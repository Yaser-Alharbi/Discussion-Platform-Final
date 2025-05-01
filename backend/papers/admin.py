# backend/papers/admin.py

from django.contrib import admin
from .models import PaperExtract

class PaperExtractAdmin(admin.ModelAdmin):
    list_display = ('title', 'user', 'doi', 'page_number', 'created_at')
    list_filter = ('created_at', 'user')
    search_fields = ('title', 'extract', 'doi', 'user__username', 'user__email')
    readonly_fields = ('created_at', 'updated_at')
    fieldsets = (
        (None, {
            'fields': ('user', 'title', 'authors', 'publication_info')
        }),
        ('Links', {
            'fields': ('doi', 'link', 'pdf_link', 'publication_link')
        }),
        ('Extract Details', {
            'fields': ('extract', 'page_number', 'additional_info')
        }),
        ('Metadata', {
            'fields': ('created_at', 'updated_at')
        }),
    )
    
    def get_queryset(self, request):
        queryset = super().get_queryset(request)
        queryset = queryset.select_related('user')
        return queryset

admin.site.register(PaperExtract, PaperExtractAdmin)
