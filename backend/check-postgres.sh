#!/bin/bash

echo "🔧 Intentando configurar PostgreSQL para el proyecto..."

# Verificar si podemos acceder como usuario del sistema
echo "1. Verificando acceso como usuario sistema:"
runuser -l postgres -c 'psql -c "\l"' 2>/dev/null && echo "✅ Acceso como postgres OK" || echo "❌ No acceso como postgres"

# Intentar con peer authentication
echo "2. Verificando peer authentication:"
sudo -u postgres psql -c "SELECT version();" 2>/dev/null && echo "✅ Peer auth OK" || echo "❌ No peer auth"

# Verificar servicios activos
echo "3. Servicios PostgreSQL activos:"
systemctl is-active postgresql 2>/dev/null && echo "✅ PostgreSQL activo" || echo "❌ PostgreSQL no activo"

# Verificar puertos
echo "4. Puertos de PostgreSQL:"
ss -tlnp | grep 5432 && echo "✅ Puerto 5432 activo" || echo "❌ Puerto 5432 no activo"

# Verificar archivos de configuración accesibles
echo "5. Archivos de configuración:"
find /var/lib/pgsql -name "postgresql.conf" 2>/dev/null | head -1 | xargs test -f && echo "✅ Config encontrado" || echo "❌ Config no encontrado"

echo "🔍 Diagnóstico completado."