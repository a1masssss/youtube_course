"""
Prompts for video summary chatbot functionality.
"""

def get_chatbot_prompt(summary: str, user_message: str) -> str:
    """
    Generate a prompt for the video summary chatbot.
    
    Args:
        summary (str): The video summary content
        user_message (str): User's question about the video
        
    Returns:
        str: Formatted prompt for the AI model
    """
    return f"""
You are an expert assistant helping users understand video content. You have access to a video summary and need to answer the user's question based ONLY on that content.

VIDEO SUMMARY:
{summary}

USER'S QUESTION:
{user_message}

INSTRUCTIONS:
- Answer simply and briefly in 3-5 sentences
- Base your answer ONLY on the video content provided above
- If the question cannot be answered from the video content, politely explain that the information is not available in this video
- Be helpful and precise
- Use a conversational but professional tone

ANSWER:
"""

def get_no_summary_prompt() -> str:
    """
    Get prompt when no summary is available.
    
    Returns:
        str: Error message prompt
    """
    return "I'm sorry, but there's no summary available for this video yet. Please make sure the video has been processed and summarized first."

def get_empty_question_prompt() -> str:
    """
    Get prompt for empty user question.
    
    Returns:
        str: Help message prompt
    """
    return "Please ask me a specific question about the video content, and I'll do my best to answer based on the video summary." 