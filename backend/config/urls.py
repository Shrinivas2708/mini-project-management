# backend/config/urls.py

from django.contrib import admin
from django.urls import path
from django.views.decorators.csrf import csrf_exempt
from graphene_django.views import GraphQLView

urlpatterns = [
    path('admin/', admin.site.urls),
    # We wrap the view in csrf_exempt so the frontend can post easily
    path('graphql/', csrf_exempt(GraphQLView.as_view(graphiql=True))),
]