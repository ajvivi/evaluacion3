from django.contrib import admin
from .models import Producto, Pedido

@admin.register(Producto)
class ProductoAdmin(admin.ModelAdmin):
    list_display = ('nombre','precio','stock','categoria','activo')
    list_filter = ('salon','categoria','activo')

@admin.register(Pedido)
class PedidoAdmin(admin.ModelAdmin):
    list_display = ('nombre','total','estado','creado')
    list_filter = ('estado','salon')
    readonly_fields = [f.name for f in Pedido._meta.fields if f.name != 'estado']
    def has_add_permission(self,request): return False
    def has_delete_permission(self,request,obj=None): return False

