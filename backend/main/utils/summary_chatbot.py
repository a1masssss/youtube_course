from openai import OpenAI
import os

client = OpenAI(api_key=os.getenv('OPENAI_API_KEY'))

def summary_chatbot(prompt: str):
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

def summary_chatbot_sync(prompt: str):
    """
    Non-streaming version of the chatbot for regular API responses
    """
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