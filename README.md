# 🎓 AIMS API — Academic Intelligent Management System

> **Servicio Nacional de Aprendizaje (SENA)**  
> **Programa:** Tecnología en Análisis y Desarrollo de Software (**ADSO**)  
> **Ficha:** 3144585  
> **Equipo de Desarrollo:**  
> • Samuel Guarín  
> • Andrés Narváez  
> • Brahian Cataño  
> • Darly Zambrano  
> • Juan Esteban Henao  

---

## 📌 Contexto del Proyecto

**AIMS (Academic Intelligent Management System / Sistema de Gestión Académica e Inteligencia Asistida)** es una plataforma tecnológica integral diseñada para transformar y modernizar la gestión operativa, académica y evaluativa en centros de formación técnica y tecnológica.

### ⚠️ Problemática Identificada
En los ambientes de aprendizaje tradicionales se evidencian fallas operativas recurrentes:
1. **Control manual disperso:** Toma de asistencias en planillas de papel o archivos de Excel aislados en equipos locales.
2. **Detección tardía de deserción:** La acumulación de fallas no se consolida en tiempo real, imposibilitando la intervención oportuna del equipo pedagógico.
3. **Sobrecarga evaluativa y retroalimentación impersonal:** La evaluación de evidencias de aprendizaje (código fuente, entregas técnicas) demanda alto tiempo del instructor, resultando en notas sin retroalimentación cualitativa constructiva.
4. **Falta de transparencia:** El aprendiz no cuenta con un canal unificado para consultar en tiempo real su porcentaje de asistencia, horarios y juicios evaluativos.

### 💡 Solución AIMS
AIMS digitaliza y unifica todo el ecosistema formativo:
* **Asistencia Digital en Tiempo Real:** Marcación ágil por sesión con cómputo inmediato de inasistencias y alertas tempranas de deserción.
* **Evaluación Asistida con Inteligencia Artificial:** Integración con **Google Gemini (1.5 Flash)** para analizar repositorios de GitHub/entregas y sugerir retroalimentaciones técnicas cualitativas, manteniendo siempre la **gobernanza y soberanía del instructor SENA**.
* **Seguridad y Control de Acceso por Roles (RBAC):** Privilegios estrictos para Administradores, Instructores y Aprendices.
* **Trazabilidad Total:** Registro asíncrono e inmutable de eventos críticos en base de datos (`Audit Log`).

---

## 🔗 Repositorio Frontend Relacionado

El cliente web y móvil de AIMS se encuentra en:
👉 **Repositorio Frontend:** [https://github.com/wsderfghbgv/AIMS](https://github.com/wsderfghbgv/AIMS)

---

## 🏗️ Arquitectura del Sistema

El backend está desarrollado bajo principios de **Clean Architecture (Arquitectura Limpia) y Patrón de Capas**:

```
[ Cliente Web / Móvil (Expo) ]
            │ HTTP / JSON
            ▼
[ Middlewares de Seguridad ] ──▶ Helmet, Express Rate Limit, JWT Authenticate, RBAC Authorize
            │
            ▼
[ Controladores (Controllers) ] ──▶ Capturan peticiones, validan entrada (Joi) y delegan a servicios
            │
            ▼
[ Servicios (Services) ] ─────────▶ Lógica de negocio core, reglas SENA, integración Gemini IA
            │
            ▼
[ Repositorios (Repositories) ] ──▶ Consultas relacionales tipadas mediante Prisma ORM
            │
            ▼
[ PostgreSQL (Neon Cloud) ] ──────▶ Base de datos relacional ACID con índices FK y estados
```

### 📦 Cobertura Funcional (18 Módulos de Negocio)
1. **Gestión Formativa:** `programas`, `fichas`, `matricula`, `modulos`, `horarios`.
2. **Seguimiento Académico:** `asistencia` (sesiones y registros con autoguardado idempotente), `calificaciones`, `evidencias` (con IA Gemini), `observacion`, `documentos`.
3. **Comunicación:** `mensaje` (mensajería interna), `comunicado`, `notificaciones` (push y correo SMTP con Nodemailer).
4. **Seguridad y Control:** `auth` (JWT + Bcrypt), `usuarios`, `dashboard`, `reportes` (PDF/Excel), `configuracion`.

---

## 🛠️ Stack Tecnológico

* **Entorno:** Node.js (v20 LTS) sobre Express v5.
* **ORM & Persistencia:** Prisma ORM 7 conectado a **PostgreSQL en Neon Cloud**.
* **Inteligencia Artificial:** API Google Gemini (`gemini-1.5-flash`).
* **Seguridad:**
  * JWT (`jsonwebtoken`) con rotación y verificación de expiración.
  * Hashing seguro de contraseñas con `bcryptjs` (salt rounds).
  * Cabeceras seguras con `helmet` (15+ HTTP security headers).
  * Prevención DoS con `express-rate-limit`.
* **Documentación:** Swagger UI & OpenAPI 3.0 (`/api-docs`).
* **Contenerización:** Docker y Docker Compose.

---

## 🚀 Despliegue y Ejecución con Docker (Opción Recomendada)

La forma más rápida de ejecutar el ecosistema completo (Backend + Frontend) en cualquier computador es usando **Docker Compose**.

### 1️⃣ Requisitos Previos
* [Git](https://git-scm.com/) instalado.
* [Docker Desktop](https://www.docker.com/products/docker-desktop/) instalado y en ejecución.

### 2️⃣ Clonar Repositorios y Levantar

Abre una terminal y ejecuta:

```bash
# 1. Clonar el repositorio Backend
git clone -b feature/dockerization https://github.com/samgO001/AIMS-API.git

# 2. Entrar al directorio
cd AIMS-API

# 3. Clonar el repositorio Frontend en la subcarpeta correspondiente
git clone -b feature/dockerization https://github.com/wsderfghbgv/AIMS.git frontend/MiProyecto

# 4. Construir y levantar ambos contenedores
docker compose up --build
```

### 3️⃣ Servicios Disponibles

| Servicio | Contenedor | URL Local | Descripción |
| :--- | :--- | :--- | :--- |
| **Backend API** | `aims-backend` | [http://localhost:3000](http://localhost:3000) | API RESTful Node.js + Express |
| **Swagger Docs** | `aims-backend` | [http://localhost:3000/api-docs](http://localhost:3000/api-docs) | Documentación interactiva de la API |
| **Health Check** | `aims-backend` | [http://localhost:3000/api/health](http://localhost:3000/api/health) | Diagnóstico de estado del backend y DB |
| **Frontend Web** | `aims-frontend` | [http://localhost:8081](http://localhost:8081) | Interfaz gráfica SPA React Native Web |

### 🛠️ Comandos útiles de Docker
```bash
# Ver estado de los contenedores
docker compose ps

# Ver logs en tiempo real
docker compose logs -f

# Detener los contenedores
docker compose down
```

---

## 💻 Instalación Manual (Desarrollo Local sin Docker)

Si prefieres ejecutar el backend de forma nativa sin Docker:

### 1. Instalar Dependencias
```bash
npm install
```

### 2. Configurar Variables de Entorno
Crea un archivo `.env` en la raíz de `AIMS-API` basado en `.env.example`:
```ini
PORT=3000
NODE_ENV=development
FRONTEND_URL=http://localhost:8081

# Base de datos PostgreSQL (Neon Cloud)
DATABASE_URL="postgresql://neondb_owner:npg_h7dN8kQOgqxT@ep-floral-heart-acnwfivw-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require"

# Seguridad JWT
JWT_SECRET=tu_clave_secreta_super_segura
JWT_EXPIRES_IN=24h

# Google Gemini API
GEMINI_API_KEY=tu_api_key_de_gemini
GEMINI_MODEL=gemini-1.5-flash

# Servidor SMTP (Notificaciones de Correo)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=tu_correo@gmail.com
SMTP_PASS=tu_contraseña_de_aplicacion
EMAIL_FROM=AIMS Notificaciones <tu_correo@gmail.com>
```

### 3. Generar Cliente de Prisma
```bash
npx prisma generate
```

### 4. Iniciar Servidor
```bash
# Modo desarrollo con recarga automática:
npm run dev

# Modo producción:
npm start
```

---

## 📡 Endpoints Clave de la API

La API responde bajo el prefijo `/api/v1` (o `/api` para utilidades de salud):

| Método | Endpoint | Rol Requerido | Descripción |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/health` | Público | Estado del servidor y conexión a base de datos |
| `POST` | `/api/v1/auth/login` | Público | Autenticación de usuario y retorno de token JWT |
| `POST` | `/api/v1/auth/refresh-token` | Público | Renovación de token de sesión |
| `GET` | `/api/v1/fichas` | `ADMIN`, `INSTRUCTOR` | Listado general de fichas formativas |
| `POST` | `/api/v1/fichas` | `ADMIN` | Creación de nueva ficha con cupos y jornada |
| `GET` | `/api/v1/asistencia/ficha/:fichaId` | `ADMIN`, `INSTRUCTOR` | Asistencias registradas para una ficha |
| `POST` | `/api/v1/asistencia` | `ADMIN`, `INSTRUCTOR` | Marcación de asistencias (idempotente) |
| `GET` | `/api/v1/asistencia/mis-asistencias` | `APRENDIZ` | Consulta de asistencias propias y porcentaje |
| `POST` | `/api/v1/evidencias/:id/asistir-ia` | `INSTRUCTOR` | Asistente de evaluación cualitativa con IA Gemini |
| `GET` | `/api/v1/reportes/asistencia/:fichaId`| `ADMIN`, `INSTRUCTOR` | Exportación de reporte consolidado |

---

## 🔒 Mecanismos de Seguridad Implementados

1. **Autenticación Stateless (JWT):** Valida la identidad y rol del usuario sin almacenar estado en memoria del servidor.
2. **Control de Acceso Basado en Roles (RBAC):** Middleware `authorize('ADMIN', 'INSTRUCTOR')` que bloquea accesos no autorizados con código `403 Forbidden`.
3. **Criptografía Bcrypt:** Las contraseñas de los aprendices e instructores nunca se almacenan en texto plano.
4. **Protección Perimetral:**
   * `helmet`: Inyecta directivas `X-Content-Type-Options`, `X-Frame-Options`, `HSTS`, `Content-Security-Policy`.
   * `express-rate-limit`: Evita ataques de fuerza bruta en los endpoints de autenticación.
5. **Auditoría Transaccional:** Registro asíncrono mediante `setImmediate` de eventos de creación, modificación y eliminación en la tabla de auditoría.

---

## 📄 Licencia y Créditos
Proyecto desarrollado con fines académicos e institucionales en el **SENA - Centro de Formación**.  
Ficha 3144585 | ADSO © 2026.
