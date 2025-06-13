from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework_simplejwt.authentication import JWTAuthentication
from django.shortcuts import get_object_or_404
from django.http import Http404, StreamingHttpResponse

from main.utils.summary_chatbot import summary_chatbot

from .models import Playlist, Video, Flashcard, MindMap, Quiz
from .serializers import (
    PlaylistSerializer,
    VideoSerializer,
    PlaylistWithVideosSerializer,
    QuizSerializer
)
from main.utils.extractor_ids import fetch_playlist_info, fetch_playlist_videos
from main.utils.transcript_fetch import fetch_youtube_data, extract_full_transcript
from main.utils.summarizer import summarize_transcript

from main.utils.generate_flashcards import generate_flashcards_from_transcript
from main.utils.generate_mindmap import generate_mindmap_from_transcript
from main.utils.generate_quiz import generate_quiz_from_transcript


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
            durations_by_id = {}
            
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
                        
                        # Extract duration in seconds
                        try:
                            duration_seconds = int(video_transcript['microformat']['playerMicroformatRenderer']['lengthSeconds'])
                            durations_by_id[video_id] = duration_seconds
                            print(f"📏 Video {video_id} duration: {duration_seconds} seconds")
                        except (KeyError, ValueError, TypeError) as e:
                            print(f"❌ Error extracting duration for video {video_id}: {str(e)}")
                            durations_by_id[video_id] = 0

            for v in videos_info:
                transcript = transcripts_by_id.get(v["id"], "")
                timecode = timecodes_by_id.get(v["id"], None)
                duration_sec = durations_by_id.get(v["id"], 0)
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
                    duration_sec=duration_sec,
                    user=request.user
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
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def post(self, request):
        print("🚀 Received POST request to /api/flashcards/")
        print("📦 Request data:", request.data)
        print(f"👤 User: {request.user.email}")
        
        video_uuid = request.data.get("video_uuid")
        
        if not video_uuid:
            print("❌ No video_uuid provided")
            return Response({"error": "video_uuid is required"}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            # Получаем видео текущего пользователя
            video = get_object_or_404(Video, uuid_video=video_uuid, user=request.user)
            print(f"🎥 Found video: {video.title}")
            
            if not video.full_transcript or not video.full_transcript.strip():
                print("❌ No transcript available for this video")
                return Response({"error": "No transcript available for this video"}, status=status.HTTP_400_BAD_REQUEST)
            
            print(f"📄 Transcript length: {len(video.full_transcript)} characters")
            
            # Сначала очищаем дубликаты если они есть
            existing_flashcards = Flashcard.objects.filter(flashcard_video=video, user=request.user)
            if existing_flashcards.count() > 1:
                print(f"🔧 Found {existing_flashcards.count()} duplicate flashcards, cleaning up...")
                # Оставляем только первую запись, остальные удаляем
                first_flashcard = existing_flashcards.first()
                Flashcard.objects.filter(flashcard_video=video, user=request.user).exclude(id=first_flashcard.id).delete()
                print("✅ Duplicate flashcards cleaned up")

            # Теперь безопасно используем get_or_create
            flashcards_data, created = generate_flashcards_from_transcript(video, request.user)
            
            if created:
                print("✅ New flashcards generated")
                message = "Flashcards generated successfully"
                status_code = 201
            else:
                print("✅ Existing flashcards found")
                message = "Flashcards already exist for this video"
                status_code = 200
            
            # Получаем uuid_flashcard из базы данных
            flashcard_obj = Flashcard.objects.filter(flashcard_video=video, user=request.user).first()
            
            if not flashcard_obj:
                print("❌ Flashcard object not found after generation")
                return Response({"error": "Failed to retrieve flashcard data"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            
            return Response({
                "message": message,
                "flashcards": flashcards_data,  # ← Используем данные из функции, не из БД
                "uuid_flashcard": flashcard_obj.uuid_flashcard,
                "video_title": video.title,
                "created": created
            }, status=status_code)
                
        except Video.DoesNotExist:
            print("❌ Video not found")
            return Response({"error": "Video not found"}, status=status.HTTP_404_NOT_FOUND)
        except ValueError as e:
            print(f"❌ Flashcards generation failed: {e}")
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

    def get(self, request):
        print("🚀 Received GET request to /api/flashcards/")
        uuid_video = request.query_params.get("video_uuid")
        
        if not uuid_video:
            return Response({"error": "video_uuid query parameter is required"}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            video = get_object_or_404(Video, uuid_video=uuid_video, user=request.user)
            flashcard = get_object_or_404(Flashcard, flashcard_video=video, user=request.user)

            return Response({
                "flashcards": flashcard.flashcards_json,
                "uuid_flashcard": flashcard.uuid_flashcard,
                "video_title": video.title
            }, status=200)

        except Http404 as e:
            return Response({"error": "Flashcards not found for this video"}, status=status.HTTP_404_NOT_FOUND)
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
   





class GenerateQuizView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        print("🚀 Received POST request to /api/generate-quiz/")
        video_uuid = request.data.get("video_uuid")
        if not video_uuid:
            print("❌ No video_uuid provided")
            return Response({"error": "video_uuid is required"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            # Get video for current user
            video = get_object_or_404(Video, uuid_video=video_uuid, user=request.user)
            print(f"🎥 Found video: {video.title}")
            
            # Check transcript
            if not video.full_transcript or not video.full_transcript.strip():
                print("❌ No transcript available for this video")
                return Response({"error": "No transcript available for this video"}, status=status.HTTP_400_BAD_REQUEST)
            
            # Check video duration
            if not video.duration_sec or video.duration_sec <= 0:
                print("❌ Invalid video duration")
                return Response({"error": "Invalid video duration"}, status=status.HTTP_400_BAD_REQUEST)
            
            try:
                # Try to get existing quiz or create new one
                quiz, created = Quiz.objects.get_or_create(
                    quiz_video=video,
                    user=request.user,
                    defaults={
                        'quiz_json': [],
                        'questions_count': 0,
                        'quiz_duration_seconds': video.duration_sec
                    }
                )
                
                # Generate new quiz if it's newly created or empty
                if created or not quiz.quiz_json or len(quiz.quiz_json) == 0:
                    print("🎯 Generating new quiz...")
                    
                    # Generate quiz using AI
                    quiz_questions = generate_quiz_from_transcript(
                        transcript=video.full_transcript,
                        duration_seconds=video.duration_sec
                    )
                    
                    # Save generated questions
                    quiz.quiz_json = quiz_questions
                    quiz.questions_count = len(quiz_questions)
                    quiz.save()
                    
                
                # Serialize quiz data
                serializer = QuizSerializer(quiz)
                
                return Response({
                    "message": "Quiz generated successfully" if created else "Quiz already exists",
                    "quiz": serializer.data,
                    "video_title": video.title,
                    "created": created
                }, status=status.HTTP_201_CREATED if created else status.HTTP_200_OK)
                    
            except Exception as quiz_error:
                print(f"Error with quiz generation: {str(quiz_error)}")
                return Response({"error": f"Quiz generation failed: {str(quiz_error)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
                
        except Video.DoesNotExist:
            print("Video not found or doesn't belong to user")
            return Response({"error": "Video not found"}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            print(f"Unexpected error: {str(e)}")
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def get(self, request):
        """Get existing quiz for a video"""
        video_uuid = request.query_params.get("video_uuid")
        
        if not video_uuid:
            return Response({"error": "video_uuid is required"}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            # Get video for current user
            video = get_object_or_404(Video, uuid_video=video_uuid, user=request.user)
            
            # Try to get quiz
            try:
                quiz = Quiz.objects.get(quiz_video=video, user=request.user)
                serializer = QuizSerializer(quiz)
                
                return Response({
                    "message": "Quiz found",
                    "quiz": serializer.data,
                    "video_title": video.title
                }, status=status.HTTP_200_OK)
                
            except Quiz.DoesNotExist:
                return Response({
                    "message": "Quiz not found",
                    "video_title": video.title
                }, status=status.HTTP_404_NOT_FOUND)
                
        except Video.DoesNotExist:
            return Response({"error": "Video not found"}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            print(f"Error getting quiz: {str(e)}")
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)




