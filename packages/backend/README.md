# @pay-in-table-repository/backend

This is the backend section of the @pay-in-table-repository stack monorepo. It uses convex for the API and Database layer.

```sh
bunx convex dev
```

## Simular una mesa (probar el backend)

Para tener una mesa con sesión activa e ítems y probar reserva/pago:

1. **Convex dev en marcha** (en `packages/backend`):
   ```sh
   cd packages/backend && bunx convex dev
   ```

2. **Ejecutar el seed** (una de las dos formas):

   - **Dashboard**: [Convex Dashboard](https://dashboard.convex.dev) → tu proyecto → **Functions** → `seed:seedDemoTable` → **Run** (args: `{}`).

   - **CLI** (desde la raíz del repo):
     ```sh
     cd packages/backend && bunx convex run seed:seedDemoTable '{}'
     ```

3. **Copiar el `accessToken`** que devuelve (ej. `tk_abc123...`).

4. **Probar en la app**: cuando tengas una ruta que use el token (ej. `/pay?token=...`), abre:
   ```
   http://localhost:3000/pay?token=<accessToken>
   ```
   Esa página puede usar `useSessionCheckout(token)` para listar ítems, reservar, liberar y pagar.

El seed crea: 1 restaurant, 1 local, 1 mesa (con ese token), 1 sesión activa y 3 ítems de ejemplo (cerveza, hamburguesa, agua). Puedes ejecutar `seedDemoTable` varias veces; cada vez crea una mesa nueva con un token distinto.

**Si ya tienes una mesa con sesión activa pero sin ítems** (ej. abriste sesión desde el dashboard):

- **Desde la app**: en `/pay?token=tk_xxx`, si no hay ítems verás el mensaje "No hay ítems en esta cuenta" y un botón **"Añadir ítems de prueba"** que inserta los mismos 3 ítems de ejemplo en esa sesión.
- **Desde CLI**: `bunx convex run seed:seedItemsForTableByToken '{"accessToken": "tk_xxx"}'` (reemplaza `tk_xxx` por tu token).

## Fintoc (demo)

Para el flujo de pago demo con Fintoc, configura en el [dashboard de Convex](https://dashboard.convex.dev) la variable de entorno **FINTOC_SECRET_KEY** con tu secret key de Fintoc (sandbox: `sk_test_*`, producción: `sk_live_*`). La action `fintoc.createFintocCheckoutSession` crea una sesión de checkout con el monto real (CLP) que envía el frontend.