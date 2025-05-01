# backend/livestream/models.py

from django.db import models
from django.conf import settings

class Room(models.Model):
    name = models.CharField(max_length=100, unique=True, null=True, blank=True)
    room_id = models.CharField(max_length=100, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)
    host = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='hosted_rooms')
    is_active = models.BooleanField(default=True)
    metadata = models.JSONField(default=dict, blank=True)
    research_interests = models.ManyToManyField('authentication.ResearchInterest', blank=True, related_name='rooms')

    def __str__(self):
        return self.name or self.room_id
    
    def is_host(self, user):
        """Check if the given user is the host of this room"""
        return user == self.host

    def get_participant_role(self, user):
        """Get the role of a participant in this room"""
        try:
            participant = self.participants.get(user=user)
            return participant.role
        except Participant.DoesNotExist:
            return None

class Participant(models.Model):
    ROLE_CHOICES = [
        ('host', 'Host'),
        ('moderator', 'Moderator'),
        ('viewer', 'Viewer'),
        ('guest', 'Guest'),
    ]
    
    room = models.ForeignKey(Room, on_delete=models.CASCADE, related_name='participants')
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='room_participations')
    role = models.CharField(max_length=10, choices=ROLE_CHOICES, default='viewer')
    joined_at = models.DateTimeField(auto_now_add=True)
    last_active = models.DateTimeField(auto_now=True)
    
    class Meta:
        unique_together = ('room', 'user')
    
    def __str__(self):
        return f"{self.user.username} - {self.get_role_display()} in {self.room.name}"
    
    def is_host(self):
        """Check if this participant is the host"""
        return self.role == 'host'
    
    def is_moderator(self):
        """Check if this participant is a moderator"""
        return self.role == 'moderator'
    
    def is_guest(self):
        """Check if this participant is a temporary guest speaker"""
        return self.role == 'guest'
    
    def can_broadcast(self):
        """Check if this participant has permission to broadcast their stream"""
        return self.role in ['host', 'moderator', 'guest']
    
    def can_moderate(self):
        """Check if this participant has moderation privileges"""
        return self.role in ['host', 'moderator']

class SharedExtract(models.Model):
    room = models.ForeignKey(Room, on_delete=models.CASCADE, related_name='shared_extracts')
    shared_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='shared_extracts')
    title = models.CharField(max_length=500)
    authors = models.CharField(max_length=500, blank=True)
    doi = models.CharField(max_length=100, blank=True, null=True)
    link = models.URLField(max_length=1000, blank=True)
    pdf_link = models.URLField(max_length=1000, blank=True)
    extract = models.TextField()
    original_extract = models.ForeignKey('papers.PaperExtract', null=True, blank=True, on_delete=models.SET_NULL, related_name='shared_instances')
    shared_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['shared_at']
    
    def __str__(self):
        return f"Extract '{self.title}' shared by {self.shared_by.username} in {self.room.name}"



