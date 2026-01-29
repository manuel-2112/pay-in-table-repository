# Fintoc – Checkout (Payment Initiation)

Integración modular del widget de checkout Fintoc para pagos.

## Documentación

- [Web Integration](https://docs.fintoc.com/docs/web-integration)
- [WebView Integration](https://docs.fintoc.com/docs/webview)
- [Create Checkout Session](https://docs.fintoc.com/reference/create-checkout-session)
- [Widget events](https://docs.fintoc.com/docs/widget-events)

## Configuración

### Frontend (env)

En `.env` o `.env.local`:

```env
# Fintoc public key (sandbox: pk_test_*, producción: pk_live_*)
VITE_FINTOC_PUBLIC_KEY=pk_test_xxxxxxxx
```

### Backend – Crear Checkout Session

El **session_token** debe crearse en el backend (nunca en el cliente) para no exponer la API secret.

En este proyecto se usa la Convex action `fintoc.createFintocCheckoutSession` (demo: monto fijo 1 CLP). En el dashboard de Convex configura la variable de entorno **FINTOC_SECRET_KEY** (tu secret key de Fintoc).

**Endpoint (referencia):** `POST https://api.fintoc.com/v1/checkout_sessions`

**Headers:**
- `Authorization: YOUR_SECRET_API_KEY`
- `Content-Type: application/json`

**Body (ejemplo):**
```json
{
  "amount": 2476,
  "currency": "CLP",
  "customer_email": "cliente@ejemplo.com"
}
```

La respuesta incluye `session_token` (para el widget) y `redirect_url` (para el flujo redirect).

## Dos flujos

1. **Widget**: el frontend abre el widget con `session_token`; el usuario paga sin salir de tu sitio.
2. **Redirect**: el frontend redirige a `redirect_url`; el usuario paga en la página de Fintoc y vuelve por `success_url` o `cancel_url`.

El **demo** (`/demo`) usa por defecto el flujo **Widget**. Las rutas `/demo/redirect/success` y `/demo/redirect/cancel` sirven para el flujo Redirect (o como URLs de retorno si cambias a redirect).

## Uso

### 1. Abrir widget desde componente

```tsx
import { FintocCheckout } from "@/components/payment/fintoc";

// Cuando tengas sessionToken (después de crear checkout session en backend)
<FintocCheckout
  sessionToken={sessionToken}
  onSuccess={() => setView("success")}
  onExit={() => setSessionToken(null)}
/>
```

### 2. Abrir widget imperativamente

```tsx
import { openFintocCheckout } from "@/lib/fintoc";

const handle = await openFintocCheckout(
  { sessionToken },
  { onSuccess: () => {}, onExit: () => {} }
);
// cleanup
handle.destroy();
```

## Estructura (Clean Code)

- **`lib/fintoc/types.ts`** – Tipos (callbacks, config, handle).
- **`lib/fintoc/config.ts`** – Constantes y `getFintocPublicKey()`.
- **`lib/fintoc/open-checkout.ts`** – `openFintocCheckout()`: carga SDK, crea widget, abre, devuelve handle.
- **`components/payment/fintoc/FintocCheckout.tsx`** – Componente React: abre cuando hay `sessionToken`, limpia al desmontar.
