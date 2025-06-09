from openai import OpenAI
from groq import Groq
import json
import os

# Initialize clients
openai_client = OpenAI(api_key=os.getenv('OPENAI_API_KEY'))
groq_client = Groq(api_key=os.getenv('GROQ_API_KEY'))

def generate_flashcards_from_transcript(transcript: str) -> list[dict]:
    """
    Takes a transcript and returns a list of flashcards in the format:
    [
        {"question": "Question 1?", "answer": "Answer 1."},
        {"question": "Question 2?", "answer": "Answer 2."},
        ...
    ]
    """

    prompt = f"""
You are an intelligent assistant that creates flashcards from lecture transcripts.

Transcript:
\"\"\"{transcript}\"\"\"

Generate exactly 10 flashcards from this transcript. Each flashcard should be a dictionary with two fields:
- question: a question that helps understand or remember key concepts
- answer: a clear and concise answer to that question

Return ONLY a JSON array of flashcards, in the following format:
[
  {{
    "question": "What is ...?",
    "answer": "..."
  }},
  ...
]
Do not include any extra text.
"""

    # Try Groq first (faster and cheaper)
    try:
        print("🚀 Trying Groq API...")
        response = groq_client.chat.completions.create(
            model="llama-3.1-8b-instant",  # Updated to supported model
            messages=[
                {"role": "system", "content": "You generate educational flashcards from transcripts."},
                {"role": "user", "content": prompt},
            ],
            temperature=0.7,
            max_tokens=2000,
        )
        
        result = response.choices[0].message.content.strip()
        print("✅ Groq API successful")
        
    except Exception as groq_error:
        print(f"❌ Groq API failed: {groq_error}")
        print("🔄 Falling back to OpenAI...")
        
        # Fallback to OpenAI
        try:
            response = openai_client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {"role": "system", "content": "You generate educational flashcards from transcripts."},
                    {"role": "user", "content": prompt},
                ],
                temperature=0.7,
            )
            
            result = response.choices[0].message.content.strip()
            print("✅ OpenAI API successful")
            
        except Exception as openai_error:
            raise ValueError(f"Both APIs failed. Groq: {groq_error}, OpenAI: {openai_error}")

    try:
        flashcards = json.loads(result)
        assert isinstance(flashcards, list)
        for card in flashcards:
            assert "question" in card and "answer" in card
        return flashcards
    except Exception as e:
        raise ValueError(f"Failed to parse flashcards: {e}\nRaw output: {result}")
