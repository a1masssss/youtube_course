import os
from allauth.socialaccount.adapter import DefaultSocialAccountAdapter
from allauth.account.adapter import DefaultAccountAdapter
from django.contrib.auth import get_user_model

User = get_user_model()

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
        if sociallogin.user.id:
            return
        
        try:
            user = User.objects.get(email=sociallogin.user.email)
            sociallogin.connect(request, user)
        except User.DoesNotExist:
            pass
    
    def save_user(self, request, sociallogin, form=None):
        """
        Ensure social login users are active
        """
        user = super().save_user(request, sociallogin, form)
        user.is_active = True
        user.save()
        return user
    
    def get_login_redirect_url(self, request):
        """
        Redirect to our OAuth success endpoint which will handle token generation
        """
        return "/oauth/success/"