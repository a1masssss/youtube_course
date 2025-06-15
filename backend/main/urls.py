from django.urls import path

from main.views import GenerateQuizView, MyCoursesAPIView, MyCourseDeleteAPIView, PlaylistAPIView, PlaylistDetailAPIView, SummaryChatbotAPIView, VideoDetailAPIView, GenerateFlashCardsView, GenerateMindMapView, SubmitQuizResultsView

from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)
urlpatterns = [
    path('playlists/', PlaylistAPIView.as_view(), name="create_playlist"), 
    path('playlists/<uuid:playlist_uuid>/', PlaylistDetailAPIView.as_view(), name="get_playlist"),
    path('videos/<uuid:video_uuid>/', VideoDetailAPIView.as_view(), name="get_video"),

    path('my-courses/', MyCoursesAPIView.as_view(), name="my_courses"),
    path('my-courses/<int:playlist_id>/delete/', MyCourseDeleteAPIView.as_view(), name="delete_course"),

    path('summary-chatbot/', SummaryChatbotAPIView.as_view(), name="summary_chatbot"),
    path('flashcards/', GenerateFlashCardsView.as_view(), name="flashcards"),   
    path('mindmap/', GenerateMindMapView.as_view(), name="mindmap"),
    path('quiz/', GenerateQuizView.as_view(), name="quiz"),
    path('quiz/submit/', SubmitQuizResultsView.as_view(), name="submit_quiz"),
    
    path('token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
]


