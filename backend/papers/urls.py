# backend/papers/urls.py
from django.urls import path
from . import views

urlpatterns = [
    path('search', views.search_scholar, name='search_scholar'),
]