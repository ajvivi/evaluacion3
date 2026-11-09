import uuid
from django.db import models

class Producto(models.Model):
    salon = models.ForeignKey("appentrechicas1.Salon", on_delete=models.PROTECT)
    nombre = models.CharField(max_length=100)
    descripcion = models.TextField(blank=True)
    precio = models.PositiveIntegerField()
    stock = models.PositiveIntegerField(default=0)
    categoria = models.CharField(max_length=20, choices=[(x,x.title()) for x in ['general','cabello','unas','labios','rostro','cuerpo','accesorios']], default='general')
    activo = models.BooleanField(default=True)
    def __str__(self): return self.nombre


    class Meta:
        db_table = 'appentrechicas1_producto'

class Pedido(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    solicitud_id = models.UUIDField(unique=True)
    salon = models.ForeignKey("appentrechicas1.Salon", on_delete=models.PROTECT)
    nombre = models.CharField(max_length=120)
    telefono = models.CharField(max_length=40)
    items = models.JSONField()
    total = models.PositiveIntegerField()
    estado = models.CharField(max_length=15, default='pendiente', choices=[('pendiente','Pendiente'),('confirmado','Confirmado'),('cancelado','Cancelado')])
    creado = models.DateTimeField(auto_now_add=True)
    def __str__(self): return f'Solicitud de {self.nombre}'

    class Meta:
        db_table = 'appentrechicas1_pedido'
