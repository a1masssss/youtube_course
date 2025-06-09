from django.contrib import admin
from .models import MindMap, Playlist, Video, Flashcard


@admin.register(Playlist)
class PlaylistAdmin(admin.ModelAdmin):
    list_display = ('playlist_id', 'title', 'user')
    search_fields = ('playlist_id', 'title', 'user')
    list_filter = ('user',)


@admin.register(Video)
class VideoAdmin(admin.ModelAdmin):
    list_display = ('video_id', 'title', 'user')
    search_fields = ('video_id', 'title', 'user')
    list_filter = ('user',)


@admin.register(Flashcard)
class FlashcardAdmin(admin.ModelAdmin):
    list_display = ('uuid_flashcard', 'flashcard_video', 'user')
    search_fields = ('flashcard_video__title', 'user__email')
    list_filter = ('user',)
    readonly_fields = ('uuid_flashcard',)



@admin.register(MindMap)
class MindMapAdmin(admin.ModelAdmin):
    list_display = ('uuid_mindmap', 'mindmap_video', 'user')
    search_fields = ('mindmap_video__title', 'user__email')
    list_filter = ('user',)
    readonly_fields = ('uuid_mindmap',)
