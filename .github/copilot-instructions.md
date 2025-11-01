# Instrucciones para Copilot

## DIRECTRICES OBLIGATORIAS

**ESTAS DIRECTRICES SON ABSOLUTAMENTE OBLIGATORIAS Y NO OPCIONALES:**

1. **Idioma**: Siempre hablar en castellano (español). Todas las explicaciones, instrucciones y documentación en castellano, así como nombres de archivos (excepto estándares que requieren inglés)
2. **Herramientas MCP**: Priorizar siempre el uso de herramientas de servidores MCP
3. **Sincronización GitHub**: Tras cada sesión, la aplicación debe estar sincronizada entre servidor y GitHub sin excepción
4. **Registro de desarrollo**: Mantener `/.github/registro.md` con todas las fases, árbol de directorios y estructura de base de datos

## Descripción del Proyecto

**Asistente IA para Actividades Juveniles** - Aplicación tipo ChatGPT para crear actividades, programaciones, dinámicas y oraciones para grupos de jóvenes de diferentes edades.

### Arquitectura de la Aplicación

```
Base de Datos MariaDB (usuarios/auth) ←→ Backend Node.js/Prisma ←→ Frontend Next.js/TypeScript
                                                    ↕
                                            ChromaDB (base vectorial para IA)
                                                    ↕
                                                API de IA
```

## Configuración del Entorno

### Conexión SSH
- **Servidor**: RPJ (conexión automática con clave de entorno)
- **Desarrollo**: Visual Studio Code a través de SSH
- **Ruta web**: `/var/www/vhosts/practical-chatelet.217-154-99-32.plesk.page/httpdocs`
- **Permisos**: `adminweb:psacln` con permisos web

### Stack Tecnológico

- **Backend**: Node.js con Prisma ORM
- **Frontend**: Next.js con TypeScript
- **Base de datos**: MariaDB (aplicación principal)
- **Base vectorial**: ChromaDB para Node.js (documentación IA)
- **Componentes UI**: Shadcn exclusivamente (sin excepciones salvo petición expresa)
- **Hosting**: Servidor Plesk

## Patrones de Desarrollo

### Estructura de Archivos
```
httpdocs/
├── .github/
│   ├── copilot-instructions.md
│   └── registro.md
├── backend/          # API Node.js/Prisma
├── frontend/         # Next.js/TypeScript
├── database/         # Esquemas y migraciones
└── docs/            # Documentación del proyecto
```

### Flujo de Trabajo
1. **Desarrollo local** vía SSH en VS Code
2. **Base de datos**: MariaDB para usuarios y aplicación principal
3. **Base vectorial**: ChromaDB para búsqueda semántica de documentación IA
4. **Frontend**: Componentes Shadcn únicamente
5. **Sincronización**: GitHub después de cada sesión
6. **Registro**: Actualizar `.github/registro.md` con cambios

### Comandos Comunes
```bash
# Configuración inicial
npm install
npx prisma generate
npx prisma migrate dev

# Desarrollo
npm run dev          # Next.js frontend
npm run server       # Backend API
```

## Consideraciones Específicas

### Base de Datos
- **MariaDB**: Usuarios, autenticación, sesiones, actividades, grupos
- **ChromaDB**: Base vectorial para documentación y búsqueda semántica IA
- **Prisma**: ORM para gestión de datos MariaDB y migraciones
- **Credenciales**: Usuario `sa`, contraseña `Servidor2025`, base de datos `rpjia`

### Componentes UI
- **Obligatorio**: Usar únicamente componentes Shadcn
- **Prohibido**: Otros frameworks/librerías de componentes
- **Excepción**: Solo si el usuario lo solicita expresamente

### Integración IA
- API externa para generación de contenido
- Consultas a base vectorial para contexto
- Respuestas personalizadas según edad del grupo

## Notas para Agentes IA

- Mantener siempre las directrices obligatorias
- Priorizar herramientas MCP en todas las operaciones
- Documentar cada cambio en `registro.md`
- Sincronizar con GitHub tras cada sesión de trabajo
- Usar TypeScript y componentes Shadcn exclusivamente