# Form - Sistema de Gestión de Formaciones

Sistema para gestionar formaciones, eventos y registro de asistencia con códigos QR y firmas digitales.

## 🚀 Tecnologías

- **Frontend**: React + Vite
- **Backend**: FastAPI (Python)
- **Base de Datos**: Azure Cosmos DB (o JSON local)
- **Almacenamiento**: Azure Blob Storage (QR y firmas)
- **Autenticación**: Microsoft Entra ID (Azure AD)
- **Infraestructura**: Docker & Docker Compose

---

## 🛠️ Configuración y Despliegue con Docker (Recomendado)

### Prerrequisitos
- Docker Desktop instalado
- Archivo `.env` configurado (ver `backend/.env.example`)

### 1. Iniciar la aplicación
Ejecuta el siguiente comando para levantar frontend y backend:

```bash
docker-compose up
```

La aplicación estará disponible en:
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000/docs

### 2. Desarrollo y Hot Reload
Docker está configurado con volúmenes para desarrollo. **No necesitas reiniciar** para:
- Cambios en código Python (`.py`)
- Cambios en React (`.jsx`, `.js`, `.css`)

### 3. Actualizar dependencias o configuración
Si instalas nuevas librerías o cambias el `.env`:

```bash
# Si agregas librerías (pip/npm)
docker-compose up --build

# Si cambias variables de entorno (.env)
docker-compose restart
```

---

## ☁️ Almacenamiento (Azure Blob Storage)

El sistema utiliza Azure Blob Storage para guardar los códigos QR y las firmas de asistencia.

### Estructura de Carpetas
```
formatoformacionesoeventos/
└── {Creador}/
    └── {Capacitacion}/
        ├── QR_{Capacitacion}.png
        └── Firmas/
            ├── Firma_{Cedula1}.png
            └── Firma_{Cedula2}.png
```

### Seguridad y Proxy
- Los archivos en Azure son **PRIVADOS**.
- El acceso se realiza a través de un **Proxy en el Backend**.
- backend genera tokens SAS temporales (24h) interna y transparente para el usuario.
- **NUNCA** se exponen las credenciales ni los tokens SAS al frontend.

---

## 🔐 Seguridad y Variables de Entorno

**IMPORTANTE**: Nunca subir el archivo `.env` al repositorio.

### Configuración `.env`
Copia `.env.example` a `backend/.env` y completa los valores:

```bash
cp backend/.env.example backend/.env
```

Variables críticas:
- `COSMOS_KEY`: Clave de base de datos
- `AZURE_STORAGE_CONNECTION_STRING`: Conexión a almacenamiento
- `ENTRA_CLIENT_SECRET`: Secreto de autenticación Microsoft

---

## 🔧 Scripts de Utilidad (Backend)

En la carpeta `backend/` hay scripts útiles para desarrollo (NO usar en producción):

- `list_azure_blobs.py`: Lista todos los archivos en Azure Storage.
- `delete_old_azure_files.py`: Elimina archivos con la estructura antigua.

Ejecutar:
```bash
cd backend
python list_azure_blobs.py
```

---
