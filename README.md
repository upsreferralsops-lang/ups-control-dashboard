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
cp .env.example .env.local   # y completar CORE_API_KEY
pnpm dev
```

El panel queda en http://localhost:3000

### Variables

| Variable | Para qué |
|---|---|
| `CORE_API_URL` | Dónde escucha el core. En local, `http://localhost:8080` |
| `CORE_API_KEY` | La misma `API_KEY` que tiene el core en su `.env` |

Ninguna lleva prefijo `NEXT_PUBLIC_` a propósito: todo el fetch corre en
Server Components, así la clave nunca llega al navegador.

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
