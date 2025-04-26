# backend/authentication/views.py

import time
from django.shortcuts import render
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from firebase_admin import auth
from .models import User
import logging
logger = logging.getLogger(__name__)
# Create your views here.

# backend/authentication/views.py


@api_view(['GET'])
def test_connection(request):
    return Response({"message": "Connected!"})


# old verify_token
# @api_view(['GET'])
# def verify_token(request):
#     try:
#         auth_header = request.headers.get('Authorization', '')
#         if not auth_header:
#             return Response({"error": "No token provided"}, status=401)
        
#         token = auth_header.split('Bearer ')[1]
#         decoded_token = auth.verify_id_token(token)
#         print("Token decoded:", decoded_token)  # Debug print
#         return Response({"uid": decoded_token["uid"]})
#     except Exception as e:
#         print("Token verification error:", str(e))  # Debug print
#         return Response({"error": str(e)}, status=401)

# new verify_token
@api_view(['GET'])
def verify_token(request):
    try:
        auth_header = request.headers.get('Authorization', '')
        if not auth_header:
            return Response({"error": "No token provided"}, status=401)
        
        token = auth_header.split('Bearer ')[1]
        
        # Verify token
        decoded_token = auth.verify_id_token(token)
        
        # Check for clock skew issues
        current_time = time.time()
        iat = decoded_token.get('iat', 0)
        CLOCK_SKEW_TOLERANCE = 300  # 5 minutes
        
        if iat > current_time + CLOCK_SKEW_TOLERANCE:
            print(f"Clock skew detected: Token issued at {iat}, current time {current_time}")
            return Response({
                "uid": decoded_token["uid"],
                "warning": "Clock skew detected"
            })
        
        return Response({"uid": decoded_token["uid"]})
    except Exception as e:
        print("Token verification error:", str(e))  # Debug print
        return Response({"error": str(e)}, status=401)


# backend/authentication/views.py
@api_view(['POST'])
@permission_classes([AllowAny]) # allow any user to register, if I dont put this here there would be a chicken and egg problem. User needs to register before they can login.
def register(request):
    try:
        # print("Register endpoint hit")  # Debug print
        # print(f"Request data: {request.data}")  # Debug print
        token = request.headers['Authorization'].split('Bearer ')[1]
        decoded_token = auth.verify_id_token(token)
        
        data = request.data
        
        # Check if user already exists
        try:
            user = User.objects.get(firebase_uid=decoded_token['uid'])
            # If user exists and they're setting a password
            if data.get('password'):
                user.set_password(data['password'])
                user.save()
                return Response({"message": "Password updated"})
        except User.DoesNotExist:
            # Create new user
            user = User.objects.create(
                firebase_uid=decoded_token['uid'],
                email=decoded_token['email'],
                username=decoded_token['email'],
                institution=data.get('institution', ''),
                bio=data.get('bio', ''),
                research_interests=data.get('research_interests', []),
                auth_methods= data.get('auth_methods', '')
            )

            if data.get('password'):
                user.set_password(data['password'])
                user.save()

        return Response({"message": "User created/updated successfully"})
    except Exception as e:
        print(f"Registration error: {str(e)}")
        return Response({"error": str(e)}, status=500)


# old user_profile
# backend/authentication/views.py
# @api_view(['GET'])
# def user_profile(request):
    # try:
    #     auth_header = request.headers.get('Authorization', '')
    #     if not auth_header:
    #         return Response({"error": "No token provided"}, status=401)
            
    #     token = auth_header.split('Bearer ')[1]
    #     decoded_token = auth.verify_id_token(token)
        
    #     try:
    #         user = User.objects.get(firebase_uid=decoded_token['uid'])
    #         return Response({
    #             'email': user.email,
    #             'institution': user.institution,
    #             'bio': user.bio,
    #             'research_interests': user.research_interests
    #         })
    #     except User.DoesNotExist:
    #         return Response({"error": "User not found"}, status=404)
            
    # except Exception as e:
    #     print(f"Profile error: {str(e)}")  # Debug print
    #     return Response({"error": str(e)}, status=500)
    
# backend/authentication/views.py


@api_view(['GET'])
def user_profile(request):
    try:
        auth_header = request.headers.get('Authorization', '')
        if not auth_header:
            return Response({"error": "No token provided"}, status=401)
            
        token = auth_header.split('Bearer ')[1]
        
        # Adding specific error handling for token verification
        try:
            decoded_token = auth.verify_id_token(token)
        except Exception as token_error:
            logger.error(f"Token verification failed: {str(token_error)}")
            return Response({"error": f"Invalid token: {str(token_error)}"}, status=401)
        
        # Add detailed logging for debugging
        logger.info(f"Token verified for user: {decoded_token['uid']}")
        
        try:
            user = User.objects.get(firebase_uid=decoded_token['uid'])
            
            # Safe attribute access with defaults
            response_data = {
                'email': user.email,
                'institution': getattr(user, 'institution', None),
                'bio': getattr(user, 'bio', None),
                'research_interests': getattr(user, 'research_interests', [])
            }
            
            return Response(response_data)
            
        except User.DoesNotExist:
            logger.warning(f"User not found for firebase_uid: {decoded_token['uid']}")
            return Response({"error": "User not found"}, status=404)
        except Exception as user_error:
            logger.exception(f"Error retrieving user data: {str(user_error)}")
            return Response({"error": f"User data error: {str(user_error)}"}, status=500)
            
    except Exception as e:
        logger.exception(f"Unhandled exception in user_profile: {str(e)}")
        return Response({"error": "Internal server error"}, status=500)
    

@api_view(['GET'])
def check_user(request):
   print("Check user endpoint hit")  # Debug print
   try:
       auth_header = request.headers.get('Authorization', '')
       if not auth_header:
           return Response({"error": "No token provided"}, status=401)
           
       token = auth_header.split('Bearer ')[1]
       
       try:
           decoded_token = auth.verify_id_token(token)
           
           try:
               print(f"Token: {decoded_token}")  # Debug print
               user = User.objects.get(firebase_uid=decoded_token['uid'])
               if user.is_active:  # Check profile completion
                   return Response(status=200)
               return Response({"message": "Profile incomplete"}, status=404)
           except User.DoesNotExist:
               return Response({"message": "User not found"}, status=404)
       except Exception as e:
           print(f"Token verification error: {str(e)}")
           return Response({"error": "Invalid token"}, status=401)
   except Exception as e:
       print(f"Unexpected error in check_user: {str(e)}")
       return Response({"error": "Server error"}, status=500)
   
   
# backend/authentication/views.py
@api_view(['POST'])
def set_password(request):
    try:
        token = request.headers['Authorization'].split('Bearer ')[1]
        decoded_token = auth.verify_id_token(token)
        
        user = User.objects.get(firebase_uid=decoded_token['uid'])
        
        if request.data.get('password'):
            user.set_password(request.data['password'])
            user.save()
            return Response({"message": "Password updated successfully"})
        else:
            return Response({"error": "No password provided"}, status=400)
    except User.DoesNotExist:
        return Response({"error": "User not found"}, status=404)
    except Exception as e:
        return Response({"error": str(e)}, status=500)

# backend/authentication/views.py
@api_view(['POST'])
def update_profile(request):
    """
    Update a user's profile information.
    Requires authentication token.
    Updates institution, bio, and research_interests fields.
    """
    try:
        # Verify the authentication token
        auth_header = request.headers.get('Authorization', '')
        if not auth_header:
            return Response({"error": "No token provided"}, status=401)
            
        token = auth_header.split('Bearer ')[1]
        decoded_token = auth.verify_id_token(token)
        
        try:
            # Get the user from the database
            user = User.objects.get(firebase_uid=decoded_token['uid'])
            data = request.data
            
            # Update user fields
            if 'institution' in data:
                user.institution = data['institution']
            if 'bio' in data:
                user.bio = data['bio']
            if 'research_interests' in data:
                user.research_interests = data['research_interests']
            
            # Save the updated user
            user.save()
            
            # Return updated user data
            return Response({
                'email': user.email,
                'institution': user.institution,
                'bio': user.bio,
                'research_interests': user.research_interests
            })
            
        except User.DoesNotExist:
            return Response({"error": "User not found"}, status=404)
            
    except Exception as e:
        print(f"Profile update error: {str(e)}")
        return Response({"error": str(e)}, status=500)
    
@api_view(['POST'])
@permission_classes([AllowAny])
def sync_reset_password(request):
    try:
        email = request.data.get('email')
        password = request.data.get('password')

        print(f"Syncing password for email: {email}")
        user = User.objects.get(email=email)
        user.set_password(password)
        user.save()
        
        return Response({"message": "Password synced successfully"})
            
    except User.DoesNotExist:
        return Response({"error": "User not found"}, status=404)
    except Exception as e:
        return Response({"error": str(e)}, status=500)
