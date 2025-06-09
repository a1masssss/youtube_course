# Deployment Guide

## Environment Variables Setup

### Backend (.env)
```bash
# Django settings
DEBUG=False
SECRET_KEY=your-production-secret-key-here
ALLOWED_HOSTS=your-domain.com,164.90.185.179

# Environment URLs (IMPORTANT: Change for production)
FRONTEND_URL=http://164.90.185.179:3000
BACKEND_URL=http://164.90.185.179:8001

# Database
DATABASE_URL=sqlite:///db.sqlite3

# API Keys
GROQ_API_KEY=your-groq-api-key-here
OPENAI_API_KEY=your-openai-api-key-here
YOUTUBE_TRANSCRIPT_API=your-youtube-api-key

# Google OAuth
GOOGLE_OAUTH2_CLIENT_ID=your-google-client-id
GOOGLE_OAUTH2_CLIENT_SECRET=your-google-client-secret
```

### Frontend (.env)
```bash
# API Configuration (IMPORTANT: Change for production)
REACT_APP_API_BASE_URL=http://164.90.185.179:8001/api

# Production Settings
REACT_APP_ENV=production
GENERATE_SOURCEMAP=false
CHOKIDAR_USEPOLLING=true
```

## Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable Google+ API
4. Create OAuth 2.0 credentials
5. Add authorized redirect URIs:
   - `http://164.90.185.179:8001/accounts/google/login/callback/`
   - `http://your-domain.com:8001/accounts/google/login/callback/`

## Django Sites Configuration

Update Django sites in admin or shell:
```python
from django.contrib.sites.models import Site
site = Site.objects.get(id=1)
site.domain = '164.90.185.179:8001'
site.name = 'Course Platform'
site.save()
```

## Deployment Steps

1. **Update environment variables** in both backend and frontend `.env` files
2. **Restart Django server**: `python manage.py runserver 164.90.185.179:8001`
3. **Build and serve React**: `npm run build && npm start`
4. **Update Google OAuth** redirect URIs in Google Cloud Console
5. **Test authentication flow** end-to-end

## Important Notes

- All hardcoded `localhost` URLs have been replaced with environment variables
- OAuth flow now uses `FRONTEND_URL` and `BACKEND_URL` from environment
- Make sure to update Google OAuth settings with production URLs
- Test the complete authentication flow after deployment

## Troubleshooting

- Check that all environment variables are set correctly
- Verify Google OAuth redirect URIs match your deployment URLs
- Check Django sites configuration matches your domain
- Ensure CORS settings allow your frontend domain 