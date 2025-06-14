# Generated by Django 5.2.1 on 2025-06-08 13:22

import django.db.models.deletion
import uuid
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('main', '0012_flashcard'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='MindMap',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('mindmap_json', models.JSONField()),
                ('uuid_mindmap', models.UUIDField(default=uuid.uuid4, editable=False, unique=True)),
                ('mindmap_video', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='mindmaps', to='main.video')),
                ('user', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='mindmaps', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'unique_together': {('uuid_mindmap', 'user')},
            },
        ),
    ]
