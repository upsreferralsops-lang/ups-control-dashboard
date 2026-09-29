# Panel de referidos UPS

Dashboard de control del sistema de referidos: métricas por estado, listado
de candidatos y ficha con la conversación completa.

Es solo el frontend. Toda la lógica y los datos viven en el core
(`ups-core-backend`), que expone la API que este panel consume.

## Producción (Vercel)

| Recurso | URL |
|---|---|
| Panel | https://ups-control-dashboard.vercel.app (alias del team: `…-ups-team1.vercel.app`) |
| Core (API) | https://api.referidosops.com |

El panel en Vercel **no es prod completo** hasta que el proyecto tenga la variable
**`CORE_API_URL=https://api.referidosops.com`** (Production **y** Preview) y un
**Redeploy** después de cargarla.

Si en el login aparece:

> No se pudo conectar con el core en **http://localhost:8090**

falta esa variable en **ese** deployment (Vercel usa el default del código).
Guía paso a paso: **[docs/conexion-core-produccion.md](docs/conexion-core-produccion.md)**.

Índice de documentación: **[docs/README.md](docs/README.md)**.

**Skills de UI en Cursor:** [.cursor/skills/](.cursor/skills/) (índice `design-workflow-cursor`).

## Desarrollo local

### Requisitos

- Node 20 o superior
- pnpm (fijado en `packageManager`)
- El core corriendo y accesible

### Puesta en marcha

```bash
pnpm install
cp .env.example .env.local
pnpm dev
```

Panel contra el core local en http://localhost:3000.

Para desarrollar el panel apuntando al core en **AWS** (sin levantar el backend en tu máquina):

```bash
pnpm dev:aws
```

Usa `CORE_API_URL` de [`.env.aws`](.env.aws) (`https://api.referidosops.com`) vía [`scripts/dev-aws.mjs`](scripts/dev-aws.mjs); tu `.env.local` sigue valiendo para `pnpm dev`.

Solo puede haber **un** `next dev` por carpeta del proyecto. `dev:aws` **detiene** el servidor dev anterior si sigue activo (por ejemplo dejó `pnpm dev` en otra terminal). Para apagarlo sin arrancar otro: `pnpm dev:stop`.

### Variables (local)

| Variable | Valor local |
|---|---|
| `CORE_API_URL` | `http://localhost:8090` (ver `.env.example`) |

La sesión usa JWT en cookie httpOnly (`POST /api/auth/login`); no hace falta API key en el front.

### Levantar el core

Desde `ups-core-backend`:

```bash
docker compose up -d
# API según tu compose / uvicorn (puerto 8090 en .env.example del panel)
```

Si el core no responde, el panel avisa en pantalla en vez de romperse.

## Comandos

| Comando | Qué hace |
|---|---|
| `pnpm dev` | Servidor de desarrollo (core local vía `.env.local`) |
| `pnpm dev:aws` | Servidor de desarrollo contra `https://api.referidosops.com` (reemplaza otro `next dev` del mismo repo) |
| `pnpm dev:stop` | Detiene el `next dev` registrado en `.next/dev/lock` |
| `pnpm build` | Build de producción |
| `pnpm start` | Sirve el build |
| `pnpm lint` | ESLint |
| `pnpm exec tsc --noEmit` | Chequeo de tipos |
