# Documentación del Proyecto

Esta carpeta contiene toda la documentación del proyecto **Asistente IA para Actividades Juveniles**.

## 📚 Índice de Documentación

### Estado del Proyecto
- [**ESTADO_FINAL.md**](./ESTADO_FINAL.md) - Estado actual del proyecto con métricas y próximos pasos

### Guías de Desarrollo
- [**RESUMEN_SESION.md**](./RESUMEN_SESION.md) - Resumen técnico completo de la sesión de desarrollo
- [**GITHUB_SETUP.md**](./GITHUB_SETUP.md) - Instrucciones para configuración de GitHub (ya completado)

### Registro de Desarrollo
Ver también el [registro completo de desarrollo](../.github/registro.md) en `.github/registro.md`

## 🚀 Enlaces Rápidos

- **Repositorio GitHub**: https://github.com/raulmolia/asistente-ia-juvenil
- **Backend**: https://ia.rpj.es/api (proxy Apache → 127.0.0.1:3001)
- **Frontend**: https://ia.rpj.es (proxy Apache → 127.0.0.1:3000)
- **Base de datos**: MariaDB (rpjia)
- **Gestión documental**: `/documentacion` (subida de PDFs y biblioteca vectorial)

## 📝 Convenciones

- Toda la documentación debe estar en esta carpeta `docs/`
- No crear archivos `.md` en la raíz del proyecto (excepto README.md)
- Mantener actualizado este índice cuando se añadan nuevos documentos

## 🔄 Última Actualización

**Fecha**: 5 de noviembre de 2025  
**Estado**: Plataforma conversacional conectada a Chutes AI con historial persistente, logs estructurados y eliminación de chats desde la UI. Suite de pruebas (Vitest + E2E) y despliegue vía PM2 actualizados.
**Nota**: El servidor ChromaDB se mantiene activo con `python3 backend/scripts/run_chromadb.py` (persistencia en `database/chroma`).