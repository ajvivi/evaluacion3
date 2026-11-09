"""Validación y respuestas comunes de las API públicas."""
import json
from functools import wraps
from django.shortcuts import get_object_or_404
from django.http import JsonResponse, Http404
from django.db import IntegrityError, OperationalError
from django.core.exceptions import ValidationError
from appentrechicas1.models import Salon

def access(s): return {'servicios':True,'tienda':True,'ra':s.probadores_demo,'modalidad':'mixto','demo':True}
def contact(s): return {'nombre':s.nombre,'direccionPublica':s.direccion,'telefonoPublico':s.telefono,'correoPublico':s.correo}
def salon(slug): return get_object_or_404(Salon, slug=slug)

def api_errors(fn):
    @wraps(fn)
    def wrapped(*args,**kwargs):
        try: return fn(*args,**kwargs)
        except Http404: return JsonResponse({'error':'No se encontró el salón, servicio o producto solicitado.'},status=404)
        except (ValueError,TypeError,KeyError,ValidationError,OverflowError): return JsonResponse({'error':'Revisa los campos: nombre, contacto, fecha y selección válidos.'},status=400)
        except (IntegrityError,OperationalError): return JsonResponse({'error':'La disponibilidad cambió. Actualiza los horarios o vuelve a intentar.'},status=409)
    return wrapped


def text(data,key,limit):
    value=data.get(key)
    if not isinstance(value,str) or not 1<=len(value.strip())<=limit: raise ValueError(key)
    return value.strip()
def positive_id(value):
    if type(value) is int and 0 < value <= 2147483647: return value
    if isinstance(value, str) and value.isascii() and value.isdigit() and 0 < len(value) <= 10:
        number = int(value)
        if 0 < number <= 2147483647: return number
    raise ValueError('Identificador inválido')

def payload(request):
    data=json.loads(request.body)
    if not isinstance(data,dict): raise ValueError()
    return data

