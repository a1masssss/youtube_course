import os
import json
import logging
from typing import Dict, List, Any, Optional
from groq import Groq
from dotenv import load_dotenv
from .prompts.quiz_prompt import generate_quiz_prompt

load_dotenv()

logger = logging.getLogger(__name__)

# Initialize Groq client
client = Groq(api_key=os.getenv('GROQ_API_KEY'))

def generate_quiz_from_transcript(transcript: str, duration_seconds: int) -> List[Dict[str, Any]]:
    if not transcript or not transcript.strip():
        raise ValueError("Transcript cannot be empty")
    
    if not duration_seconds or duration_seconds <= 0:
        raise ValueError("Duration must be a positive number")
    

    duration_minutes = duration_seconds / 60.0
    
  
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
    logger.info(f"🤖 Using Groq client")
    
    system_prompt = generate_quiz_prompt(num_questions)
    user_prompt = f"Based on this transcript, create exactly {num_questions} quiz questions:\n\n{transcript}"
    
    def validate_quiz_data(quiz_data):
        """Валидация структуры квиза"""
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
    
    try:
        completion = client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            temperature=0.7,
            max_tokens=2000,
        )
        
        quiz_content = completion.choices[0].message.content.strip()
        
        try:
            quiz_data = json.loads(quiz_content)
            validated_data = validate_quiz_data(quiz_data)
            logger.info(f"✅ Successfully generated {len(validated_data)} quiz questions with Groq")
            return validated_data
            
        except json.JSONDecodeError as e:
            logger.error(f"❌ Failed to parse Groq JSON response: {e}")
            logger.error(f"Raw response: {quiz_content}")
            raise ValueError(f"Invalid JSON response from Groq")
            
    except Exception as e:
        logger.error(f"❌ Error generating quiz with Groq: {str(e)}")
        raise Exception(f"Quiz generation failed: {str(e)}")