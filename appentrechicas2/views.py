from django.shortcuts import render
from django.http import HttpResponse

# Create your views here.
def vista1(request):
    return HttpResponse("Hola, esta es la vista 1 de appentrechicas2.")

def vista2(request):
    return HttpResponse("Hola, esta es la vista 2 de appentrechicas2.")
