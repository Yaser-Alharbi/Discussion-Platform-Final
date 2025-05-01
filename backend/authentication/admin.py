# backend/authentication/admin.py

from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import User, ResearchInterest
from papers.models import PaperExtract

class PaperExtractInline(admin.TabularInline):
    model = PaperExtract
    fields = ('title', 'doi', 'extract', 'page_number', 'created_at')
    readonly_fields = ('created_at',)
    extra = 0
    max_num = 10  
    can_delete = False 
    show_change_link = True 

class CustomUserAdmin(UserAdmin):
    readonly_fields = ('id', 'date_joined', 'last_login')
    
    fieldsets = (
        (None, {'fields': ('id', 'username', 'password')}),
        ('Personal info', {'fields': ('first_name', 'last_name', 'email', 'institution', 'bio', 'research_interests')}),
        ('Firebase Info', {'fields': ('firebase_uid', 'auth_methods', 'password_set')}),
        # ('Permissions', {'fields': ('is_active', 'is_staff', 'is_superuser',
        #                            'groups', 'user_permissions')}),
        ('Important dates', {'fields': ('last_login', 'date_joined')}),
    )
    list_display = ('username', 'email', 'first_name', 'last_name', 'is_staff', 'institution', 'auth_methods', 'display_research_interests', 'extract_count')
    inlines = [PaperExtractInline]

    def display_research_interests(self, obj):
        return ", ".join([interest.name for interest in obj.research_interests.all()])
    display_research_interests.short_description = 'Research Interests'
    
    def extract_count(self, obj):
        return obj.paper_extracts.count()
    extract_count.short_description = 'Extracts'
    
class ResearchInterestAdmin(admin.ModelAdmin):
    list_display = ('name',)
    search_fields = ('name',)
    list_filter = ('name',)
    ordering = ('name',)
    list_per_page = 20

admin.site.register(User, CustomUserAdmin)
admin.site.register(ResearchInterest, ResearchInterestAdmin)