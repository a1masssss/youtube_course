import json
import os
from groq import Groq
from openai import OpenAI
from .prompts.flashcards_prompt import get_system_prompt, get_user_prompt

# Initialize API clients
groq_client = Groq(api_key=os.getenv("GROQ_API_KEY"))
openai_client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

def generate_flashcards_from_transcript(video, user):
    from ..models import Flashcard  # Import here to avoid circular imports
    
    # Check if flashcards already exist for this video and user
    flashcard_obj, created = Flashcard.objects.get_or_create(
        flashcard_video=video,
        user=user,
        defaults={'flashcards_json': []}
    )
    
    # If flashcards already exist and have content, return them
    if not created and flashcard_obj.flashcards_json:
        print(f"✅ Found existing flashcards for video: {video.title}")
        return flashcard_obj.flashcards_json, False
    
    # Generate new flashcards if they don't exist or are empty
    print(f"🚀 Generating new flashcards for video: {video.title}")
    
    if not video.full_transcript or not video.full_transcript.strip():
        raise ValueError("No transcript available for this video")
    
    system_prompt = get_system_prompt()
    user_prompt = get_user_prompt(video.full_transcript)

    # Try Groq first (faster and cheaper)
    try:
        print("🚀 Trying Groq API...")
        response = groq_client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
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
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt},
                ],
                temperature=0.7,
            )
            
            result = response.choices[0].message.content.strip()
            print("✅ OpenAI API successful")
            
        except Exception as openai_error:
            raise ValueError(f"Both APIs failed. Groq: {groq_error}, OpenAI: {openai_error}")

    try:
        flashcards_data = json.loads(result)
        assert isinstance(flashcards_data, list)
        for card in flashcards_data:
            assert "question" in card and "answer" in card
        
        # Save the generated flashcards to the database
        flashcard_obj.flashcards_json = flashcards_data
        flashcard_obj.save()
        
        print(f"✅ Generated and saved {len(flashcards_data)} flashcards")
        return flashcards_data, True
        
    except Exception as e:
        # If parsing failed, delete the empty flashcard object if it was just created
        if created:
            flashcard_obj.delete()
        raise ValueError(f"Failed to parse flashcards: {e}\nRaw output: {result}")

