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

## 🛠️ Desarrollo Local (Sin Docker)

### Prerrequisitos
- Python 3.10+
- Node.js 18+
- Archivos `.env` configurados en las carpetas `backend/` y `frontend/`

### 1. Configurar y encender el Backend
Desde la raíz del proyecto:

```powershell
cd backend
# crear entorno virtual (opcional pero recomendado)
python -m venv .venv
.\.venv\Scripts\activate

# instalar dependencias
pip install -r requirements.txt

# iniciar servidor
python -m uvicorn app.main:app --reload
```
El backend estará en: [http://localhost:8000/docs](http://localhost:8000/docs)

### 2. Configurar y encender el Frontend
Desde la raíz del proyecto en otra terminal:

```powershell
cd frontend
# instalar dependencias
npm install --force

# iniciar servidor de desarrollo
npm run dev
```
La aplicación estará en: [http://localhost:3000](http://localhost:3000)

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
