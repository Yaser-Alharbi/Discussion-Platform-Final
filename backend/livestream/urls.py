from django.urls import path
from . import views

urlpatterns = [
    path('test/', views.test_endpoint, name='test_endpoint'),
    path('test', views.test_endpoint, name='test_endpoint'),  # Keep old URL for backward compatibility
    path('rooms/', views.room_list, name='room_list'),
    path('rooms', views.room_list, name='room_list'),  # Keep old URL for backward compatibility
    path('rooms/create/', views.create_room, name='create_room'),
    path('rooms/create', views.create_room, name='create_room'),  # Keep old URL for backward compatibility
    path('rooms/<str:room_id>/', views.room_detail, name='room_detail'),
    path('rooms/<str:room_id>', views.room_detail, name='room_detail'),  # Keep old URL for backward compatibility
    path('rooms/<str:room_id>/token/', views.get_room_token, name='get_room_token'),
    path('rooms/<str:room_id>/token', views.get_room_token, name='get_room_token'),  # Keep old URL for backward compatibility
    path('rooms/<str:room_id>/participants/', views.room_participants, name='room_participants'),
    path('rooms/<str:room_id>/participants/<str:participant_id>/role/', views.update_participant_role, name='update_participant_role'),
    path('rooms/<str:room_id>/participants/<str:participant_id>/role', views.update_participant_role, name='update_participant_role'),  # Keep old URL
    path('rooms/<str:room_id>/delete/', views.delete_room, name='delete_room'),
    path('rooms/<str:room_id>/delete', views.delete_room, name='delete_room'),  # Keep old URL for backward compatibility
    path('webhook/', views.webhook, name='webhook'),
    path('webhook', views.webhook, name='webhook'),  # Keep old URL for backward compatibility
    path('research-interests/', views.research_interests, name='research_interests'),
    path('research-interests', views.research_interests, name='research_interests'),  # Keep old URL for backward compatibility
]
