# Better Insurance - Análisis de Renovaciones 2026

Dashboard interactivo para analizar el proceso de renovación de pólizas de seguros entre los períodos 2025 y 2026.

## 🚀 Características

- **Dashboard Principal**: Vista general con KPIs de renovación, retención y nuevas pólizas
- **Análisis por Captador**: Estadísticas detalladas por agente de seguros
- **Análisis Financiero**: Seguimiento de comisiones y proyecciones
- **Matriz de Migración**: Visualización de flujos de pólizas entre compañías
- **Vista Inside 2026**: Análisis detallado de la base 2026 con gráficos interactivos
- **Registros**: Tabla completa de todas las pólizas con filtros

## 🛠️ Tecnologías

- **React** + **Vite**: Framework y herramienta de build
- **Tailwind CSS**: Estilos y diseño responsivo
- **Lucide React**: Iconos
- **Firebase Hosting**: Despliegue en producción

## 📦 Instalación

```bash
# Instalar dependencias
npm install

# Iniciar servidor de desarrollo
npm run dev

# Construir para producción
npm run build

# Desplegar a Firebase
./deploy.bat
```

## 🌐 Despliegue

La aplicación está desplegada en Firebase Hosting:
**URL**: https://bi-renov-2026-v2.web.app

## 📊 Estructura de Datos

El dashboard procesa dos archivos JSON:
- `polizas-2025.json`: Pólizas del período base
- `polizas-2026.json`: Pólizas renovadas y nuevas

### Campos Principales
- `ID-BI`: Identificador único de póliza
- `CAPTADOR`: Agente de seguros
- `COMPANIA`: Compañía aseguradora
- `MIEMBROS`: Número de miembros cubiertos
- `COMISION`: Comisión generada
- `NEW_REN`: Estado ('Renewal' o 'New')

## 🎯 KPIs Principales

- **Tasa de Retención**: Porcentaje de pólizas renovadas
- **Nuevas Pólizas**: Crecimiento de la base
- **Comisiones**: Análisis financiero por captador
- **Migración**: Flujos entre compañías

## 📝 Licencia

Proyecto privado - Better Insurance © 2025
