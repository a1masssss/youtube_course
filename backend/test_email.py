#!/usr/bin/env python
import os
import django
from django.core.mail import send_mail
from django.conf import settings

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backennd.settings')
django.setup()

def test_email():
    print("🧪 Testing email configuration...")
    print(f"📧 EMAIL_BACKEND: {settings.EMAIL_BACKEND}")
    print(f"📧 EMAIL_HOST: {settings.EMAIL_HOST}")
    print(f"📧 EMAIL_PORT: {settings.EMAIL_PORT}")
    print(f"📧 EMAIL_USE_TLS: {settings.EMAIL_USE_TLS}")
    print(f"📧 EMAIL_HOST_USER: {settings.EMAIL_HOST_USER}")
    print(f"📧 DEFAULT_FROM_EMAIL: {settings.DEFAULT_FROM_EMAIL}")
    
    try:
        result = send_mail(
            subject='Test Email from Django',
            message='This is a test email to verify SMTP configuration.',
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[settings.EMAIL_HOST_USER],  # Send to yourself
            fail_silently=False,
        )
        print(f"✅ Email sent successfully! Result: {result}")
        return True
    except Exception as e:
        print(f"❌ Email sending failed: {str(e)}")
        return False

if __name__ == "__main__":
    test_email() 