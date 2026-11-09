from django.db import migrations


def relabel(apps, schema_editor, source, destination):
    ContentType = apps.get_model('contenttypes', 'ContentType')
    objects = ContentType.objects.using(schema_editor.connection.alias)
    for model in ('producto', 'pedido'):
        old = objects.filter(app_label=source, model=model).first()
        if old:
            if objects.filter(app_label=destination, model=model).exists():
                raise RuntimeError('Existen permisos duplicados de tienda. Revisa los tipos de contenido antes de migrar.')
            # Keep the primary key so permissions and admin log entries survive.
            old.app_label = destination
            old.save(update_fields=['app_label'], using=schema_editor.connection.alias)


def forward(apps, schema_editor):
    relabel(apps, schema_editor, 'appentrechicas1', 'appentrechicas2')


def backward(apps, schema_editor):
    relabel(apps, schema_editor, 'appentrechicas2', 'appentrechicas1')


class Migration(migrations.Migration):
    dependencies = [('appentrechicas2', '0001_tienda')]
    operations = [migrations.RunPython(forward, backward)]
