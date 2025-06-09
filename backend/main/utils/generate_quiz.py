# import os
# import json
# import logging
# from typing import Dict, List, Any, Optional
# from openai import OpenAI
# from .prompts.quiz_prompt import generate_quiz_prompt

# logger = logging.getLogger(__name__)

# def generate_quiz_from_transcript(transcript: str, duration_seconds: Optional[int] = None) -> List[Dict[str, Any]]:
#     if not transcript or not transcript.strip():
#         raise ValueError("Transcript cannot be empty")
    
#     # Умный расчет количества вопросов
#     num_questions = calculate_quiz_questions(duration_seconds)
    
#     logger.info(f"🎯 Generating {num_questions} quiz questions for video duration: {duration_seconds}s")
#     logger.info(f"🤖 Using Groq with OpenAI client")
    
#     system_prompt = generate_quiz_prompt(num_questions)
#     user_prompt = f"Based on this transcript, create exactly {num_questions} quiz questions:\n\n{transcript}"
    
#     def validate_quiz_data(quiz_data):
#         """Валидация структуры квиза"""
#         if not isinstance(quiz_data, list):
#             raise ValueError("Quiz data must be a list")
        
#         for i, question in enumerate(quiz_data):
#             if not all(key in question for key in ['question', 'answers', 'correct_index']):
#                 raise ValueError(f"Question {i+1} missing required fields")
            
#             if not isinstance(question['answers'], list) or len(question['answers']) != 4:
#                 raise ValueError(f"Question {i+1} must have exactly 4 answers")
            
#             if not isinstance(question['correct_index'], int) or question['correct_index'] not in [0, 1, 2, 3]:
#                 raise ValueError(f"Question {i+1} has invalid correct_index")
        
#         return quiz_data
    
#     try:
#         # Использование OpenAI клиента с Groq API endpoint
#         groq_client = OpenAI(
#             base_url="https://api.groq.com/openai/v1",
#             api_key=os.getenv('GROQ_API_KEY')
#         )

        
#         response = groq_client.chat.completions.create(
#             model="llama-3.1-8b-instant",
#             messages=[
#                 {"role": "system", "content": system_prompt},
#                 {"role": "user", "content": user_prompt}
#             ],
#             temperature=0.7,
#             max_tokens=2000,
#         )
        
#         quiz_content = response.choices[0].message.content.strip()
        
#         try:
#             quiz_data = json.loads(quiz_content)
#             validated_data = validate_quiz_data(quiz_data)
#             logger.info(f"✅ Successfully generated {len(validated_data)} quiz questions with Groq")
#             return validated_data
            
#         except json.JSONDecodeError as e:
#             logger.error(f"❌ Failed to parse Groq JSON response: {e}")
#             logger.error(f"Raw response: {quiz_content}")
#             raise ValueError(f"Invalid JSON response from Groq")
            
#     except Exception as e:
#         logger.error(f"❌ Error generating quiz with Groq: {str(e)}")
#         raise Exception(f"Quiz generation failed: {str(e)}")





# print(generate_quiz_from_transcript(""))