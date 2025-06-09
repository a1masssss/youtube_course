from django.urls import path
from . import views

app_name = 'users'

urlpatterns = [
    path('register/', views.RegisterView.as_view(), name='register'),
    path('login/', views.LoginView.as_view(), name='login'),
    path('logout/', views.LogoutView.as_view(), name='logout'),
    path('refresh/', views.RefreshTokenView.as_view(), name='refresh'),
    path('profile/', views.UserProfileView.as_view(), name='profile'),
    path('user/', views.UserProfileView.as_view(), name='user'),  # Alias for frontend
    path('callback/', views.GoogleOAuthCallbackView.as_view(), name='oauth_api_callback'),
]
