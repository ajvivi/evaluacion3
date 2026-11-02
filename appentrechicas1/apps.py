from django.apps import AppConfig
from django.http import HttpResponse


class Appentrechicas1Config(AppConfig):
    name = 'appentrechicas1'

def vista1(request):
    return HttpResponse("Hola, esta es la vista 1 de appentrechicas1.")

def vista2(request):
    return HttpResponse("Hola, esta es la vista 2 de appentrechicas1.")