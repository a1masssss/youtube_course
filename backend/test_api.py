from main.utils.transcript_fetch import extract_full_transcript, fetch_youtube_data
result = fetch_youtube_data(["Sd6F2pfKJmk", "Lxa8poQYRtc"])


print(extract_full_transcript(result))

