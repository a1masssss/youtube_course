import os
import logging
from allauth.socialaccount.adapter import DefaultSocialAccountAdapter
from allauth.account.adapter import DefaultAccountAdapter
from django.contrib.auth import get_user_model

User = get_user_model()
logger = logging.getLogger(__name__)

class CustomAccountAdapter(DefaultAccountAdapter):
    def is_open_for_signup(self, request):
        return True
    
    def save_user(self, request, user, form, commit=True):
        user = super().save_user(request, user, form, commit=False)
        user.is_active = True  # Ensure users are activated
        if commit:
            user.save()
        return user

class CustomSocialAccountAdapter(DefaultSocialAccountAdapter):
    def pre_social_login(self, request, sociallogin):
        """
        Connect existing user with same email to social account
        """
        logger.info(f"🔍 PRE_SOCIAL_LOGIN: {sociallogin.user.email}")
        logger.info(f"🔍 Provider: {sociallogin.account.provider}")
        
        if sociallogin.user.id:
            logger.info(f"✅ User already has ID: {sociallogin.user.id}")
            return
        
        try:
            # Try to find existing user with same email
            user = User.objects.get(email=sociallogin.user.email)
            logger.info(f"🔗 Connecting existing user {user.email} to social account")
            sociallogin.connect(request, user)
        except User.DoesNotExist:
            logger.info(f"👤 No existing user found for {sociallogin.user.email}, will create new")
            pass
    
    def save_user(self, request, sociallogin, form=None):
        """
        Ensure social login users are active and save extra data
        """
        logger.info(f"💾 Saving social user: {sociallogin.user.email}")
        logger.info(f"🔍 Social login extra data: {sociallogin.account.extra_data}")
        
        user = super().save_user(request, sociallogin, form)
        user.is_active = True
        user.save()
        
        logger.info(f"✅ Social user saved: {user.email} (ID: {user.id})")
        return user
    
    def populate_user(self, request, sociallogin, data):
        """
        Populate user with data from social account
        """
        logger.info(f"👥 Populating user data from social login")
        logger.info(f"🔍 Available data: {data}")
        
        user = super().populate_user(request, sociallogin, data)
        
        # Extract additional info from Google
        if sociallogin.account.provider == 'google':
            extra_data = sociallogin.account.extra_data
            logger.info(f"🔍 Google extra data: {extra_data}")
            
            # Set names if not already set
            if not user.first_name and extra_data.get('given_name'):
                user.first_name = extra_data.get('given_name')
            if not user.last_name and extra_data.get('family_name'):
                user.last_name = extra_data.get('family_name')
        
        return user
    
    def get_login_redirect_url(self, request):
        return "/oauth/success/"