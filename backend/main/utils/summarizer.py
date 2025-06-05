from groq import Groq
import os
from dotenv import load_dotenv
import time

load_dotenv()

# Initialize Groq client
client = Groq(api_key=os.getenv('GROQ_API_KEY'))

def summarize_transcript(transcript_text, max_words=150):
    if not transcript_text:
        return {
            'success': False,
            'summary': ''
        }
    
    try:
        start_time = time.time()
        
        completion = client.chat.completions.create(
            model="llama-3.1-8b-instant",  # Back to this model - has higher TPM limit
            messages=[
                {"role": "system", "content": "Create concise summaries focusing on key points only."},
                {"role": "user", "content": f"Summarize this transcript in exactly {max_words} words, focusing on main topics only:\n\n{transcript_text}"}
            ],
            max_tokens=900, 
            temperature=0.3,
            stream=True
        )
        
        summary = ""
        for chunk in completion:
            if chunk.choices[0].delta.content:
                summary += chunk.choices[0].delta.content
        
        processing_time = time.time() - start_time
        word_count = len(summary.split())
        
        print(f"✅ Summary completed: {processing_time:.2f}s, {word_count} words (input: {len(transcript_text)} words)")
        
        return {
            'success': True,
            'summary': summary.strip(),
            'processing_time': processing_time,
            'word_count': word_count
        }
        
    except Exception as e:
        print(f"❌ Summarization error: {str(e)}")
        return {
            'success': False,
            'error': str(e),
            'summary': ''
        }

def summarize_multiple_transcripts(transcripts: list) -> dict:
    summaries = {}
    
    for item in transcripts:
        video_id = item.get('id')
        transcript = item.get('transcript', '')
        
        if video_id and transcript:
            result = summarize_transcript(transcript)
            summaries[video_id] = result['summary'] if result['success'] else f"Error: {result.get('error', 'Unknown error')}"
        else:
            summaries[video_id] = "No transcript available to summarize."
    
    return summaries
        