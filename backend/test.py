import yt_dlp
def fetch_playlist_info(playlist_url: str):
    opts = {"quiet": True, "extract_flat": True, "skip_download": True, "no_warnings": True}
    with yt_dlp.YoutubeDL(opts) as ydl:
        pl = ydl.extract_info(playlist_url, download=False)

    return {
        "id": pl.get("id"),
        "title": pl.get("title", "Без названия"),
        "url": playlist_url
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
    print('#'*10)
    print(fetch_playlist_videos("https://youtube.com/playlist?list=PLu71SKxNbfoDOf-6vAcKmazT92uLnWAgy&si=oKyXp9A8Qn5jAEVQ"))