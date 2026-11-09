from django.urls import path
from . import views
app_name = 'tienda'
urlpatterns = [path('', views.tienda, name='inicio'), path('vista1/', views.tienda, name='vista1'), path('vista2/', views.tienda, name='vista2')]
