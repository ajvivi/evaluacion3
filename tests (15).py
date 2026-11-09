import uuid
from django.test import TestCase, TransactionTestCase
from django.db import connection
from django.db.migrations.executor import MigrationExecutor
from django.urls import resolve
from .models import Producto, Pedido


class TiendaRoutesTests(TestCase):
    def test_store_routes_and_ownership(self):
        for url in ['/tienda/', '/tienda.html', '/html/tienda.html',
                    '/appentrechicas2/', '/appentrechicas2/vista1/', '/appentrechicas2/vista2/']:
            self.assertEqual(resolve(url).func.__module__, 'appentrechicas2.views')
            response = self.client.get(url)
            self.assertEqual(response.status_code, 200)
            self.assertTemplateUsed(response, 'appentrechicas2/tienda.html')
        self.assertEqual(Producto._meta.app_label, 'appentrechicas2')
        self.assertEqual(Pedido._meta.app_label, 'appentrechicas2')


class ExistingDatabaseMigrationTests(TransactionTestCase):
    """Upgrade the old schema with records and a previously granted permission."""
    def test_upgrade_preserves_records_and_permissions(self):
        executor = MigrationExecutor(connection)
        latest = executor.loader.graph.leaf_nodes()
        old_targets = [('appentrechicas1', '0001_initial'), ('appentrechicas2', None)]
        try:
            executor.migrate(old_targets)
            state = MigrationExecutor(connection).loader.project_state([
                ('appentrechicas1', '0001_initial'), ('auth', '0012_alter_user_first_name_max_length')
            ]).apps
            Salon = state.get_model('appentrechicas1', 'Salon')
            OldProducto = state.get_model('appentrechicas1', 'Producto')
            OldPedido = state.get_model('appentrechicas1', 'Pedido')
            ContentType = state.get_model('contenttypes', 'ContentType')
            Permission = state.get_model('auth', 'Permission')
            Group = state.get_model('auth', 'Group')
            salon = Salon.objects.create(slug='conservacion', nombre='Salón de prueba')
            product = OldProducto.objects.create(salon=salon, nombre='Producto existente', precio=4500, stock=7)
            order = OldPedido.objects.create(salon=salon, solicitud_id=uuid.uuid4(), nombre='Prueba', telefono='123456789', total=4500, items=[{'id': product.pk, 'cantidad': 1, 'precio': 4500}])
            content_type, _ = ContentType.objects.get_or_create(app_label='appentrechicas1', model='producto')
            permission, _ = Permission.objects.get_or_create(content_type=content_type, codename='change_producto', defaults={'name': 'Can change producto'})
            group = Group.objects.create(name='Gestión tienda')
            group.permissions.add(permission)
            MigrationExecutor(connection).migrate(latest)
            self.assertEqual(Producto.objects.get(pk=product.pk).stock, 7)
            self.assertEqual(Pedido.objects.get(pk=order.pk).items, order.items)
            content_type.refresh_from_db()
            self.assertEqual(content_type.app_label, 'appentrechicas2')
            self.assertTrue(group.permissions.filter(pk=permission.pk).exists())
            self.assertEqual(Producto.objects.get(pk=product.pk).salon_id, salon.pk)
        finally:
            MigrationExecutor(connection).migrate(latest)
