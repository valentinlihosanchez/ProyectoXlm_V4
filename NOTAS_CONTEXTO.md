# Contexto del Proyecto — ProyectoXlm_V4

## Estado actual
- App web monolítica: React 18 CDN + Babel, sin framework, sin build step
- Archivo principal: `index.html` (producción) y `index_copia.html` (desarrollo activo)
- Almacenamiento hoy: localStorage (`sat-cfdi-v7` para config, `sat-contribs-v1` para contribuyentes)
- NO hay backend implementado aún
- NO hay login funcional aún

## Qué hace la app
Herramienta web para contadores mexicanos. Procesa CFDIs XML del SAT mexicano (CFDI 3.3 y 4.0):
- Lee archivos XML, extrae datos fiscales (emisor, receptor, impuestos, conceptos)
- Clasifica automáticamente Ingresos/Egresos por RFC
- Exporta a Excel (.xlsx con estilos) y PDF
- Gestión de contribuyentes con tarjetas y detalle
- Sistema de despachos contables (multi-usuario, arquitectura preparada pero no conectada a backend)

## Usuarios objetivo
Contadores mexicanos independientes y en despachos contables. Cualquier contador puede crear un Despacho y convertirse en administrador. Dentro del despacho todos los miembros comparten contribuyentes, XMLs y registros.

---

## Arquitectura backend pendiente de implementar

### Stack decidido
- **Frontend:** `index.html` estático (React CDN, sin cambios estructurales)
- **Backend:** Vercel Serverless Functions (carpeta `/api/`)
- **Base de datos:** Neon.tech (PostgreSQL gratis, integra con Vercel)
- **Auth:** JWT (tokens, sin sesiones de servidor)
- **Hosting:** Vercel (subdominio gratis, ej. `cfdi-app.vercel.app`)
- **No hay dominio propio pagado**

### Estructura de archivos a crear
```
ProyectoXlm_V4/
├── public/
│   └── index.html              <- app actual (mover aquí)
├── api/
│   ├── auth/
│   │   ├── login.js
│   │   ├── register.js
│   │   └── me.js
│   ├── contribuyentes/
│   │   ├── index.js            <- GET list / POST create
│   │   └── [id].js             <- GET one / PUT / DELETE
│   ├── despachos/
│   │   ├── index.js
│   │   └── members.js
│   └── lista69b/
│       ├── sync.js             <- descarga SAT + actualiza DB
│       ├── status.js           <- fecha última sync
│       └── check.js            <- verifica RFC específico
├── lib/
│   ├── db.js                   <- cliente PostgreSQL (Neon)
│   ├── auth.js                 <- helpers JWT
│   └── parse-sat.js            <- parser de Excel del SAT
├── package.json
└── vercel.json                 <- rutas + cron job
```

### Tablas PostgreSQL a crear
```sql
users              -> id, email, password_hash, nombre
despachos          -> id, nombre, admin_id
despacho_members   -> despacho_id, user_id, role
contribuyentes     -> id, rfc, nombre, datos (JSONB), user_id, despacho_id
lista_69b          -> rfc (PK), tipo, situacion
lista_69b_sync     -> id, synced_at, records_count, synced_by
```

---

## Funcionalidad Lista 69B (pendiente)

### Qué es
Las listas 69B del SAT identifican EFOs (Empresas Facturadoras de Operaciones Simuladas) y EDOs (Empresas que Deducen Operaciones Simuladas). Son críticas para compliance fiscal.

### Fuente oficial
https://www.sat.gob.mx/minisitio/DatosAbiertos/contribuyentes_publicados.html
- Formato: Excel (.xlsx)
- Aprox. 15 listas distintas
- Dato a extraer por lista: RFC (campo clave), tipo, situación

### Flujo de sincronización
1. Cron automático cada 7 días (Vercel cron, domingo 00:00)
2. Descarga los Excel del SAT desde la URL oficial
3. Parsea con librería `xlsx` (npm) -> extrae RFC + tipo + situación
4. Upsert masivo en tabla `lista_69b`
5. Registra en `lista_69b_sync` con timestamp y usuario que disparó el sync
6. Frontend muestra: "Ultima actualizacion: hace 3 dias" (calculado del último registro en lista_69b_sync)
7. Botón "Actualizar ahora" en la UI llama manualmente a `/api/lista69b/sync`
8. Como el sync se guarda en DB, cuando un usuario actualiza, TODOS los usuarios ven la misma fecha actualizada

### UX de alerta de riesgo
- Al ver un contribuyente guardado, consultar `/api/lista69b/check?rfc=XXX`
- Si el RFC está en lista 69B: mostrar badge/alerta visible (no modal agresivo)
- Mostrar tipo (EFO/EDOS) y fecha de última sincronización
- Solo se guarda el RFC en DB (no campos adicionales por ahora)

---

## Orden de implementación acordado
1. ✅ `package.json` + `vercel.json` + estructura de carpetas
2. ✅ `lib/db.js` (conexión Neon PostgreSQL)
3. ✅ Schema SQL (crear tablas)
4. ✅ `lib/auth.js` + endpoints login/register
5. ✅ Endpoints de contribuyentes
6. ✅ `lib/parse-sat.js` + endpoint sync lista 69B (completado 2026-05-27)
7. ✅ `api/lista69b/check.js` + alerta en frontend (check.js ✅, alerta frontend pendiente)
8. ⏳ Despachos multi-usuario (carpeta existe, código pendiente)

## Cambios en esta sesión (2026-05-27)
- **✅ Creado `lib/parse-sat.js`**: Parser que descarga Excel del SAT, extrae RFC/tipo/situación de listas EFO y EDOS
- **✅ Implementado `api/lista69b/sync.js`**: Endpoint que sincroniza datos, hace upsert masivo, registra en `lista_69b_sync`
- **✅ Creado `.env.local`**: Template de variables de entorno necesarias
- **✅ Actualizado `.gitignore`**: Excluir .env, node_modules, etc.
- **Git**: Ya existe repo GitHub conectado (`origin/master`)

## Próximos pasos
1. Configurar variables de entorno en máquina local (llenar `.env.local`)
2. Instalar dependencias: `npm install`
3. Conectar Neon.tech (compartir CONNECTION STRING en .env.local)
4. Probar localmente: `vercel dev` → GET `/api/health` (verificar DB conectada)
5. Probar sync: POST `/api/lista69b/sync` (sin token, permite cron automático)
6. Verificar tabla `lista_69b` poblada en Neon
7. Push a GitHub: `git add . && git commit -m "feat: implement lista 69B sync"` 
8. Vercel: conectar repo y configurar vars de entorno (DATABASE_URL, JWT_SECRET)

---

## Archivos clave del frontend
- `index_copia.html`: archivo activo de desarrollo (NO tocar `index.html`)
- localStorage `sat-cfdi-v7`: configuración y filtros
- localStorage `sat-contribs-v1`: contribuyentes guardados (migrar a DB eventualmente)
- `PRODUCT.md`: definicion de producto, usuarios, principios de diseño

## Notas de desarrollo frontend (sesiones anteriores)
- React 18 CDN + Babel, JSX en script tags, sin build
- `filteredRows` computed via useMemo desde `allRows = toRows(results, xf.miRfc)`
- Cada row tiene `r.archivo` (nombre XML) como identificador
- `files` state: `{id, file, name, status, carpeta}`
- `deselectedXmls`: Set de nombres de archivo excluidos del Excel
- `mostFreqContrib`: RFC mas frecuente en resultados procesados
- `isActive = busy || files.some(f => f.status === 'processing')`
- Sidebar usa `React.createElement` (no JSX)
- `contribView`: null = mostrar ContribsHub, string RFC = mostrar detalle contribuyente
