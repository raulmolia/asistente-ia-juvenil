# Guía de Deployment

## Estructura de archivos en producción

### Frontend (Next.js standalone)
PM2 ejecuta el frontend desde: `./frontend/.next/standalone`

**Archivos críticos requeridos:**
```
frontend/.next/standalone/
├── .next/
│   ├── static/          ← CRÍTICO: chunks JS, CSS, fuentes
│   ├── server/          ← Código del servidor Next.js
│   └── [manifests]      ← Configuración de build
├── public/              ← CRÍTICO: favicon, imágenes públicas
├── node_modules/        ← Dependencias necesarias
├── package.json
└── server.js           ← Entry point de PM2
```

## Proceso de deployment automático

### Script: `./scripts/deploy.sh`

```bash
./scripts/deploy.sh
```

**Pasos que ejecuta:**
1. `git pull --rebase` - Actualiza código
2. `npm install` - Backend y frontend
3. `prisma migrate deploy` - Migraciones DB (si hay pendientes)
4. `npm run build --prefix frontend` - Compila frontend
5. **Copia archivos estáticos** (paso crítico):
   - `frontend/.next/static` → `frontend/.next/standalone/.next/`
   - `frontend/public` → `frontend/.next/standalone/`
6. `npx pm2 start ecosystem.config.js --update-env` - Reinicia servicios
7. `npx pm2 save` - Guarda configuración PM2

## Deployment manual (si es necesario)

### 1. Build del frontend
```bash
cd /var/www/vhosts/ia.rpj.es/httpdocs/frontend
npm run build
```

### 2. Copiar archivos estáticos (CRÍTICO)
```bash
# Desde el directorio frontend/
rm -rf .next/standalone/.next/static .next/standalone/public
cp -R .next/static .next/standalone/.next/
cp -R public .next/standalone/
```

### 3. Reiniciar servicios
```bash
cd /var/www/vhosts/ia.rpj.es/httpdocs
npx pm2 restart rpjia-frontend
# O para reiniciar todo:
npx pm2 restart all
```

## Verificación post-deployment

### 1. Verificar que los servicios están corriendo
```bash
npx pm2 status
```

Debe mostrar:
- ✅ rpjia-frontend (port 3000) - online
- ✅ rpjia-backend (port 3001) - online
- ✅ rpjia-chromadb (port 8000) - online

### 2. Verificar archivos estáticos
```bash
ls -la frontend/.next/standalone/.next/static
ls -la frontend/.next/standalone/public
```

Ambos directorios deben existir y contener archivos.

### 3. Verificar logs si hay problemas
```bash
npx pm2 logs rpjia-frontend --lines 50
```

## Problemas comunes

### Error 404 en archivos /_next/static/*

**Síntoma:** En la consola del navegador aparecen errores como:
```
Failed to load resource: 404 (Not Found)
/_next/static/chunks/main-app-xxx.js
/_next/static/chunks/xxx.css
```

**Causa:** Los archivos estáticos no se copiaron a `frontend/.next/standalone/.next/static`

**Solución:**
```bash
cd /var/www/vhosts/ia.rpj.es/httpdocs/frontend
cp -R .next/static .next/standalone/.next/
cp -R public .next/standalone/
npx pm2 restart rpjia-frontend
```

### Aplicación se queda en "Preparando tu espacio de trabajo..."

**Causas posibles:**
1. Error en el código del frontend (revisar logs)
2. Archivos estáticos no disponibles (ver arriba)
3. Problema de autenticación/permisos

**Diagnóstico:**
```bash
# Ver logs del frontend
npx pm2 logs rpjia-frontend --lines 50

# Ver errores de compilación
cd frontend && npm run build
```

### PM2 no inicia el frontend

**Verificar configuración:**
```bash
npx pm2 describe rpjia-frontend
```

Debe mostrar:
- **cwd**: `/var/www/vhosts/ia.rpj.es/httpdocs/frontend/.next/standalone`
- **script**: `node`
- **args**: `server.js`

## Configuración PM2

Ver: `./ecosystem.config.js`

```javascript
{
  name: "rpjia-frontend",
  cwd: "./frontend/.next/standalone",
  script: "node",
  args: "server.js",
  env: {
    NODE_ENV: "production",
    PORT: "3000"
  }
}
```

## Notas importantes

1. **NUNCA** ejecutar `npm run build` directamente en producción sin copiar los archivos estáticos después
2. **SIEMPRE** usar el script `./scripts/deploy.sh` para deployments completos
3. Los archivos en `.next/static/` cambian con cada build (contienen hashes únicos)
4. El navegador cachea estos archivos, puede ser necesario Ctrl+F5 para ver cambios
5. PM2 debe apuntar a `./frontend/.next/standalone`, no a otros directorios

## Estructura de directorios relevante

```
/var/www/vhosts/ia.rpj.es/httpdocs/
├── frontend/
│   ├── .next/
│   │   ├── standalone/     ← PM2 corre desde aquí
│   │   │   ├── .next/
│   │   │   │   └── static/ ← Debe copiarse aquí
│   │   │   ├── public/     ← Debe copiarse aquí
│   │   │   └── server.js
│   │   └── static/         ← Origen de archivos estáticos
│   ├── public/             ← Origen de archivos públicos
│   └── src/
├── backend/
├── scripts/
│   └── deploy.sh          ← Script principal de deployment
└── ecosystem.config.js    ← Configuración PM2
```
