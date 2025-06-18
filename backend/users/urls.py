from django.urls import path
from users.views import clerk_webhook


urlpatterns = [
    path('webhooks/clerk', clerk_webhook, name='clerk_webhook'),
]


