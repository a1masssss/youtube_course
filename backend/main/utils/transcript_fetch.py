import requests
import os 
from dotenv import load_dotenv
load_dotenv()

YOUTUBE_TRANSCRIPT_API = os.getenv('YOUTUBE_TRANSCRIPT_API')

def fetch_youtube_data(video_ids: list):
    url = "https://www.youtube-transcript.io/api/transcripts"
    headers = {
        "Authorization": f"Basic {YOUTUBE_TRANSCRIPT_API}",
        "Content-Type": "application/json"
    }

    payload = {
        "ids": video_ids
    }

    response = requests.post(url, headers=headers, json=payload)

    if response.status_code == 200:
        return response.json()
    else:
        print("❌ Ошибка:", response.status_code, response.text)
        return None
    

def extract_full_transcript(transcript_data):
    all_transcripts = []
    
    if transcript_data and len(transcript_data) > 0:
        for video_data in transcript_data:
            video_transcript = ""
            
            if 'tracks' in video_data and len(video_data['tracks']) > 0:
                transcript_track = video_data['tracks'][0]

                if 'transcript' in transcript_track:
                    text_segments = []
                    for segment in transcript_track['transcript']:
                        if 'text' in segment:
                            text_segments.append(segment['text'])
                    
                    video_transcript = ' '.join(text_segments)
            
            if video_transcript:
                all_transcripts.append(f"{video_transcript}")
    
    return '\n\n'.join(all_transcripts)



