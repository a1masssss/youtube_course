from django.urls import path

from main.views import PlaylistAPIView


urlpatterns = [
    path('', PlaylistAPIView.as_view(), name="get_playlist"), 

]