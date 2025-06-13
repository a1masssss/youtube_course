from django.urls import path
from . import views
from .views import (
    RegisterView,
    LoginView,
    LogoutView,
    RefreshTokenView,
    UserProfileView,
    GoogleOAuthCallbackView,
    OAuthRedirectView,
    ActivateAccountView,
    ResendActivationEmailView
)

app_name = 'users'

urlpatterns = [
    path('register/', RegisterView.as_view(), name='register'),
    path('login/', LoginView.as_view(), name='login'),
    path('logout/', LogoutView.as_view(), name='logout'),
    path('refresh/', RefreshTokenView.as_view(), name='refresh'),
    path('profile/', UserProfileView.as_view(), name='profile'),
    path('oauth/callback/', GoogleOAuthCallbackView.as_view(), name='oauth_api_callback'),
    path('oauth/redirect/', OAuthRedirectView.as_view(), name='oauth_redirect'),
    path('activate/', ActivateAccountView.as_view(), name='activate_account'),
    path('resend-activation/', ResendActivationEmailView.as_view(), name='resend_activation'),
]
