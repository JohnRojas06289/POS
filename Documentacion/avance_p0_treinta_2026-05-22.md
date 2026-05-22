# Avance P0 vs referente Treinta POS — 2026-05-22

## Objetivo
Dejar documentados los cambios urgentes que se implementaron después del análisis comparativo contra el referente de Treinta POS, priorizando primero las brechas más visibles de producto y luego los errores que bloqueaban compilación.

## Cambios implementados

### 1. Clientes
**Estado:** resuelto

- Se eliminó el uso de datos mock en la pantalla de clientes.
- Se adaptó el frontend al shape real del backend.
- El drawer de detalle ahora carga información real del cliente.
- El historial de crédito y las órdenes recientes pasan a consumirse desde backend.
- El flujo de abono quedó alineado con el payload real del API (`paymentMethod`, `reference`).

**Archivos principales:**
- `apps/web/src/app/(dashboard)/customers/page.tsx`

---

### 2. Catálogo público / WhatsApp
**Estado:** resuelto

- El catálogo público ahora prioriza el WhatsApp configurado en Settings.
- También se prioriza el nombre de negocio configurado en tenant config.
- Se dejó fallback al tenant base para mantener compatibilidad.

**Archivos principales:**
- `backend/src/modules/catalog/catalog.service.ts`

---

### 3. Movimientos
**Estado:** resuelto

- La lista de movimientos fue enriquecida con cliente, teléfono y mesa.
- El detalle de la orden ahora expone cliente, mesa, pagos y nombres reales de producto/variante.
- La UI de Movimientos quedó más operativa, con:
  - detalle útil
  - recibo
  - exportación CSV
  - hold / resume
  - filtros más aprovechables
- Se ajustó la visualización para mostrar totales cobrados, propinas y vuelto cuando aplica.

**Archivos principales:**
- `backend/src/modules/pos/pos.service.ts`
- `apps/web/src/app/(dashboard)/orders/page.tsx`

---

### 4. Propinas end-to-end
**Estado:** resuelto

- Se conectó la configuración de propinas desde Settings al POS.
- El modal de cobro ahora soporta:
  - sin propina
  - porcentaje sugerido
  - monto personalizado
- El backend valida pagos contra el total a cobrar incluyendo propina.
- La propina se persiste sin migración usando `Payment.metadata`.
- El sync offline también soporta `tipAmount` y `tipPercentage`.
- El recibo refleja propina y vuelto correctamente.
- Movimientos muestra propina dentro del resumen.
- Analíticas ahora incluye pestaña dedicada de propinas.

**Decisión técnica importante:**
- Se mantuvo `Order.total` como total de venta sin propina.
- El total operativo cobrado se deriva como `chargedTotal` desde los pagos.
- Esto permite separar ventas y propinas en analítica sin migración de schema.

**Archivos principales:**
- `apps/web/src/components/pos/PaymentModal.tsx`
- `apps/web/src/app/(pos)/pos/page.tsx`
- `apps/web/src/components/pos/Receipt.tsx`
- `apps/web/src/app/(dashboard)/orders/page.tsx`
- `apps/web/src/app/(dashboard)/analytics/page.tsx`
- `apps/web/src/lib/api.ts`
- `backend/src/modules/pos/dto/create-order.dto.ts`
- `backend/src/modules/pos/pos.service.ts`
- `backend/src/modules/sync/sync.service.ts`
- `backend/src/modules/analytics/analytics.controller.ts`
- `backend/src/modules/analytics/analytics.service.ts`

---

### 5. Limpieza de errores de compilación pendientes
**Estado:** resuelto

#### 5.1 Catálogo público `tienda/[slug]`
- Se normalizó el shape de productos para respetar el contrato esperado por el catálogo público.
- Se corrigieron nullables e inferencias de tipo.

**Archivo principal:**
- `apps/web/src/app/tienda/[slug]/page.tsx`

#### 5.2 Quotes y Tables
- Se eliminó la dependencia directa de `tx.quote` y `tx.table`.
- Ambos módulos fueron reescritos con SQL crudo tenant-scoped usando `SET LOCAL search_path`.
- Se agregó protección con `ensureTenantSchemaTables(...)` para `Quote`, `QuoteItem` y `Table`.
- Esto resuelve el desajuste entre el schema Prisma y el cliente generado actual del proyecto.

**Archivos principales:**
- `backend/src/modules/quotes/dto/create-quote.dto.ts`
- `backend/src/modules/quotes/quotes.controller.ts`
- `backend/src/modules/quotes/quotes.service.ts`
- `backend/src/modules/tables/dto/create-table.dto.ts`
- `backend/src/modules/tables/tables.controller.ts`
- `backend/src/modules/tables/tables.service.ts`

---

## Validación realizada
Se ejecutó typecheck completo después de los cambios:

- **Web:** OK
- **Backend:** OK

## Impacto
Con este bloque queda resuelta la parte más urgente del frente comparativo con Treinta en estas áreas:

- clientes
- movimientos
- propinas
- consistencia del catálogo público
- estabilidad de compilación

## Pendientes sugeridos para siguiente fase
Los siguientes frentes recomendados, fuera de este bloque, son:

1. Impresión real / administración de impresoras
2. DIAN operativa completa
3. Conversión real de cotización a venta
4. Mayor profundidad en catálogo digital / administración de menú

## Nota
Este documento resume únicamente los cambios implementados en esta ronda priorizada P0. Se dejó fuera cualquier archivo no relacionado con este alcance.
