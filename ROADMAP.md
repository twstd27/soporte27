# Roadmap — Funcionalidades Futuras

Módulos y mejoras identificadas para desarrollar en fases posteriores.

---

## Alta Prioridad

### Módulo de Clientes — Historial y CRM básico
- Ver todos los tickets históricos de un cliente desde su perfil
- Contador de visitas y monto total facturado
- Notas internas por cliente
- Exportar historial del cliente en PDF

### Exportación de Reportes
- Exportar reporte financiero a CSV / Excel
- Exportar listado de tickets filtrado a PDF/CSV
- Imprimir reporte de técnico por período

### Órdenes de Trabajo (OT)
- Generación de PDF/impresión de orden de trabajo formal (diferente al ticket térmico)
- Firma digital del cliente al entregar
- Número de OT separado del número de ticket

---

## Media Prioridad

### Presupuestos / Cotizaciones
- Crear presupuesto antes de aprobar la reparación
- Estado: pendiente_aprobación → aprobado / rechazado
- Notificación al cliente por WhatsApp/Email al generar presupuesto

### Notificaciones al Cliente
- Envío de SMS o WhatsApp cuando el ticket cambia a estado "listo"
- Integración con Twilio o Meta Business API
- Plantillas configurables por empresa

### Portal de Seguimiento para Clientes
- URL pública con número de ticket para consultar estado sin login
- QR en ticket impreso que lleva al portal
- Vista read-only del progreso

### Inventario de Repuestos
- Stock mínimo por repuesto con alertas
- Movimientos de entrada/salida
- Asociar compra de repuesto a proveedor con factura
- Informe de rotación de inventario

---

## Baja Prioridad / Ideas Futuras

### Multi-Sucursal
- Soporte para múltiples sedes o locales
- Tickets asignados por sucursal
- Reportes consolidados o por sucursal

### Dashboard Ejecutivo
- KPIs comparativos mes a mes
- Gráfico de tendencia de ingresos anual
- Ranking de técnicos por tickets entregados y calificación

### Calificación de Servicio
- Enviar encuesta de satisfacción al cliente tras entrega
- NPS o rating de 1-5 estrellas
- Visualización de calificaciones en dashboard

### Integración Contable
- Exportación compatible con sistemas contables locales
- Generación de facturas electrónicas (DIAN / SAT / SRI según país)

### App Móvil / PWA
- Instalar como PWA desde el navegador
- Push notifications nativas en móvil
- Tomar foto y adjuntar al ticket desde la cámara del móvil

### Gestión de Garantías
- Registro automático de garantía al entregar
- Alerta cuando el cliente regresa dentro del período de garantía
- Reporte de tickets re-ingresados por garantía

### Calendario Compartido
- Vista calendario compartida entre todos los técnicos (admin)
- Asignación de slots de trabajo por técnico
- Integración con Google Calendar / Outlook

---

## Mejoras Técnicas

- Tests automatizados (PHPUnit backend, Vitest/Playwright frontend)
- WebSockets para notificaciones en tiempo real (reemplazar polling)
- Rate limiting y auditoría de seguridad
- Soporte multi-idioma (i18n)
- Modo offline parcial con service workers
