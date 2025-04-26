# backend/authentication/models.py

from django.db import models
from django.contrib.auth.models import AbstractUser

class User(AbstractUser):
    firebase_uid = models.CharField(max_length=128, unique=True, blank=True, null=True)
    institution = models.CharField(max_length=100, blank=True)
    bio = models.TextField(blank=True)
    research_interests = models.ManyToManyField('ResearchInterest', blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    auth_methods = models.CharField(max_length=50, null=False)

    groups = models.ManyToManyField(
        'auth.Group',
        related_name='custom_user_set',
        blank=True,
    )
    user_permissions = models.ManyToManyField(
        'auth.Permission',
        related_name='custom_user_set',
        blank=True,
    )

class ResearchInterest(models.Model):
    name = models.CharField(max_length=100, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return self.name