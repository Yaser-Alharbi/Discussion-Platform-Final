# backend/papers/urls.py
from django.urls import path
from . import views

urlpatterns = [
    path('search/', views.search_scholar, name='search_scholar'),
    path('extracts/', views.get_user_extracts, name='get_user_extracts'),
    path('extracts/save/', views.save_extract, name='save_extract'),
    path('extracts/<int:extract_id>/', views.delete_extract, name='delete_extract'),
]