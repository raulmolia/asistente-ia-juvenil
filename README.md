# Asistente IA para Actividades Juveniles

**Aplicación web tipo ChatGPT para la creación de actividades, programaciones, dinámicas y oraciones para grupos de jóvenes de diferentes edades.**

## 🎯 Descripción del Proyecto

Esta aplicación utiliza inteligencia artificial para ayudar a monitores, educadores y responsables de grupos juveniles a crear contenido personalizado según las necesidades específicas de cada grupo de edad.

### 🏗️ Arquitectura

```
Base de Datos MariaDB (usuarios/auth) ←→ Backend Node.js/Prisma ←→ Frontend Next.js/TypeScript
                                                    ↕
                                                ChromaDB (vectores IA)
                                                    ↕
                                                API de IA
```

## 🛠️ Stack Tecnológico

- **Backend**: Node.js + Prisma ORM
- **Frontend**: Next.js + TypeScript  
- **Base de datos**: MariaDB (aplicación principal)
- **Base vectorial**: ChromaDB (documentación IA)
- **Componentes UI**: Shadcn/ui exclusivamente
- **Hosting**: Servidor Plesk con SSH

## 🚀 Configuración del Entorno

### Requisitos Previos
- Node.js 18+
- MariaDB 10.6+ (o compatible)
- Servidor ChromaDB ≥ 0.4 (Docker o binario)
- Visual Studio Code
- Conexión SSH configurada

### Instalación
```bash
# Clonar el repositorio
git clone [URL_DEL_REPOSITORIO]
cd asistente-ia-juvenil

# Abrir con VS Code configurado
code asistente-ia-juvenil.code-workspace

# Instalar dependencias (usar tarea de VS Code)
# Ctrl+Shift+P → "Tasks: Run Task" → "📦 Instalar dependencias"

# Instalación desde la raíz (opcional)
npm install --prefix backend
npm install --prefix frontend
npm install
```

### Variables de Entorno
```env
# backend/.env
DATABASE_URL="mysql://usuario:password@localhost:3306/rpjia"
CHROMA_HOST="127.0.0.1"
CHROMA_PORT="8000"
NEXTAUTH_SECRET="tu-clave-secreta"
NEXTAUTH_URL="http://localhost:3000"
JWT_SECRET="tu-clave-jwt"
JWT_EXPIRES_IN="12h"
AUTH_SALT_ROUNDS="12"
SEED_DEFAULT_PASSWORD="ChangeMe123!"
```

Variables opcionales para el seed (solo si se necesitan credenciales personalizadas):

```env
SEED_ADMIN_PASSWORD=""
SEED_DOCUMENTADOR_PASSWORD=""
SEED_USUARIO_PASSWORD=""
SEED_SUPERADMIN_EMAIL=""
SEED_SUPERADMIN_PASSWORD=""
SEED_SUPERADMIN_NAME=""
SEED_SUPERADMIN_LASTNAME=""
SEED_SUPERADMIN_USERNAME=""
SEED_SUPERADMIN_AVATAR=""
SEED_SUPERADMIN_PHONE=""
SEED_SUPERADMIN_BIRTHDATE=""
```

## 📁 Estructura del Proyecto

```
httpdocs/
├── .github/           # Configuración de GitHub y documentación
├── .vscode/           # Configuración completa de VS Code
├── backend/           # API Node.js con Prisma
├── frontend/          # Aplicación Next.js
├── database/          # Esquemas y migraciones
├── docs/             # Documentación del proyecto
└── asistente-ia-juvenil.code-workspace
```

## ⚡ Desarrollo

### Arranque rápido desde la raíz
```bash
# Ejecutar ambos servicios en paralelo desde httpdocs/
npm install            # instala concurrently la primera vez
npm run dev            # lanza backend (3001) y frontend (3000)
```

Scripts útiles:
- `npm run dev:backend`
- `npm run dev:frontend`
- `npm run install:all`

### Tareas Disponibles en VS Code
- **🚀 Ejecutar frontend** - Inicia Next.js en desarrollo
- **⚙️ Ejecutar backend** - Inicia servidor API
- **🔧 Prisma: Generar cliente** - Regenera cliente Prisma
- **🗃️ Prisma: Migrar BD** - Ejecuta migraciones
- **📊 Prisma: Studio** - Interfaz web de base de datos
- **🔄 Sincronizar GitHub** - Commit y push automático

### Flujo de Trabajo
1. Desarrollo en VS Code con conexión SSH
2. Uso exclusivo de componentes Shadcn/ui
3. Sincronización obligatoria con GitHub tras cada sesión
4. Documentación en castellano (excepto estándares)
5. Priorización de herramientas MCP

## 🗃️ Base de Datos

### MariaDB Principal
- Usuarios y autenticación
- Sesiones y perfiles
- Actividades y programaciones generadas por IA

## 🔐 Sistema de Usuarios

- **Roles disponibles**: Superadmin, Administrador, Documentador y Usuario (jerárquicos)
- **Autenticación**: credenciales email + contraseña con hash bcrypt y tokens JWT
- **Endpoints clave**:
    - `POST /api/auth/login` / `POST /api/auth/logout`
    - `GET /api/auth/me`
    - `GET /api/auth/users`
    - `POST /api/auth/users`
    - `PATCH /api/auth/users/:id/role`
    - `PATCH /api/auth/users/:id/status`
- **Gestión de sesiones**: tabla `sesiones` con control de expiración y revocación
- **Seed inicial**: crea usuarios de ejemplo para cada rol con contraseñas de desarrollo

### ChromaDB (Base Vectorial)
- Documentación y ejemplos para IA
- Contexto semántico para generación
- Consultas vectoriales para recomendaciones

## 🤖 Funcionalidades IA

- **Generación de actividades** personalizadas por edad
- **Creación de programaciones** para eventos y campamentos
- **Dinámicas de grupo** adaptadas al contexto
- **Oraciones y reflexiones** según temáticas
- **Recomendaciones inteligentes** basadas en historial

## 📋 Directrices de Desarrollo

### Obligatorias
- ✅ Toda documentación en castellano
- ✅ Priorizar herramientas MCP
- ✅ Sincronización GitHub tras cada sesión
- ✅ Mantener registro en `.github/registro.md`
- ✅ Componentes Shadcn/ui exclusivamente

### Recomendadas
- Usar TypeScript en todo el código
- Mantener arquitectura modular
- Documentar cambios importantes
- Realizar pruebas antes de deploy

## 🔧 Configuración SSH

```bash
# ~/.ssh/config
Host RPJ
    HostName your-server.com
    User adminweb
    IdentityFile ~/.ssh/id_rsa
```

## 📄 Licencia

[Definir licencia según necesidades del proyecto]

## 👥 Contribuciones

Las contribuciones deben seguir las directrices obligatorias del proyecto y mantener la sincronización con GitHub.

---

**Nota**: Este proyecto sigue directrices específicas de desarrollo. Consultar `.github/copilot-instructions.md` para detalles completos.