from rest_framework import serializers

from rest_framework import serializers
from main.models import Flashcard, MindMap, Playlist, Video, Quiz


class PlaylistSerializer(serializers.ModelSerializer):
    class Meta:
        model = Playlist
        fields = '__all__'


class VideoSerializer(serializers.ModelSerializer):
    playlist_uuid = serializers.CharField(source='playlist.uuid_playlist', read_only=True)
    
    class Meta:
        model = Video
        fields = '__all__'


class PlaylistWithVideosSerializer(serializers.ModelSerializer):
    videos = VideoSerializer(many=True, read_only=True)

    class Meta:
        model = Playlist
        fields = '__all__'


class FlashcardSerializer(serializers.ModelSerializer):
    class Meta:
        model = Flashcard
        fields = '__all__'


class MindMapSerializer(serializers.ModelSerializer):
    class Meta:
        model = MindMap
        fields = '__all__'


class QuizSerializer(serializers.ModelSerializer):
    class Meta:
        model = Quiz
        fields = '__all__'



