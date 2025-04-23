# # backend/livestream/views.py

import uuid
import asyncio
from functools import wraps
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from django.conf import settings
from livekit import api
from livekit.api import AccessToken, VideoGrants
from .models import Room, Participant

# Add simple test endpoint
@api_view(['GET', 'POST'])
@permission_classes([AllowAny])
def test_endpoint(request):
    """Simple test endpoint to verify API connectivity"""
    print("Test endpoint called!")
    return Response({
        'status': 'success',
        'message': 'API is working!',
        'method': request.method,
        'data': request.data if request.method == 'POST' else None
    })

# Get LiveKit config from settings
LIVEKIT_API_URL = getattr(settings, 'LIVEKIT_API_URL', None)
LIVEKIT_API_KEY = getattr(settings, 'LIVEKIT_API_KEY', None)
LIVEKIT_API_SECRET = getattr(settings, 'LIVEKIT_API_SECRET', None)

# Helper function to run async LiveKit calls in a sync context
def sync_livekit(async_func):
    @wraps(async_func)
    def wrapper(*args, **kwargs):
        loop = asyncio.new_event_loop()
        try:
            return loop.run_until_complete(async_func(*args, **kwargs))
        finally:
            loop.close()
    return wrapper

# Function to get a new LiveKit API client for each request
def get_livekit_client():
    return api.LiveKitAPI(
        url=LIVEKIT_API_URL,
        api_key=LIVEKIT_API_KEY,
        api_secret=LIVEKIT_API_SECRET
    )

@api_view(['GET'])
@permission_classes([AllowAny])  # Temporarily allow any user for testing
def room_list(request):
    """List all active rooms"""
    rooms = Room.objects.filter(is_active=True).order_by('-created_at')
    
    room_data = [
        {
            'id': room.id,
            'name': room.name,
            'roomId': room.room_id,
            'createdAt': room.created_at,
            'isActive': room.is_active
        }
        for room in rooms
    ]
    
    return Response(room_data)

@api_view(['GET'])
@permission_classes([AllowAny])  # Temporarily allow any user for testing
def room_detail(request, room_id):
    """Get details of a specific room"""
    try:
        room = Room.objects.get(room_id=room_id)
        return Response({
            'id': room.id,
            'name': room.name,
            'roomId': room.room_id,
            'createdAt': room.created_at,
            'isActive': room.is_active
        })
    except Room.DoesNotExist:
        return Response(
            {'error': 'Room not found'},
            status=status.HTTP_404_NOT_FOUND
        )

@api_view(['POST'])
@permission_classes([AllowAny])  # Temporarily allow any user for testing
def create_room(request):
    """Create a new LiveKit room with test user as host"""
    name = request.data.get('name', '')
    if not name:
        return Response({'error': 'Room name is required'}, status=status.HTTP_400_BAD_REQUEST)
    
    # Generate a unique room ID
    room_id = str(uuid.uuid4())
    
    # Create the LiveKit room via API
    try:
        # Create room in LiveKit
        room_request = api.proto_room.CreateRoomRequest(
            name=room_id,
            empty_timeout=300,  # 5 minutes
            max_participants=100
        )
        
        # Create a LiveKit client and run the async operation synchronously
        @sync_livekit
        async def create_livekit_room():
            async with get_livekit_client() as client:
                return await client.room.create_room(room_request)
        
        livekit_room = create_livekit_room()
        
        # For testing, use a test user if the real user is not available
        from django.contrib.auth import get_user_model
        User = get_user_model()
        user = request.user
        if not user.is_authenticated:
            # Get or create a test user
            user, created = User.objects.get_or_create(
                username='testuser',
                defaults={'password': 'testpassword'}
            )
        
        # Create room in our database
        room = Room.objects.create(
            name=name,
            room_id=room_id,
            host=user
        )
        
        # Create participant entry for the host
        Participant.objects.create(
            room=room,
            user=user,
            role='host'
        )
        
        return Response({
            'id': room.id,
            'name': room.name,
            'room_id': room.room_id,
            'created_at': room.created_at,
        }, status=status.HTTP_201_CREATED)
        
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
@permission_classes([AllowAny])  # Temporarily allow any user for testing
def get_room_token(request, room_id):
    """Generate a LiveKit token with appropriate permissions based on role"""
    try:
        room = Room.objects.get(room_id=room_id)
        
        # For testing, use a test user if the real user is not available
        from django.contrib.auth import get_user_model
        User = get_user_model()
        user = request.user
        if not user.is_authenticated:
            # Get or create a test user
            user, created = User.objects.get_or_create(
                username='testuser',
                defaults={'password': 'testpassword'}
            )
        
        # Get or create participant (viewers are created on first token request)
        participant, created = Participant.objects.get_or_create(
            room=room,
            user=user,
            defaults={'role': 'viewer'}
        )
        
        # Create token with appropriate permissions based on role
        token = AccessToken(
            api_key=LIVEKIT_API_KEY,
            api_secret=LIVEKIT_API_SECRET
        )
        
        # Set identity and room
        token.with_identity(str(user.id))
        token.with_name(user.username)
        
        # Set permissions based on role
        grants = VideoGrants(
            room=room_id,
            room_join=True,
            can_publish=participant.can_broadcast(),
            can_subscribe=True,
            can_publish_data=True
        )
        
        if participant.is_host() or participant.is_moderator():
            grants.room_admin = True
        
        token.with_grants(grants)
        
        return Response({
            'token': token.to_jwt(), 
            'room_id': room_id,
            'role': participant.role
        })
        
    except Room.DoesNotExist:
        return Response(
            {'error': 'Room not found'},
            status=status.HTTP_404_NOT_FOUND
        )
    except Exception as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
