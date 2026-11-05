import json, uuid
from datetime import datetime, date, time, timedelta
from functools import wraps
from django.shortcuts import render, get_object_or_404, redirect
from django.http import JsonResponse, HttpResponse, Http404
from django.db import transaction, IntegrityError, OperationalError
from django.db.models import F
from django.core.exceptions import ValidationError
from django.core.validators import validate_email
from django.utils import timezone
from django.views.decorators.csrf import ensure_csrf_cookie
from django.views.decorators.http import require_GET, require_POST
from .models import Salon, Servicio, Producto, Reserva, Pedido

PAGES = {'index','ayuda','espejo','modelo-negocio','peinados','tienda','unas','unas-foto','ver-peinado'}
@ensure_csrf_cookie
@require_GET
def page(request, nombre='index'):
    if nombre not in PAGES:
        from django.http import Http404
        raise Http404()
    return render(request, f'entrechicas/{nombre}.html')

def vista1(request): return page(request)
def vista2(request): return redirect('/tienda.html')

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


@require_GET
@api_errors
def info(request,slug):
    s=salon(slug)
    return JsonResponse({**contact(s),'apertura':s.apertura,'cierre':s.cierre,'acceso':access(s),'servicios':list(s.servicio_set.filter(activo=True).values('id','nombre','precio','duracion'))})
@require_GET
@api_errors
def acceso(request,slug): return JsonResponse(access(salon(slug)))
@require_GET
@api_errors
def productos(request,slug):
    return JsonResponse(list(salon(slug).producto_set.filter(activo=True).values('id','nombre','descripcion','precio','stock','categoria')),safe=False)


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

def slots(s,service,day):
    if day < timezone.localdate() or day > timezone.localdate()+timedelta(days=180): return []
    start=timezone.make_aware(datetime.combine(day,time()))+timedelta(hours=s.apertura)
    close=timezone.make_aware(datetime.combine(day,time()))+timedelta(hours=s.cierre)
    occupied=list(Reserva.objects.filter(salon=s,inicio__lt=close,fin__gt=start).exclude(estado='cancelada').values_list('inicio','fin'))
    result=[]
    while start+timedelta(minutes=service.duracion)<=close:
        end=start+timedelta(minutes=service.duracion)
        if start>timezone.now() and not any(a<end and b>start for a,b in occupied): result.append(start.strftime('%H:%M'))
        start+=timedelta(minutes=30)
    return result

@require_GET
@api_errors
def horarios(request,slug):
    s=salon(slug);service=get_object_or_404(Servicio,pk=positive_id(request.GET['servicio']),salon=s,activo=True)
    return JsonResponse({'horarios':slots(s,service,date.fromisoformat(request.GET['fecha']))})

def reserva_response(r):
    start=timezone.localtime(r.inicio)
    return JsonResponse({'id':str(r.pk),'mensaje':'Reserva registrada.','contacto':contact(r.salon),'resumen':{'servicio':r.servicio_nombre,'fecha':start.strftime('%Y-%m-%d'),'hora':start.strftime('%H:%M'),'duracion':int((r.fin-r.inicio).total_seconds()/60),'precio':r.precio}})

@require_POST
@api_errors
def reservas(request,slug):
    data=payload(request);sid=uuid.UUID(text(data,'solicitudId',36));nombre=text(data,'nombre',120);correo=text(data,'correo',254);validate_email(correo);telefono=text(data,'telefono',40)
    day=date.fromisoformat(text(data,'fecha',10));hour=text(data,'hora',5);service_id=positive_id(data['servicio_id'])
    with transaction.atomic():
        s=salon(slug)
        # First write serializes public bookings on SQLite; row lock on PostgreSQL.
        Salon.objects.filter(pk=s.pk).update(revision=F('revision')+1)
        prior=Reserva.objects.filter(solicitud_id=sid).first()
        if prior:
            if prior.salon_id!=s.pk or prior.nombre!=nombre or prior.correo!=correo or prior.telefono!=telefono or prior.servicio_id!=service_id or timezone.localtime(prior.inicio).strftime('%Y-%m-%d %H:%M')!=f'{day.isoformat()} {hour}':
                return JsonResponse({'error':'El código de solicitud ya fue utilizado.'},status=409)
            return reserva_response(prior)
        service=get_object_or_404(Servicio,pk=service_id,salon=s,activo=True)
        if hour not in slots(s,service,day): return JsonResponse({'error':'Ese horario no está disponible. Selecciona otro.'},status=409)
        start=timezone.make_aware(datetime.combine(day,time.fromisoformat(hour)))
        r=Reserva.objects.create(solicitud_id=sid,salon=s,servicio=service,nombre=nombre,correo=correo,telefono=telefono,inicio=start,fin=start+timedelta(minutes=service.duracion),precio=service.precio,servicio_nombre=service.nombre)
    return reserva_response(r)

def pedido_response(p): return JsonResponse({'id':str(p.pk),'mensaje':'Solicitud recibida; el negocio debe confirmar stock, pago y entrega.','total':p.total,'items':p.items})
@require_POST
@api_errors
def pedidos(request,slug):
    data=payload(request);sid=uuid.UUID(text(data,'solicitudId',36));nombre=text(data,'nombre',120);telefono=text(data,'telefono',40)
    raw=data['items']
    if not isinstance(raw,list) or not 1<=len(raw)<=20: raise ValueError()
    items=[];seen=set()
    for item in raw:
        if not isinstance(item,dict): raise ValueError()
        pid=positive_id(item['id']);qty=item['cantidad']
        if type(qty) is not int or not 1<=qty<=20 or pid in seen: raise ValueError()
        seen.add(pid);items.append((pid,qty))
    with transaction.atomic():
        s=salon(slug);Salon.objects.filter(pk=s.pk).update(revision=F('revision')+1)
        prior=Pedido.objects.filter(solicitud_id=sid).first()
        if prior:
            if prior.salon_id!=s.pk or prior.nombre!=nombre or prior.telefono!=telefono or sorted(items)!=sorted((i['id'],i['cantidad']) for i in prior.items): return JsonResponse({'error':'El código de solicitud ya fue utilizado.'},status=409)
            return pedido_response(prior)
        snapshot=[]
        for pid,qty in items:
            p=get_object_or_404(Producto,pk=pid,salon=s,activo=True)
            if qty>p.stock: return JsonResponse({'error':f'Stock insuficiente para {p.nombre}.'},status=409)
            snapshot.append({'id':p.pk,'nombre':p.nombre,'precio':p.precio,'cantidad':qty})
        p=Pedido.objects.create(solicitud_id=sid,salon=s,nombre=nombre,telefono=telefono,items=snapshot,total=sum(i['precio']*i['cantidad'] for i in snapshot))
    return pedido_response(p)

@require_GET
def ayuda_config(request): return JsonResponse({'proveedor':'consulta','enviaExterno':False})
@require_POST
@api_errors
def ayuda(request,slug):
    s=salon(slug);q=text(payload(request),'pregunta',1000).lower()
    if any(w in q for w in ['cancel','cambiar']): answer='Para cambiar o cancelar una reserva, contacta al negocio e indica el código de confirmación. El administrador puede cancelarla desde Django.'
    elif any(w in q for w in ['precio','servicio']): answer='Servicios disponibles: '+('; '.join(f'{x.nombre}: ${x.precio:,} CLP, {x.duracion} minutos' for x in s.servicio_set.filter(activo=True)) or 'Aún no hay servicios publicados.')
    elif any(w in q for w in ['reserva','hora','cita']): answer=f'Pulsa Agendar Cita, selecciona servicio, fecha y horario y completa tus datos. Atención de {s.apertura}:00 a {s.cierre}:00. El calendario muestra disponibilidad real de la agenda demo.'
    elif any(w in q for w in ['pago','plan','suscrip']): answer='Esta es una demostración académica. No se cobra dinero ni se activan suscripciones comerciales. Los planes son informativos.'
    elif any(w in q for w in ['tienda','producto','compra']): answer='En la tienda puedes enviar una solicitud de productos. El negocio confirma después el stock, pago y entrega; enviar la solicitud no reserva unidades ni realiza cobros.'
    elif any(w in q for w in ['pelo','cabello','uña','labial','camara','cámara']): answer='Los probadores ofrecen una simulación orientativa en tu navegador. Permite la cámara y mantén internet para descargar los detectores. También puedes diseñar uñas sobre una foto.'
    else: answer='Puedo orientarte sobre reservas, servicios, tienda, cancelaciones, planes y probadores. Escribe una pregunta sobre alguno de esos temas.'
    return JsonResponse({'respuesta':answer,'aviso':'Ayuda por reglas del sitio; no utiliza IA generativa ni RAG.','fuentes':[]})
