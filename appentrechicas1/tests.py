import json,uuid
from datetime import timedelta
from django.test import TestCase,Client
from django.utils import timezone
from django.core.management import call_command
from django.contrib.auth import get_user_model
from .models import Reserva,Pedido,Servicio,Producto

class IntegrationTests(TestCase):
    @classmethod
    def setUpTestData(cls): call_command('cargar_demo')
    def setUp(self):
        self.client=Client(enforce_csrf_checks=True)
        self.client.get('/')
        self.token=self.client.cookies['csrftoken'].value
        self.day=(timezone.localdate()+timedelta(days=1)).isoformat()
        self.service=Servicio.objects.get(nombre='Manicure')
    def post(self,path,data): return self.client.post(path,json.dumps(data),content_type='application/json',HTTP_X_CSRFTOKEN=self.token)
    def booking(self): return dict(solicitudId=str(uuid.uuid4()),nombre='Clienta Demo',correo='demo@example.com',telefono='123456789',servicio_id=self.service.pk,fecha=self.day,hora='09:00')
    def test_pages_and_admin(self):
        for page in ['','index.html','tienda.html','peinados.html','unas.html','espejo.html','ayuda.html','unas-foto.html','modelo-negocio.html','html/index.html','appentrechicas1/vista1/','appentrechicas2/vista1/']:
            self.assertEqual(self.client.get('/'+page).status_code,200,page)
        self.assertEqual(self.client.get('/admin/').status_code,302)
        self.assertEqual(self.client.get('/desconocida.html').status_code,404)
    def test_booking_overlap_idempotency_cancel(self):
        data=self.booking();r=self.post('/api/publico/demo/reservas',data);self.assertEqual(r.status_code,200,r.content)
        self.assertEqual(self.post('/api/publico/demo/reservas',data).json()['id'],r.json()['id'])
        self.assertEqual(Reserva.objects.count(),1)
        data['solicitudId']=str(uuid.uuid4());data['hora']='09:30'
        self.assertEqual(self.post('/api/publico/demo/reservas',data).status_code,409)
        Reserva.objects.update(estado='cancelada')
        self.assertEqual(self.post('/api/publico/demo/reservas',data).status_code,200)
    def test_invalid_and_csrf(self):
        self.assertEqual(self.client.post('/api/publico/demo/reservas',json.dumps(self.booking()),content_type='application/json').status_code,403)
        data=self.booking();data['correo']='bad';self.assertEqual(self.post('/api/publico/demo/reservas',data).status_code,400)
        data=self.booking();data['hora']='23:00';self.assertEqual(self.post('/api/publico/demo/reservas',data).status_code,409)
        data=self.booking();data['fecha']='2000-01-01';self.assertEqual(self.post('/api/publico/demo/reservas',data).status_code,409)
    def test_shop(self):
        p=Producto.objects.first();data={'solicitudId':str(uuid.uuid4()),'nombre':'Demo','telefono':'12345','items':[{'id':p.pk,'cantidad':2}]}
        r=self.post('/api/publico/demo/pedidos',data);self.assertEqual(r.status_code,200,r.content);self.assertEqual(r.json()['total'],p.precio*2)
        self.assertEqual(self.post('/api/publico/demo/pedidos',data).json()['id'],r.json()['id']);self.assertEqual(Pedido.objects.count(),1)
        data['solicitudId']=str(uuid.uuid4());data['items'][0]['cantidad']=20
        self.assertEqual(self.post('/api/publico/demo/pedidos',data).status_code,409)
    def test_demo_command_is_non_destructive(self):
        self.service.precio=999;self.service.save();call_command('cargar_demo');self.service.refresh_from_db();self.assertEqual(self.service.precio,999);self.assertEqual(Servicio.objects.count(),4)
    def test_help_and_gate(self):
        self.assertEqual(self.post('/api/publico/demo/ayuda',{'pregunta':'Cómo reservar'}).status_code,200)
        self.assertTrue(self.client.get('/api/publico/demo/acceso').json()['ra'])
    def test_admin_access(self):
        user=get_user_model().objects.create_user('staff',password='test-password',is_staff=True,is_superuser=True)
        self.client.force_login(user)
        for model in ['salon','servicio','producto','reserva','pedido']:
            self.assertEqual(self.client.get('/admin/appentrechicas1/'+model+'/').status_code,200)

    def test_admin_salon_missing_hours_shows_errors(self):
        from django.forms import modelform_factory
        from .models import Salon
        form=modelform_factory(Salon,fields=['slug','nombre','apertura','cierre'])(data={'slug':'nuevo','nombre':'Nuevo','apertura':'','cierre':'19'})
        self.assertFalse(form.is_valid())
        self.assertIn('apertura',form.errors)

    def test_api_missing_resources_return_json(self):
        for path in ['/api/publico/no-existe','/api/publico/no-existe/acceso','/api/publico/no-existe/productos','/api/publico/demo/horarios?fecha='+self.day+'&servicio=2147483647']:
            r=self.client.get(path)
            self.assertEqual(r.status_code,404)
            self.assertIn('error',r.json())

    def test_ids_are_not_silently_coerced(self):
        for value in [True,1.9,-1,[],{},'1.0','999999999999999999999999']:
            data=self.booking();data['servicio_id']=value
            self.assertEqual(self.post('/api/publico/demo/reservas',data).status_code,400)

    def test_reused_request_with_new_data_is_rejected(self):
        data=self.booking()
        self.assertEqual(self.post('/api/publico/demo/reservas',data).status_code,200)
        data['nombre']='Otra persona'
        self.assertEqual(self.post('/api/publico/demo/reservas',data).status_code,409)
        self.assertEqual(Reserva.objects.count(),1)

    def test_product_quantities_and_duplicate_items(self):
        p=Producto.objects.first()
        for items in [[{'id':p.pk,'cantidad':0}],[{'id':p.pk,'cantidad':True}],[{'id':p.pk,'cantidad':1},{'id':p.pk,'cantidad':1}],[]]:
            data={'solicitudId':str(uuid.uuid4()),'nombre':'Demo','telefono':'12345','items':items}
            self.assertEqual(self.post('/api/publico/demo/pedidos',data).status_code,400)
        self.assertEqual(Pedido.objects.count(),0)

    def test_admin_theme_and_static_files_exist(self):
        from django.contrib.staticfiles import finders
        r=self.client.get('/admin/login/')
        self.assertContains(r,'entrechicas/css/admin.css')
        self.assertContains(r,'Tu espacio de belleza y bienestar')
        for path in ['css/admin.css','assets/imagenes/foto1.png','assets/imagenes/trabajadores.jpeg','assets/videos/video.mp4','assets/imagenes/icono-192.png','assets/imagenes/icono-512.png']:
            self.assertIsNotNone(finders.find('entrechicas/'+path),path)

    def test_invalid_json_and_inactive_service(self):
        r=self.client.post('/api/publico/demo/reservas','{',content_type='application/json',HTTP_X_CSRFTOKEN=self.token)
        self.assertEqual(r.status_code,400)
        self.service.activo=False;self.service.save()
        self.assertEqual(self.post('/api/publico/demo/reservas',self.booking()).status_code,404)
