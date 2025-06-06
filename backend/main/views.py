from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.shortcuts import get_object_or_404
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator

from .models import Playlist, Video
from .serializers import PlaylistSerializer, VideoSerializer
from main.utils.extractor_ids import fetch_playlist_info, fetch_playlist_videos
from main.utils.transcript_fetch import fetch_youtube_data, extract_full_transcript
from main.utils.summarizer import summarize_transcript


@method_decorator(csrf_exempt, name='dispatch')
class PlaylistAPIView(APIView):
    def post(self, request):
        print("🚀 Received POST request to /api/playlists/")
        print("📦 Request data:", request.data)
        
        url = request.data.get("url")
        if not url:
            print("❌ No URL provided")
            return Response({"error": "URL is required"}, status=400)

        print(f"🔍 Processing URL: {url}")
        
        try:
            playlist_info = fetch_playlist_info(url)
            videos_info = fetch_playlist_videos(url)

            playlist = Playlist.objects.create(
            playlist_id=playlist_info["id"],
            title=playlist_info["title"],
            playlist_url=playlist_info["url"],
            playlist_thumbnail=playlist_info["playlist_thumbnail"]
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
                
                summary = ""
                if transcript and transcript.strip():
                    try:
                        summary = summarize_transcript(transcript)
                        print(f"✅ Generated summary for video {v['id']}")
                    except Exception as e:
                        print(f"❌ Error generating summary for video {v['id']}: {str(e)}")
                        summary = "Summary generation failed"
                
                Video.objects.create(
                    video_id=v["id"],
                    title=v["title"],
                    url=v["url"],
                    thumbnail=v["thumbnail"],
                    full_transcript=transcript,
                    summary=summary,
                    playlist=playlist
                )

            serializer = PlaylistSerializer(playlist)
            print("✅ Successfully created playlist:", serializer.data)
            return Response(serializer.data, status=201)
        except Exception as e:
            print(f"❌ Error processing playlist: {str(e)}")
            return Response({"error": str(e)}, status=500)


@method_decorator(csrf_exempt, name='dispatch')
class PlaylistDetailAPIView(APIView):
    def get(self, request, playlist_id):
        playlist = get_object_or_404(Playlist, id=playlist_id)
        serializer = PlaylistSerializer(playlist)
        return Response(serializer.data)


@method_decorator(csrf_exempt, name='dispatch')
class VideoDetailAPIView(APIView):
    def get(self, request, video_id):
        video = get_object_or_404(Video, id=video_id)
        serializer = VideoSerializer(video)
        return Response(serializer.data)



@method_decorator(csrf_exempt, name='dispatch')
class MyCoursesAPIView(APIView):
    def get(self, request):
        playlists = Playlist.objects.all()
        serializer = PlaylistSerializer(playlists, many=True)
        return Response(serializer.data)
    
 
@method_decorator(csrf_exempt, name='dispatch')
class MyCourseDeleteAPIView(APIView):
    def delete(self, request, playlist_id):
        playlist = get_object_or_404(Playlist, id=playlist_id)
        playlist.delete()
        return Response({"message": "Playlist deleted successfully"}, status=200)





