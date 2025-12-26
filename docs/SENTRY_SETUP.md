# Configuración de Sentry (Producción) 🚨

Este documento detalla la configuración final de Sentry para el proyecto MCSupport.

## 1. Variables de Entorno Requeridas

Asegúrate de configurar estas variables en tu servidor de despliegue (Railway, Vercel, etc.):

```properties
# PÚBLICO: Dirección de envío de errores (DSN)
# Debe coincidir con el proyecto configurado en el código
NEXT_PUBLIC_SENTRY_DSN=https://2dc6394dfac22c4062283397f965b732@o4510552615616512.ingest.us.sentry.io/4510552620007424

# PRIVADO: Token para subir Source Maps durante el build y Releases
SENTRY_AUTH_TOKEN=sntry_tu_token_aqui

# Identificadores del Proyecto
SENTRY_ORG=multicomputos
SENTRY_PROJECT=javascript-nextjs
```

## 2. Configuración de Seguridad (Allowed Domains)

Si Sentry rechaza eventos con error `403 Forbidden`, es necesario autorizar los dominios:

1.  Ir a **Settings** -> **Client Keys (DSN)** -> **Configure**.
2.  En **Allowed Domains**, agregar:
    - `*` (Permitir todo - útil si las IPs cambian dinámicamente)
    - O las IPs/Dominios específicos: `localhost:3000`, `midominio.com`.

## 3. Verificación

El sistema está configurado para capturar:

- **Errores no controlados** (Frontend y Backend).
- **Fallos en Server Actions**.
- **Performance** (Muestreo del 100% de traces en Dev, ajustar en Prod).

Para probar, verifica que la consola del navegador muestre peticiones exitosas a `ingest.us.sentry.io` cuando ocurre un error.
