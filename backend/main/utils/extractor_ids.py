import yt_dlp

def fetch_playlist_info(playlist_url: str):
    opts = {"quiet": True, "extract_flat": True, "skip_download": True, "no_warnings": True}
    with yt_dlp.YoutubeDL(opts) as ydl:
        pl = ydl.extract_info(playlist_url, download=False)

    # Try first video thumbnail
    thumbnail = ""
    if "entries" in pl and pl["entries"]:
        first_video = pl["entries"][0]
        if "id" in first_video:
            thumbnail = f"https://img.youtube.com/vi/{first_video['id']}/maxresdefault.jpg"

    return {
        "id": pl.get("id"),
        "title": pl.get("title", "Без названия"),
        "url": playlist_url,
        "playlist_thumbnail": thumbnail,
    }





def fetch_playlist_videos(playlist_url: str):
    opts = {"quiet": True, "extract_flat": True, "skip_download": True, "no_warnings": True}
    with yt_dlp.YoutubeDL(opts) as ydl:
        pl = ydl.extract_info(playlist_url, download=False)

    return [
        {
            "id": v["id"],
            "title": v["title"],
            "url": f"https://www.youtube.com/watch?v={v['id']}",
            "thumbnail": f"https://img.youtube.com/vi/{v['id']}/maxresdefault.jpg",
        }
        for v in pl.get("entries", [])
    ]





if __name__ == '__main__':
    print(fetch_playlist_info("https://youtube.com/playlist?list=PLu71SKxNbfoDOf-6vAcKmazT92uLnWAgy&si=oKyXp9A8Qn5jAEVQ"))









import yt_dlp
def get_video_id(url: str):


    with yt_dlp.YoutubeDL() as ydl:
        info = ydl.extract_info(url, download=False)
        video_id = info.get("id")
        print("Video ID:", video_id)