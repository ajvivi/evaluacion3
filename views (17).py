"""Tienda pública y solicitudes de compra de Entre Chicas."""
import uuid
from django.shortcuts import render, get_object_or_404
from django.http import JsonResponse
from django.db import transaction
from django.db.models import F
from django.views.decorators.csrf import ensure_csrf_cookie
from django.views.decorators.http import require_GET, require_POST
from appentrechicas1.models import Salon
from entrechicas.api_utils import salon, api_errors, text, positive_id, payload
from .models import Producto, Pedido

@ensure_csrf_cookie
@require_GET
def tienda(request):
    return render(request, 'appentrechicas2/tienda.html')

@require_GET
@api_errors
def productos(request,slug):
    return JsonResponse(list(salon(slug).producto_set.filter(activo=True).values('id','nombre','descripcion','precio','stock','categoria')),safe=False)


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

