# Revisión de Entre Chicas — 4 de noviembre de 2026

## Correcciones aplicadas

- Restauradas las imágenes, los iconos y el video en las rutas que utilizan las plantillas y el manifest. En el ZIP recibido estaban en otras carpetas y devolvían 404.
- Eliminado el registro del service worker `/sw.js`, que no existe en esta integración. La aplicación requiere conexión; no se presenta como una PWA offline terminada.
- Corregida la validación del salón: dejar un horario vacío muestra el error en el formulario y ya no provoca una excepción del servidor.
- Las consultas de API a salones, productos o servicios inexistentes devuelven errores JSON comprensibles.
- Los identificadores de servicios/productos se validan estrictamente: no se convierten booleanos ni decimales en identificadores válidos.
- Corregida una declaración CSS inválida y reducido el tamaño de los indicadores de portada para evitar superposición en teléfonos.
- Añadido soporte para reducir animaciones en portada según la preferencia del navegador.
- Limpiadas las referencias de versión de settings y fijada la ruta estática absoluta.
- Conservado el administrador con colores de Entre Chicas.

## Pruebas completadas

Django 5.2.19 / Python 3.12:
- `python manage.py check`: sin incidencias.
- `python manage.py test`: 14 pruebas aprobadas.
- `python manage.py makemigrations --check --dry-run`: sin cambios pendientes.

Navegador Chromium:
- Carga del catálogo y creación de reserva desde el formulario real.
- Carrito y envío de solicitud de compra.
- Consulta en Ayuda.
- Carga de páginas de cabello, uñas, labiales, uñas con foto y modelo de negocio.
- Inicio de sesión y listados administrativos de salones, servicios, productos, reservas y pedidos.
- Formulario de salón con horario vacío: muestra validación en vez de error de servidor.
- Inicio, tienda, ayuda y administración a 320 y 390 píxeles: sin desbordamiento horizontal.
- Cambio al tema oscuro.
- Sin errores JavaScript ni respuestas HTTP locales fallidas durante los recorridos finales.

Las pruebas utilizaron una base temporal independiente. No se modificaron los registros, usuarios ni contraseñas de la base de datos del ZIP original.

## Aplicar la actualización

1. Guarda una copia de tu proyecto actual.
2. Extrae este ZIP en una carpeta nueva y abre `evaluacion3_integrado` en VS Code.
3. Crea/activa un entorno virtual e instala `python -m pip install -r requirements.txt`.
4. Ejecuta `python manage.py check` y `python manage.py runserver`.
5. Abre http://127.0.0.1:8000/ y http://127.0.0.1:8000/admin/.
6. Actualiza con Ctrl+F5 para cargar los estilos y scripts nuevos.

Si has agregado datos después de enviar el ZIP, conserva tu `db.sqlite3` más reciente al incorporar los cambios. No copies encima una base antigua. No se agregaron migraciones en esta revisión.

Tu usuario y contraseña siguen siendo los que creaste. Esta revisión no crea usuarios por defecto. Si necesitas crear uno: `python manage.py createsuperuser`.

## Alcance y comprobaciones pendientes

- La cámara física y la precisión de los filtros requieren prueba en tu equipo con permisos e internet. La carga de las páginas no certifica la calidad del seguimiento.
- Las fuentes y detectores remotos dependen de servicios externos.
- Los pagos y planes siguen siendo informativos; no hay cobros ni suscripciones reales.
- Ayuda utiliza reglas del sitio, no IA generativa ni RAG.
- Las compras son solicitudes: no descuentan stock automáticamente.
- Una agenda por salón; no hay agendas individuales por profesional.
- Esta revisión valida los recorridos descritos; no equivale a una certificación de ausencia absoluta de errores ni a una auditoría de producción.
