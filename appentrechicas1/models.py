import uuid
from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator
from django.core.exceptions import ValidationError

class Salon(models.Model):
    slug = models.SlugField(unique=True, default='demo')
    nombre = models.CharField(max_length=120, default='Entre Chicas · Demo')
    direccion = models.CharField(max_length=200, blank=True)
    telefono = models.CharField(max_length=40, blank=True)
    correo = models.EmailField(blank=True)
    apertura = models.PositiveSmallIntegerField(default=9, validators=[MaxValueValidator(23)])
    cierre = models.PositiveSmallIntegerField(default=19, validators=[MinValueValidator(1), MaxValueValidator(24)])
    probadores_demo = models.BooleanField(default=True)
    revision = models.PositiveIntegerField(default=0, editable=False)
    def clean(self):
        if self.apertura is not None and self.cierre is not None and self.cierre <= self.apertura: raise ValidationError('El cierre debe ser posterior a la apertura.')
    def __str__(self): return self.nombre

class Servicio(models.Model):
    salon = models.ForeignKey(Salon, on_delete=models.PROTECT)
    nombre = models.CharField(max_length=100)
    precio = models.PositiveIntegerField()
    duracion = models.PositiveSmallIntegerField(default=60, validators=[MinValueValidator(1), MaxValueValidator(600)])
    activo = models.BooleanField(default=True)
    def __str__(self): return self.nombre

class Producto(models.Model):
    salon = models.ForeignKey(Salon, on_delete=models.PROTECT)
    nombre = models.CharField(max_length=100)
    descripcion = models.TextField(blank=True)
    precio = models.PositiveIntegerField()
    stock = models.PositiveIntegerField(default=0)
    categoria = models.CharField(max_length=20, choices=[(x,x.title()) for x in ['general','cabello','unas','labios','rostro','cuerpo','accesorios']], default='general')
    activo = models.BooleanField(default=True)
    def __str__(self): return self.nombre

class Reserva(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    solicitud_id = models.UUIDField(unique=True)
    salon = models.ForeignKey(Salon, on_delete=models.PROTECT)
    servicio = models.ForeignKey(Servicio, on_delete=models.PROTECT)
    nombre = models.CharField(max_length=120)
    correo = models.EmailField()
    telefono = models.CharField(max_length=40)
    inicio = models.DateTimeField()
    fin = models.DateTimeField()
    precio = models.PositiveIntegerField()
    servicio_nombre = models.CharField(max_length=100)
    estado = models.CharField(max_length=15, default='pendiente', choices=[('pendiente','Pendiente'),('completada','Completada'),('cancelada','Cancelada')])
    creada = models.DateTimeField(auto_now_add=True)
    def clean(self):
        if self.inicio and self.fin and self.fin <= self.inicio: raise ValidationError('Horario inválido.')
        if self.estado != 'cancelada' and self.inicio and self.fin and Reserva.objects.filter(salon_id=self.salon_id,inicio__lt=self.fin,fin__gt=self.inicio).exclude(estado='cancelada').exclude(pk=self.pk).exists():
            raise ValidationError('Existe otra reserva en ese horario.')
    def __str__(self): return f'{self.nombre} · {self.servicio_nombre}'

class Pedido(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    solicitud_id = models.UUIDField(unique=True)
    salon = models.ForeignKey(Salon, on_delete=models.PROTECT)
    nombre = models.CharField(max_length=120)
    telefono = models.CharField(max_length=40)
    items = models.JSONField()
    total = models.PositiveIntegerField()
    estado = models.CharField(max_length=15, default='pendiente', choices=[('pendiente','Pendiente'),('confirmado','Confirmado'),('cancelado','Cancelado')])
    creado = models.DateTimeField(auto_now_add=True)
    def __str__(self): return f'Solicitud de {self.nombre}'
