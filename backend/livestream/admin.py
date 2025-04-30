# backend/livestream/admin.py

from django.contrib import admin
from .models import Room, Participant

class ParticipantInline(admin.TabularInline):
    model = Participant
    extra = 0
    readonly_fields = ('joined_at', 'last_active')
    fields = ('user', 'role', 'joined_at', 'last_active')

@admin.register(Room)
class RoomAdmin(admin.ModelAdmin):
    list_display = ('name', 'room_id', 'host', 'is_active', 'created_at', 'participant_count', 'research_interests_list')
    list_filter = ('is_active', 'created_at', 'research_interests')
    search_fields = ('name', 'room_id', 'host__username')
    readonly_fields = ('created_at', 'room_id')
    inlines = [ParticipantInline]
    filter_horizontal = ('research_interests',)
    
    def participant_count(self, obj):
        return obj.participants.count()
    participant_count.short_description = 'Participants'
    
    def research_interests_list(self, obj):
        return ", ".join([interest.name for interest in obj.research_interests.all()])
    research_interests_list.short_description = 'Research Interests'

@admin.register(Participant)
class ParticipantAdmin(admin.ModelAdmin):
    list_display = ('user', 'room', 'role', 'joined_at', 'last_active', 'can_broadcast')
    list_filter = ('role', 'joined_at', 'last_active')
    search_fields = ('user__username', 'room__name')
    readonly_fields = ('joined_at', 'last_active')
    
    def can_broadcast(self, obj):
        return obj.can_broadcast()
    can_broadcast.boolean = True
    can_broadcast.short_description = 'Can Broadcast'
    


