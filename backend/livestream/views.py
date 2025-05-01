# # backend/livestream/views.py

import uuid
import asyncio
import json
# import hmac
# import hashlib
# import base64
from functools import wraps
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from django.conf import settings
from django.views.decorators.csrf import csrf_exempt
from livekit import api
from livekit.api import AccessToken, VideoGrants
# Import the correct proto modules
from livekit.api.room_service import CreateRoomRequest, DeleteRoomRequest, ListParticipantsRequest
from .models import Room, Participant, SharedExtract
from django.utils import timezone
from django.db.models import Q
from papers.models import PaperExtract

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
    print("Fetching room list")
    rooms = Room.objects.filter(is_active=True).order_by('-created_at')
    
    room_data = []
    for room in rooms:
        # Count participants
        participant_count = Participant.objects.filter(room=room).count()
        
        # Get host details - use full name if available
        host_name = "Unknown"
        if room.host:
            if room.host.first_name or room.host.last_name:
                host_name = f"{room.host.first_name} {room.host.last_name}".strip()
            else:
                host_name = room.host.username
        
        # Get research interests
        research_interests = [interest.name for interest in room.research_interests.all()]
        
        room_info = {
            'id': room.id,
            'room_id': room.room_id,
            'title': room.name,
            'numParticipants': participant_count,
            'hostId': str(room.host.id) if room.host else None,
            'hostName': host_name,
            'createdAt': room.created_at.isoformat(),
            'isActive': room.is_active,
            'research_interests': research_interests
        }
        room_data.append(room_info)
    
    print(f"Found {len(room_data)} active rooms")
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

@api_view(['GET'])
@permission_classes([AllowAny])
def room_participants(request, room_id):
    """Get participants for a specific room with their roles"""
    try:
        room = Room.objects.get(room_id=room_id)
        participants = Participant.objects.filter(room=room)
        
        # Get current user if authenticated
        user = request.user
        current_user_role = None
        
        if user.is_authenticated:
            # check if user is the host
            if room.host and room.host.id == user.id:
                current_user_role = 'host'
                print(f"User {user.id} ({user.username}) is the host of room {room_id}")
            else:
                # check if user is a participant with another role
                try:
                    participant = Participant.objects.get(room=room, user=user)
                    current_user_role = participant.role
                    print(f"User {user.id} ({user.username}) is a {participant.role} in room {room_id}")
                except Participant.DoesNotExist:
                    # default to viewer if no role found
                    current_user_role = 'viewer'
                    print(f"User {user.id} ({user.username}) defaulting to viewer in room {room_id}")
        
        participants_data = []
        for participant in participants:
            # isCurrentUser flag based on user ID match
            is_current_user = user.is_authenticated and participant.user.id == user.id
            
            # If this participant is the current user, update current_user_role as a fallback
            if is_current_user and not current_user_role:
                current_user_role = participant.role
                
            participants_data.append({
                'id': participant.id,
                'userId': participant.user.id,
                'username': participant.user.username,
                'role': participant.role,
                'joinedAt': participant.joined_at,
                'lastActive': participant.last_active,
                'isCurrentUser': is_current_user
            })
        
        # If current user isn't in participants yet, add them temporarily
        if user.is_authenticated and not any(p['userId'] == user.id for p in participants_data):
            # Try once more to determine role if there isnt one
            if not current_user_role:
                if room.host and room.host.id == user.id:
                    current_user_role = 'host'
                else:
                    current_user_role = 'viewer' 
            
            participants_data.append({
                'id': 'temp-' + str(user.id),
                'userId': user.id,
                'username': user.username,
                'role': current_user_role,
                'joinedAt': timezone.now().isoformat(),
                'lastActive': timezone.now().isoformat(),
                'isCurrentUser': True,
                'isTemporary': True
            })
        
        print(f"Room {room_id} - Current user role: {current_user_role}")
        
        return Response({
            'roomId': room.room_id,
            'participants': participants_data,
            'currentUserRole': current_user_role
        })
        
    except Room.DoesNotExist:
        return Response(
            {'error': 'Room not found'},
            status=status.HTTP_404_NOT_FOUND
        )

@api_view(['DELETE'])
@permission_classes([AllowAny])
def delete_room(request, room_id):
    """Delete a room and clean up resources"""
    try:
        room = Room.objects.get(room_id=room_id)
        
        # Check if authenticated user is host
        user = request.user
        if user.is_authenticated and room.host != user:
            return Response(
                {'error': 'Only the host can delete a room'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        print(f"Deleting room {room_id} (ID: {room.id}, Name: {room.name})")
        
        #  disconnect all participants from LiveKit
        try:
            # Get list of participants before deletion
            @sync_livekit
            async def get_room_participants():
                async with get_livekit_client() as client:
                    participants = await client.room.list_participants(
                        ListParticipantsRequest(room=room_id)
                    )
                    return participants
            
            participant_response = get_room_participants()
            participant_count = len(participant_response.participants)
            print(f"Room has {participant_count} participants to disconnect")
            
            # Delete from LiveKit
            @sync_livekit
            async def delete_livekit_room():
                async with get_livekit_client() as client:
                    await client.room.delete_room(
                        DeleteRoomRequest(room=room_id)
                    )
            
            delete_livekit_room()
            print(f"LiveKit room {room_id} deleted successfully")
        except Exception as e:
            print(f"Error with LiveKit room deletion: {str(e)}")
            # Continue with local deletion even if LiveKit deletion fails
        
        # Remove all participants from database
        participant_count = Participant.objects.filter(room=room).count()
        Participant.objects.filter(room=room).delete()
        print(f"Removed {participant_count} participants from database")
        
        # Mark as inactive and then delete from database
        room.is_active = False
        room.save()
        room.delete()
        print(f"Room {room_id} deleted from database")
        
        return Response({'success': True})
        
    except Room.DoesNotExist:
        return Response(
            {'error': 'Room not found'},
            status=status.HTTP_404_NOT_FOUND
        )
    except Exception as e:
        print(f"Error deleting room: {str(e)}")
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['POST'])
@permission_classes([AllowAny])  # Temporarily allow any user for testing
def create_room(request):
    """Create a new LiveKit room with user as host"""
    name = request.data.get('name', '')
    research_interests = request.data.get('research_interests', [])
    
    if not name:
        return Response({'error': 'Room name is required'}, status=status.HTTP_400_BAD_REQUEST)
    
    if not request.user.is_authenticated:
        return Response({'error': 'Authentication required'}, status=status.HTTP_401_UNAUTHORIZED)
    
    user_id = str(request.user.id)
    room_id = user_id
    
    print(f"Creating room '{name}' with ID: {room_id} (User: {request.user.username})")
    print(f"Research interests: {research_interests}")
    
    # Create the LiveKit room via API
    try:
        # check if a room with this ID already exists for this user
        try:
            existing_room = Room.objects.get(room_id=room_id)
            # if room exists but is not active, reactivate it
            if not existing_room.is_active:
                print(f"Reactivating existing room {room_id}")
                existing_room.is_active = True
                existing_room.name = name
                existing_room.save()
                
                # update research interests
                if research_interests:
                    existing_room.research_interests.clear()
                    from authentication.models import ResearchInterest
                    for interest_name in research_interests:
                        interest, _ = ResearchInterest.objects.get_or_create(name=interest_name)
                        existing_room.research_interests.add(interest)
                
                # get research interests for response
                interests = [interest.name for interest in existing_room.research_interests.all()]
                
                return Response({
                    'id': existing_room.id,
                    'name': existing_room.name,
                    'room_id': existing_room.room_id,
                    'created_at': existing_room.created_at,
                    'research_interests': interests
                }, status=status.HTTP_200_OK)
            else:
                print(f"Room with ID {room_id} already exists and is active")
                return Response({'error': 'You already have an active room'}, status=status.HTTP_400_BAD_REQUEST)
        except Room.DoesNotExist:
            # room doesn't exist, continue with creation
            pass
        
        # Create room in LiveKit - using CreateRoomRequest directly instead of api.proto_room
        room_request = CreateRoomRequest(
            name=room_id,
            empty_timeout=300,  # 5 minutes
            max_participants=100,
            metadata=json.dumps({
                'creatorId': user_id,
                'title': name
            })
        )
        
        # Create a LiveKit client and run the async operation synchronously
        @sync_livekit
        async def create_livekit_room():
            async with get_livekit_client() as client:
                return await client.room.create_room(room_request)
        
        livekit_room = create_livekit_room()
        print(f"LiveKit room created: {livekit_room}")
        
        # create room in database
        room = Room.objects.create(
            name=name,
            room_id=user_id,
            host=request.user,
            metadata={
                'title': name,
                'creatorId': user_id
            }
        )
        
        # add research interests if provided
        if research_interests:
            from authentication.models import ResearchInterest
            for interest_name in research_interests:
                interest, _ = ResearchInterest.objects.get_or_create(name=interest_name)
                room.research_interests.add(interest)
        
        # create participant entry for the host
        participant = Participant.objects.create(
            room=room,
            user=request.user,
            role='host'
        )
        
        print(f"Room created in database: {room.room_id} (ID: {room.id})")
        
        # get research interests for response
        interests = [interest.name for interest in room.research_interests.all()]
        
        return Response({
            'id': room.id,
            'name': room.name,
            'room_id': room.room_id,
            'created_at': room.created_at,
            'host_id': str(room.host.id),
            'research_interests': interests
        }, status=status.HTTP_201_CREATED)
        
    except Exception as e:
        print(f"Error creating room: {str(e)}")
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
@permission_classes([AllowAny])
def get_room_token(request, room_id):
    """Generate a LiveKit token with appropriate permissions based on role"""
    try:
        room = Room.objects.get(room_id=room_id)
        
        user = request.user
        
        # Get requested role and username from query params
        requested_role = request.query_params.get('role', 'viewer')
        username = request.query_params.get('username', '')
        
        # Validate the requested role
        valid_roles = ['host', 'moderator', 'guest', 'viewer']
        if requested_role not in valid_roles:
            requested_role = 'viewer'
        
        
        if user.is_authenticated:
            if requested_role == 'host' and room.host != user:
                requested_role = 'viewer'
                print(f"User requested 'host' role but is not the host - downgraded to viewer")
            else:
                print(f"User requested role '{requested_role}' - verified")
                
            participant, created = Participant.objects.get_or_create(
                room=room,
                user=user,
                defaults={'role': requested_role}
            )
            
            if participant.role != 'host':
                participant.role = requested_role
                participant.save()
                
            identity = str(user.id)
            name = user.username
        else:
            # Anonymous users always get viewer role
            requested_role = 'viewer'
            identity = f"anonymous-{uuid.uuid4()}"
            
            if username:
                name = username
            else:
                name = f"Viewer-{identity[:8]}"
            
            # Create a temporary user for the anonymous participant
            from django.contrib.auth import get_user_model
            User = get_user_model()
            temp_user, created = User.objects.get_or_create(
                username=identity,
                defaults={
                    'email': f"{identity}@anonymous.user"
                }
            )
            
            # Then create the participant with the temporary user
            participant, created = Participant.objects.get_or_create(
                room=room,
                user=temp_user,
                defaults={'role': 'viewer'}
            )
        
        # Create token with appropriate permissions
        token = AccessToken(
            api_key=LIVEKIT_API_KEY,
            api_secret=LIVEKIT_API_SECRET
        )
        
        token.with_identity(identity)
        token.with_name(name)
        
        can_publish = True
        room_admin = requested_role == 'host'
        
        print(f"DEBUG PERMISSIONS: role={requested_role}, can_publish={can_publish}, room_admin={room_admin}")
        
        grants = VideoGrants(
            room=room_id,
            room_join=True,
            room_admin=room_admin,
            can_publish=can_publish,
            can_subscribe=True,
            can_publish_data=True
        )
        
        # Admin rights already set above
        print(f"Final token permissions: can_publish={grants.can_publish}, room_admin={grants.room_admin}")
        
        token.with_grants(grants)
        
        return Response({
            'token': token.to_jwt(), 
            'room_id': room_id,
            'role': requested_role,
            'name': name,
            'identity': identity,
            'can_publish': can_publish 
        })
        
    except Room.DoesNotExist:
        return Response({'error': 'Room not found'}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@csrf_exempt
@api_view(['POST', 'GET'])
@permission_classes([AllowAny])
def webhook(request):
    """Handle LiveKit webhooks for participant and room events"""
    print("\n===== WEBHOOK EVENT RECEIVED =====")
    print(f"[WEBHOOK] Request Method: {request.method}")
    print(f"[WEBHOOK] Headers: {dict(request.headers)}")
    print(f"[WEBHOOK] Query Params: {dict(request.query_params)}")
    
    try:
        if request.method == 'GET':
            print(f"[WEBHOOK] Received GET request - LiveKit testing or verification")
            
            
            return Response(
                {'success': True, 'message': 'Webhook endpoint is active and receiving GET requests'}, 
                status=status.HTTP_200_OK
            )
        
        auth_header = request.headers.get('Authorization', '')
        print(f"[WEBHOOK] Auth Header Present: {bool(auth_header)}")
        
        if not auth_header or not auth_header.startswith('Bearer '):
            print("[ERROR] Webhook received with invalid authorization header")
            return Response(
                {'error': 'Invalid authorization header'},
                status=status.HTTP_401_UNAUTHORIZED
            )
        
        # Extract the token
        token = auth_header.replace('Bearer ', '')
        print(f"[WEBHOOK] Token extracted (partial): {token[:10]}...")
        
        # Parse the request body
        body_data = request.body
        print(f"[WEBHOOK] Body data length: {len(body_data)} bytes")
        
        
        # Parse JSON data
        try:
            event_data = json.loads(body_data.decode('utf-8'))
            print(f"[WEBHOOK] Successfully parsed JSON data")
        except json.JSONDecodeError as e:
            print(f"[WEBHOOK] Error parsing JSON data: {str(e)}")
            print(f"[WEBHOOK] Raw body data: {body_data.decode('utf-8', 'ignore')}")
            return Response(
                {'error': f'Invalid JSON data: {str(e)}'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Get the event type
        event_type = event_data.get('event')
        print(f"[WEBHOOK] Event Type: {event_type}")
        print(f"[WEBHOOK] Data: {json.dumps(event_data, indent=2)}")
        
        # Log events differently based on type
        if event_type == 'room_started':
            room_info = event_data.get('room', {})
            room_name = room_info.get('name')
            print(f"\n[ROOM STARTED] Room: {room_name}")
            print(f"[ROOM STARTED] Details: {json.dumps(room_info, indent=2)}")
            
        elif event_type == 'room_finished':
            room_info = event_data.get('room', {})
            room_name = room_info.get('name')
            print(f"\n[ROOM FINISHED] Room: {room_name}")
            print(f"[ROOM FINISHED] Details: {json.dumps(room_info, indent=2)}")
            
            # Mark room as inactive in database
            try:
                room = Room.objects.get(room_id=room_name)
                room.is_active = False
                room.save()
                
                # Clear all participants for this room
                Participant.objects.filter(room=room).delete()
                print(f"[ROOM FINISHED] Removed all participants for room {room_name}")
                
                print(f"[ROOM FINISHED] Marked room {room_name} as inactive in database")
            except Room.DoesNotExist:
                print(f"[ROOM FINISHED] Room {room_name} not found in database")
            
        elif event_type == 'participant_joined':
            room_info = event_data.get('room', {})
            participant_info = event_data.get('participant', {})
            
            room_name = room_info.get('name')
            participant_identity = participant_info.get('identity')
            participant_name = participant_info.get('name')
            participant_state = participant_info.get('state')
            participant_permission = participant_info.get('permission', {})
            participant_metadata = participant_info.get('metadata')
            
            print(f"\n[PARTICIPANT JOINED] Event Details:")
            print(f"  Room: {room_name}")
            print(f"  Participant Identity: {participant_identity}")
            print(f"  Participant Name: {participant_name}")
            print(f"  State: {participant_state}")
            print(f"  Metadata: {participant_metadata}")
            print(f"  Permissions: {json.dumps(participant_permission, indent=2)}")
            print(f"  Full Participant Info: {json.dumps(participant_info, indent=2)}")
            
            # Make sure participant is in database
            if room_name and participant_identity:
                try:
                    room = Room.objects.get(room_id=room_name)
                    
                    # Get user
                    from django.contrib.auth import get_user_model
                    User = get_user_model()
                    
                    try:
                        user = User.objects.get(id=participant_identity)
                        
                        # Create participant if doesn't exist
                        participant, created = Participant.objects.get_or_create(
                            room=room,
                            user=user,
                            defaults={'role': 'viewer'}  # Default role
                        )
                        
                        if created:
                            print(f"[PARTICIPANT JOINED] Added participant {participant_identity} to database")
                        else:
                            print(f"[PARTICIPANT JOINED] Participant {participant_identity} already in database")
                            
                    except User.DoesNotExist:
                        print(f"[PARTICIPANT JOINED] User with ID {participant_identity} not found")
                
                except Room.DoesNotExist:
                    print(f"[PARTICIPANT JOINED] Room {room_name} not found in database")
            
        # Handle participant_left event
        elif event_type == 'participant_left':
            room_info = event_data.get('room', {})
            participant_info = event_data.get('participant', {})
            
            room_name = room_info.get('name')
            participant_identity = participant_info.get('identity')
            participant_name = participant_info.get('name', 'Unknown')
            
            print(f"\n[PARTICIPANT LEFT] Event Details:")
            print(f"  Room: {room_name}")
            print(f"  Participant Identity: {participant_identity}")
            print(f"  Participant Name: {participant_name}")
            
            if room_name:
                try:
                    room = Room.objects.get(room_id=room_name)
                    
                    # Remove participant from database if they exist
                    if participant_identity or participant_name:
                        from django.contrib.auth import get_user_model
                        User = get_user_model()
                        
                        # Try multiple ways to find the participant
                        try:
                            # First try to find by identity (user id)
                            if participant_identity:
                                try:
                                    user = User.objects.get(id=participant_identity)
                                    participant_found = Participant.objects.filter(room=room, user=user).exists()
                                    if participant_found:
                                        Participant.objects.filter(room=room, user=user).delete()
                                        print(f"[PARTICIPANT LEFT] Removed participant with ID {participant_identity} from database")
                                        
                                        # Check if this was the host
                                        if room.host == user:
                                            print(f"[PARTICIPANT LEFT] Host {participant_identity} left room {room_name}")
                                            
                                            # Handle host leaving - mark room inactive and delete all participants
                                            room.is_active = False
                                            room.save()
                                            print(f"[PARTICIPANT LEFT] Marked room {room_name} as inactive in database")
                                            
                                            # Delete all participants for this room
                                            Participant.objects.filter(room=room).delete()
                                            print(f"[PARTICIPANT LEFT] Removed all participants for room {room_name}")
                                            
                                            # Delete the LiveKit room
                                            try:
                                                @sync_livekit
                                                async def delete_livekit_room():
                                                    async with get_livekit_client() as client:
                                                        await client.room.delete_room(
                                                            DeleteRoomRequest(room=room_name)
                                                        )
                                                
                                                delete_livekit_room()
                                                print(f"[PARTICIPANT LEFT] Host left, deleted room {room_name} from LiveKit")
                                            except Exception as e:
                                                print(f"[PARTICIPANT LEFT] Error deleting LiveKit room: {str(e)}")
                                                
                                    else:
                                        print(f"[PARTICIPANT LEFT] No participant found with ID {participant_identity} in room {room_name}")
                                except User.DoesNotExist:
                                    print(f"[PARTICIPANT LEFT] User with ID {participant_identity} not found")
                            
                            # If not found by ID, try by username/name
                            if participant_name and participant_name != 'Unknown':
                                # Find users with matching username
                                matching_users = User.objects.filter(username=participant_name)
                                
                                if matching_users.exists():
                                    for user in matching_users:
                                        deleted_count = Participant.objects.filter(room=room, user=user).delete()[0]
                                        if deleted_count > 0:
                                            print(f"[PARTICIPANT LEFT] Removed participant with name {participant_name} from database")
                                        
                                        # Check if the user was a host
                                        if room.host == user:
                                            print(f"[PARTICIPANT LEFT] Host {participant_name} left room {room_name}")
                                            
                                            # Handle host leaving - mark room inactive and delete all participants
                                            room.is_active = False
                                            room.save()
                                            print(f"[PARTICIPANT LEFT] Marked room {room_name} as inactive in database")
                                            
                                            # Delete all participants for this room
                                            Participant.objects.filter(room=room).delete()
                                            print(f"[PARTICIPANT LEFT] Removed all participants for room {room_name}")
                                            
                                            # Delete the LiveKit room
                                            try:
                                                @sync_livekit
                                                async def delete_livekit_room():
                                                    async with get_livekit_client() as client:
                                                        await client.room.delete_room(
                                                            DeleteRoomRequest(room=room_name)
                                                        )
                                                
                                                delete_livekit_room()
                                                print(f"[PARTICIPANT LEFT] Host left, deleted room {room_name} from LiveKit")
                                            except Exception as e:
                                                print(f"[PARTICIPANT LEFT] Error deleting LiveKit room: {str(e)}")
                                else:
                                    print(f"[PARTICIPANT LEFT] No users found with name {participant_name}")
                            
                            # Fallback: try to find anonymous participants
                            if participant_identity and participant_identity.startswith('anonymous-'):
                                # Find users with matching identity in username
                                matching_users = User.objects.filter(username=participant_identity)
                                
                                if matching_users.exists():
                                    for user in matching_users:
                                        deleted_count = Participant.objects.filter(room=room, user=user).delete()[0]
                                        if deleted_count > 0:
                                            print(f"[PARTICIPANT LEFT] Removed anonymous participant {participant_identity} from database")
                                else:
                                    print(f"[PARTICIPANT LEFT] No anonymous users found with identity {participant_identity}")
                                    
                        except Exception as e:
                            print(f"[PARTICIPANT LEFT] Error removing participant: {str(e)}")
                    
                    # Check current participant count in LiveKit
                    @sync_livekit
                    async def get_room_participants():
                        async with get_livekit_client() as client:
                            participants = await client.room.list_participants(
                                ListParticipantsRequest(room=room_name)
                            )
                            return participants
                    
                    participants_response = get_room_participants()
                    remaining_count = len(participants_response.participants)
                    print(f"[PARTICIPANT LEFT] Room {room_name} has {remaining_count} remaining participants in LiveKit")
                    
                    # Ensure database count matches LiveKit count
                    db_count = Participant.objects.filter(room=room).count()
                    print(f"[PARTICIPANT LEFT] Room {room_name} has {db_count} participants in database")
                    
                    # If counts don't match, sync them
                    if db_count != remaining_count:
                        print(f"[PARTICIPANT LEFT] Participant counts don't match. Syncing database with LiveKit.")
                        
                        # Clear participants for this room and recreate from LiveKit data
                        if remaining_count == 0:
                            # If no remaining participants, simple clear the database
                            Participant.objects.filter(room=room).delete()
                            print(f"[PARTICIPANT LEFT] Cleared all participants for empty room {room_name}")
                            
                            # If LiveKit shows no participants, mark room as inactive
                            print(f"[PARTICIPANT LEFT] Room {room_name} is empty, marking as inactive")
                            room.is_active = False
                            room.save()
                            
                            # delete the room from LiveKit
                            try:
                                @sync_livekit
                                async def delete_livekit_room():
                                    async with get_livekit_client() as client:
                                        await client.room.delete_room(
                                            DeleteRoomRequest(room=room_name)
                                        )
                                
                                delete_livekit_room()
                                print(f"[PARTICIPANT LEFT] Deleted room {room_name} from LiveKit")
                            except Exception as e:
                                print(f"[PARTICIPANT LEFT] Error deleting LiveKit room: {str(e)}")
                    
                except Room.DoesNotExist:
                    print(f"[PARTICIPANT LEFT] Room {room_name} not found in database")
        
        elif event_type == 'track_published':
            room_info = event_data.get('room', {})
            participant_info = event_data.get('participant', {})
            track_info = event_data.get('track', {})
            
            room_name = room_info.get('name')
            participant_identity = participant_info.get('identity')
            participant_name = participant_info.get('name')
            track_type = track_info.get('type')
            track_source = track_info.get('source')
            track_sid = track_info.get('sid')
            track_name = track_info.get('name')
            
            print(f"\n[TRACK PUBLISHED] Event Details:")
            print(f"  Room: {room_name}")
            print(f"  Participant Identity: {participant_identity}")
            print(f"  Participant Name: {participant_name}")
            print(f"  Track Type: {track_type}")
            print(f"  Track Source: {track_source}")
            print(f"  Track SID: {track_sid}")
            print(f"  Track Name: {track_name}")
            print(f"  Track Info: {json.dumps(track_info, indent=2)}")
            
        elif event_type == 'track_unpublished':
            room_info = event_data.get('room', {})
            participant_info = event_data.get('participant', {})
            track_info = event_data.get('track', {})
            
            room_name = room_info.get('name')
            participant_identity = participant_info.get('identity')
            participant_name = participant_info.get('name')
            track_type = track_info.get('type')
            track_source = track_info.get('source')
            track_sid = track_info.get('sid')
            track_name = track_info.get('name')
            
            print(f"\n[TRACK UNPUBLISHED] Event Details:")
            print(f"  Room: {room_name}")
            print(f"  Participant Identity: {participant_identity}")
            print(f"  Participant Name: {participant_name}")
            print(f"  Track Type: {track_type}")
            print(f"  Track Source: {track_source}")
            print(f"  Track SID: {track_sid}")
            print(f"  Track Name: {track_name}")
            print(f"  Track Info: {json.dumps(track_info, indent=2)}")
        else:
            print(f"\n[UNHANDLED EVENT] {event_type}")
            print(f"[UNHANDLED EVENT] Data: {json.dumps(event_data, indent=2)}")
        
        print("===== WEBHOOK EVENT PROCESSED =====\n")
        # Return success
        return Response({'success': True})
    
    except Exception as e:
        print(f"[WEBHOOK ERROR] {str(e)}")
        import traceback
        traceback.print_exc()
        print("===== WEBHOOK EVENT FAILED =====\n")
        return Response(
            {'error': str(e)},
            status=status.HTTP_400_BAD_REQUEST
        )

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def share_extract_in_room(request, room_id):
    """Share a paper extract in a livestream room"""
    try:
        # Get the room
        room = Room.objects.get(room_id=room_id)
        
        # Get user and verify permissions
        user = request.user
        
        # Check if user is participant in this room
        try:
            participant = Participant.objects.get(room=room, user=user)
            if participant.role not in ['host', 'guest']:
                return Response(
                    {'error': 'Only hosts and guests can share extracts in a room'},
                    status=status.HTTP_403_FORBIDDEN
                )
        except Participant.DoesNotExist:
            return Response(
                {'error': 'You are not a participant in this room'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Get extract data from request
        extract_id = request.data.get('id')
        
        # Check if this extract already exists and belongs to the user
        paper_extract = None
        if extract_id:
            try:
                paper_extract = PaperExtract.objects.get(id=extract_id, user=user)
            except PaperExtract.DoesNotExist:
                return Response(
                    {'error': 'Extract not found or not owned by you'},
                    status=status.HTTP_404_NOT_FOUND
                )
        
        #print(f"Received extract data: {request.data}")
        
        # Create SharedExtract record
        shared_extract = SharedExtract.objects.create(
            room=room,
            shared_by=user,
            title=request.data.get('title', ''),
            authors=request.data.get('authors', ''),
            doi=request.data.get('doi', ''),
            link=request.data.get('link', ''),
            pdf_link=request.data.get('pdf_link', ''),
            extract=request.data.get('extract', ''),
            original_extract=paper_extract
        )
        
        #print(f"Created SharedExtract: {shared_extract.id}, PDF link: {shared_extract.pdf_link}")
        
        # Return the created extract
        return Response({
            'extract': {
                'id': shared_extract.id,
                'title': shared_extract.title,
                'authors': shared_extract.authors,
                'doi': shared_extract.doi,
                'link': shared_extract.link,
                'pdf_link': shared_extract.pdf_link,
                'publication_link': shared_extract.link,
                'extract': shared_extract.extract,
                'shared_by': shared_extract.shared_by.username,
                'shared_at': shared_extract.shared_at.isoformat()
            }
        }, status=status.HTTP_201_CREATED)
        
    except Room.DoesNotExist:
        return Response(
            {'error': 'Room not found'},
            status=status.HTTP_404_NOT_FOUND
        )
    except Exception as e:
        print(f"Error sharing extract: {str(e)}")
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['GET'])
@permission_classes([AllowAny])
def get_room_extracts(request, room_id):
    """Get all shared extracts for a specific room"""
    try:
        # Get the room
        room = Room.objects.get(room_id=room_id)
        
        # Get all shared extracts for this room
        shared_extracts = SharedExtract.objects.filter(room=room).order_by('shared_at')
        
        # Format response
        extracts_data = []
        for extract in shared_extracts:
            extracts_data.append({
                'id': extract.id,
                'title': extract.title,
                'authors': extract.authors,
                'doi': extract.doi,
                'link': extract.link,
                'pdf_link': extract.pdf_link,
                'publication_link': extract.link,  # Use link as fallback
                'extract': extract.extract,
                'shared_by': extract.shared_by.username,
                'shared_at': extract.shared_at.isoformat()
            })
        
        #print(f"Room {room_id}: Found {len(extracts_data)} extracts")
        #if extracts_data:
        #    print(f"Sample extract PDF link: {extracts_data[0].get('pdf_link')}")
        #    print(f"Sample extract publication link: {extracts_data[0].get('publication_link')}")
        
        return Response({
            'room_id': room_id,
            'extracts': extracts_data
        })
        
    except Room.DoesNotExist:
        return Response(
            {'error': 'Room not found'},
            status=status.HTTP_404_NOT_FOUND
        )
    except Exception as e:
        print(f"Error getting room extracts: {str(e)}")
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['POST'])
@permission_classes([AllowAny])
def update_participant_role(request, room_id, participant_id):
    """Update a participant's role - only hosts can promote viewers to guests"""
    try:
        # Get the room
        room = Room.objects.get(room_id=room_id)
        
        # Get the authenticated user
        user = request.user
        
        # Check if the user is authenticated and is the host
        if not user.is_authenticated:
            return Response({'error': 'Authentication required'}, status=status.HTTP_401_UNAUTHORIZED)
        
        # Verify the user is the host of this room
        if room.host != user:
            return Response({'error': 'Only the host can update participant roles'}, status=status.HTTP_403_FORBIDDEN)
        
        # Get the new role from the request
        new_role = request.data.get('role')
        if not new_role or new_role not in ['guest', 'viewer']:
            return Response({'error': 'Invalid role. Only "guest" or "viewer" roles are allowed'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Find the participant by ID
        try:
            participant = Participant.objects.get(id=participant_id, room=room)
        except Participant.DoesNotExist:
            return Response({'error': 'Participant not found'}, status=status.HTTP_404_NOT_FOUND)
        
        # Don't allow changing host roles
        if participant.role == 'host':
            return Response({'error': 'Cannot change role of a host'}, status=status.HTTP_403_FORBIDDEN)
        
        # Update the role
        old_role = participant.role
        participant.role = new_role
        participant.save()
        
        print(f"Updated participant {participant.user.username} role from {old_role} to {new_role}")
        
        # Return success
        return Response({
            'success': True,
            'message': f'Successfully updated participant role to {new_role}',
            'participant': {
                'id': participant.id,
                'userId': participant.user.id,
                'username': participant.user.username,
                'role': participant.role
            }
        })
        
    except Room.DoesNotExist:
        return Response({'error': 'Room not found'}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        print(f"Error updating participant role: {str(e)}")
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
@permission_classes([AllowAny])
def research_interests(request):
    """Get all research interests in the system"""
    from authentication.models import ResearchInterest
    
    interests = ResearchInterest.objects.all().order_by('name')
    interest_names = [interest.name for interest in interests]
    
    return Response(interest_names)


