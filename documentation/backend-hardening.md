# Endurecimiento del backend

## Qué se está reforzando

- Registro de tenants con rollback compensatorio si falla la provisión.
- Manejo explícito de errores Prisma para evitar 500 genéricos.
- Límite de tasa en rutas públicas críticas de auth y onboarding.
- Timeouts y reintentos controlados en provisión de schemas.
- Health check real con estado de base de datos y Redis.
- Validación de totales en sync para que el backend no corrompa contabilidad.

## Medidas aplicadas

1. **Rollback de tenant provisioning**
   - Si falla la creación de schema, se eliminan los registros parciales en `public` y el schema temporal.

2. **Rate limiting interno**
   - `login`, `login-pin`, `register-tenant`, `onboarding/register`, `check-schema` y `templates` tienen límites por ventana de tiempo.

3. **Timeout + retry**
   - La provisión de tenant y onboarding ahora fallan rápido si se cuelgan y reintentan una vez en fallos transitorios.

4. **Health check útil**
   - `/health` reporta estado de base de datos y Redis.
   - Si la base cae, el endpoint responde `503`.

5. **Sync consistente**
   - El total de órdenes offline se calcula desde items y no desde pagos.

## Línea general de endurecimiento

- Reducir 500 opacos.
- Hacer los flujos críticos idempotentes.
- Compensar los fallos parciales.
- Exponer estado real de dependencias.
- Proteger endpoints públicos contra abuso.

## Siguientes pasos sugeridos

- Agregar tests E2E del flujo completo de alta de tenant y login.
- Añadir observabilidad por request id y spans en onboarding/auth.
- Persistir métricas de rate limiting y errores transitorios.
