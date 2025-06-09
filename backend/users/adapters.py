from allauth.socialaccount.adapter import DefaultSocialAccountAdapter
from allauth.account.adapter import DefaultAccountAdapter
from django.contrib.auth import get_user_model

User = get_user_model()

class CustomAccountAdapter(DefaultAccountAdapter):
    def save_user(self, request, user, form, commit=True):
        user = super().save_user(request, user, form, commit=False)
        user.is_active = True 
        if commit:
            user.save()
        return user

class CustomSocialAccountAdapter(DefaultSocialAccountAdapter):
    def pre_social_login(self, request, sociallogin):
        # Connect existing users with same email
        email = sociallogin.account.extra_data.get('email')

        if email:
            try:
                existing_user = User.objects.get(email=email)
                # Connect this social login to the existing user
                sociallogin.connect(request, existing_user)
            except User.DoesNotExist:
                pass  # No existing user, will proceed to create one

        # Activate new users if needed
        user = sociallogin.user
        if not user.pk:  
            user.is_active = True

    def save_user(self, request, sociallogin, form=None):
        """Ensure user is active when created via social login"""
        user = super().save_user(request, sociallogin, form)
        user.is_active = True
        user.save()
        return user

    def get_login_redirect_url(self, request):
        """
        Force redirect to React frontend after OAuth login
        """
        return "http://localhost:3000/auth/callback/"