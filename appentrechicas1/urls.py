from django.urls import path
from appentrechicas1.apps import vista1, vista2
from . import views 

urlpatterns = [
    path('vista1/', vista1, name='vista1'),
    path('vista2/', vista2, name='vista2'),
]