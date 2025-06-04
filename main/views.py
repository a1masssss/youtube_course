from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status

from .models import Playlist, Video
from .serializers import PlaylistSerializer
from main.utils.extractor_ids import fetch_playlist_info, fetch_playlist_videos
from main.utils.transcript_fetch import fetch_youtube_data, extract_full_transcript


class PlaylistAPIView(APIView):
    def post(self, request):
        url = request.data.get("url")
        if not url:
            return Response({"error": "URL is required"}, status=400)

        playlist_info = fetch_playlist_info(url)
        videos_info = fetch_playlist_videos(url)

        playlist = Playlist.objects.create(
        playlist_id=playlist_info["id"],
        title=playlist_info["title"],
        playlist_url=playlist_info["url"]
        )

        video_ids = [v["id"] for v in videos_info]
        
        transcript_data = fetch_youtube_data(video_ids)
        

        transcripts_by_id = {}
        if transcript_data:
            for video_transcript in transcript_data:
                video_id = video_transcript.get('id')
                if video_id:

                    single_video_transcript = extract_full_transcript([video_transcript])
                    transcripts_by_id[video_id] = single_video_transcript

        for v in videos_info:

            transcript = transcripts_by_id.get(v["id"], "")
            
            Video.objects.create(
                video_id=v["id"],
                title=v["title"],
                url=v["url"],
                thumbnail=v["thumbnail"],
                full_transcript=transcript,
                playlist=playlist
            )

        serializer = PlaylistSerializer(playlist)
        return Response(serializer.data, status=201)





