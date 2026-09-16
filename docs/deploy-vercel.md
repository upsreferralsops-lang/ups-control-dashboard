# Despliegue del panel en Vercel

Repo: `upsreferralsops-lang/ups-control-dashboard`  
Stack: Next.js 16 · pnpm · Node 20+

El panel **no llama al core desde el navegador**. Las Server Actions y Route Handlers en Vercel hablan con el backend usando `CORE_API_URL`. La cookie de sesión (`ups_session`) queda en el dominio de Vercel.

---

## Requisito previo (importante)

Vercel debe poder alcanzar el core por **HTTPS público**.  
`CORE_API_URL=http://localhost:8090` **no funciona** en producción: el servidor de Vercel no ve tu máquina local.

Opciones:

1. **Recomendado:** desplegar primero el core en AWS (o un VPS) y usar algo como `https://api.tudominio.com`.
2. **Prueba temporal:** túnel (Cloudflare Tunnel, ngrok) apuntando al API local — solo para validar el flujo, no para producción.

---

## Paso 1 — Código en GitHub

### Cuenta correcta (upsreferralsops-lang)

Los pushes deben ir con la org, no con el usuario personal. En PowerShell:

```powershell
gh auth switch -u upsreferralsops-lang
gh auth setup-git
```

En **cada repo** (`ups-control-dashboard`, `ups-core-backend`), la identidad del **commit** es local al repo (no uses `git config --global` si mezclás cuentas):

```powershell
git config user.name "upsreferralsops-lang"
git config user.email "ups.referidos.ops@gmail.com"
```

Comprobación:

```powershell
gh auth status          # active account: upsreferralsops-lang
git log -1 --format="%an <%ae>"
```

> El **autor** del commit (`Edavi11` vs `upsreferralsops-lang`) **no** provoca el 404 de Vercel; el build se dispara igual. Sí importa para auditoría y para que **Vercel → Git** esté instalado en la **org** `upsreferralsops-lang`, no solo en tu GitHub personal (Settings → Git en el proyecto Vercel).

Desde la carpeta del dashboard:

```powershell
cd "...\UPS Client\ups-control-dashboard"
git status
pnpm install
pnpm build
```

Si `pnpm build` pasa, sube a GitHub (cuenta `upsreferralsops-lang`):

```powershell
gh auth switch -u upsreferralsops-lang
gh auth setup-git
git add .
git commit -m "feat: panel listo para despliegue en Vercel"
git push origin main
```

Los secretos **no** van al repo: `.gitignore` ignora `.env*` (excepto `.env.example`).

---

## Paso 2 — Iniciar sesión en Vercel

La CLI en esta máquina no tiene token válido; hay que autenticarse una vez:

```powershell
vercel login
```

Sigue el enlace en el navegador y confirma la cuenta (idealmente la misma org/equipo donde vivirá el proyecto).

---

## Paso 3 — Crear el proyecto (GitHub → Vercel)

### Opción A — Web (recomendada la primera vez)

1. Entra a [vercel.com/new](https://vercel.com/new).
2. **Import** del repo `upsreferralsops-lang/ups-control-dashboard`.
3. Framework: **Next.js** (auto).
4. **Install Command:** `pnpm install` (Vercel suele detectarlo por `packageManager` en `package.json`).
5. **Build Command:** `pnpm build` (default).
6. **Root Directory:** `./` (raíz del repo).

### Opción B — CLI

```powershell
cd "...\ups-control-dashboard"
vercel link
vercel --prod
```

---

## Paso 4 — Variable de entorno en Vercel

En el proyecto: **Settings → Environment Variables**

| Nombre | Valor | Entornos |
|--------|--------|----------|
| `CORE_API_URL` | URL pública del core, ej. `https://api.tudominio.com` | Production, Preview, Development |

No hace falta `NEXT_PUBLIC_*`: nada sensible va al bundle del cliente para el core.

Tras guardar, **Redeploy** (Deployments → … → Redeploy) para que el build tome la variable.

---

## Paso 5 — Backend cuando el core ya esté en la nube

En el `.env` del **core** (AWS), conviene:

```env
JWT_SECRET=<mismo valor fuerte en prod>
API_ALLOWED_ORIGINS=https://tu-panel.vercel.app,https://tu-dominio-custom.com
```

El panel hoy consume el API **desde el servidor de Next**, así que CORS casi no afecta el flujo normal; igual conviene dejar el origen del panel por si más adelante hay llamadas desde el browser.

---

## Paso 6 — Verificación

1. Abre la URL de producción de Vercel (`https://….vercel.app`).
2. Inicia sesión con un usuario del core.
3. Revisa Home, listado de candidatos y una ficha (SSE vía `/api/events` en el mismo dominio de Vercel).

Si el login falla con error de conexión:

- Revisa que `CORE_API_URL` no tenga barra final extra rara (`https://api.com` sin `/` al final está bien).
- Comprueba que el API responda desde fuera: `curl https://api.tudominio.com/health` (o el endpoint de salud que tengáis).
- En Vercel → **Deployments → Functions / Logs**, busca `502` o `No se pudo conectar con el core`.

---

## Si ves 404 NOT_FOUND (pero el build lista `/login`)

**No es pnpm.** Si en los logs aparece `next build` con rutas (`/login`, `/candidatos`, …), la compilación está bien. El 404 viene del **edge de Vercel**, no de Next.

### A) Dominio `https://ups-control-dashboard.vercel.app`

Ese hostname **global** a veces **no enruta** al deployment del team aunque aparezca como alias en el panel. En la práctica responde `X-Vercel-Error: NOT_FOUND` sin servir la app.

**Usar la URL del team (la que sí enruta):**

`https://ups-control-dashboard-ups-team1.vercel.app`

Alternativas: dominio propio en **Settings → Domains**, o renombrar el proyecto en Vercel para obtener otro `*.vercel.app` libre.

### B) Protección de deployments (Vercel Authentication)

Si la URL correcta redirige a `vercel.com/sso-api` o pide login de **Vercel**, no es el panel: es **Deployment Protection** del team.

**Project → Settings → Deployment Protection** → desactivar protección en **Production** (panel operativo debe ser público; la auth es la del core vía cookie JWT).

El repo incluye `vercel.json` con `"framework": "nextjs"` para que Git no trate el proyecto como **Other** + output `.` (configuración que no corresponde a App Router).

---

## Dominio propio (opcional)

**Project Settings → Domains** → añade `panel.tudominio.com` y configura el CNAME que indique Vercel.

---

## Resumen de arquitectura

```
Usuario → https://panel.vercel.app (Next.js)
              ↓ server-side fetch
         https://api.tudominio.com (FastAPI en AWS)
              ↓
         Postgres / Redis / workers
```

Cookies de sesión: dominio Vercel · JWT emitido por el core · `secure: true` en producción.
