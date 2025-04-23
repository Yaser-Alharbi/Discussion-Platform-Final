from django.urls import path
from . import views

urlpatterns = [
    path('test', views.test_endpoint, name='test_endpoint'),
    path('rooms', views.room_list, name='room_list'),
    path('rooms/create', views.create_room, name='create_room'),
    path('rooms/<str:room_id>', views.room_detail, name='room_detail'),
    path('rooms/<str:room_id>/token', views.get_room_token, name='get_room_token'),
]
