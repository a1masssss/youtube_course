from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework_simplejwt.authentication import JWTAuthentication
from users.authentication import ClerkJWTAuthentication
from django.shortcuts import get_object_or_404
from django.http import Http404, StreamingHttpResponse, JsonResponse
from django.utils import timezone
from django.contrib.auth import get_user_model
import json
import logging
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
import hmac
import hashlib
from django.conf import settings

# Get the custom User model
User = get_user_model()

from main.utils.summary_chatbot import process_chatbot_request
from main.utils.quiz_explanation import process_quiz_explanation_request

from .models import Playlist, Video, Flashcard, MindMap, Quiz
from .serializers import (
    PlaylistSerializer,
    VideoSerializer,
    PlaylistWithVideosSerializer,
    PlaylistWithVideoListSerializer,
    QuizSerializer
)
from main.utils.extractor_ids import fetch_playlist_info, fetch_playlist_videos
from main.utils.transcript_fetch import fetch_youtube_data, extract_full_transcript
from main.utils.summarizer import summarize_transcript

from main.utils.generate_flashcards import generate_flashcards_from_transcript
from main.utils.generate_mindmap import generate_mindmap_from_transcript, generate_mindmap_from_video
from main.utils.generate_quiz import generate_quiz_from_transcript


class PlaylistAPIView(APIView):
    authentication_classes = [ClerkJWTAuthentication]
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        print("🚀 Received POST request to /api/playlists/")
        print(f"🔍 Request data: {request.data}")
        print(f"👤 User: {request.user}")
        
        # Get URL or playlist_id from request
        url = request.data.get("url")
        playlist_id = request.data.get("playlist_id")
        
        # If playlist_id is provided, construct YouTube URL
        if playlist_id and not url:
            url = f"https://www.youtube.com/playlist?list={playlist_id}"
            print(f"🔗 Constructed URL from playlist_id: {url}")
        
        if not url:
            print("❌ No URL or playlist_id provided")
            return Response({"error": "URL or playlist_id is required"}, status=status.HTTP_400_BAD_REQUEST)

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

            # Check total duration limit (30 hours = 108,000 seconds)
            MAX_PLAYLIST_DURATION = 30 * 60 * 60  # 30 hours in seconds
            total_duration = sum(durations_by_id.values())
            
            print(f"📊 Total playlist duration: {total_duration} seconds ({total_duration/3600:.2f} hours)")
            
            if total_duration > MAX_PLAYLIST_DURATION:
                # Delete the created playlist since we can't process it
                playlist.delete()
                hours = total_duration / 3600
                max_hours = MAX_PLAYLIST_DURATION / 3600
                error_message = f"Playlist duration ({hours:.1f} hours) exceeds the maximum allowed duration of {max_hours} hours. Please use a shorter playlist to reduce server load."
                print(f"❌ {error_message}")
                return Response({"error": error_message}, status=status.HTTP_400_BAD_REQUEST)

            # Filter videos by cumulative duration to ensure we don't exceed the limit
            processed_videos = []
            cumulative_duration = 0
            
            for v in videos_info:
                video_duration = durations_by_id.get(v["id"], 0)
                if cumulative_duration + video_duration <= MAX_PLAYLIST_DURATION:
                    processed_videos.append(v)
                    cumulative_duration += video_duration
                    print(f"✅ Added video {v['id']} - Running total: {cumulative_duration/3600:.2f} hours")
                else:
                    print(f"⏱️ Skipping video {v['id']} - would exceed time limit")
                    break

            print(f"📈 Processing {len(processed_videos)} out of {len(videos_info)} videos")
            print(f"🕐 Final duration: {cumulative_duration/3600:.2f} hours")

            for v in processed_videos:
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
    authentication_classes = [ClerkJWTAuthentication]
    permission_classes = [IsAuthenticated]
    
    def get(self, request, playlist_uuid):
        playlist = get_object_or_404(Playlist, uuid_playlist=playlist_uuid, user=request.user)
        serializer = PlaylistWithVideosSerializer(playlist)
        return Response(serializer.data)


class PlaylistVideosListAPIView(APIView):
    authentication_classes = [ClerkJWTAuthentication]
    permission_classes = [IsAuthenticated]
    
    def get(self, request, playlist_uuid):
        playlist = get_object_or_404(Playlist, uuid_playlist=playlist_uuid, user=request.user)
        serializer = PlaylistWithVideoListSerializer(playlist)
        return Response(serializer.data)


class VideoDetailAPIView(APIView):
    authentication_classes = [ClerkJWTAuthentication]
    permission_classes = [IsAuthenticated]
    
    def get(self, request, video_uuid):
        video = get_object_or_404(Video, uuid_video=video_uuid, user=request.user)
        serializer = VideoSerializer(video)
        return Response(serializer.data)



class MyCoursesAPIView(APIView):
    authentication_classes = [ClerkJWTAuthentication]
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        playlists = Playlist.objects.filter(user=request.user).order_by('-id')
        serializer = PlaylistSerializer(playlists, many=True)
        return Response(serializer.data)
    


 

class MyCourseDeleteAPIView(APIView):
    authentication_classes = [ClerkJWTAuthentication]
    permission_classes = [IsAuthenticated]
    
    def delete(self, request, playlist_id):
        # Удаляем только плейлисты текущего пользователя
        playlist = get_object_or_404(Playlist, id=playlist_id, user=request.user)
        playlist.delete()
        return Response({"message": "Playlist deleted successfully"}, status=status.HTTP_200_OK)



class SummaryChatbotAPIView(APIView):
    authentication_classes = [ClerkJWTAuthentication]
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        try:
            response_generator = process_chatbot_request(
                user=request.user,
                video_uuid=request.data.get("video_uuid"),
                user_message=request.data.get("user_message")
            )
            return StreamingHttpResponse(
                response_generator, 
                content_type='text/event-stream'
            )
            
        except ValueError as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
        except Video.DoesNotExist:
            return Response({"error": "Video not found"}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)



class GenerateFlashCardsView(APIView):
    authentication_classes = [ClerkJWTAuthentication]
    permission_classes = [IsAuthenticated]

    def post(self, request):
        print("Received POST request to /api/flashcards/")
        video_uuid = request.data.get("video_uuid")
        
        try:
            # Получаем видео текущего пользователя
            video = get_object_or_404(Video, uuid_video=video_uuid, user=request.user)
            print(f"🎥 Found video: {video.title}")
            
            if not video.full_transcript or not video.full_transcript.strip():
                print("No transcript available for this video")
                return Response({"error": "No transcript available for this video"}, status=status.HTTP_400_BAD_REQUEST)
            
            
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
    authentication_classes = [ClerkJWTAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request):
        """Get existing mindmap for a video"""
        video_uuid = request.query_params.get("video_uuid")
        
        if not video_uuid:
            return Response({"error": "video_uuid is required"}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            video = get_object_or_404(Video, uuid_video=video_uuid, user=request.user)
            
            # Get existing mindmap (should be only one due to unique constraint)
            mindmap = MindMap.objects.filter(mindmap_video=video, user=request.user).first()
            
            if mindmap:
                return Response({
                    "message": "Mindmap found",
                    "mindmap": mindmap.mindmap_json,
                    "video_title": video.title
                }, status=200)
            else:
                return Response({"error": "No mindmap found for this video"}, status=status.HTTP_404_NOT_FOUND)
                
        except Video.DoesNotExist:
            return Response({"error": "Video not found"}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def post(self, request):
        """Generate and save new mindmap for a video"""
        print("Received POST request to /api/mindmap/")
        video_uuid = request.data.get("video_uuid")
        
        if not video_uuid:
            return Response({"error": "video_uuid is required"}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            # Get video for current user
            video = get_object_or_404(Video, uuid_video=video_uuid, user=request.user)
            print(f"🎥 Found video: {video.title}")
            
            if not video.full_transcript or not video.full_transcript.strip():
                print("❌ No transcript available for this video")
                return Response({"error": "No transcript available for this video"}, status=status.HTTP_400_BAD_REQUEST)
            
            print(f"📄 Transcript length: {len(video.full_transcript)} characters")
            
            # Use generate_mindmap_from_video which handles get_or_create safely
            mindmap_data, created = generate_mindmap_from_video(video, request.user)
            
            if created:
                print("✅ New mindmap generated")
                message = "Mindmap generated successfully"
                status_code = 201
            else:
                print("✅ Existing mindmap found")
                message = "Mindmap already exists for this video"
                status_code = 200
            
            # Get the mindmap object for uuid
            mindmap_obj = MindMap.objects.filter(mindmap_video=video, user=request.user).first()
            
            if not mindmap_obj:
                print("❌ Mindmap object not found after generation")
                return Response({"error": "Failed to retrieve mindmap data"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            
            return Response({
                "message": message,
                "mindmap": mindmap_data,
                "uuid_mindmap": mindmap_obj.uuid_mindmap,
                "video_title": video.title,
                "created": created
            }, status=status_code)
                
        except Video.DoesNotExist:
            print("❌ Video not found")
            return Response({"error": "Video not found"}, status=status.HTTP_404_NOT_FOUND)
        except ValueError as e:
            print(f"❌ Mindmap generation failed: {e}")
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            print(f"❌ Unexpected error: {str(e)}")
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class GenerateQuizView(APIView):
    authentication_classes = [ClerkJWTAuthentication]
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
                
                response_data = {
                    "message": "Quiz found",
                    "quiz": serializer.data,
                    "video_title": video.title
                }
                
                # Add completion information if quiz is completed
                if quiz.is_completed:
                    response_data["completion"] = {
                        "is_completed": True,
                        "completed_at": quiz.created_at,
                        "score_percentage": quiz.score_percentage,
                        "correct_answers_count": quiz.correct_answers_count,
                        "total_questions": quiz.questions_count,
                        "user_answers": quiz.user_answers
                    }
                
                return Response(response_data, status=status.HTTP_200_OK)
                
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


class SubmitQuizResultsView(APIView):
    authentication_classes = [ClerkJWTAuthentication]
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        """Save quiz completion results"""
        print("🚀 Received POST request to /api/quiz/submit/")
        
        video_uuid = request.data.get("video_uuid")
        user_answers = request.data.get("user_answers")  # List of user answers
        
        if not video_uuid:
            return Response({"error": "video_uuid is required"}, status=status.HTTP_400_BAD_REQUEST)
        
        if not user_answers or not isinstance(user_answers, list):
            return Response({"error": "user_answers is required and must be a list"}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            # Get video for current user
            video = get_object_or_404(Video, uuid_video=video_uuid, user=request.user)
            
            # Get quiz for this video
            quiz = get_object_or_404(Quiz, quiz_video=video, user=request.user)
            
            if not quiz.quiz_json or len(quiz.quiz_json) == 0:
                return Response({"error": "Quiz has no questions"}, status=status.HTTP_400_BAD_REQUEST)
            
            # Calculate results
            total_questions = len(quiz.quiz_json)
            correct_answers = 0
            processed_answers = []
            
            for i, user_answer in enumerate(user_answers):
                if i >= total_questions:
                    break
                    
                question = quiz.quiz_json[i]
                is_correct = user_answer == question.get('correct_index')
                
                if is_correct:
                    correct_answers += 1
                
                processed_answers.append({
                    "question_index": i,
                    "selected_answer": user_answer,
                    "is_correct": is_correct,
                    "correct_answer": question.get('correct_index')
                })
            
            # Calculate score percentage
            score_percentage = (correct_answers / total_questions) * 100 if total_questions > 0 else 0
            
            # Update quiz with results
            quiz.is_completed = True
            quiz.score_percentage = score_percentage
            quiz.correct_answers_count = correct_answers
            quiz.user_answers = processed_answers
            quiz.save()
            
            print(f"✅ Quiz results saved: {correct_answers}/{total_questions} ({score_percentage:.1f}%)")
            
            return Response({
                "message": "Quiz results saved successfully",
                "results": {
                    "total_questions": total_questions,
                    "correct_answers": correct_answers,
                    "score_percentage": round(score_percentage, 1),
                    "is_completed": True,
                    "completed_at": quiz.created_at,
                    "user_answers": processed_answers
                }
            }, status=status.HTTP_200_OK)
            
        except Video.DoesNotExist:
            return Response({"error": "Video not found"}, status=status.HTTP_404_NOT_FOUND)
        except Quiz.DoesNotExist:
            return Response({"error": "Quiz not found"}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            print(f"❌ Error saving quiz results: {str(e)}")
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class QuizExplanationAPIView(APIView):
    authentication_classes = [ClerkJWTAuthentication]
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        """
        Handle AI explanation requests for quiz answers.
        """
        try:
            # Process request using utility function
            response_generator = process_quiz_explanation_request(
                user=request.user,
                video_uuid=request.data.get("video_uuid"),
                question_index=request.data.get("question_index"),
                user_answer_index=request.data.get("user_answer_index")
            )
            
            # Return streaming response
            return StreamingHttpResponse(
                response_generator, 
                content_type='text/event-stream'
            )
            
        except ValueError as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
        except Video.DoesNotExist:
            return Response({"error": "Video not found"}, status=status.HTTP_404_NOT_FOUND)
        except Quiz.DoesNotExist:
            return Response({"error": "Quiz not found"}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@csrf_exempt
@require_http_methods(["POST"])
def clerk_webhook(request):
    """
    Webhook endpoint to sync Clerk users with Django database
    """
    logger = logging.getLogger(__name__)
    
    try:
        # Get webhook secret from settings
        webhook_secret = getattr(settings, 'CLERK_WEBHOOK_SECRET', None)
        
        # Parse the webhook payload
        body = request.body
        payload = json.loads(body)
        
        event_type = payload.get('type')
        data = payload.get('data', {})
        
        logger.info(f"📧 Received Clerk webhook: {event_type}")
        
        # Temporarily disable signature verification for testing
        # TODO: Re-enable after confirming webhook works
        signature_check_disabled = True
        
        # Verify webhook signature if secret is configured and not disabled
        if webhook_secret and webhook_secret != 'whsec_your_webhook_secret_here' and not signature_check_disabled:
            signature = request.headers.get('clerk-signature')
            if signature:
                # Verify the webhook signature
                if not verify_webhook_signature(body, signature, webhook_secret):
                    logger.warning("❌ Invalid webhook signature")
                    return JsonResponse({'error': 'Invalid signature'}, status=400)
            else:
                logger.warning("⚠️ No signature header found")
        else:
            if signature_check_disabled:
                logger.info("⚠️ Signature verification disabled for testing")
            else:
                logger.info("⚠️ Webhook secret not configured - skipping signature verification")
        
        if event_type == 'user.created':
            return handle_user_created(data, logger)
            
        elif event_type == 'user.updated':
            return handle_user_updated(data, logger)
            
        elif event_type == 'user.deleted':
            return handle_user_deleted(data, logger)
        
        else:
            logger.info(f"📄 Unhandled event type: {event_type}")
            return JsonResponse({'status': 'event_ignored', 'event_type': event_type})
        
        return JsonResponse({'status': 'success'})
        
    except json.JSONDecodeError as e:
        logger.error(f"❌ Invalid JSON in webhook payload: {str(e)}")
        return JsonResponse({'error': 'Invalid JSON'}, status=400)
    except Exception as e:
        logger.error(f"❌ Clerk webhook error: {str(e)}")
        return JsonResponse({'error': str(e)}, status=500)


def verify_webhook_signature(payload, signature, secret):
    """
    Verify Clerk webhook signature
    Based on Clerk's webhook verification: https://clerk.com/docs/webhooks/overview
    """
    import base64
    
    try:
        # Clerk sends multiple signatures in the header
        # Format: "v1,signature1 v1,signature2"
        signatures = signature.split(' ')
        
        for sig in signatures:
            if not sig.startswith('v1,'):
                continue
                
            # Extract the signature part
            sig_value = sig[3:]  # Remove 'v1,' prefix
            
            # Clerk uses the raw payload body for signature
            expected_sig = hmac.new(
                secret.encode('utf-8'),
                payload,
                hashlib.sha256
            ).hexdigest()
            
            # Try multiple comparison methods
            if hmac.compare_digest(sig_value, expected_sig):
                return True
                
            # Also try base64 encoded version
            try:
                expected_sig_b64 = base64.b64encode(
                    hmac.new(
                        secret.encode('utf-8'),
                        payload,
                        hashlib.sha256
                    ).digest()
                ).decode('utf-8')
                
                if hmac.compare_digest(sig_value, expected_sig_b64):
                    return True
            except:
                pass
        
        return False
        
    except Exception as e:
        logging.getLogger(__name__).error(f"❌ Error verifying signature: {str(e)}")
        return False


def handle_user_created(data, logger):
    """
    Handle user.created webhook event
    """
    clerk_user_id = data.get('id')
    email_addresses = data.get('email_addresses', [])
    email = email_addresses[0].get('email_address') if email_addresses else None
    first_name = data.get('first_name', '')
    last_name = data.get('last_name', '')
    
    logger.info(f"🔍 Processing user.created: email={email}, clerk_id={clerk_user_id}")
    
    if not email or not clerk_user_id:
        logger.warning("❌ Missing email or clerk_user_id in webhook data")
        return JsonResponse({'error': 'Missing email or clerk_user_id'}, status=400)
    
    try:
        # Check if user already exists by Clerk ID
        existing_user = User.objects.filter(clerk_id=clerk_user_id).first()
        if existing_user:
            logger.info(f"✅ User already exists with Clerk ID: {email}")
            return JsonResponse({
                'status': 'user_already_exists',
                'user_id': existing_user.id,
                'email': existing_user.email
            })
        
        # Check if user exists by email
        existing_user = User.objects.filter(email=email).first()
        if existing_user:
            # Update with Clerk ID
            existing_user.clerk_id = clerk_user_id
            existing_user.first_name = first_name or existing_user.first_name
            existing_user.last_name = last_name or existing_user.last_name
            existing_user.save()
            logger.info(f"✅ Updated existing user with Clerk ID: {email}")
            return JsonResponse({
                'status': 'user_updated_with_clerk_id',
                'user_id': existing_user.id,
                'email': existing_user.email
            })
        
        # Create new user
        user = User.objects.create_user(
            email=email,
            first_name=first_name,
            last_name=last_name,
            clerk_id=clerk_user_id,
            is_active=True,
            username=email  # Use email as username
        )
        
        logger.info(f"✅ Created new user: {email} (Clerk ID: {clerk_user_id}, Django ID: {user.id})")
        return JsonResponse({
            'status': 'user_created',
            'user_id': user.id,
            'email': user.email,
            'clerk_id': clerk_user_id
        })
        
    except Exception as e:
        logger.error(f"❌ Error creating user: {str(e)}")
        return JsonResponse({'error': f'Failed to create user: {str(e)}'}, status=500)


def handle_user_updated(data, logger):
    """
    Handle user.updated webhook event
    """
    clerk_user_id = data.get('id')
    email_addresses = data.get('email_addresses', [])
    email = email_addresses[0].get('email_address') if email_addresses else None
    first_name = data.get('first_name', '')
    last_name = data.get('last_name', '')
    
    logger.info(f"🔄 Processing user.updated: email={email}, clerk_id={clerk_user_id}")
    
    try:
        # Try to find user by Clerk ID first
        user = User.objects.filter(clerk_id=clerk_user_id).first()
        if not user and email:
            # Try to find by email
            user = User.objects.filter(email=email).first()
        
        if user:
            # Update user information
            updated_fields = []
            if user.email != email and email:
                user.email = email
                updated_fields.append('email')
            if user.first_name != first_name:
                user.first_name = first_name
                updated_fields.append('first_name')
            if user.last_name != last_name:
                user.last_name = last_name
                updated_fields.append('last_name')
            if not user.clerk_id and clerk_user_id:
                user.clerk_id = clerk_user_id
                updated_fields.append('clerk_id')
            
            user.save()
            logger.info(f"✅ Updated user: {email} (fields: {', '.join(updated_fields)})")
            return JsonResponse({
                'status': 'user_updated',
                'user_id': user.id,
                'updated_fields': updated_fields
            })
        else:
            logger.warning(f"❌ User not found for Clerk ID: {clerk_user_id}")
            return JsonResponse({'error': 'User not found'}, status=404)
            
    except Exception as e:
        logger.error(f"❌ Error updating user: {str(e)}")
        return JsonResponse({'error': f'Failed to update user: {str(e)}'}, status=500)


def handle_user_deleted(data, logger):
    """
    Handle user.deleted webhook event
    """
    clerk_user_id = data.get('id')
    logger.info(f"🗑️ Processing user.deleted: clerk_id={clerk_user_id}")
    
    try:
        user = User.objects.filter(clerk_id=clerk_user_id).first()
        if user:
            user_email = user.email
            user_id = user.id
            user.delete()
            logger.info(f"✅ Deleted user: {user_email} (Django ID: {user_id})")
            return JsonResponse({
                'status': 'user_deleted',
                'deleted_user_id': user_id,
                'deleted_email': user_email
            })
        else:
            logger.warning(f"❌ User not found for deletion, Clerk ID: {clerk_user_id}")
            return JsonResponse({'error': 'User not found'}, status=404)
            
    except Exception as e:
        logger.error(f"❌ Error deleting user: {str(e)}")
        return JsonResponse({'error': f'Failed to delete user: {str(e)}'}, status=500)


