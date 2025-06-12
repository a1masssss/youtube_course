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
import os

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
        logger.info("🚀 Starting registration process")
        logger.info(f"📥 RegisterView received data: {request.data}")
        
        email = request.data.get('email')
        password = request.data.get('password')
        first_name = request.data.get('first_name')
        last_name = request.data.get('last_name')
        
        logger.info(f"👤 Attempting to register user with email: {email}")
        
        # Validation
        if not email or not password:
            logger.error("❌ Email or password missing")
            return Response({
                'error': 'Email and password are required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        if User.objects.filter(email=email).exists():
            logger.error(f"❌ User with email {email} already exists")
            return Response({
                'error': 'User with this email already exists'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        if len(password) < 6:
            logger.error("❌ Password too short")
            return Response({
                'error': 'Password must be at least 6 characters long'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            logger.info("👥 Creating new user...")
            # Create user
            user = User.objects.create_user(
                email=email,
                password=password,
                first_name=first_name or '',
                last_name=last_name or ''
            )
            
            logger.info(f"✅ User created successfully with ID: {user.id}")
            
            # Generate tokens
            logger.info("🔑 Generating authentication tokens...")
            tokens = get_tokens_for_user(user)
            logger.info("✅ Tokens generated successfully")
            
            response_data = {
                'message': 'Registration successful',
                'tokens': tokens,
                'user': {
                    'id': user.id,
                    'email': user.email,
                    'first_name': user.first_name,
                    'last_name': user.last_name,
                }
            }
            logger.info(f"📤 Sending response: {response_data}")
            return Response(response_data, status=status.HTTP_201_CREATED)
            
        except Exception as e:
            logger.error(f"❌ Registration failed with error: {str(e)}")
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
    def get(self, request):
        try:
            # Check if user is authenticated via session (after OAuth)
            if request.user.is_authenticated:
                logger.info(f"✅ User is authenticated: {request.user.email}")
                
                # Generate JWT tokens for the user
                refresh = RefreshToken.for_user(request.user)
                access_token = str(refresh.access_token)
                refresh_token = str(refresh)
                
                # Return tokens and user info
                return Response({
                    'access_token': access_token,
                    'refresh_token': refresh_token,
                    'user': {
                        'id': request.user.id,
                        'email': request.user.email,
                        'first_name': request.user.first_name,
                        'last_name': request.user.last_name,
                    }
                }, status=200)
            else:
                return Response({'error': 'User not authenticated'}, status=401)
                
        except Exception as e:
            logger.error(f"❌ OAuth callback error: {str(e)}")
            # Always redirect to React - let React handle the token retrieval
            # Add a parameter to prevent infinite loops
            frontend_url = os.getenv('FRONTEND_URL')
            redirect_url = f'{frontend_url}/auth/callback/?from_django=true'
            logger.info(f"Redirecting to: {redirect_url}")
            return HttpResponseRedirect(redirect_url)

class OAuthRedirectView(APIView):
    """
    Redirect view that sends users to React frontend after OAuth
    """
    authentication_classes = [SessionAuthentication]
    permission_classes = [AllowAny]
    
    def get(self, request):
        # Check if this is already a redirect to prevent infinite loops
        if request.GET.get('redirected'):
            return Response({'error': 'Redirect loop detected'}, status=400)
        
        frontend_url = os.getenv('FRONTEND_URL')
        
        # If user is authenticated, generate tokens and redirect with them
        if request.user.is_authenticated:
            try:
                logger.info(f"✅ User is authenticated: {request.user.email}")
                
                # Generate JWT tokens for the user
                refresh = RefreshToken.for_user(request.user)
                access_token = str(refresh.access_token)
                refresh_token = str(refresh)
                
                # Redirect to React with tokens in URL parameters
                redirect_url = f'{frontend_url}/auth/callback/?access_token={access_token}&refresh_token={refresh_token}'
                return HttpResponseRedirect(redirect_url)
                
            except Exception as e:
                logger.error(f"❌ Error generating tokens: {str(e)}")
                # Redirect with error
                redirect_url = f'{frontend_url}/login?error=token_generation_failed'
                return HttpResponseRedirect(redirect_url)
        else:
            # Redirect with error
            redirect_url = f'{frontend_url}/login?error=oauth_failed'
            return HttpResponseRedirect(redirect_url)



