import os
import json
import logging
from typing import Dict, List, Any, Optional
from groq import Groq
from openai import OpenAI
from dotenv import load_dotenv
from .prompts.quiz_prompt import generate_quiz_prompt
import re

load_dotenv()

logger = logging.getLogger(__name__)

# Initialize API clients
groq_client = Groq(api_key=os.getenv('GROQ_API_KEY'))
openai_client = OpenAI(api_key=os.getenv('OPENAI_API_KEY'))

def generate_quiz_from_transcript(transcript: str, duration_seconds: int) -> List[Dict[str, Any]]:
    if not transcript or not transcript.strip():
        raise ValueError("Transcript cannot be empty")
    
    if not duration_seconds or duration_seconds <= 0:
        raise ValueError("Duration must be a positive number")
    
    duration_minutes = duration_seconds / 60.0
    
    # Determine number of questions based on video length
    if duration_minutes < 10:  
        num_questions = 5
    elif 10 < duration_minutes < 30:
        num_questions = 7
    elif 30 < duration_minutes < 60: 
        num_questions = 10
    elif 60 < duration_minutes < 90:  
        num_questions = 15
    elif 90 < duration_minutes < 120:  
        num_questions = 20
    else:  
        num_questions = 30
    
    logger.info(f"📝 Transcript length: {len(transcript.strip())} characters")
    logger.info(f"⏱️ Video duration: {duration_seconds} seconds ({duration_minutes:.1f} minutes)")
    logger.info(f"🎯 Generating {num_questions} quiz questions based on video duration")
    
    system_prompt = generate_quiz_prompt(num_questions)
    user_prompt = f"Based on this transcript, create exactly {num_questions} quiz questions:\n\n{transcript}"
    
    def validate_quiz_data(quiz_data):
        """Validate quiz data structure"""
        if not isinstance(quiz_data, list):
            raise ValueError("Quiz data must be a list")
        
        for i, question in enumerate(quiz_data):
            if not all(key in question for key in ['question', 'answers', 'correct_index']):
                raise ValueError(f"Question {i+1} missing required fields")
            
            if not isinstance(question['answers'], list) or len(question['answers']) != 4:
                raise ValueError(f"Question {i+1} must have exactly 4 answers")
            
            if not isinstance(question['correct_index'], int) or question['correct_index'] not in [0, 1, 2, 3]:
                raise ValueError(f"Question {i+1} has invalid correct_index")
        
        return quiz_data
    
    def clean_json_response(response_text: str) -> str:
        """Clean up potential JSON formatting issues"""
        
        
        # First, try to find a complete JSON array
        start_idx = response_text.find('[')
        end_idx = response_text.rfind(']')
        
        if start_idx != -1 and end_idx != -1 and start_idx < end_idx:
            # Extract just the JSON array
            json_text = response_text[start_idx:end_idx + 1]
            try:
                # Test if it's valid JSON
                json.loads(json_text)
                return json_text
            except json.JSONDecodeError:
                pass
        
        # If no valid JSON array found, try to extract numbered JSON objects
        # Split by lines and look for numbered entries
        lines = response_text.split('\n')
        json_objects = []
        current_json = ""
        in_json = False
        brace_count = 0
        
        for line in lines:
            line = line.strip()
            
            # Check if this line starts a new numbered JSON object
            if re.match(r'^\d+\.\s*\{', line):
                # If we were building a JSON object, try to parse it
                if current_json and in_json:
                    try:
                        obj = json.loads(current_json)
                        if all(key in obj for key in ['question', 'answers', 'correct_index']):
                            json_objects.append(obj)
                    except json.JSONDecodeError:
                        pass
                
                # Start new JSON object (remove the number prefix)
                current_json = re.sub(r'^\d+\.\s*', '', line)
                in_json = True
                brace_count = current_json.count('{') - current_json.count('}')
                
            elif in_json:
                # Continue building the current JSON object
                current_json += '\n' + line
                brace_count += line.count('{') - line.count('}')
                
                # If braces are balanced, we might have a complete object
                if brace_count == 0:
                    try:
                        obj = json.loads(current_json)
                        if all(key in obj for key in ['question', 'answers', 'correct_index']):
                            json_objects.append(obj)
                    except json.JSONDecodeError:
                        pass
                    
                    current_json = ""
                    in_json = False
        
        # Handle the last object if we were still building one
        if current_json and in_json:
            try:
                obj = json.loads(current_json)
                if all(key in obj for key in ['question', 'answers', 'correct_index']):
                    json_objects.append(obj)
            except json.JSONDecodeError:
                pass
        
        if json_objects:
            return json.dumps(json_objects)
        
        # Fallback: try to find any JSON objects in the text
        json_pattern = r'\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}'
        json_matches = re.findall(json_pattern, response_text, re.DOTALL)
        
        if json_matches:
            valid_objects = []
            for match in json_matches:
                try:
                    obj = json.loads(match.strip())
                    # Validate it has the required fields
                    if all(key in obj for key in ['question', 'answers', 'correct_index']):
                        valid_objects.append(obj)
                except json.JSONDecodeError:
                    continue
            
            if valid_objects:
                return json.dumps(valid_objects)
        
        raise ValueError("No valid JSON objects found in response")
    
    # Try Groq first
    try:
        logger.info("🚀 Attempting to generate quiz with Groq...")
        completion = groq_client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            temperature=0.7,
            max_tokens=3000,  # Increased token limit
        )
        
        quiz_content = completion.choices[0].message.content.strip()
        
        try:
            # Try to clean up the response if needed
            cleaned_content = clean_json_response(quiz_content)
            quiz_data = json.loads(cleaned_content)
            validated_data = validate_quiz_data(quiz_data)
            logger.info(f"✅ Successfully generated {len(validated_data)} quiz questions with Groq")
            return validated_data
            
        except (json.JSONDecodeError, ValueError) as e:
            logger.error(f"❌ Failed to parse Groq JSON response: {e}")
            logger.error(f"Raw response: {quiz_content}")
            raise ValueError(f"Invalid JSON from Groq: {str(e)}")
            
    except Exception as groq_error:
        logger.error(f"❌ Groq failed: {str(groq_error)}")
        logger.info("🔄 Falling back to OpenAI...")
        
        # Fallback to OpenAI
        try:
            completion = openai_client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                temperature=0.7,
                max_tokens=3000,
            )
            
            quiz_content = completion.choices[0].message.content.strip()
            
            try:
                cleaned_content = clean_json_response(quiz_content)
                quiz_data = json.loads(cleaned_content)
                validated_data = validate_quiz_data(quiz_data)
                logger.info(f"✅ Successfully generated {len(validated_data)} quiz questions with OpenAI")
                return validated_data
                
            except (json.JSONDecodeError, ValueError) as e:
                logger.error(f"❌ Failed to parse OpenAI JSON response: {e}")
                logger.error(f"Raw response: {quiz_content}")
                raise ValueError(f"Invalid JSON from OpenAI: {str(e)}")
                
        except Exception as openai_error:
            logger.error(f"❌ OpenAI also failed: {str(openai_error)}")
            raise Exception(f"Quiz generation failed with both APIs. Groq: {str(groq_error)}, OpenAI: {str(openai_error)}")