import json
import os
from groq import Groq
from openai import OpenAI
from .prompts.mindmap_prompt import get_system_prompt


def generate_mindmap_from_video(video, user):
    """
    Generate mindmap from video transcript, similar to flashcards logic.
    Returns mindmap data and whether it was newly created.
    """
    from ..models import MindMap  # Import here to avoid circular imports
    
    # Check if mindmap already exists for this video and user
    mindmap_obj, created = MindMap.objects.get_or_create(
        mindmap_video=video,
        user=user,
        defaults={'mindmap_json': {}}
    )
    
    # If mindmap already exists and has content, return it
    if not created and mindmap_obj.mindmap_json:
        print(f"✅ Found existing mindmap for video: {video.title}")
        return mindmap_obj.mindmap_json, False
    
    # Generate new mindmap if it doesn't exist or is empty
    print(f"🚀 Generating new mindmap for video: {video.title}")
    
    if not video.full_transcript or not video.full_transcript.strip():
        raise ValueError("No transcript available for this video")
    
    try:
        # Generate mindmap data using the transcript
        mindmap_data = generate_mindmap_from_transcript(video.full_transcript)
        
        # Save the generated mindmap to the database
        mindmap_obj.mindmap_json = mindmap_data
        mindmap_obj.save()
        
        print(f"✅ Generated and saved mindmap")
        return mindmap_data, True
        
    except Exception as e:
        # If generation failed, delete the empty mindmap object if it was just created
        if created:
            mindmap_obj.delete()
        raise ValueError(f"Failed to generate mindmap: {e}")


def generate_mindmap_from_transcript(transcript):
    """
    Generate a detailed mindmap from video transcript using AI.
    
    Args:
        transcript (str): The full transcript of the video
        
    Returns:
        dict: Generated mindmap in JSON format
        
    Raises:
        Exception: If both Groq and OpenAI fail to generate mindmap
    """
    if not transcript or not transcript.strip():
        raise ValueError("Transcript cannot be empty")
    
    system_prompt = get_system_prompt()
    
    user_prompt = f"""
    Based on the following video transcript, create a comprehensive and detailed mind map that captures all the key concepts, ideas, and relationships discussed in the content.

    Transcript:
    {transcript}

    Please create a mind map that:
    1. Identifies the main topic/theme
    2. Breaks down into 5 major categories
    3. Each category has 3-4 detailed sub-nodes
    4. Each sub-node has a description explaining the concept
    5. Uses clear, meaningful titles (no generic placeholders)
    6. Maintains proper hierarchical structure

    Generate the mind map as valid JSON following the specified format.
    """
    
    # Try Groq first
    try:
        print("🧠 Attempting to generate mindmap with Groq...")
        groq_client = Groq(api_key=os.getenv('GROQ_API_KEY'))
        
        response = groq_client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            temperature=0.7,
            max_tokens=1500,
        )
        
        mindmap_text = response.choices[0].message.content.strip()
        
        # Parse and validate JSON
        try:
            mindmap_data = json.loads(mindmap_text)
            print("✅ Mindmap generated successfully with Groq")
            return mindmap_data
        except json.JSONDecodeError as e:
            print(f"❌ Groq returned invalid JSON: {e}")
            raise Exception(f"Groq returned invalid JSON: {e}")
            
    except Exception as e:
        print(f"❌ Groq failed: {str(e)}")
        print("🔄 Falling back to OpenAI...")
        
        # Fallback to OpenAI
        try:
            openai_client = OpenAI(api_key=os.getenv('OPENAI_API_KEY'))
            
            response = openai_client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                temperature=0.7,
                max_tokens=4000,
            )
            
            mindmap_text = response.choices[0].message.content.strip()
            
            # Parse and validate JSON
            try:
                mindmap_data = json.loads(mindmap_text)
                print("✅ Mindmap generated successfully with OpenAI")
                return mindmap_data
            except json.JSONDecodeError as e:
                print(f"❌ OpenAI returned invalid JSON: {e}")
                raise Exception(f"OpenAI returned invalid JSON: {e}")
                
        except Exception as openai_error:
            print(f"❌ OpenAI also failed: {str(openai_error)}")
            raise Exception(f"Both Groq and OpenAI failed to generate mindmap. Groq: {str(e)}, OpenAI: {str(openai_error)}")


def validate_mindmap_structure(mindmap_data):
    """
    Validate that the mindmap follows the expected structure.
    
    Args:
        mindmap_data (dict): The mindmap data to validate
        
    Returns:
        bool: True if valid, False otherwise
    """
    try:
        # Check required top-level keys
        if not isinstance(mindmap_data, dict):
            return False
            
        if 'title' not in mindmap_data or 'root' not in mindmap_data:
            return False
            
        root = mindmap_data['root']
        if not isinstance(root, dict) or 'message' not in root or 'children' not in root:
            return False
            
        # Check that root has children (categories)
        children = root['children']
        if not isinstance(children, list) or len(children) == 0:
            return False
            
        # Validate each category
        for category in children:
            if not isinstance(category, dict) or 'message' not in category:
                return False
                
            # Each category should have children (sub-nodes)
            if 'children' in category:
                for sub_node in category['children']:
                    if not isinstance(sub_node, dict) or 'message' not in sub_node:
                        return False
                        
        return True
        
    except Exception:
        return False
