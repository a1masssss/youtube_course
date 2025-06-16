"""
Prompts for quiz answer explanation functionality.
"""

def get_quiz_explanation_prompt(question_data: dict, user_answer_index: int, video_summary: str) -> str:
    """
    Generate a prompt for explaining quiz answers.
    
    Args:
        question_data (dict): Question with answers and correct answer
        user_answer_index (int): Index of user's selected answer
        video_summary (str): Video summary for context
        
    Returns:
        str: Formatted prompt for AI explanation
    """
    question = question_data.get('question', '')
    answers = question_data.get('answers', [])
    correct_index = question_data.get('correct_index', 0)
    
    # Get the actual answer texts
    user_answer = answers[user_answer_index] if user_answer_index < len(answers) else "Unknown"
    correct_answer = answers[correct_index] if correct_index < len(answers) else "Unknown"
    
    is_correct = user_answer_index == correct_index
    
    if is_correct:
        explanation_type = "correct answer explanation"
        analysis_section = f"""
**Great job! You selected the correct answer.**

CORRECT ANSWER: {correct_answer}

Please explain why this answer is correct based on the video content.
"""
    else:
        explanation_type = "answer analysis and correction"
        analysis_section = f"""
**Your Answer Analysis:**

YOUR SELECTED ANSWER: {user_answer}
CORRECT ANSWER: {correct_answer}

Please explain:
1. Why the correct answer ({correct_answer}) is right
2. Why your selected answer ({user_answer}) is incorrect or less accurate
3. What key information from the video supports the correct answer
"""

    return f"""
You are an expert tutor helping students understand quiz questions based on video content. 

VIDEO SUMMARY:
{video_summary}

QUIZ QUESTION:
{question}

ANSWER OPTIONS:
{chr(10).join([f"{i+1}. {answer}" for i, answer in enumerate(answers)])}

{analysis_section}

INSTRUCTIONS:
- Base your explanation ONLY on the video content provided
- Be educational and encouraging
- Use clear, simple language
- Provide specific details from the video that support your explanation
- Keep the explanation concise but thorough (3-5 sentences)
- Be helpful and constructive in your feedback

EXPLANATION:
"""

def get_no_video_context_prompt() -> str:
    """
    Get prompt when no video context is available.
    
    Returns:
        str: Error message prompt
    """
    return "I'm sorry, but I need the video content to provide an accurate explanation. Please make sure the video has been processed and summarized."

def get_invalid_question_prompt() -> str:
    """
    Get prompt for invalid question data.
    
    Returns:
        str: Error message prompt
    """
    return "I'm sorry, but there seems to be an issue with the question data. Please try again or contact support if the problem persists." 