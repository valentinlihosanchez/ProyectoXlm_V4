# SAT CFDI Processor - ProyectoXlm_V4

Herramienta web para contadores mexicanos que procesa CFDIs XML del SAT. Lee archivos XML, clasifica ingresos/egresos por RFC, exporta a Excel/PDF y gestiona despachos contables multi-usuario.

## Stack

- **Frontend:** React 18 (CDN) + Babel (sin build step)
- **Backend:** Vercel Serverless Functions + PostgreSQL (Neon.tech)
- **Auth:** JWT (sin sesiones de servidor)
- **Hosting:** Vercel (subdominio gratis)

## Estado actual

**Vercel:** Configurado y desplegado en https://proyectoxlm-v4.vercel.app  
**Base de datos:** Neon PostgreSQL conectada  
**Variables de entorno:** DATABASE_URL y JWT_SECRET configuradas en Vercel

## Instalación y configuración

### 1. Requisitos previos

- Node.js 18+
- Cuenta en [Neon.tech](https://neon.tech) (PostgreSQL gratis)
- Cuenta en [Vercel](https://vercel.com)
- Repositorio GitHub conectado

### 2. Configuración local

```bash
# Instalar dependencias
npm install

# Crear/actualizar .env.local con:
# - DATABASE_URL (de Neon)
# - JWT_SECRET (generar aleatorio)

# Copiar valores en .env.local (ver .env para referencia)
```

### 3. Base de datos

```bash
# Ejecutar schema.sql en Neon SQL Editor:
# https://console.neon.tech → SQL Editor

# Las tablas se crearán automáticamente:
# - users, despachos, despacho_members, contribuyentes
# - lista_69b, lista_69b_sync
```

### 4. Desarrollo local

```bash
# Iniciar servidor Vercel en modo local
npm run dev

# La app estará en http://localhost:3000
```

## API Endpoints

### Auth
- `POST /api/auth/register` — crear usuario
- `POST /api/auth/login` — autenticar y retornar JWT
- `GET /api/auth/me` — datos del usuario autenticado

### Contribuyentes
- `GET /api/contribuyentes` — listar contribuyentes del usuario
- `POST /api/contribuyentes` — crear contribuyente
- `GET /api/contribuyentes/[id]` — obtener contribuyente específico
- `PUT /api/contribuyentes/[id]` — actualizar
- `DELETE /api/contribuyentes/[id]` — eliminar

### Lista 69B (SAT)
- `GET /api/lista69b/status` — última fecha de sincronización
- `POST/GET /api/lista69b/sync` — descargar y sincronizar listas del SAT (cron automático cada domingo)
- `GET /api/lista69b/check?rfc=XXX` — verificar si RFC está en lista 69B

### Sistema
- `GET /api/health` — verificar conexión a DB

## Flujo de Lista 69B

1. **Sincronización automática** (cron cada domingo 00:00 UTC)
2. **Sincronización manual** (POST `/api/lista69b/sync` con token de usuario)
3. **Verificación** (GET `/api/lista69b/check?rfc=RFC`) retorna:
   ```json
   {
     "found": true,
     "data": { "rfc": "ABC123...", "tipo": "EFO", "situacion": null },
     "lastSync": "2026-05-27T00:00:00Z"
   }
   ```

## Deploy en Vercel

1. **Conectar repositorio GitHub**
   - En Vercel.com → Importar repo

2. **Configurar variables de entorno**
   - `DATABASE_URL` — connection string de Neon
   - `JWT_SECRET` — clave fuerte aleatoria

3. **Deploy automático**
   - Cada push a `master` deploya automáticamente

## Estructura de archivos

```
ProyectoXlm_V4/
├── public/
│   └── index.html                 # App React estática
├── api/
│   ├── auth/
│   │   ├── login.js              # POST autenticación
│   │   ├── register.js           # POST crear usuario
│   │   └── me.js                 # GET usuario autenticado
│   ├── contribuyentes/
│   │   ├── index.js              # GET list / POST create
│   │   └── [id].js               # GET one / PUT / DELETE
│   ├── lista69b/
│   │   ├── sync.js               # POST/GET sincronizar
│   │   ├── check.js              # GET verificar RFC
│   │   └── status.js             # GET última actualización
│   ├── despachos/                # (pendiente: rutas multi-usuario)
│   ├── health.js                 # GET health check
│   └── ...
├── lib/
│   ├── db.js                     # Cliente PostgreSQL
│   ├── auth.js                   # Helpers JWT
│   └── parse-sat.js              # Parser de Excel del SAT
├── index_copia.html              # Desarrollo frontend
├── package.json
├── vercel.json                   # Config Vercel + cron
├── schema.sql                    # DDL tablas
├── .env                          # Variables de entorno (SECRETO)
└── .gitignore
```

## Desarrollo

### Frontend
- Archivo principal: `index_copia.html`
- React CDN + Babel (sin build step)
- localStorage: `sat-cfdi-v7` (config), `sat-contribs-v1` (contribuyentes)

### Backend
- Node.js + Express-like (Vercel functions)
- JWT en header: `Authorization: Bearer <token>`
- Respuestas JSON (éxito y errores)

## Notas de seguridad

- **JWT_SECRET**: Generar cadena aleatoria fuerte, nunca incluir en git
- **DATABASE_URL**: Incluir en variables de entorno Vercel, NO en git
- **CORS**: Actualmente abierto (frontend en mismo dominio)
- **Validación**: Todo input validado en backend

## Próximos pasos

1. ✅ Parser lista 69B completado
2. ✅ Sync endpoint implementado
3. ⏳ Alerta visual en frontend (badge riesgo RFC)
4. ⏳ API despachos multi-usuario
5. ⏳ Integración upload XML en frontend

## Recursos

- [SAT Datos Abiertos](https://www.sat.gob.mx/minisitio/DatosAbiertos/contribuyentes_publicados.html)
- [Documentación CFDI](https://www.sat.gob.mx/contabilidad/c_cfdi)
- [Neon PostgreSQL](https://neon.tech/docs)
- [Vercel Functions](https://vercel.com/docs/functions/serverless-functions)
Cambio cosmético
