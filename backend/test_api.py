from main.utils.transcript_fetch import extract_full_transcript, fetch_youtube_data
from main.utils.summarizer import summarize_transcript
result = fetch_youtube_data(["Sd6F2pfKJmk"])


full_trans = extract_full_transcript(result)


print(full_trans)
print('#'*10)
print(summarize_transcript(full_trans))