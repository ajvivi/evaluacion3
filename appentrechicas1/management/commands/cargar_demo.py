from django.core.management.base import BaseCommand
from appentrechicas1.models import Salon,Servicio,Producto
class Command(BaseCommand):
    help = 'Crea datos ficticios del prototipo sin sobrescribir datos existentes.'
    def handle(self,*args,**kwargs):
        s,_=Salon.objects.get_or_create(slug='demo',defaults={'nombre':'Entre Chicas · Demo'})
        for name,price,duration in [('Manicure',15000,60),('Corte de cabello',12000,30),('Coloración de cabello',35000,90),('Limpieza facial',20000,60)]:
            Servicio.objects.get_or_create(salon=s,nombre=name,defaults={'precio':price,'duracion':duration})
        for name,price,category in [('Esmalte rosa',3990,'unas'),('Champú nutritivo',6990,'cabello'),('Labial rojo',4990,'labios')]:
            Producto.objects.get_or_create(salon=s,nombre=name,defaults={'precio':price,'stock':10,'categoria':category,'descripcion':'Producto de ejemplo para la demostración académica.'})
        self.stdout.write(self.style.SUCCESS('Salón demo listo. Servicios y productos ficticios; no se han creado usuarios ni cobrado dinero.'))
