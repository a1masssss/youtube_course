from openai import OpenAI
import os
from django.shortcuts import get_object_or_404
from main.models import Video
from .prompts.chatbot_prompt import get_chatbot_prompt, get_no_summary_prompt, get_empty_question_prompt

client = OpenAI(api_key=os.getenv('OPENAI_API_KEY'))

def process_chatbot_request(user, video_uuid: str, user_message: str):
    # Validation
    if not video_uuid:
        raise ValueError("video_uuid is required")
    
    if not user_message or not user_message.strip():
        raise ValueError("user_message is required")

    # Get video and summary
    video = get_object_or_404(Video, uuid_video=video_uuid, user=user)
    
    if not video.summary:
        # Return generator for no summary case
        return _generate_static_response(get_no_summary_prompt())
    
    # Generate chatbot prompt
    prompt = get_chatbot_prompt(video.summary, user_message.strip())
    
    # Return streaming response
    return summary_chatbot_stream(prompt)

def _generate_static_response(message: str):
    yield f"data: {message}\n\n"
    yield f"data: [DONE]\n\n"

def summary_chatbot_stream(prompt: str):
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

# Legacy function for backward compatibility
def summary_chatbot(prompt: str):
    return summary_chatbot_stream(prompt)

def summary_chatbot_sync(prompt: str):
    try:
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[{"role": "user", "content": prompt}],
            stream=False
        )
        return {
            "response": response.choices[0].message.content,
            "success": True
        }
    except Exception as e:
        return {
            "response": f"Error: {str(e)}",
            "success": False
        }