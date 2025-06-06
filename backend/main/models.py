from django.db import models


class Playlist(models.Model):
    playlist_id = models.CharField(max_length=100)
    title = models.CharField(max_length=255)
    playlist_url = models.URLField()
    playlist_thumbnail = models.URLField(null=True, blank=True)
    

    def __str__(self):
        return self.title


class Video(models.Model):
    video_id = models.CharField(max_length=100)
    title = models.CharField(max_length=255)
    url = models.URLField()
    thumbnail = models.URLField(null=True, blank=True)
    duration_sec = models.PositiveIntegerField(null=True, blank=True)
    duration_string = models.CharField(null=True, blank=True)
    summary = models.TextField()
    full_transcript = models.TextField(null=True, blank=True)
    playlist = models.ForeignKey(
        Playlist,
        related_name="videos",
        on_delete=models.CASCADE
    )


    def __str__(self):
        return f"{self.title} ({self.video_id})"
