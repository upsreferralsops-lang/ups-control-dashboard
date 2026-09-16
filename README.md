# Panel de referidos UPS

Dashboard de control del sistema de referidos: métricas por estado, listado
de candidatos y ficha con la conversación completa.

Es solo el frontend. Toda la lógica y los datos viven en el core
(`ups-core-backend`), que expone la API que este panel consume.

## Requisitos

- Node 20 o superior
- pnpm (el gestor del proyecto; está fijado en `packageManager`)
- El core corriendo y accesible

## Puesta en marcha

```bash
pnpm install
cp .env.example .env.local   # y completar CORE_API_URL si hace falta
pnpm dev
```

El panel queda en http://localhost:3000

### Variables

| Variable | Para qué |
|---|---|
| `CORE_API_URL` | Dónde escucha el core. En local, `http://localhost:8090` |

La sesión del panel usa JWT en cookie httpOnly (`POST /api/auth/login`); no hace falta API key estática.

## Levantar el core

Desde el repo `ups-core-backend`:

```bash
docker compose up -d
venv/Scripts/python.exe -m uvicorn app.api.main:app --port 8080
```

Si el core no responde, el panel lo avisa en pantalla en vez de romperse.

## Comandos

| Comando | Qué hace |
|---|---|
| `pnpm dev` | Servidor de desarrollo |
| `pnpm build` | Build de producción |
| `pnpm start` | Sirve el build |
| `pnpm lint` | ESLint |
| `pnpm exec tsc --noEmit` | Chequeo de tipos |
