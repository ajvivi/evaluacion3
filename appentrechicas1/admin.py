from django.contrib import admin
from .models import Salon, Servicio, Producto, Reserva, Pedido

@admin.register(Salon)
class SalonAdmin(admin.ModelAdmin):
    list_display = ('nombre','slug','apertura','cierre','probadores_demo')

@admin.register(Servicio)
class ServicioAdmin(admin.ModelAdmin):
    list_display = ('nombre','salon','precio','duracion','activo')
    list_filter = ('salon','activo')

@admin.register(Producto)
class ProductoAdmin(admin.ModelAdmin):
    list_display = ('nombre','precio','stock','categoria','activo')
    list_filter = ('salon','categoria','activo')

@admin.register(Reserva)
class ReservaAdmin(admin.ModelAdmin):
    list_display = ('nombre','servicio_nombre','inicio','estado')
    list_filter = ('estado','salon')
    search_fields = ('nombre','correo','telefono')
    readonly_fields = [f.name for f in Reserva._meta.fields if f.name != 'estado']
    def has_add_permission(self,request): return False
    def has_delete_permission(self,request,obj=None): return False

@admin.register(Pedido)
class PedidoAdmin(admin.ModelAdmin):
    list_display = ('nombre','total','estado','creado')
    list_filter = ('estado','salon')
    readonly_fields = [f.name for f in Pedido._meta.fields if f.name != 'estado']
    def has_add_permission(self,request): return False
    def has_delete_permission(self,request,obj=None): return False

admin.site.site_header = 'Administración · Entre Chicas'
admin.site.site_title = 'Entre Chicas'
