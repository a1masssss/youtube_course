from groq import Groq
import os
from dotenv import load_dotenv
import time

from main.utils.prompts.summarizer_prompt import summarizer_prompt

load_dotenv()

# Initialize Groq client
client = Groq(api_key=os.getenv('GROQ_API_KEY'))


prompt = summarizer_prompt()

def summarize_transcript(transcript_text, max_words=1200, prompt=prompt):
    if not transcript_text:
        return {
            'success': False,
            'summary': ''
        }
    
    try:
        start_time = time.time()

        
        completion = client.chat.completions.create(
            model="llama-3.1-8b-instant",  
            messages=[
                {"role": "system", "content": prompt},
                {"role": "user", "content": f"Summarize this transcript in at least {max_words} words, focusing on main topics only:\n\n{transcript_text}"}
            ],
            max_tokens=min(1000, max_words * 2), 
            temperature=0.3
        )
        
        summary = completion.choices[0].message.content
        
        processing_time = time.time() - start_time
        word_count = len(summary.split())
        
        print(f"✅ Summary completed: {processing_time:.2f}s, {word_count} words (input: {len(transcript_text)} words)")
        
        return summary
        
    except Exception as e:
        print(f"❌ Summarization error: {str(e)}")
        return {
            'success': False,
            'error': str(e),
            'summary': ''
        }

        