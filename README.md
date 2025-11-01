# Asistente IA para Actividades Juveniles

**Aplicación web tipo ChatGPT para la creación de actividades, programaciones, dinámicas y oraciones para grupos de jóvenes de diferentes edades.**

## 🎯 Descripción del Proyecto

Esta aplicación utiliza inteligencia artificial para ayudar a monitores, educadores y responsables de grupos juveniles a crear contenido personalizado según las necesidades específicas de cada grupo de edad.

### 🏗️ Arquitectura

```
Base de Datos PostgreSQL (usuarios/auth) ←→ Backend Node.js/Prisma ←→ Frontend Next.js/TypeScript
                                                    ↕
                                            Base de Datos Vectorial PostgreSQL (documentación IA)
                                                    ↕
                                                API de IA
```

## 🛠️ Stack Tecnológico

- **Backend**: Node.js + Prisma ORM
- **Frontend**: Next.js + TypeScript  
- **Base de datos**: PostgreSQL (principal + vectorial)
- **Componentes UI**: Shadcn/ui exclusivamente
- **Hosting**: Servidor Plesk con SSH

## 🚀 Configuración del Entorno

### Requisitos Previos
- Node.js 18+
- PostgreSQL 14+
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
```

### Variables de Entorno
```env
# backend/.env
DATABASE_URL="postgresql://user:password@localhost:5432/asistente_ia_juvenil"
VECTOR_DATABASE_URL="postgresql://user:password@localhost:5432/asistente_ia_vectorial"
NEXTAUTH_SECRET="your-secret-key"
NEXTAUTH_URL="http://localhost:3000"
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

### PostgreSQL Principal
- Usuarios y autenticación
- Sesiones y perfiles
- Configuraciones de la aplicación

### PostgreSQL Vectorial  
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