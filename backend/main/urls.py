from django.urls import path
from . import views

urlpatterns = [
    # Playlists and videos
    path('playlists/', views.PlaylistAPIView.as_view(), name='playlist-list-create'),
    path('playlists/<uuid:playlist_uuid>/', views.PlaylistDetailAPIView.as_view(), name='playlist-detail'),
    path('playlists/<uuid:playlist_uuid>/videos/', views.PlaylistVideosListAPIView.as_view(), name='playlist-videos-list'),
    path('videos/<uuid:video_uuid>/', views.VideoDetailAPIView.as_view(), name='video-detail'),
    
    # My courses
    path('my-courses/', views.MyCoursesAPIView.as_view(), name='my-courses'),
    path('my-courses/<uuid:playlist_id>/delete/', views.MyCourseDeleteAPIView.as_view(), name='my-course-delete'),
    
    # AI Features
    path('summary-chatbot/', views.SummaryChatbotAPIView.as_view(), name='summary-chatbot'),
    path('flashcards/', views.GenerateFlashCardsView.as_view(), name='flashcards'),
    path('mindmap/', views.GenerateMindMapView.as_view(), name='mindmap'),
    path('quiz/', views.GenerateQuizView.as_view(), name='quiz'),
    path('quiz/submit/', views.SubmitQuizResultsView.as_view(), name='quiz-submit'),
    path('quiz/explain/', views.QuizExplanationAPIView.as_view(), name='quiz-explain'),
]


