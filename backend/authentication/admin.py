# backend/authentication/admin.py

# authentication/admin.py
from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import User

class CustomUserAdmin(UserAdmin):
    # Reordering and modifying the fieldsets
    fieldsets = (
        (None, {'fields': ('username', 'password')}),
        ('Personal info', {'fields': ('first_name', 'last_name', 'email', 'institution', 'bio', 'research_interests')}),
        ('Firebase Info', {'fields': ('firebase_uid', 'auth_methods')}),
        ('Permissions', {'fields': ('is_active', 'is_staff', 'is_superuser',
                                   'groups', 'user_permissions')}),
        ('Important dates', {'fields': ('last_login', 'date_joined')}),
    )
    list_display = UserAdmin.list_display + ('firebase_uid','institution', 'bio', 'research_interests', 'auth_methods')

admin.site.register(User, CustomUserAdmin)
