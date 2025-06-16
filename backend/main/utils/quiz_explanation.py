"""
Quiz explanation utility for generating AI explanations of quiz answers.
"""

from openai import OpenAI
import os
from django.shortcuts import get_object_or_404
from main.models import Video, Quiz
from .prompts.quiz_explanation_prompt import (
    get_quiz_explanation_prompt, 
    get_no_video_context_prompt, 
    get_invalid_question_prompt
)

client = OpenAI(api_key=os.getenv('OPENAI_API_KEY'))

def process_quiz_explanation_request(user, video_uuid: str, question_index: int, user_answer_index: int):
    """
    Process quiz explanation request and return appropriate response generator.
    
    Args:
        user: Django user object
        video_uuid (str): UUID of the video
        question_index (int): Index of the question in the quiz
        user_answer_index (int): Index of user's selected answer
        
    Returns:
        generator: Streaming response generator
        
    Raises:
        ValueError: If validation fails
        Video.DoesNotExist: If video not found
        Quiz.DoesNotExist: If quiz not found
    """
    # Validation
    if not video_uuid:
        raise ValueError("video_uuid is required")
    
    if question_index is None or question_index < 0:
        raise ValueError("question_index is required and must be non-negative")
    
    if user_answer_index is None or user_answer_index < 0:
        raise ValueError("user_answer_index is required and must be non-negative")

    # Get video and quiz
    video = get_object_or_404(Video, uuid_video=video_uuid, user=user)
    quiz = get_object_or_404(Quiz, quiz_video=video, user=user)
    
    # Validate question index
    if not quiz.quiz_json or question_index >= len(quiz.quiz_json):
        raise ValueError("Invalid question_index")
    
    # Get question data
    question_data = quiz.quiz_json[question_index]
    
    # Validate user answer index
    answers = question_data.get('answers', [])
    if user_answer_index >= len(answers):
        raise ValueError("Invalid user_answer_index")
    
    # Check if video has summary for context
    if not video.summary:
        return _generate_static_response(get_no_video_context_prompt())
    
    # Generate explanation prompt
    prompt = get_quiz_explanation_prompt(
        question_data=question_data,
        user_answer_index=user_answer_index,
        video_summary=video.summary
    )
    
    # Return streaming response
    return quiz_explanation_stream(prompt)

def _generate_static_response(message: str):
    """
    Generate a static response in streaming format.
    
    Args:
        message (str): Static message to send
        
    Yields:
        str: Formatted SSE data
    """
    yield f"data: {message}\n\n"
    yield f"data: [DONE]\n\n"

def quiz_explanation_stream(prompt: str):
    """
    Stream quiz explanation response using OpenAI API.
    
    Args:
        prompt (str): Formatted prompt for the AI model
        
    Yields:
        str: Formatted SSE data chunks
    """
    try:
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[{"role": "user", "content": prompt}],
            stream=True
        )
        for chunk in response:
            if chunk.choices[0].delta.content:
                text_piece = chunk.choices[0].delta.content
                yield f"data: {text_piece}\n\n"
        yield f"data: [DONE]\n\n"
    except Exception as e:
        yield f"data: [Error: {str(e)}]\n\n"

def quiz_explanation_sync(prompt: str):
    """
    Non-streaming version of quiz explanation for regular API responses.
    
    Args:
        prompt (str): Formatted prompt for the AI model
        
    Returns:
        dict: Response with success status and content
    """
    try:
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[{"role": "user", "content": prompt}],
            stream=False
        )
        return {
            "explanation": response.choices[0].message.content,
            "success": True
        }
    except Exception as e:
        return {
            "explanation": f"Error: {str(e)}",
            "success": False
        } 