# @pay-in-table-repository/backend

This is the backend section of the @pay-in-table-repository stack monorepo. It uses convex for the API and Database layer.

```sh
bunx convex dev
```

## Fintoc (demo)

Para el flujo de pago demo con Fintoc, configura en el [dashboard de Convex](https://dashboard.convex.dev) la variable de entorno **FINTOC_SECRET_KEY** con tu secret key de Fintoc (sandbox: `sk_test_*`, producción: `sk_live_*`). La action `fintoc.createFintocCheckoutSession` crea una sesión de checkout con monto fijo 1 CLP para pruebas.