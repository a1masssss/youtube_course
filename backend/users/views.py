import json, hmac, hashlib, base64, logging
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.conf import settings
from django.contrib.auth import get_user_model

User = get_user_model()
logger = logging.getLogger(__name__)

@csrf_exempt
def clerk_webhook(request):
    if request.method != 'POST':
        return JsonResponse({'error': 'Method not allowed'}, status=405)

    try:
        signature = request.headers.get("Clerk-Signature")
        secret = getattr(settings, "CLERK_WEBHOOK_SECRET", None)
        payload = request.body

        # Проверка подписи (можно отключить в dev-среде)
        if signature and secret:
            expected = hmac.new(
                key=bytes(secret, "utf-8"),
                msg=payload,
                digestmod=hashlib.sha256
            ).digest()
            expected_signature = base64.b64encode(expected).decode()

            if not hmac.compare_digest(expected_signature, signature):
                logger.warning("Invalid webhook signature")
                return JsonResponse({'error': 'Invalid signature'}, status=401)

        event = json.loads(payload)
        logger.info(f"Received Clerk event: {event.get('type')}")

        if event.get("type") == "user.created":
            data = event.get("data", {})
            email_list = data.get("email_addresses", [])
            email = email_list[0].get("email_address") if email_list else None
            clerk_id = data.get("id")

            if not email or not clerk_id:
                return JsonResponse({'error': 'Missing required data'}, status=400)

            user, created = User.objects.update_or_create(
                clerk_id=clerk_id,
                defaults={
                    "email": email,
                    "first_name": data.get("first_name", ""),
                    "last_name": data.get("last_name", ""),
                    "username": email.split("@")[0],
                }
            )

            logger.info(f"{'Created' if created else 'Updated'} user: {user.email}")

        return JsonResponse({'status': 'ok'})

    except Exception as e:
        logger.exception("Webhook error")
        return JsonResponse({'error': str(e)}, status=400)
    