# backend/django_backend/urls.py

from django.contrib import admin
from django.urls import path, include
from authentication import views
from django.conf import settings

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/check-user', views.check_user),
    path('', include('authentication.urls')),
    path('api/livestream/', include('livestream.urls')),
    path('api/papers/', include('papers.urls')),
]


# Debug toolbar urls

if settings.DEBUG:
    import debug_toolbar
    urlpatterns = [
        path('__debug__/', include(debug_toolbar.urls)),
    ] + urlpatterns



"""
URL configuration for django_backend project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.1/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""