# backend/authentication/firebase.py

from django.conf import settings
from firebase_admin import credentials, initialize_app


cred = credentials.Certificate(settings.FIREBASE_SERVICE_ACCOUNT)
initialize_app(cred)
