# backend/papers/models.py

from django.db import models
from authentication.models import User

# Create your models here.

class PaperExtract(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='paper_extracts')
    title = models.CharField(max_length=500)
    authors = models.CharField(max_length=500, blank=True)
    publication_info = models.CharField(max_length=500, blank=True)
    doi = models.CharField(max_length=100, blank=True, null=True)
    link = models.URLField(max_length=1000, blank=True)
    pdf_link = models.URLField(max_length=1000, blank=True)
    publication_link = models.URLField(max_length=1000, blank=True)
    
    # User input fields
    extract = models.TextField()
    page_number = models.CharField(max_length=20, blank=True)
    additional_info = models.TextField(blank=True)
    
    # Metadata fields
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
