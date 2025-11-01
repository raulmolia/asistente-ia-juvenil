# Registro de Desarrollo - Asistente IA para Actividades Juveniles

## Información del Proyecto
- **Nombre**: Asistente IA para Actividades Juveniles
- **Tipo**: Aplicación web tipo ChatGPT
- **Objetivo**: Generar actividades, programaciones, dinámicas y oraciones para grupos juveniles
- **Inicio del proyecto**: 1 de noviembre de 2025

## Configuración del Entorno
- **Servidor SSH**: RPJ
- **Ruta de desarrollo**: `/var/www/vhosts/practical-chatelet.217-154-99-32.plesk.page/httpdocs`
- **Permisos**: `adminweb:psacln`
- **IDE**: Visual Studio Code (conexión SSH)

## Stack Tecnológico
- **Backend**: Node.js + Prisma ORM
- **Frontend**: Next.js + TypeScript
- **Base de datos**: PostgreSQL (principal + vectorial)
- **Componentes UI**: Shadcn/ui
- **Hosting**: Servidor Plesk

---

## Registro de Fases de Desarrollo

### Fase 1: Configuración Inicial (1 Nov 2025)
**Estado**: En progreso

#### Acciones realizadas:
- [x] Creación de `.github/copilot-instructions.md` con directrices obligatorias
- [x] Creación de `.github/registro.md` para seguimiento del proyecto
- [x] Configuración completa de Visual Studio Code
  - [x] Workspace principal (`asistente-ia-juvenil.code-workspace`)
  - [x] Configuración del proyecto (`.vscode/settings.json`)
  - [x] Tareas automatizadas (`.vscode/tasks.json`)
  - [x] Configuración de debugging (`.vscode/launch.json`)
  - [x] Extensiones recomendadas (`.vscode/extensions.json`)
  - [x] Configuración de conexiones (`.vscode/configuracion-conexiones.json`)
  - [x] Documentación de configuración (`.vscode/README.md`)
- [x] Configuración inicial del repositorio GitHub
  - [x] Inicialización de git con rama main
  - [x] Configuración de usuario git del proyecto
  - [x] Creación de README.md completo
  - [x] Configuración de .gitignore
  - [x] Primer commit realizado
- [x] Estructura de carpetas del proyecto completa
  - [x] backend/ con subdirectorios src/ y prisma/
  - [x] frontend/ con subdirectorios src/ y public/
  - [x] database/ para esquemas
  - [x] docs/ para documentación
- [x] Configuración de Node.js y dependencias
  - [x] package.json backend con todas las dependencias necesarias
  - [x] package.json frontend con Next.js, TypeScript y Shadcn
  - [x] Archivos .env.example para ambos entornos
  - [x] Configuración de TypeScript (tsconfig.json)
  - [x] Configuración de Next.js (next.config.mjs)
  - [x] Configuración de Tailwind CSS y PostCSS
  - [x] Servidor backend básico con Express.js funcionando
- [x] Configuración de PostgreSQL
  - [x] Esquema Prisma completo para base de datos principal
  - [x] Esquema SQL para base de datos vectorial
  - [x] Seed básico con datos de ejemplo
  - [x] Configuración de vector embeddings para IA
- [x] Configuración inicial de Shadcn/ui
  - [x] components.json configurado
  - [x] Utilidades básicas en lib/utils.ts
  - [x] Componente Button base de Shadcn
  - [x] Estructura de directorios para componentes UI
  - [x] Página principal Next.js con diseño responsive

#### Árbol de directorios actual:
```
httpdocs/
├── .github/
│   ├── copilot-instructions.md
│   └── registro.md
├── .vscode/
│   ├── settings.json
│   ├── tasks.json
│   ├── launch.json
│   ├── extensions.json
│   ├── configuracion-conexiones.json
│   ├── formatters.json
│   └── README.md
├── backend/
│   ├── src/
│   │   └── index.js (servidor Express)
│   ├── prisma/
│   │   ├── schema.prisma (esquema completo)
│   │   └── seed.js (datos de ejemplo)
│   ├── package.json
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── layout.tsx
│   │   │   └── page.tsx
│   │   ├── components/
│   │   │   └── ui/
│   │   │       └── button.tsx
│   │   ├── lib/
│   │   │   └── utils.ts
│   │   └── styles/
│   │       └── globals.css
│   ├── public/
│   ├── package.json
│   ├── tsconfig.json
│   ├── next.config.mjs
│   ├── tailwind.config.ts
│   ├── postcss.config.js
│   ├── components.json
│   └── .env.example
├── database/
│   └── schema-vectorial.sql
├── docs/
├── asistente-ia-juvenil.code-workspace
├── README.md
├── .gitignore
└── index.html (página por defecto Plesk)
```

#### Estructura de base de datos:
```
PostgreSQL Principal (asistente_ia_juvenil):
├── usuarios (id, email, nombre, organizacion, configuraciones...)
├── sesiones (id, usuarioId, token, metadatos...)
├── actividades (id, usuarioId, titulo, contenido, clasificacion...)
├── actividades_favoritas (usuarioId, actividadId)
└── configuraciones_usuario (usuarioId, clave, valor)

PostgreSQL Vectorial (asistente_ia_vectorial):
├── documentos_vectoriales (id, contenido, embedding, clasificacion...)
├── ejemplos_actividades (id, documento_id, detalles_actividad...)
├── plantillas_actividades (id, estructura, variables...)
├── contenido_inspiracional (id, tipo, contenido, tematica...)
└── conocimiento_juventud (id, tema, rango_edad, aplicacion...)

Funcionalidades implementadas:
- Vector embeddings para búsqueda semántica
- Clasificación por edad, tipo y dificultad
- Sistema de tags y categorización
- Métricas de uso y calificaciones
- Plantillas reutilizables
```

---

### Configuraciones Completadas

#### Visual Studio Code
- **Workspace completo** configurado con todas las herramientas necesarias
- **Extensiones automáticas** para desarrollo con Node.js, TypeScript, PostgreSQL
- **Tareas predefinidas** para build, desarrollo, debugging y sincronización
- **Debugging configurado** para frontend, backend y tests
- **Conexiones preparadas** para bases de datos PostgreSQL y SSH
- **Formateo automático** y linting configurado

---

## Próximas Acciones Planificadas

1. **Configuración del repositorio GitHub**
   - Inicializar git en el directorio
   - Crear repositorio remoto
   - Configurar sincronización

2. **Estructura del proyecto**
   - Crear carpetas: backend/, frontend/, database/, docs/
   - Configurar Node.js y dependencias
   - Configurar Next.js

3. **Configuración de base de datos**
   - PostgreSQL principal (usuarios/auth)
   - PostgreSQL vectorial (documentación IA)
   - Esquemas Prisma

4. **Desarrollo inicial**
   - Componentes Shadcn básicos
   - Sistema de autenticación
   - API backend inicial

---

## Notas de Desarrollo

- **Idioma**: Toda la documentación y código en castellano (excepto estándares)
- **Herramientas MCP**: Priorizar en todas las operaciones
- **Sincronización**: GitHub obligatoria tras cada sesión
- **Componentes**: Shadcn exclusivamente

---

*Última actualización: 1 de noviembre de 2025*