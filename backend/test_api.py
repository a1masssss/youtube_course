from main.utils.transcript_fetch import extract_full_transcript, fetch_youtube_data
from main.utils.summarizer import summarize_transcript
result = fetch_youtube_data(["Sd6F2pfKJmk"])


print(result[0]["tracks"][0]["transcript"])
# full_trans = extract_full_transcript(result)
# print('#'*10)
# print(summarize_transcript(full_trans))