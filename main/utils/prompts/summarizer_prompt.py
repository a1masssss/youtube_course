def summarizer_prompt(text: str):
    return f"""
    You are an expert in summarizing YouTube video transcripts. Please create a concise, informative summary of the following video transcript.

    Guidelines:
    - Focus on the main topics and key points discussed
    - Maintain the logical flow of information
    - Include important details, examples, or insights mentioned
    - Keep the summary between 100-300 words
    - Use clear, engaging language
    - If the content is educational, highlight the main learning objectives
    - If it's entertainment, capture the essence and highlights

    Transcript to summarize:
    {text}

    Please provide a well-structured summary:
    """
    