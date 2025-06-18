import jwt
import requests
from jwt import PyJWKClient
from django.contrib.auth import get_user_model
from rest_framework.authentication import BaseAuthentication
from rest_framework.exceptions import AuthenticationFailed
from django.conf import settings
import os
User = get_user_model()

class ClerkJWTAuthentication(BaseAuthentication):
    def authenticate(self, request):
        auth_header = request.META.get('HTTP_AUTHORIZATION')

        if not auth_header or not auth_header.startswith('Bearer '):
            return None

        token = auth_header.split(' ')[1]

        try:
            jwks_url = os.getenv("JWKS_URL") or f"https://{os.getenv('CLERK_DOMAIN')}/.well-known/jwks.json"
            jwk_client = PyJWKClient(jwks_url)
            signing_key = jwk_client.get_signing_key_from_jwt(token)

            decoded_token = jwt.decode(
                token,
                signing_key.key,
                algorithms=["RS256"],
                options={"verify_aud": False}  # Отключаем проверку audience для упрощения
            )

            clerk_id = decoded_token.get("sub")
            if not clerk_id:
                raise AuthenticationFailed("No sub claim in Clerk token")

            # Получаем email из токена для создания пользователя
            email = decoded_token.get("email") or decoded_token.get("primary_email_address", {}).get("email_address")
            first_name = decoded_token.get("given_name", "")
            last_name = decoded_token.get("family_name", "")

            user, created = User.objects.get_or_create(
                clerk_id=clerk_id,
                defaults={
                    'email': email or f"{clerk_id}@clerk.local",
                    'first_name': first_name,
                    'last_name': last_name,
                }
            )

            return (user, token)

        except jwt.ExpiredSignatureError:
            raise AuthenticationFailed("Token expired")
        except jwt.InvalidTokenError as e:
            raise AuthenticationFailed(f"Invalid token: {str(e)}")
        except Exception as e:
            raise AuthenticationFailed(f"Authentication failed: {str(e)}")
