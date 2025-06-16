import os
from django.contrib.auth.models import AbstractUser, BaseUserManager
from django.db import models
from django.utils.crypto import get_random_string
from functools import partial
from django.core.mail import send_mail
from django.utils import timezone
import uuid

FRONTEND_URL = os.getenv("FRONTEND_URL")
# Function to generate random token
get_random_token = partial(get_random_string, 100)

class UserManager(BaseUserManager):
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError('The Email field must be set')
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('is_active', True)  # Automatically activate superusers

        if extra_fields.get('is_staff') is not True:
            raise ValueError('Superuser must have is_staff=True.')
        if extra_fields.get('is_superuser') is not True:
            raise ValueError('Superuser must have is_superuser=True.')

        return self.create_user(email, password, **extra_fields)

class User(AbstractUser):
    uuid = models.UUIDField(default=uuid.uuid4, editable=False, unique=True)
    email = models.EmailField(unique=True)
    username = models.CharField(max_length=150, blank=True, null=True)
    is_active = models.BooleanField(default=False) 
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['first_name', 'last_name']
    
    objects = UserManager()
    
    def __str__(self):
        return self.email

class EmailActivation(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    token = models.CharField(max_length=100, default=get_random_token)
    created_at = models.DateTimeField(auto_now_add=True)
    is_active = models.BooleanField(default=False)

    class Meta:
        verbose_name = "Email Activation"
        verbose_name_plural = "Email Activations"
    
    def __str__(self):
        return f"Activation for {self.user.email}"
    
    def is_expired(self):
        """Check if the activation link has expired (24 hours)."""
        expiration_time = self.created_at + timezone.timedelta(hours=24)
        return timezone.now() > expiration_time
    
    def send_email(self):
        """Send a professional activation email to the user."""
        company_name = "Coursiva"
        
        base_url = FRONTEND_URL  
        activation_url = f"{base_url}/activate/{self.token}/{self.user.id}"
        
        # Email subject 
        subject = f'Activate Your {company_name} Account'
        
        # Create a professional HTML email body with proper formatting
        html_message = f'''
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Account Activation</title>
    <style>
        body {{
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #ffffff;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #0A0A1B;
        }}
        .header {{
            text-align: center;
            margin-bottom: 20px;
        }}
        .logo {{
            max-height: 60px;
        }}
        .content {{
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            padding: 30px;
            border-radius: 10px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }}
        .button {{
            display: inline-block;
            background-color: #ffffff;
            color: #764ba2 !important;
            text-decoration: none;
            padding: 12px 24px;
            margin: 20px 0;
            border-radius: 6px;
            font-weight: bold;
            transition: all 0.3s ease;
        }}
        .button:hover {{
            background-color: #f0f0f0;
            transform: translateY(-2px);
        }}
        .footer {{
            margin-top: 20px;
            font-size: 12px;
            color: #a0a0a0;
            text-align: center;
        }}
        .footer a {{
            color: #667eea;
            text-decoration: none;
        }}
        .footer a:hover {{
            text-decoration: underline;
        }}
    </style>
</head>
<body>
    <div class="header">
        <h1 style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">{company_name}</h1>
    </div>
    <div class="content">
        <h2>Welcome to {company_name}!</h2>
        <p>Thank you for signing up. To complete your registration and activate your account, please click on the button below:</p>
        
        <div style="text-align: center;">
            <a href="{activation_url}" class="button">Activate Your Account</a>
        </div>
        
        <p>If the button above doesn't work, please copy and paste the following link into your web browser:</p>
        <p style="word-break: break-all;">{activation_url}</p>
        
        <p>This activation link will expire in 24 hours for security reasons.</p>
        
        <p>If you did not create an account with us, please disregard this email.</p>
        
        <p>Best regards,<br>
        The {company_name} Team</p>
    </div>
    <div class="footer">
        <p>This is an automated message. Please do not reply to this email.</p>
        <p>&copy; {timezone.now().year} {company_name}. All rights reserved.</p>
        <p><a href="{base_url}/privacy-policy">Privacy Policy</a> | <a href="{base_url}/terms">Terms of Service</a></p>
    </div>
</body>
</html>
'''
        
        # Plain text version for email clients that don't support HTML
        plain_message = f'''
Welcome to {company_name}!

Thank you for signing up. To complete your registration and activate your account, please visit the following link:

{activation_url}

This activation link will expire in 24 hours for security reasons.

If you did not create an account with us, please disregard this email.

Best regards,
The {company_name} Team

© {timezone.now().year} {company_name}. All rights reserved.
'''
        
        from_email = f'auth@coursiva.com'
        
        # Recipient
        recipient_list = [self.user.email]
        
        # Send email with both HTML and plain text versions
        send_mail(
            subject=subject,
            message=plain_message,
            from_email=from_email,
            recipient_list=recipient_list,
            fail_silently=False,
            html_message=html_message
        )
        
        return True
