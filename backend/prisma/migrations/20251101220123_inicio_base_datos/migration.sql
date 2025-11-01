-- CreateTable
CREATE TABLE "usuarios" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "apellidos" TEXT,
    "nombreUsuario" TEXT,
    "avatarUrl" TEXT,
    "telefono" TEXT,
    "fechaNacimiento" DATETIME,
    "genero" TEXT,
    "emailVerificado" DATETIME,
    "password" TEXT,
    "organizacion" TEXT,
    "cargo" TEXT,
    "experiencia" INTEGER,
    "temaPreferido" TEXT NOT NULL DEFAULT 'light',
    "idioma" TEXT NOT NULL DEFAULT 'es',
    "notificaciones" BOOLEAN NOT NULL DEFAULT true,
    "fechaCreacion" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fechaActualizacion" DATETIME NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true
);

-- CreateTable
CREATE TABLE "sesiones" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "usuarioId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "tipoDispositivo" TEXT,
    "navegador" TEXT,
    "ip" TEXT,
    "ubicacion" TEXT,
    "activa" BOOLEAN NOT NULL DEFAULT true,
    "fechaCreacion" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fechaExpiracion" DATETIME NOT NULL,
    "ultimoAcceso" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "sesiones_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "actividades" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "usuarioId" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "descripcion" TEXT NOT NULL,
    "contenido" TEXT NOT NULL,
    "tipoActividad" TEXT NOT NULL,
    "edadMinima" INTEGER NOT NULL,
    "edadMaxima" INTEGER NOT NULL,
    "duracionMinutos" INTEGER NOT NULL,
    "numeroParticipantes" INTEGER NOT NULL,
    "categoria" TEXT NOT NULL,
    "subcategoria" TEXT,
    "tags" TEXT NOT NULL,
    "dificultad" TEXT NOT NULL,
    "promptOriginal" TEXT NOT NULL,
    "modeloIA" TEXT NOT NULL,
    "parametrosIA" TEXT NOT NULL,
    "versionIA" TEXT,
    "estado" TEXT NOT NULL DEFAULT 'BORRADOR',
    "calificacion" REAL,
    "vecesUsada" INTEGER NOT NULL DEFAULT 0,
    "fechaCreacion" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fechaActualizacion" DATETIME NOT NULL,
    CONSTRAINT "actividades_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "actividades_favoritas" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "usuarioId" TEXT NOT NULL,
    "actividadId" TEXT NOT NULL,
    "fechaCreacion" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "actividades_favoritas_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "actividades_favoritas_actividadId_fkey" FOREIGN KEY ("actividadId") REFERENCES "actividades" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "configuraciones_usuario" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "usuarioId" TEXT NOT NULL,
    "clave" TEXT NOT NULL,
    "valor" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "fechaCreacion" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fechaActualizacion" DATETIME NOT NULL,
    CONSTRAINT "configuraciones_usuario_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_email_key" ON "usuarios"("email");

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_nombreUsuario_key" ON "usuarios"("nombreUsuario");

-- CreateIndex
CREATE UNIQUE INDEX "sesiones_token_key" ON "sesiones"("token");

-- CreateIndex
CREATE UNIQUE INDEX "actividades_favoritas_usuarioId_actividadId_key" ON "actividades_favoritas"("usuarioId", "actividadId");

-- CreateIndex
CREATE UNIQUE INDEX "configuraciones_usuario_usuarioId_clave_key" ON "configuraciones_usuario"("usuarioId", "clave");
