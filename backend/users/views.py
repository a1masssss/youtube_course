from django.shortcuts import render
from django.contrib.auth import authenticate
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.authentication import JWTAuthentication
from django.contrib.auth import get_user_model
from django.shortcuts import redirect
from django.http import JsonResponse, HttpResponseRedirect
from allauth.socialaccount.models import SocialAccount
from django.urls import reverse
from django.contrib.auth import login as django_login
from allauth.socialaccount.adapter import DefaultSocialAccountAdapter
from allauth.account.utils import perform_login
from allauth.core.exceptions import ImmediateHttpResponse
import json
from urllib.parse import urlencode
import logging
from rest_framework.authentication import SessionAuthentication

User = get_user_model()
logger = logging.getLogger(__name__)

def get_tokens_for_user(user):
    refresh = RefreshToken.for_user(user)
    return {
        'refresh': str(refresh),
        'access': str(refresh.access_token),
    }


class RegisterView(APIView):
    permission_classes = [AllowAny]
    
    def post(self, request):
        email = request.data.get('email')
        password = request.data.get('password')
        first_name = request.data.get('first_name')
        last_name = request.data.get('last_name')
        
        # Validation
        if not email or not password:
            return Response({
                'error': 'Email and password are required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        if User.objects.filter(email=email).exists():
            return Response({
                'error': 'User with this email already exists'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        if len(password) < 6:
            return Response({
                'error': 'Password must be at least 6 characters long'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            # Create user
            user = User.objects.create_user(
                email=email,
                password=password,
                first_name=first_name or '',
                last_name=last_name or ''
            )
            
            # Generate tokens
            tokens = get_tokens_for_user(user)
            
            return Response({
                'message': 'Registration successful',
                'tokens': tokens,
                'user': {
                    'id': user.id,
                    'email': user.email,
                    'first_name': user.first_name,
                    'last_name': user.last_name,
                }
            }, status=status.HTTP_201_CREATED)
            
        except Exception as e:
            return Response({
                'error': 'Registration failed'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class LoginView(APIView):
    permission_classes = [AllowAny]
    
    def post(self, request):
        email = request.data.get('email')
        password = request.data.get('password')
        
        if not email or not password:
            return Response({
                'error': 'Email and password are required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        user = authenticate(request, username=email, password=password)
        
        if user:
            tokens = get_tokens_for_user(user)
            return Response({
                'message': 'Login successful',
                'tokens': tokens,
                'user': {
                    'id': user.id,
                    'email': user.email,
                    'first_name': user.first_name,
                    'last_name': user.last_name,
                }
            })
        else:
            return Response({
                'error': 'Invalid credentials'
            }, status=status.HTTP_401_UNAUTHORIZED)

class LogoutView(APIView):
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        try:
            refresh_token = request.data.get('refresh')
            if refresh_token:
                try:
                    token = RefreshToken(refresh_token)
                    # Try to blacklist the token if blacklist app is installed
                    token.blacklist()
                except Exception as blacklist_error:
                    # If blacklisting fails (e.g., blacklist app not installed), 
                    # still return success as the user is logging out
                    print(f"Token blacklisting failed: {blacklist_error}")
                    pass
            
            return Response({
                'message': 'Logout successful'
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            print(f"Logout error: {e}")
            # Even if there's an error, we should allow logout
            return Response({
                'message': 'Logout successful'
            }, status=status.HTTP_200_OK)

class UserProfileView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        user = request.user
        return Response({
            'id': user.id,
            'email': user.email,
            'first_name': user.first_name,
            'last_name': user.last_name,
        })

class RefreshTokenView(APIView):
    permission_classes = [AllowAny]
    
    def post(self, request):
        try:
            refresh_token = request.data.get('refresh')
            if not refresh_token:
                return Response({
                    'error': 'Refresh token is required'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            token = RefreshToken(refresh_token)
            new_token = token.access_token
            
            return Response({
                'access': str(new_token)
            })
        except Exception as e:
            return Response({
                'error': 'Invalid refresh token'
            }, status=status.HTTP_401_UNAUTHORIZED)

class GoogleOAuthCallbackView(APIView):
    """
    API endpoint to get JWT tokens after OAuth login
    """
    authentication_classes = [SessionAuthentication]
    permission_classes = [AllowAny]
    
    def get(self, request):
        try:
            # Debug logging
            logger.info(f"OAuth callback - User authenticated: {request.user.is_authenticated}")
            logger.info(f"OAuth callback - User: {request.user}")
            logger.info(f"OAuth callback - Session key: {request.session.session_key}")
            
            # Check if user is authenticated (via session after OAuth)
            if request.user.is_authenticated:
                # Generate JWT tokens for the user
                refresh = RefreshToken.for_user(request.user)
                
                return Response({
                    'tokens': {
                        'refresh': str(refresh),
                        'access': str(refresh.access_token),
                    },
                    'user': {
                        'id': request.user.id,
                        'email': request.user.email,
                        'first_name': request.user.first_name,
                        'last_name': request.user.last_name,
                    }
                }, status=200)
            else:
                logger.warning("OAuth callback - User not authenticated")
                return Response({'error': 'User not authenticated'}, status=401)
        except Exception as e:
            logger.error(f"OAuth callback error: {str(e)}")
            return Response({'error': 'Authentication failed'}, status=500)

class OAuthRedirectView(APIView):
    """
    Redirect view that sends users to React frontend after OAuth
    """
    authentication_classes = [SessionAuthentication]
    permission_classes = [AllowAny]
    
    def get(self, request):
        # Debug logging
        logger.info(f"OAuth redirect - User authenticated: {request.user.is_authenticated}")
        logger.info(f"OAuth redirect - User: {request.user}")
        
        # Check if this is already a redirect to prevent infinite loops
        if request.GET.get('redirected'):
            logger.warning("Already redirected, preventing infinite loop")
            return Response({'error': 'Redirect loop detected'}, status=400)
        
        # Always redirect to React - let React handle the token retrieval
        # Add a parameter to prevent infinite loops
        redirect_url = 'http://localhost:3000/auth/callback/?from_django=true'
        logger.info(f"Redirecting to: {redirect_url}")
        return HttpResponseRedirect(redirect_url)



