from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework_simplejwt.authentication import JWTAuthentication
from django.shortcuts import get_object_or_404
from django.http import Http404, StreamingHttpResponse

from main.utils.summary_chatbot import summary_chatbot

from .models import Playlist, Video, Flashcard, MindMap
from .serializers import PlaylistSerializer, VideoSerializer, PlaylistWithVideosSerializer
from main.utils.extractor_ids import fetch_playlist_info, fetch_playlist_videos
from main.utils.transcript_fetch import fetch_youtube_data, extract_full_transcript
from main.utils.summarizer import summarize_transcript

from main.utils.generate_flashcards import generate_flashcards_from_transcript
from main.utils.generate_mindmap import generate_mindmap_from_transcript


class PlaylistAPIView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        print("🚀 Received POST request to /api/playlists/")
        print("📦 Request data:", request.data)
        print(f"👤 User: {request.user.email}")
        
        url = request.data.get("url")
        if not url:
            print("❌ No URL provided")
            return Response({"error": "URL is required"}, status=status.HTTP_400_BAD_REQUEST)

        print(f"🔍 Processing URL: {url}")
        
        try:
            playlist_info = fetch_playlist_info(url)
            videos_info = fetch_playlist_videos(url)

            # Проверяем, есть ли уже такой плейлист у пользователя
            existing_playlist = Playlist.objects.filter(
                playlist_id=playlist_info["id"],
                user=request.user
            ).first()
            
            if existing_playlist:
                print(f"📋 Playlist already exists for user: {existing_playlist.title}")
                serializer = PlaylistSerializer(existing_playlist)
                return Response(serializer.data, status=status.HTTP_200_OK)

            playlist = Playlist.objects.create(
                playlist_id=playlist_info["id"],
                title=playlist_info["title"],
                playlist_url=playlist_info["url"],
                playlist_thumbnail=playlist_info["playlist_thumbnail"],
                user=request.user  # Привязываем к текущему пользователю
            )

            video_ids = [v["id"] for v in videos_info]
            
            transcript_data = fetch_youtube_data(video_ids)

            # Extract both full transcripts and timecode transcripts by video ID
            transcripts_by_id = {}
            timecodes_by_id = {}
            
            if transcript_data:
                for video_transcript in transcript_data:
                    video_id = video_transcript.get('id')
                    if video_id:
                        # Extract full transcript (plain text)
                        single_video_transcript = extract_full_transcript([video_transcript])
                        transcripts_by_id[video_id] = single_video_transcript
                        
                        # Extract timecode transcript (JSON with timestamps)
                        try:
                            if 'tracks' in video_transcript and len(video_transcript['tracks']) > 0:
                                timecode_transcript = video_transcript['tracks'][0]['transcript']
                                timecodes_by_id[video_id] = timecode_transcript
                            else:
                                timecodes_by_id[video_id] = None
                        except (KeyError, IndexError) as e:
                            print(f"❌ Error extracting timecode for video {video_id}: {str(e)}")
                            timecodes_by_id[video_id] = None

            for v in videos_info:
                transcript = transcripts_by_id.get(v["id"], "")
                timecode = timecodes_by_id.get(v["id"], None)
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
                    playlist=playlist,
                    timecode_transcript=timecode,
                    user=request.user  # Привязываем к текущему пользователю
                )

            serializer = PlaylistSerializer(playlist)
            print("✅ Successfully created playlist:", serializer.data)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        except Exception as e:
            print(f"❌ Error processing playlist: {str(e)}")
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)



class PlaylistDetailAPIView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]
    
    def get(self, request, playlist_uuid):
        playlist = get_object_or_404(Playlist, uuid_playlist=playlist_uuid, user=request.user)
        serializer = PlaylistWithVideosSerializer(playlist)
        return Response(serializer.data)



class VideoDetailAPIView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]
    
    def get(self, request, video_uuid):
        # Получаем только видео текущего пользователя
        video = get_object_or_404(Video, uuid_video=video_uuid, user=request.user)
        serializer = VideoSerializer(video)
        return Response(serializer.data)



class MyCoursesAPIView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        playlists = Playlist.objects.filter(user=request.user).order_by('-id')
        serializer = PlaylistSerializer(playlists, many=True)
        return Response(serializer.data)
    


 

class MyCourseDeleteAPIView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]
    
    def delete(self, request, playlist_id):
        # Удаляем только плейлисты текущего пользователя
        playlist = get_object_or_404(Playlist, id=playlist_id, user=request.user)
        playlist.delete()
        return Response({"message": "Playlist deleted successfully"}, status=status.HTTP_200_OK)




class SummaryChatbotAPIView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        video_uuid = request.data.get("video_uuid")
        user_message = request.data.get("user_message")

        if not video_uuid:
            return Response({"error": "video_uuid is required"}, status=status.HTTP_400_BAD_REQUEST)
        
        if not user_message:
            return Response({"error": "user_message is required"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            # Получаем саммари текущего пользователя
            video = get_object_or_404(Video, uuid_video=video_uuid, user=request.user)
            summary = video.summary
            
            if not summary:
                return Response({"error": "No summary available for this video"}, status=status.HTTP_400_BAD_REQUEST)

            prompt = f"""
            You are an expert in understanding the user's question about this content:
            {summary}
            User's question:
            {user_message}

            Please answer simply and briefly in 3–5 sentences.
            Answer only based on the content above.

            Please answer based ONLY on the video content above.
            """
            
            response = StreamingHttpResponse(
                summary_chatbot(prompt), 
                content_type='text/event-stream'
            )
            return response
            
        except Video.DoesNotExist:
            return Response({"error": "Video not found"}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)




class GenerateFlashCardsView(APIView):
    authentication_classes = []
    permission_classes = []

    def post(self, request):
        video_uuid = request.data.get("video_uuid")
        
        if not video_uuid:
            return Response({"error": "video_uuid is required"}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            # Временно убираем фильтрацию по пользователю для тестирования
            video = get_object_or_404(Video, uuid_video=video_uuid)
            
            if not video.full_transcript:
                return Response({"error": "No transcript available for this video"}, status=status.HTTP_400_BAD_REQUEST)
            
            # Check if flashcards already exist
            existing_flashcard = Flashcard.objects.filter(
                flashcard_video=video
            ).first()
            
            if existing_flashcard:
                return Response({
                    "message": "Flashcards already exist for this video",
                    "flashcards": existing_flashcard.flashcards_json,
                    "uuid_flashcard": existing_flashcard.uuid_flashcard
                }, status=200)

            flashcards_data = generate_flashcards_from_transcript(video.full_transcript)
            
            # Save to database - используем пользователя из видео
            flashcard = Flashcard.objects.create(
                flashcards_json=flashcards_data,
                user=video.user,
                flashcard_video=video
            )
            
            return Response({
                "message": "Flashcards generated successfully",
                "flashcards": flashcards_data,
                "uuid_flashcard": flashcard.uuid_flashcard,
                "video_title": video.title
            }, status=201)
                
        except Video.DoesNotExist:
            return Response({"error": "Video not found"}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    from django.http import Http404

    def get(self, request):
        uuid_video = request.query_params.get("video_uuid")
        
        if not uuid_video:
            return Response({"error": "video_uuid query parameter is required"}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            video = get_object_or_404(Video, uuid_video=uuid_video)
            flashcard = get_object_or_404(Flashcard, flashcard_video=video)

            return Response({
                "flashcards": flashcard.flashcards_json,
                "uuid_flashcard": flashcard.uuid_flashcard,
                "video_title": video.title
            }, status=200)

        except Http404 as e:
            return Response({"error": str(e)}, status=status.HTTP_404_NOT_FOUND)

        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class GenerateMindMapView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request):
        """Get existing mindmap for a video"""
        video_uuid = request.query_params.get("video_uuid")
        
        if not video_uuid:
            return Response({"error": "video_uuid is required"}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            video = get_object_or_404(Video, uuid_video=video_uuid, user=request.user)
            
            # Try to get existing mindmap
            try:
                mindmap = MindMap.objects.get(mindmap_video=video, user=request.user)
                return Response({
                    "message": "Mindmap found",
                    "mindmap": mindmap.mindmap_json,
                    "video_title": video.title
                }, status=200)
            except MindMap.DoesNotExist:
                return Response({"error": "No mindmap found for this video"}, status=status.HTTP_404_NOT_FOUND)
                
        except Video.DoesNotExist:
            return Response({"error": "Video not found"}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def post(self, request):
        """Generate and save new mindmap for a video"""
        video_uuid = request.data.get("video_uuid")
        
        if not video_uuid:
            return Response({"error": "video_uuid is required"}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            video = get_object_or_404(Video, uuid_video=video_uuid, user=request.user)
            
            if not video.full_transcript:
                return Response({"error": "No transcript available for this video"}, status=status.HTTP_400_BAD_REQUEST)
            
            # Check if mindmap already exists
            existing_mindmap = MindMap.objects.filter(mindmap_video=video, user=request.user).first()
            
            if existing_mindmap:
                # Return existing mindmap
                return Response({
                    "message": "Mindmap already exists",
                    "mindmap": existing_mindmap.mindmap_json,
                    "video_title": video.title
                }, status=200)
            
            # Generate new mindmap from transcript
            mindmap_data = generate_mindmap_from_transcript(video.full_transcript)
            
            # Save mindmap to database
            mindmap = MindMap.objects.create(
                mindmap_json=mindmap_data,
                user=request.user,
                mindmap_video=video
            )
            
            return Response({
                "message": "Mindmap generated and saved successfully",
                "mindmap": mindmap_data,
                "video_title": video.title,
                "mindmap_uuid": mindmap.uuid_mindmap
            }, status=201)
                
        except Video.DoesNotExist:
            return Response({"error": "Video not found"}, status=status.HTTP_404_NOT_FOUND)
        except ValueError as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    def delete(self, request):
        """Delete existing mindmap for regeneration"""
        video_uuid = request.data.get("video_uuid")
        
        if not video_uuid:
            return Response({"error": "video_uuid is required"}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            video = get_object_or_404(Video, uuid_video=video_uuid, user=request.user)
            
            # Delete existing mindmap
            deleted_count = MindMap.objects.filter(mindmap_video=video, user=request.user).delete()[0]
            
            if deleted_count > 0:
                return Response({"message": "Mindmap deleted successfully"}, status=200)
            else:
                return Response({"error": "No mindmap found to delete"}, status=status.HTTP_404_NOT_FOUND)
                
        except Video.DoesNotExist:
            return Response({"error": "Video not found"}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


