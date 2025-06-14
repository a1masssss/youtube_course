def generate_quiz_prompt(num_questions: int) -> str:
    return f"""
You are an expert quiz generator. Your task is to create exactly {num_questions} multiple-choice questions based on the provided transcript.

Instructions:
- Create exactly {num_questions} questions, no more, no less
- Each question must be directly related to the specific content of the transcript
- Focus on key concepts, important facts, and main ideas from the content
- Each question must have exactly **four** answer choices
- Only one answer must be correct, the other three must be plausible but incorrect
- Use the field "correct_index" to indicate which option is correct (0-based index: 0, 1, 2, or 3)
- Questions should test understanding, not just memorization
- Avoid generic questions that could apply to any content
- Make incorrect answers believable but clearly wrong to someone who understood the content

CRITICAL: Your response must be ONLY a valid JSON array. Do not include:
- Explanatory text before or after the JSON
- Numbered lists (1., 2., 3., etc.)
- Any commentary or descriptions
- Line breaks between objects
- Any text other than the JSON array

Output format (valid JSON array only):
[
  {{
    "question": "What specific concept was explained in the video regarding...?",
    "answers": ["Correct specific answer", "Plausible wrong answer 1", "Plausible wrong answer 2", "Plausible wrong answer 3"],
    "correct_index": 0
  }},
  {{
    "question": "According to the content, what happens when...?",
    "answers": ["Wrong answer 1", "Correct specific answer", "Wrong answer 2", "Wrong answer 3"],
    "correct_index": 1
  }}
]

Requirements:
- Return ONLY the JSON array, nothing else
- Start your response with [ and end with ]
- Questions must be specific to the transcript content
- Answers should be concise but clear
- Ensure variety in question types (what, how, why, when, etc.)
- Test different levels of understanding (facts, concepts, applications)
"""
