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
- [ ] Configuración inicial del repositorio GitHub
- [ ] Estructura de carpetas del proyecto
- [ ] Configuración de Node.js y dependencias
- [ ] Configuración de PostgreSQL

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
├── asistente-ia-juvenil.code-workspace
└── index.html (página por defecto Plesk)
```

#### Estructura de base de datos:
```
[Pendiente de creación]
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