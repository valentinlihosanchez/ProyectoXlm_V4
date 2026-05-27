# Configuración Vercel - Lista 69B Sync

Guía paso a paso para conectar el proyecto a Vercel y habilitar la sincronización automática de listas 69B.

## Estado actual

✅ **Completado:**
- Parser Excel (`lib/parse-sat.js`) — descarga y parsea listas SAT
- Endpoint sync (`api/lista69b/sync.js`) — inserta datos, registra histórico
- Base de datos Neon configurada y poblada (tablas creadas)
- Código pusheado a GitHub (`valentinlihosanchez/ProyectoXlm_V4`)

⏳ **Pendiente:**
- Configurar Vercel (variables de entorno + deploy)
- Probar sync localmente y en producción

---

## Paso 1: Verificar conexión local a DB

Antes de deployar a Vercel, probar que todo funciona en tu máquina:

```bash
# En el proyecto
npm run dev

# En otra terminal, probar health check
curl http://localhost:3000/api/health

# Respuesta esperada:
# { "status": "ok", "db": "connected" }
```

Si falla, verificar `.env` tiene `DATABASE_URL` correcta de Neon.

---

## Paso 2: Probar sincronización manual

```bash
# Con servidor local corriendo, sincronizar listas SAT
curl -X POST http://localhost:3000/api/lista69b/sync

# Respuesta esperada (después de ~30-60 segundos):
# {
#   "success": true,
#   "message": "Sincronización completada: XXXX registros",
#   "sync": { "id": 1, "synced_at": "...", "records_count": 5000, ... }
# }
```

**Nota:** La descarga de Excel del SAT toma tiempo (10-30 segundos por lista).

---

## Paso 3: Verificar tabla poblada en Neon

En Neon Dashboard → SQL Editor:

```sql
-- Ver cantidad de registros sincronizados
SELECT COUNT(*) as total FROM lista_69b;

-- Ver últimos sincronizados
SELECT synced_at, records_count FROM lista_69b_sync ORDER BY synced_at DESC LIMIT 5;

-- Verificar un RFC específico (cambiar XXX por RFC real)
SELECT * FROM lista_69b WHERE rfc = 'XXX123XXX';
```

---

## Paso 4: Configurar Vercel

### Opción A: CLI (línea de comandos)

```bash
# Instalar Vercel CLI (si no tienes)
npm install -g vercel

# Conectar proyecto
vercel link

# (Seleccionar: crear nuevo proyecto o vincular existente)

# Configurar variables de entorno
vercel env add DATABASE_URL
# Pegar: postgresql://neondb_owner:npg_...@ep-....neon.tech/neondb?sslmode=require

vercel env add JWT_SECRET
# Pegar: una cadena aleatoria fuerte (generar con: openssl rand -hex 32)
```

### Opción B: Dashboard Vercel (web)

1. Ir a https://vercel.com/dashboard
2. Seleccionar proyecto `ProyectoXlm_V4`
3. Settings → Environment Variables
4. Agregar:
   - **DATABASE_URL** = (de Neon)
   - **JWT_SECRET** = (cadena aleatoria)

---

## Paso 5: Deploy a Vercel

```bash
# Opción 1: Deploy automático (recomendado)
# Vercel despliega automáticamente cuando haces push a master

git push origin master
# → Vercel inicia deploy automáticamente
# → Ver progreso en https://vercel.com/dashboard

# Opción 2: Deploy manual
vercel --prod
```

---

## Paso 6: Probar en producción

Una vez desplegado en Vercel:

```bash
# Reemplazar DOMINIO con tu URL de Vercel (ej. cfdi-app.vercel.app)
DOMINIO=tu-proyecto.vercel.app

# 1. Health check
curl https://$DOMINIO/api/health

# 2. Sincronización manual
curl -X POST https://$DOMINIO/api/lista69b/sync

# 3. Verificar último sync
curl https://$DOMINIO/api/lista69b/status

# 4. Buscar un RFC
curl "https://$DOMINIO/api/lista69b/check?rfc=ABC123XYZ"
```

---

## Paso 7: Habilitar cron automático

El cron está configurado en `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/lista69b/sync",
      "schedule": "0 0 * * 0"  // Cada domingo 00:00 UTC
    }
  ]
}
```

**Para activar:**
- El cron automático se habilita automáticamente al deployar en Vercel
- Vercel ejecutará `/api/lista69b/sync` cada domingo a las 00:00 UTC
- No requiere autenticación (permitido en sync.js)

---

## Troubleshooting

### Error: "DATABASE_URL no definida"
→ Verificar que en Vercel Dashboard → Settings → Environment Variables existe DATABASE_URL

### Error: "Connection refused" a Neon
→ Verificar que DATABASE_URL es correcta y que Neon está online
→ Copiar URL exacta de Neon Dashboard

### Error: "Conexión timeout"
→ Puede ser que Vercel necesita permitir conexión saliente a Neon
→ Normalmente Vercel funciona, pero contactar support si persiste

### Sync toma mucho tiempo
→ Normal: descarga 2-3 Excel del SAT (~15-30 MB cada uno)
→ Si falla, revisar logs en Vercel Dashboard → Deployments → Runtime Logs

---

## Checklist final

- [ ] `.env` tiene DATABASE_URL de Neon
- [ ] `npm run dev` → `/api/health` retorna `{ status: "ok", db: "connected" }`
- [ ] `npm run dev` → POST `/api/lista69b/sync` completa exitosamente
- [ ] Tabla `lista_69b` en Neon tiene registros (SELECT COUNT(*))
- [ ] GitHub tiene push con commit `feat: implement lista 69B`
- [ ] Vercel conectado al repo (auto-deploy en cada push)
- [ ] Variables de entorno en Vercel: DATABASE_URL, JWT_SECRET
- [ ] Deploy en Vercel exitoso
- [ ] Production `/api/health` funciona
- [ ] Production `/api/lista69b/status` muestra último sync

---

## URLs útiles

- GitHub: https://github.com/valentinlihosanchez/ProyectoXlm_V4
- Vercel Dashboard: https://vercel.com/dashboard
- Neon Console: https://console.neon.tech
- Documentación SAT: https://www.sat.gob.mx/minisitio/DatosAbiertos/

---

## Siguientes pasos después de Vercel

1. Integrar alerta visual en frontend (`index_copia.html`):
   - Al mostrar contribuyente, llamar a `/api/lista69b/check?rfc=XXX`
   - Mostrar badge "⚠️ RIESGO FISCAL" si está en lista 69B

2. Implementar API despachos multi-usuario:
   - `/api/despachos` (CRUD)
   - `/api/despachos/members` (agregar/quitar usuarios)

3. Migración de contribuyentes:
   - localStorage → Base de datos PostgreSQL
