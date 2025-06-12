import uuid
from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()


class Playlist(models.Model):
    playlist_id = models.CharField(max_length=100)
    uuid_playlist = models.UUIDField(default=uuid.uuid4, editable=False, unique=True)
    title = models.CharField(max_length=255)
    playlist_url = models.URLField()
    playlist_thumbnail = models.URLField(null=True, blank=True)
    user = models.ForeignKey(
        User,
        related_name="playlists",
        on_delete=models.CASCADE
    )
    
    class Meta:
        unique_together = ['playlist_id', 'user']  # Один плейлист может быть у разных пользователей

    def __str__(self):
        return f"{self.title} - {self.user.email}"


class Video(models.Model):
    video_id = models.CharField(max_length=100)
    uuid_video = models.UUIDField(default=uuid.uuid4, editable=False, unique=True)
    title = models.CharField(max_length=255)
    url = models.URLField()
    thumbnail = models.URLField(null=True, blank=True)
    duration_sec = models.PositiveIntegerField(null=True, blank=True)
    duration_string = models.CharField(max_length=20, null=True, blank=True)
    summary = models.TextField()
    full_transcript = models.TextField(null=True, blank=True)
    timecode_transcript = models.JSONField(null=True, blank=True)
    playlist = models.ForeignKey(
        Playlist,
        related_name="videos",
        on_delete=models.CASCADE
    )
    user = models.ForeignKey(
        User,
        related_name="videos",
        on_delete=models.CASCADE
    )

    class Meta:
        unique_together = ['video_id', 'user']  # Одно видео может быть у разных пользователей

    def __str__(self):
        return f"{self.title} ({self.video_id}) - {self.user.email}"



class Flashcard(models.Model):
    flashcards_json = models.JSONField()
    uuid_flashcard = models.UUIDField(default=uuid.uuid4, editable=False, unique=True)
    user = models.ForeignKey(
        User,
        related_name="flashcards",
        on_delete=models.CASCADE
    )
    flashcard_video = models.ForeignKey(
        Video,
        related_name="flashcards",
        on_delete=models.CASCADE
    )

    class Meta:
        unique_together = ['uuid_flashcard', 'user']  # Одна и та же карточка может быть у разных пользователей

    def __str__(self):
        return f"{self.flashcards_json[:50]} - {self.user.email}"


class MindMap(models.Model):
    mindmap_json = models.JSONField()
    uuid_mindmap = models.UUIDField(default=uuid.uuid4, editable=False, unique=True)
    user = models.ForeignKey(
        User,
        related_name="mindmaps",
        on_delete=models.CASCADE)    
    mindmap_video  = models.ForeignKey(
        Video,
        related_name="mindmaps",
        on_delete=models.CASCADE
    )
    
    class Meta:
        unique_together = ['uuid_mindmap', 'user']  # Одна и та же карточка может быть у разных пользователей

    def __str__(self):
        return f"{self.mindmap_json[:50]} - {self.user.email}"


class Quiz(models.Model):
    quiz_json = models.JSONField()
    uuid_quiz = models.UUIDField(default=uuid.uuid4, editable=False, unique=True)
    questions_count = models.PositiveIntegerField(null=True, blank=True)
    quiz_duration_seconds = models.PositiveIntegerField(null=True, blank=True)
    user = models.ForeignKey(
        User,
        related_name="quizzes",
        on_delete=models.CASCADE
    )
    quiz_video = models.ForeignKey(
        Video,
        related_name="quizzes",
        on_delete=models.CASCADE
    )
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ['user', 'quiz_video']  # Один квиз на видео для каждого пользователя

    def __str__(self):
        return f"Quiz for {self.quiz_video.title} - {self.user.email}"
    
    