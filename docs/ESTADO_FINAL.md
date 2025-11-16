# 🚀 Estado actual del proyecto (16 nov 2025)

## ✅ COMPLETADO CON ÉXITO

### Documentación Actualizada
- ✅ `.github/copilot-instructions.md` - Stack: MariaDB + ChromaDB
- ✅ `.github/registro.md` - Fase 2 documentada completamente
- ✅ `GITHUB_SETUP.md` - Instrucciones para configurar remoto
- ✅ `RESUMEN_SESION.md` - Resumen completo de la sesión
- ✅ `README.md` - Información del proyecto
- ✅ `EMAIL_TROUBLESHOOTING.md` - Guía completa de configuración SMTP/DNS

### Código y Configuración
- ✅ Backend operativo en puerto 3001
- ✅ Frontend operativo en puerto 3000
- ✅ Base de datos MariaDB `rpjia` con 8 tablas (añadido campo `debeCambiarPassword`)
- ✅ Servicio ChromaDB preparado
- ✅ API con endpoints de health check y test
- ✅ Orquestación con PM2 (`ecosystem.config.js`) para backend, frontend y ChromaDB
- ✅ Servicio de email configurado con Nodemailer (SMTP port 465, SSL)
- ✅ Variables de entorno cargadas con ruta absoluta en index.js

### UI/UX Mejorado (15 nov 2025)
- ✅ **Tipografía moderna**: Fuente Inter con pesos 300-700 (similar a Notion/ChatGPT)
- ✅ **Sidebar optimizado**: Ancho compacto w-80 (320px)
- ✅ **Límite de caracteres**: Títulos truncados a 25 caracteres
- ✅ **Botones de opciones**: Diseño compacto y visible en hover
- ✅ **Layout simplificado**: Estructura de una sola línea con justify-between
- ✅ **Renderizado markdown**: react-markdown para formato de mensajes del asistente
- ✅ **Respuestas completas**: Límite de tokens aumentado a 128,000
- ✅ **Scroll nativo**: Página de documentación usa scroll del navegador
- ✅ **Sistema de intenciones**: 5 categorías con prompts especializados y filtrado por tags
- ✅ **Modelo LLM**: Kimi-K2-Instruct-0905 (Moonshot AI) vía Chutes AI

### Gestión Documental Avanzada (15 nov 2025)
- ✅ **9 etiquetas disponibles**: Programaciones, Dinámicas, Celebraciones, Oraciones, Consulta, Pastoral Genérico, Revistas, Contenido Mixto, Otros
- ✅ **Búsqueda contextual**: Filtrado en tiempo real por título, nombre y descripción (sin acentos)
- ✅ **Filtro por etiquetas**: Selector múltiple con badges activos
- ✅ **Ordenamiento**: Por fecha de subida (ascendente/descendente)
- ✅ **Edición inline**: Modificar etiquetas de documentos con actualización en BD y ChromaDB
- ✅ **Eliminación segura**: Confirmación inline, elimina de BD, ChromaDB y sistema de archivos

### Descarga de Documentos (15 nov 2025)
- ✅ **Formato PDF**: Generación con jsPDF incluyendo logo RPJ (150px), parsing avanzado de markdown con agrupación de listas, limpieza de sintaxis markdown, renderizado de headers (16pt/14pt/12pt), listas con bullets/números, bloques de código con fondo gris y paginación automática
- ✅ **Formato Word**: Generación con HTML + Microsoft Office XML namespace, BOM UTF-8, logo RPJ embebido como base64 (150px), estilos en puntos (pt) para compatibilidad, encoding correcto de caracteres especiales (á, é, í, ó, ú, ñ, ¿, ¡)
- ✅ **UI de descarga**: Dropdown menu en mensajes del asistente con opciones PDF y Word
- ✅ **Nomenclatura**: Archivos nombrados como `respuesta-{messageId}.pdf` o `.doc`

### Interfaz y Navegación (15 nov 2025)
- ✅ **Badges de categorías coloreados**: Sistema de colores distintivos para cada categoría (Dinámicas, Celebraciones, Programaciones, Oraciones, Pastoral, Consulta, Otros) visibles tanto en modo oscuro como claro
- ✅ **Página "Acerca de"**: Nueva página informativa (`/acerca-de`) con logo RPJ centrado, diseño atractivo con degradados, títulos grandes y espaciado generoso, enlaces con iconos externos y efecto hover, renderizado markdown del contenido de `acercade.md`
- ✅ **Navegación mejorada**: Enlace "Acerca de" en header principal alineado a la izquierda, botón "Volver al chat" en páginas secundarias

### Sistema de Gestión de Usuarios con Emails (16 nov 2025)
- ✅ **Servicio de email**: Nodemailer 6.9.7 con SMTP (ia.rpj.es:465, SSL/TLS)
- ✅ **Generación de contraseñas**: Algoritmo seguro de 12 caracteres (uppercase, lowercase, números, símbolos)
- ✅ **Templates HTML premium**: Email de bienvenida con logo RPJ embebido (base64), diseño responsive, gradientes corporativos
- ✅ **Campo debeCambiarPassword**: Migración Prisma añadiendo Boolean default false
- ✅ **API endpoints nuevos**:
  - POST /api/password/change - Cambio de contraseña con validación
  - GET /api/password/must-change - Verificación de flag
  - POST /api/auth/users (modificado) - Auto-generación y envío de email
- ✅ **ChangePasswordModal**: Componente React bloqueante con validación en tiempo real, show/hide toggles, tips de seguridad
- ✅ **Admin UI mejorado**: Checkboxes para auto-generar contraseña y enviar email (defaults: true)
- ✅ **Auth context extendido**: Estado mustChangePassword y función clearPasswordChangeFlag
- ✅ **Flujo completo**: Creación → Email → Login → Modal obligatorio → Cambio → Acceso
- ✅ **SMTP configurado**: Puerto 465 con secure=true, autenticación exitosa
- ✅ **DKIM activado**: Firma de mensajes salientes habilitada en Plesk
- ⏳ **Pendiente DNS**: Registros MX necesarios para entrega de emails (en gestión externa)

### Restricciones Temáticas y Uso de RAG (16 nov 2025)
- ✅ **Restricción temática estricta**: El asistente SOLO responde preguntas sobre pastoral juvenil, religión católica y temas relacionados
- ✅ **Mensaje de rechazo amable**: Preguntas fuera de tema reciben respuesta educada explicando la especialización del asistente
- ✅ **Uso flexible de documentación RAG**: La documentación vectorial es prioritaria pero NO exclusiva
- ✅ **Conocimiento del modelo**: Si no hay suficiente documentación, el modelo puede usar su entrenamiento sobre pastoral y religión católica
- ✅ **Aplicado a todas las intenciones**: DINAMICA, CELEBRACION, PROGRAMACION, ORACION y OTROS incluyen ambas directrices
- ✅ **Prompts actualizados**: Sistema de prompts en `backend/src/config/chatPrompts.js` con secciones claras de restricción temática y uso de documentación

### Sistema de Fuentes Web (16 nov 2025)
- ✅ **Modelo FuenteWeb**: Tabla en base de datos con campos para URL, dominio, título, descripción, etiquetas, tipo de fuente, estado de procesamiento y contenido extraído
- ✅ **Tipos de fuente**: PAGINA (URL individual), DOMINIO (crawling completo), SITEMAP (procesamiento de XML sitemap)
- ✅ **Servicio de scraping**: `webScraperService.js` con cheerio para extracción de HTML, límites configurables (50 páginas máximo por dominio), timeout de 30 segundos, tamaño máximo 5MB
- ✅ **API REST completa**: Endpoints CRUD en `/api/fuentes-web` (GET etiquetas, GET listar, POST agregar, PATCH actualizar, DELETE eliminar, POST reprocesar)
- ✅ **Vectorización automática**: Contenido web se divide en chunks (1500 caracteres, overlap 200) y se indexa en ChromaDB colección `rpjia-fuentes-web`
- ✅ **Integración con chat**: Búsqueda paralela en documentos PDF y fuentes web, combinación por relevancia (distancia vectorial), contexto enriquecido con URLs de origen
- ✅ **Procesamiento en background**: Scraping y vectorización no bloquean la respuesta HTTP, actualización de estado en BD
- ✅ **Dependencia cheerio**: Versión 1.0.0-rc.12 instalada para parsing HTML avanzado
- ✅ **Variables de entorno**: WEB_SCRAPER_MAX_PAGES, WEB_SCRAPER_MAX_SIZE, WEB_SCRAPER_USER_AGENT, WEB_SCRAPER_TIMEOUT_MS, WEB_CHUNK_SIZE, WEB_CHUNK_OVERLAP, WEB_MAX_CHUNKS, CHROMA_COLLECTION_WEB

## Panorama general

- Plataforma conversacional operativa en producción (`https://ia.rpj.es`)
- Backend Express + Prisma conectado a MariaDB y ChromaDB con historial de conversaciones persistente
- Integración con Chutes AI (`POST /api/chat`) que incluye detección de intención, contexto documental dinámico y mensajes de fallback cuando la IA no responde
- Observabilidad reforzada con logs estructurados, métricas básicas de tokens/duración y reintentos configurables
- Suites de pruebas activas: Vitest (backend) y Vitest + Testing Library (frontend E2E)
- Despliegue orquestado con PM2 y script `scripts/deploy.sh` actualizado

## Hitos recientes

1. **API de chat completa**
   - Rutas REST (`GET /api/chat`, `GET /api/chat/:id`, `POST /api/chat`, `DELETE /api/chat/:id`)
   - Conversaciones ligadas al usuario con saneado de títulos y timestamps
   - Registro de metadatos (tokens, intentos, contexto documental utilizado)

2. **Prompts e intenciones centralizadas** en `backend/src/config/chatPrompts.js` (DINAMICA, ORACION, PROYECTO, GENERAL)

3. **Servicio LLM robusto** (`backend/src/services/llmService.js`) con AbortController, reintentos y gestión de errores

4. **Integración Chroma** mejorada (`backend/src/services/chromaService.js`) con fallback si el servicio no está disponible

5. **Experiencia de usuario afinada**: 
   - Tipografía Inter sans-serif moderna
   - Sidebar compacto con límite de 25 caracteres en títulos
   - Input con estilo corporativo
   - Eliminación de chats desde la interfaz
   - Feedback visual mejorado
   - **Renderizado markdown** en mensajes del asistente (negrita, listas, código)
   - **Respuestas completas** sin cortes (límite 4096 tokens)
   - **Scroll optimizado** en página de documentación

6. **Documentación y tareas** sincronizadas (`docs/task.md`, `.github/registro.md`)

7. **Sistema de gestión de usuarios con emails** (16 nov 2025):
   - Servicio completo de email con Nodemailer y templates HTML premium
   - Generación automática de contraseñas seguras
   - Campo debeCambiarPassword en base de datos
   - Modal de cambio obligatorio en primer login
   - Panel de administración con opciones de auto-generación
   - SMTP configurado y DKIM activado

## Stack actualizado

```
Backend   : Node.js 24, Express 4, Prisma 5, Vitest 1, Nodemailer 6.9.7
Frontend  : Next.js 14, React 18, Tailwind, Shadcn/ui, Vitest + Testing Library
Tipografía: Inter (Google Fonts) - Sans-serif moderna
Markdown  : react-markdown + remark-gfm para renderizado de contenido
Persistencia: MariaDB (prisma), ChromaDB (vectores persistidos en database/chroma)
Email     : SMTP ia.rpj.es:465 SSL, DKIM, templates HTML responsive
Infraestructura: PM2 (backend, frontend, chroma) + proxy Apache
IA        : Chutes AI (https://llm.chutes.ai/v1/chat/completions)
Modelo    : Kimi-K2-Instruct-0905 (Moonshot AI)
Max tokens: 128,000 (128K)
Intenciones: 5 categorías con prompts especializados y filtrado por tags ChromaDB
Etiquetas : 9 opciones para clasificación documental
```

## API pública (resumen)

| Método | Endpoint | Descripción |
| --- | --- | --- |
| GET | `/api/health` | Estado de servicios (MariaDB & Chroma) |
| GET | `/api/info` | Metadatos de la API y rutas disponibles |
| POST | `/api/test-db` | Inserción de prueba en MariaDB |
| POST | `/api/auth/login` | Autenticación (JWT) |
| GET | `/api/documentos` | Repositorio documental |
| POST | `/api/documentos` | Subida y vectorización de documentos |
| PATCH | `/api/documentos/:id` | Actualizar etiquetas de un documento |
| DELETE | `/api/documentos/:id` | Eliminar documento (BD, ChromaDB y archivo) |
| GET | `/api/documentos/etiquetas` | Obtener etiquetas disponibles |
| GET | `/api/chat` | Listado de conversaciones del usuario |
| GET | `/api/chat/:id` | Recuperar mensajes ordenados |
| POST | `/api/chat` | Enviar mensaje al asistente (Chutes AI) |

| DELETE | `/api/chat/:id` | Eliminar conversación + mensajes |├── Express.js 4.18.2

├── Prisma ORM 5.7.0

> Los prompts de sistema y palabras clave para detección de intención están documentados en `backend/src/config/chatPrompts.js`.├── ChromaDB 3.1.0

└── Middlewares: Helmet, CORS, Rate Limit

## Testing & QA```

- `npm run test --prefix backend`: 11 pruebas (prompts, servicio LLM, Chroma fallback) usando Vitest.

- `npm run test:e2e --prefix frontend`: flujo de login validado con Vitest + Testing Library (jsdom).### Frontend

- Cobertura manual: eliminación de conversaciones, fallback IA y logs verificados en PM2.```

Next.js 14

## Despliegue├── TypeScript

1. `npm run build --prefix frontend`├── Tailwind CSS

2. Copia de artefactos a `frontend/.next/standalone` (automático en `scripts/deploy.sh`).├── Shadcn/ui

3. `scripts/deploy.sh` ejecuta pull, dependencias, migraciones Prisma, build y `pm2 start --update-env`.└── App Router

4. Reinicios puntuales: `pm2 restart rpjia-backend` / `pm2 restart rpjia-frontend`.```



## Métricas### Bases de Datos

- Commits totales: **26** (`HEAD: 8641c2a feat: enhance chat workflows and testing`).```

- Últimos relevantes: despliegue dominio (`e4047cb`), panel usuarios (`3aa0db9`), modo oscuro (`bd25a9e`).MariaDB

- Cambios recientes: 28 archivos, 7.2k líneas añadidas, 1.4k eliminadas.├── Host: 127.0.0.1:3306

├── Database: rpjia

## Próximos pasos├── User: sa

1. Extender pruebas E2E para cubrir el ciclo completo del chat y el módulo de documentación.└── Status: ✅ OPERATIVA

2. Añadir seeds para disponer de conversaciones y documentos de ejemplo en entornos nuevos.

3. Exponer métricas en dashboards (Prometheus/Grafana) reutilizando los logs estructurados.ChromaDB

4. Evaluar respuestas en streaming desde Chutes para mejorar la experiencia.├── Modo: Desarrollo con servidor uvicorn dedicado

└── Status: ✅ Operativo via `python3 backend/scripts/run_chromadb.py`

## Referencias rápidas```

- Prompts e intenciones: `backend/src/config/chatPrompts.js`

- Servicio LLM con reintentos: `backend/src/services/llmService.js`---

- Servicio vectorial: `backend/src/services/chromaService.js`

- Rutas API: `backend/src/routes/*.js`## 🚀 SIGUIENTE ACCIÓN REQUERIDA

- Pruebas: `backend/tests/*.test.js`, `frontend/tests/auth-login.e2e.test.tsx`

- Deploy: `scripts/deploy.sh`, `ecosystem.config.js`### ⚠️ CONFIGURAR REPOSITORIO REMOTO EN GITHUB



**Estado**: ✅ Plataforma funcionando en producción con soporte de IA, historial persistente y observabilidad básica.**Archivo de instrucciones**: `GITHUB_SETUP.md`


**Pasos rápidos**:
1. Crear repositorio en GitHub
2. Ejecutar:
   ```bash
   cd /var/www/vhosts/practical-chatelet.217-154-99-32.plesk.page/httpdocs
   git remote add origin https://github.com/<usuario>/<repo>.git
   git push -u origin main
   ```

**Una vez hecho el push**:
- ✅ Código respaldado en GitHub
- ✅ Listo para colaboración
- ✅ Historial completo sincronizado

---

## 📈 MÉTRICAS DEL PROYECTO

### Commits
- **Total**: 5 commits
- **Archivos modificados**: 40+ archivos
- **Líneas añadidas**: 1,800+ líneas
- **Líneas eliminadas**: 1,200+ líneas

### Estructura
```
httpdocs/
├── .github/          (Documentación)
├── .vscode/          (Configuración VS Code)
├── backend/          (API Node.js)
│   ├── src/
│   │   ├── index.js
│   │   ├── routes/
│   │   └── services/
│   ├── prisma/
│   │   ├── schema.prisma
│   │   └── seed.js
│   └── package.json
├── frontend/         (Next.js App)
│   ├── src/
│   │   ├── app/
│   │   ├── components/
│   │   └── lib/
│   └── package.json
├── database/
├── docs/
└── Archivos raíz (README, .gitignore, etc.)
```

### Tests Exitosos
- ✅ Prisma generate
- ✅ Prisma db push
- ✅ Conexión MariaDB
- ✅ Servidor backend iniciado
- ✅ Servidor frontend iniciado
- ✅ Endpoints API respondiendo

---

## 💾 ESTADO DE SINCRONIZACIÓN

### Git Local
```
Status: ✅ LIMPIO
Branch: main
Commits: 5
Cambios sin commit: 0
```

### GitHub Remote
```
Status: ⚠️ NO CONFIGURADO
Acción requerida: Configurar origin
Ver: GITHUB_SETUP.md
```

---

## ✨ LOGROS DESTACADOS

1. **Resolución exitosa** del problema de autenticación PostgreSQL
2. **Migración completa** a stack MariaDB + ChromaDB
3. **Base de datos operativa** con esquema completo
4. **Infraestructura lista** para desarrollo de funcionalidades
5. **Documentación exhaustiva** de todo el proceso
6. **Código limpio** sin archivos temporales
7. **Control de versiones** con commits descriptivos

---

## 🎯 TAREAS PENDIENTES

### Prioritarias
1. ⚠️ Configurar repositorio remoto en GitHub y hacer push
2. ⭕ Crear seed para poblar base de datos con datos de ejemplo
3. ⭕ Activar ChromaDB con servidor dedicado
4. ⭕ Implementar sistema de autenticación

### Siguientes Fases
- Desarrollo de funcionalidades core
- Integración con API de IA
- Testing completo
- Deploy a producción

---

## 📞 SOPORTE

### Archivos de Referencia
- `README.md` - Información general
- `GITHUB_SETUP.md` - Configurar remoto
- `RESUMEN_SESION.md` - Detalles técnicos
- `.github/registro.md` - Historial completo

### Verificar Estado
```bash
cd /var/www/vhosts/practical-chatelet.217-154-99-32.plesk.page/httpdocs

# Ver commits
git log --oneline

# Ver estado
git status

# Ver configuración
git config --list
```

---

**Fecha de finalización**: 2 de Noviembre de 2025  
**Estado**: ✅ OPERATIVO Y LISTO PARA DESARROLLO  
**Próxima acción**: Configurar GitHub remoto