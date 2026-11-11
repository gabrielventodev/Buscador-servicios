# Buscador de servicios

App para que vecinos de Campana (Buenos Aires) pidan presupuestos a prestadores de servicios de la zona.

Esta primera versión cubre el **reclutamiento de prestadores**:

- **Panel `/admin`** (con usuario y contraseña): arma la tanda diaria (20 por defecto). En cada fila hay un botón que abre WhatsApp con el mensaje de invitación listo, y el envío lo confirmás vos en WhatsApp.
- **Importar desde Excel** (.xlsx o .csv): reconoce columnas como Nombre, Oficio/Rubro, Celular/Teléfono/WhatsApp y Notas. Saltea los números ya cargados y lista las filas con error.
- **Enlace de invitación `/p/<código>`**: el prestador elige "Me sumo" o "No me interesa".
- **Registro con aviso de privacidad** (Ley 25.326) y consentimiento guardado.
- **Seguimiento automático** del estado de cada prestador: Pendiente → Enviado → Interesado → Registrado, o Baja.

## Por qué el envío no es automático

Automatizar WhatsApp personal (con librerías no oficiales) o mandar mensajes en frío desde la API oficial viola las políticas de WhatsApp y pone en riesgo el número. Por eso el envío es semiautomático: el sistema prepara todo y la persona toca "Enviar".

Como WhatsApp personal no tiene API, la app no puede leer las respuestas. Por eso el seguimiento se hace con el enlace con código único:

| Estado | Cuándo |
| --- | --- |
| Enviado | al tocar "Enviar por WhatsApp" en el panel |
| Interesado | el prestador toca "Me sumo". Abrir el enlace no cuenta, porque WhatsApp lo abre para generar la vista previa |
| Registrado | completa el registro y acepta el aviso de privacidad |
| Baja | toca "No me interesa", se marca a mano, o pasan 7 días sin respuesta |

A quien está de baja no se le vuelve a escribir. El teléfono se normaliza y es único, así que no se puede cargar dos veces.

## Correr en local

Necesitás Node 20+ y Postgres.

```bash
cp .env.example .env.local   # completar DATABASE_URL, ADMIN_USER, ADMIN_PASSWORD
npm install
DATABASE_URL=... npm run db:migrate
npm run dev
```

Panel: http://localhost:3000/admin

## Publicar para probar (Vercel + Neon, gratis)

1. En [vercel.com/new](https://vercel.com/new), importar este repositorio.
2. En el proyecto, ir a **Storage → Create Database → Neon (Postgres)** y conectarla. Eso carga `DATABASE_URL` sola.
3. En **Settings → Environment Variables**, agregar `ADMIN_USER` y `ADMIN_PASSWORD`.
4. Redesplegar. El build aplica el esquema de la base, y cada PR tiene su propio enlace de vista previa.

`BASE_URL` es opcional en Vercel; si no está, se usa el dominio del despliegue.

## Comandos

- `npm test`: tests unitarios (normalización de teléfonos, mensajes, estados)
- `npm run lint`: chequeo de tipos
- `npm run build`: build de producción

## Configuración

Ver `.env.example`. También `PRIVACY_CONTACT` (correo que aparece en el aviso de privacidad) y `APP_TIMEZONE` (por defecto `America/Argentina/Buenos_Aires`).

## Pendiente

- Cruce con el Registro Nacional No Llame (Ley 26.951) antes de contactar en frío, previsto para la fase 2.
- Búsqueda de candidatos con Places API, en vivo y guardando solo el `place_id`.
- Flujo de pedidos de vecinos y comparador de presupuestos.
