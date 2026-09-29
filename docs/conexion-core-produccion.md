# Conectar el panel (Vercel) con el core en producción (AWS)

**Si en el login ves esto:**

> No se pudo conectar con el core en http://localhost:8090. Verifica que este corriendo.

el deployment de Vercel **no tiene configurada `CORE_API_URL`** y el código usa su
valor por defecto (`src/lib/api.ts`). Esta guía lo resuelve.

---

## El dato que importa

| Variable | Valor en producción |
|---|---|
| `CORE_API_URL` | **`https://api.referidosops.com`** |

Tres reglas sobre ese valor:

1. **Sin barra al final.** El código arma `${CORE_API_URL}/api/...`: con
   `https://api.referidosops.com/` queda `//api/...` y el core responde **404**.
2. **Sin `NEXT_PUBLIC_`.** La usa solo el servidor de Next (Server Components,
   Server Actions y el route handler `/api/events`). Nunca llega al navegador.
3. **Con `https://`.** El core solo atiende por HTTPS (certificado de Let's Encrypt).

`CORE_API_KEY`, que figura en `.env.example`, **no la usa el código**: no hace falta cargarla.

---

## Configurarla en Vercel

1. Proyecto `ups-control-dashboard` → **Settings → Environment Variables**.
2. Agregar:

   | Key | Value | Environments |
   |---|---|---|
   | `CORE_API_URL` | `https://api.referidosops.com` | ✅ Production · ✅ Preview · ✅ Development |

   **Marcá también Preview.** Cada push genera una URL propia
   (`ups-control-dashboard-<hash>-ups-team1.vercel.app`), y si la variable está solo en
   Production, esas URLs siguen apuntando a `localhost`.

3. **Redeploy obligatorio.** Vercel fija las variables al crear cada deployment: cambiar
   la variable no afecta a los que ya existen.
   **Deployments** → último deployment → **⋯ → Redeploy** (sin cache de build).

### Por CLI (alternativa)

```powershell
cd "...\ups-control-dashboard"
vercel env add CORE_API_URL production    # pegar: https://api.referidosops.com
vercel env add CORE_API_URL preview
vercel --prod
```

Al pegar el valor, cuidado con que no se cuele un salto de línea o un espacio.

---

## Verificar

### 1. El core responde desde internet

Los servidores de Vercel llegan al core igual que cualquier cliente de internet:

```powershell
curl https://api.referidosops.com/api/health
# {"status":"ok"}
```

Si esto falla, el problema está en el core (AWS), no en Vercel. Ver
`ups-core-backend/docs/despliegue-aws.md`.

### 2. El panel

1. Abrir la URL del deployment nuevo.
2. Iniciar sesión.
3. Revisar Home, Candidatos y la ficha de un candidato.
4. En la ficha, mandar un mensaje al bot: la conversación debería actualizarse sola
   (SSE vía `/api/events`).

---

## Cómo se conectan

```
Navegador ──HTTPS──► Vercel (Next.js)                    cookie httpOnly `ups_session`
                        │  Server Components / Actions   (en el dominio de Vercel)
                        │  /api/events (proxy SSE)
                        │
                        │  Authorization: Bearer <JWT>
                        ▼
                     https://api.referidosops.com         ← CORE_API_URL
                        │  Caddy (TLS) → FastAPI
                        ▼
                     RDS Postgres · Redis · workers por cliente
```

- **El navegador nunca llama al core.** Todas las llamadas salen del servidor de Next
  con el JWT de la cookie. Por eso **CORS no interviene**: la lista `API_ALLOWED_ORIGINS`
  del core no bloquea al panel aunque la URL de Vercel no figure ahí.
- **El JWT lo emite el core** con su `JWT_SECRET` de producción, que es distinto del de
  desarrollo. Una sesión iniciada contra el core local no sirve en producción: hay que
  volver a iniciar sesión.
- **Los usuarios están en RDS**, migrados desde la base local.

### Endpoints que usa el panel

Todos existen en la versión desplegada (verificado contra `/openapi.json` del core):

| Área | Endpoints |
|---|---|
| Sesión | `POST /api/auth/login` · `GET /api/me` · `/api/auth/impersonate/targets` · `/api/auth/impersonate/stop` · `/api/admin/users/{id}/impersonate` |
| Panel | `GET /api/metrics` · `GET /api/candidates` · `GET /api/candidates/{id}` · `POST /api/candidates/{id}/confirm-referral` |
| Reglas de mejora | `/api/candidates/{id}/improvements` · `/api/candidates/{id}/improvements/{case_id}` |
| Tiempo real | `GET /api/events/stream` (SSE, proxificado por `/api/events`) |
| Administración | `/api/admin/tenants` · `/api/admin/tenants/{id}` · `/api/admin/users` · `/api/admin/users/{id}/tenants` |

Si el front agrega un endpoint nuevo, **primero hay que desplegar el core** (`imagen` +
`app` en `ups-core-backend/infra/desplegar.ps1`). Si no, el panel recibe 404.

### SSE en Vercel

`/api/events` mantiene abierta una conexión con el core. Vercel corta las funciones al
llegar a su duración máxima; cuando eso pasa, `EventSource` se reconecta solo. Es
esperable ver reconexiones periódicas en los logs de Vercel: no es un error.

---

## Dominio propio: `panel.referidosops.com`

`referidosops.com` está en Route 53 (cuenta AWS del core). El core ya acepta
`https://panel.referidosops.com` como origen.

1. Vercel → **Settings → Domains** → agregar `panel.referidosops.com`.
2. Vercel muestra el registro DNS a crear, normalmente un **CNAME** hacia
   `cname.vercel-dns.com` (usá el valor exacto que muestre Vercel).
3. Crearlo en Route 53, zona `referidosops.com`:

   ```powershell
   $cambio = '{"Changes":[{"Action":"UPSERT","ResourceRecordSet":{"Name":"panel.referidosops.com","Type":"CNAME","TTL":300,"ResourceRecords":[{"Value":"cname.vercel-dns.com"}]}}]}'
   Set-Content -Path "$env:TEMP\panel-dns.json" -Value $cambio -Encoding ascii
   aws route53 change-resource-record-sets --hosted-zone-id Z04493491HRQ7P84LKEE0 `
     --change-batch "file://$env:TEMP\panel-dns.json" --profile ups
   ```

4. Esperar a que Vercel marque el dominio como **Valid** (emite el certificado solo).

**No tocar el registro `api.referidosops.com`:** lo administra CloudFormation, y un
cambio manual se pierde en el próximo despliegue de la infraestructura.

---

## Problemas frecuentes

| Síntoma | Causa | Solución |
|---|---|---|
| «No se pudo conectar con el core en **http://localhost:8090**» | `CORE_API_URL` no está en ese deployment | Cargarla (incluido Preview) y hacer **Redeploy** |
| «No se pudo conectar con el core en **https://api.referidosops.com**» | El core no responde | `curl .../api/health`; si falla, revisar AWS |
| Todo da 404, incluso el login | `CORE_API_URL` con barra al final | Quitar la `/` final y redeploy |
| «Tu sesion vencio.» con la contraseña mal escrita | Bug conocido del front: todo 401 se muestra como sesión vencida | Revisar la contraseña; ver `ups-core-backend/docs/frontend.md` |
| Una sección da 404 y el resto anda | El front usa un endpoint que el core desplegado no tiene | Desplegar el core primero |
| Funciona en la URL de producción y no en una de preview | Variable cargada solo en Production | Marcar Preview y redeploy |
| La ficha no se actualiza sola | SSE cortado por algún proxy intermedio | Recargar; revisar logs de `/api/events` en Vercel |

---

## Referencias

- Core en AWS (arquitectura, despliegue, logs, alarmas): `ups-core-backend/docs/despliegue-aws.md`
- Proyecto en Vercel (Git, plan Hobby, 404 de Vercel): [deploy-vercel.md](deploy-vercel.md)
