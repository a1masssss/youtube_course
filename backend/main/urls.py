from django.urls import path

from main.views import PlaylistAPIView, PlaylistDetailAPIView, VideoDetailAPIView


urlpatterns = [
    path('playlists/', PlaylistAPIView.as_view(), name="create_playlist"), 
    path('playlists/<int:playlist_id>/', PlaylistDetailAPIView.as_view(), name="get_playlist"),
    path('videos/<int:video_id>/', VideoDetailAPIView.as_view(), name="get_video"),
]