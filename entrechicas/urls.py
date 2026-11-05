from django.contrib import admin
from django.urls import path, include
from django.views.generic import RedirectView
from appentrechicas1 import views
urlpatterns = [
    path('admin/',admin.site.urls),
    path('admin.html',RedirectView.as_view(url='/admin/',permanent=False)),
    path('html/admin.html',RedirectView.as_view(url='/admin/',permanent=False)),
    path('appentrechicas1/',include('appentrechicas1.urls')),
    path('appentrechicas2/',include('appentrechicas2.urls')),
    path('api/ayuda/config',views.ayuda_config),
    path('api/publico/<slug:slug>',views.info),
    path('api/publico/<slug:slug>/acceso',views.acceso),
    path('api/publico/<slug:slug>/productos',views.productos),
    path('api/publico/<slug:slug>/horarios',views.horarios),
    path('api/publico/<slug:slug>/reservas',views.reservas),
    path('api/publico/<slug:slug>/pedidos',views.pedidos),
    path('api/publico/<slug:slug>/ayuda',views.ayuda),
    path('manifest.json',RedirectView.as_view(url='/static/entrechicas/manifest.json',permanent=False)),
    path('',views.page,name='inicio'),
    path('<str:nombre>.html',views.page),
    path('html/<str:nombre>.html',views.page),
]
