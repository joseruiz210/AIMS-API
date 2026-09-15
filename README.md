# AIMS API — Academic Intelligent Management System API

Backend RESTful API para la plataforma **AIMS (Academic Intelligent Management System)**, desarrollada con **Node.js**, **Express v5**, **Prisma 7** y **PostgreSQL Neon**. Ofrece un sistema integral de gestión académica inteligente, autenticación con rotación de tokens (JWT), control de acceso basado en roles (RBAC), validaciones con Joi, documentación OpenAPI/Swagger y gestión completa de programas, fichas, horarios, asistencias, calificaciones, módulos/competencias y evidencias.

---

## Repositorio Frontend Relacionado

El repositorio con el código fuente del cliente de interfaz de usuario (**Frontend**) de AIMS se encuentra disponible en:
* **AIMS Frontend Repository:** [https://github.com/wsderfghbgv/AIMS](https://github.com/wsderfghbgv/AIMS)

---

## Tecnologías Utilizadas

* **Entorno de ejecución:** Node.js (CommonJS)
* **Framework Web:** Express v5 (`express`)
* **Base de Datos & ORM:** PostgreSQL con Prisma 7 (`@prisma/client`, `@prisma/adapter-pg`, `pg`)
* **Autenticación & Seguridad:** 
  * JSON Web Tokens (`jsonwebtoken`)
  * Hashing de contraseñas con Bcrypt (`bcryptjs`)
  * Protecciones HTTP con Helmet (`helmet`)
  * Control de CORS (`cors`)
  * Limitación de tasa de peticiones (`express-rate-limit`)
* **Validación de Datos:** Joi (`joi`)
* **Documentación API:** Swagger UI & OpenAPI (`swagger-ui-express`, `swagger-jsdoc`)
* **Servicio de Correo:** Nodemailer (`nodemailer`)
* **Testing:** Jest & Supertest (`jest`, `supertest`)
* **Herramientas de Desarrollo:** Nodemon (`nodemon`), TSX (`tsx`)

---

## Requisitos Previos

Antes de comenzar, asegúrate de contar con lo siguiente instalado en tu equipo:

* **Node.js** (v18.x o superior recomendado)
* **npm** (incluido con Node.js)
* **PostgreSQL** (instancia local o remota en Neon PostgreSQL)

---

## Guía de Instalación y Configuración Paso a Paso

### 1. Clonar el Repositorio

```bash
git clone https://github.com/samgO001/AIMS-API.git
cd AIMS-API
```

### 2. Instalar Dependencias

Ejecuta el siguiente comando para instalar las dependencias de producción y desarrollo:

```bash
npm install
```

### 3. Configurar Variables de Entorno

Crea un archivo `.env` en la raíz del proyecto tomando como plantilla el archivo `.env.example`:

```bash
cp .env.example .env
```

Edita el archivo `.env` configurando las variables correspondientes a tu entorno local.

#### Variables de Entorno Requeridas y Opcionales

| Variable | Requerida | Valor por Defecto / Descripción |
| :--- | :--- | :--- |
| `DATABASE_URL` | **Sí** | Cadena de conexión PostgreSQL (ej. `postgresql://usuario:password@localhost:5432/aims_db?schema=public`) |
| `JWT_SECRET` | **Sí** | Clave secreta segura para firmar los Access Tokens JWT |
| `PORT` | No | Puerto en el que correrá el servidor (por defecto `3000`) |
| `NODE_ENV` | No | Entorno de ejecución (`development` / `production` / `test`) |
| `JWT_EXPIRES_IN` | No | Tiempo de expiración del Access Token (por defecto `15m`) |
| `JWT_REFRESH_SECRET` | No | Clave secreta para Refresh Tokens (por defecto `<JWT_SECRET>_refresh`) |
| `JWT_REFRESH_EXPIRES_IN` | No | Tiempo de expiración del Refresh Token (por defecto `7d`) |
| `FRONTEND_URL` | No | URL del cliente frontend para enlaces de correo (por defecto `http://localhost:3000`) |
| `SMTP_HOST` | No | Servidor SMTP para envío de correos (por defecto `smtp.ethereal.email`) |
| `SMTP_PORT` | No | Puerto SMTP (por defecto `587`) |
| `SMTP_USER` | No | Usuario de autenticación SMTP |
| `SMTP_PASS` | No | Contraseña de autenticación SMTP |
| `EMAIL_FROM` | No | Remitente de los correos enviados (por defecto `AIMS API <noreply@aims-api.com>`) |

> **Nota de Seguridad:** NUNCA subas el archivo `.env` al repositorio ni expongas credenciales o secretos reales en control de versiones.

---

### 4. Configurar la Base de Datos con Prisma 7

#### Generar el Cliente de Prisma
```bash
npm run prisma:generate
```

#### Ejecutar las Migraciones en Desarrollo
Crea las tablas e índices necesarios en la base de datos PostgreSQL:
```bash
npm run prisma:migrate
```

#### Explorar la Base de Datos con Prisma Studio (Opcional)
Abre la interfaz gráfica de administración de datos de Prisma:
```bash
npm run prisma:studio
```

---

## Ejecución de la Aplicación

### Modo Desarrollo (con recarga automática)
```bash
npm run dev
```

### Modo Producción
```bash
npm start
```

---

## Documentación de la API y Health Check

Una vez que el servidor esté en ejecución en `http://localhost:3000`:

* **Documentación Interactiva Swagger UI:** [http://localhost:3000/api/docs](http://localhost:3000/api/docs)
* **Verificación de Estado (Health Check):** [http://localhost:3000/api/health](http://localhost:3000/api/health)

---

## Reglas de Asignación Automática de Roles

El sistema implementa una **política estricta de asignación automática de roles por dominio de correo** en el registro público (`POST /api/v1/auth/register`):

1. **El cliente NO puede elegir el rol durante el registro público:** Cualquier campo `role` enviado en el cuerpo de la petición de registro público es ignorado por seguridad.
2. **Resolución automática de roles por dominio (`roleResolver`):**
   * Correo finalizado en `@gmail.com` $\rightarrow$ Asigna rol **`APRENDIZ`**
   * Correo finalizado en `@soy.sena.edu.co` $\rightarrow$ Asigna rol **`APRENDIZ`**
   * Correo finalizado en `@sena.edu.co` $\rightarrow$ Asigna rol **`INSTRUCTOR`**
   * Cualquier otro dominio de correo $\rightarrow$ El registro es **rechazado** con código HTTP `400 Bad Request` (*"El dominio del correo no está permitido para registro"*).
3. **Rol `ADMIN`:** El rol de Administrador **NO** se puede obtener mediante el registro público. Únicamente puede ser asignado por un usuario `ADMIN` existente desde el panel de administración (`PUT /api/v1/users/:id`).

---

## Endpoints de la API

El prefijo base de la API es `/api/v1`.

### 1. Módulo Auth (`/api/v1/auth`)

| Método | Ruta | Autenticación | Rol | Descripción |
| :--- | :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/auth/register` | Pública | Ninguno | Registro de usuario (Rol resuelto automáticamente según dominio). |
| `POST` | `/api/v1/auth/login` | Pública | Ninguno | Inicio de sesión. Devuelve `accessToken` y `refreshToken`. |
| `POST` | `/api/v1/auth/verify-email` | Pública | Ninguno | Confirmar correo electrónico mediante token (Body). |
| `GET` | `/api/v1/auth/verify-email` | Pública | Ninguno | Confirmar correo electrónico mediante token (Query). |
| `POST` | `/api/v1/auth/resend-verification` | Pública | Ninguno | Reenviar correo de verificación de cuenta. |
| `POST` | `/api/v1/auth/forgot-password` | Pública | Ninguno | Solicitar recuperación de contraseña (envía correo). |
| `POST` | `/api/v1/auth/validate-reset-token` | Pública | Ninguno | Validar token de recuperación (Body). |
| `GET` | `/api/v1/auth/validate-reset-token` | Pública | Ninguno | Validar token de recuperación (Query). |
| `POST` | `/api/v1/auth/reset-password` | Pública | Ninguno | Restablecer contraseña utilizando token seguro. |
| `POST` | `/api/v1/auth/refresh-token` | Pública | Ninguno | Renovar Access Token usando Refresh Token Rotation. |
| `POST` | `/api/v1/auth/logout` | Pública / Token | Ninguno | Cierre de sesión y revocación de Refresh Token. |
| `POST` | `/api/v1/auth/change-password` | **Bearer JWT** | Cualquiera | Cambia contraseña del usuario e invalida sesiones activas. |
| `GET` | `/api/v1/auth/me` | **Bearer JWT** | Cualquiera | Obtener información del usuario autenticado en sesión. |

### 2. Módulo Users (`/api/v1/users`)

| Método | Ruta | Autenticación | Rol | Descripción |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/users/profile` | **Bearer JWT** | Cualquiera | Obtener datos del perfil del usuario autenticado. |
| `PUT` | `/api/v1/users/profile` | **Bearer JWT** | Cualquiera | Actualizar datos propios del perfil (`firstName`, `lastName`, `phone`). |
| `GET` | `/api/v1/users` | **Bearer JWT** | **ADMIN** | Listar usuarios con paginación, filtros (`role`, `isActive`), búsqueda y ordenamiento. |
| `GET` | `/api/v1/users/:id` | **Bearer JWT** | **ADMIN** | Obtener información detallada de un usuario por UUID. |
| `PUT` | `/api/v1/users/:id` | **Bearer JWT** | **ADMIN** | Actualizar cualquier usuario (permite cambiar rol y estado activo). |
| `DELETE` | `/api/v1/users/:id` | **Bearer JWT** | **ADMIN** | Eliminar un usuario de la base de datos por UUID. |
| `PATCH` | `/api/v1/users/:id/toggle-active` | **Bearer JWT** | **ADMIN** | Activar o desactivar el acceso de un usuario. |

### 3. Módulo Programas (`/api/v1/programas`)

| Método | Ruta | Autenticación | Rol | Descripción |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/programas` | **Bearer JWT** | Cualquiera | Listar todos los programas de formación. |
| `GET` | `/api/v1/programas/:id` | **Bearer JWT** | Cualquiera | Obtener un programa de formación por ID. |
| `POST` | `/api/v1/programas` | **Bearer JWT** | **ADMIN** | Crear un nuevo programa de formación. |
| `PUT` | `/api/v1/programas/:id` | **Bearer JWT** | **ADMIN** | Actualizar un programa de formación. |
| `DELETE` | `/api/v1/programas/:id` | **Bearer JWT** | **ADMIN** | Eliminar un programa de formación. |

### 4. Módulo Módulos / Competencias (`/api/v1/modulos`)

| Método | Ruta | Autenticación | Rol | Descripción |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/modulos` | **Bearer JWT** | Cualquiera | Listar módulos de formación (filtro opcional `programaId`). |
| `GET` | `/api/v1/modulos/:id` | **Bearer JWT** | Cualquiera | Obtener detalle de un módulo por ID. |
| `POST` | `/api/v1/modulos` | **Bearer JWT** | **ADMIN, INSTRUCTOR** | Crear un nuevo módulo de formación. |
| `PUT` | `/api/v1/modulos/:id` | **Bearer JWT** | **ADMIN, INSTRUCTOR** | Actualizar un módulo de formación. |
| `DELETE` | `/api/v1/modulos/:id` | **Bearer JWT** | **ADMIN** | Eliminar un módulo de formación. |

### 5. Módulo Fichas (`/api/v1/fichas`)

| Método | Ruta | Autenticación | Rol | Descripción |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/fichas` | **Bearer JWT** | Cualquiera | Listar fichas de formación. |
| `GET` | `/api/v1/fichas/:id` | **Bearer JWT** | Cualquiera | Obtener detalle de una ficha por ID. |
| `POST` | `/api/v1/fichas` | **Bearer JWT** | **ADMIN, INSTRUCTOR** | Crear una nueva ficha de formación. |
| `PUT` | `/api/v1/fichas/:id` | **Bearer JWT** | **ADMIN, INSTRUCTOR** | Actualizar una ficha de formación. |
| `DELETE` | `/api/v1/fichas/:id` | **Bearer JWT** | **ADMIN** | Eliminar una ficha de formación. |
| `POST` | `/api/v1/fichas/:id/aprendices` | **Bearer JWT** | **ADMIN, INSTRUCTOR** | Asignar un aprendiz a una ficha. |
| `DELETE` | `/api/v1/fichas/:id/aprendices/:aprendizId` | **Bearer JWT** | **ADMIN** | Remover un aprendiz de una ficha. |

### 6. Módulo Horarios (`/api/v1/horarios`)

| Método | Ruta | Autenticación | Rol | Descripción |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/horarios/mi-horario` | **Bearer JWT** | Cualquiera | Obtener el horario de clases del usuario en sesión. |
| `POST` | `/api/v1/horarios` | **Bearer JWT** | **ADMIN, INSTRUCTOR** | Crear un bloque de horario para una ficha. |

### 7. Módulo Asistencia (`/api/v1/asistencia`)

| Método | Ruta | Autenticación | Rol | Descripción |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/asistencia/mis-asistencias` | **Bearer JWT** | Cualquiera | Obtener reporte y porcentaje de asistencia del aprendiz. |
| `POST` | `/api/v1/asistencia/registrar` | **Bearer JWT** | **ADMIN, INSTRUCTOR** | Registrar asistencias masivas de una sesión. |

### 8. Módulo Calificaciones (`/api/v1/calificaciones`)

| Método | Ruta | Autenticación | Rol | Descripción |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/calificaciones/mis-calificaciones` | **Bearer JWT** | Cualquiera | Obtener boletín y promedio general de notas del aprendiz. |
| `POST` | `/api/v1/calificaciones` | **Bearer JWT** | **ADMIN, INSTRUCTOR** | Registrar o actualizar nota de un aprendiz en un módulo. |

### 9. Módulo Evidencias y Entregas (`/api/v1/evidencias`)

| Método | Ruta | Autenticación | Rol | Descripción |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/evidencias` | **Bearer JWT** | Cualquiera | Listar evidencias académicas. |
| `GET` | `/api/v1/evidencias/:id` | **Bearer JWT** | Cualquiera | Obtener detalle de una evidencia. |
| `POST` | `/api/v1/evidencias` | **Bearer JWT** | **ADMIN, INSTRUCTOR** | Crear una nueva evidencia académica. |
| `PUT` | `/api/v1/evidencias/:id` | **Bearer JWT** | **ADMIN, INSTRUCTOR** | Actualizar una evidencia. |
| `DELETE` | `/api/v1/evidencias/:id` | **Bearer JWT** | **ADMIN, INSTRUCTOR** | Eliminar una evidencia. |
| `POST` | `/api/v1/evidencias/:id/entregas` | **Bearer JWT** | **APRENDIZ, ADMIN** | Enviar entrega de trabajo/evidencia. |
| `GET` | `/api/v1/evidencias/:id/entregas` | **Bearer JWT** | **ADMIN, INSTRUCTOR** | Obtener entregas recibidas de una evidencia. |
| `PUT` | `/api/v1/evidencias/:id/entregas/:entregaId/calificar` | **Bearer JWT** | **ADMIN, INSTRUCTOR** | Calificar una entrega recibida. |

### 10. Módulos Aprendiz, Notificaciones y Admin (`/api/v1`)

| Método | Ruta | Autenticación | Rol | Descripción |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/aprendiz/dashboard` | **Bearer JWT** | **APRENDIZ, ADMIN** | Obtener métricas resumidas del dashboard del aprendiz. |
| `GET` | `/api/v1/notificaciones` | **Bearer JWT** | Cualquiera | Obtener lista de notificaciones del usuario. |
| `PATCH` | `/api/v1/notificaciones/:id/read` | **Bearer JWT** | Cualquiera | Marcar notificación individual como leída. |
| `PATCH` | `/api/v1/notificaciones/read-all` | **Bearer JWT** | Cualquiera | Marcar todas las notificaciones como leídas. |
| `GET` | `/api/v1/admin/stats` | **Bearer JWT** | **ADMIN** | Obtener estadísticas globales del sistema. |
| `GET` | `/api/v1/admin/recent-activity` | **Bearer JWT** | **ADMIN** | Obtener historial de auditoría y actividad reciente. |
| `POST` | `/api/v1/admin/users` | **Bearer JWT** | **ADMIN** | Crear usuarios con rol directo por administrador. |

---

## Pruebas y Testing

El proyecto cuenta con una suite completa de pruebas unitarias y de integración desarrolladas en **Jest** y **Supertest**.

Actualmente se encuentran implementadas y pasando al 100%:
* **13 Test Suites:** (`users.crud.test.js`, `auth.endpoints.test.js`, `auth.register.test.js`, `programas.test.js`, `fichas.test.js`, `asistencia.test.js`, `calificaciones.test.js`, `horarios.test.js`, `admin.test.js`, `modulos.test.js`, `evidencias.test.js`, `app.test.js`, `roleResolver.test.js`).
* **96 Pruebas Totales (96/96 pasadas exitosamente).**

### Ejecutar la Suite de Pruebas

```bash
npm test
```

---

## Estructura del Proyecto

```text
AIMS-API/
├── .env.example                # Plantilla de variables de entorno
├── .gitignore                  # Exclusiones de Git
├── package.json                # Dependencias y scripts del proyecto
├── package-lock.json           # Árbol de dependencias bloqueado
├── prisma.config.ts            # Configuración de Prisma 7
├── requests.http               # Colección de peticiones de prueba HTTP
├── prisma/
233: │   ├── migrations/             # Historial de migraciones SQL de la BD
234: │   └── schema.prisma           # Modelos y esquemas de Prisma ORM
├── src/
│   ├── app.js                  # Configuración de Express, middlewares y Swagger
│   ├── server.js               # Punto de entrada y arranque del servidor HTTP
│   ├── config/                 # Configuraciones de base de datos, entorno y Swagger
│   │   ├── database.js
│   │   ├── env.js
│   │   └── swagger.js
│   ├── middlewares/            # Middlewares de Auth, Errores, Rate Limit y Validación
│   │   ├── auth.js
│   │   ├── errorHandler.js
│   │   ├── rateLimiter.js
│   │   └── validate.js
│   ├── utils/                  # Loggers, mailer, JWT, roleResolver y respuestas
│   │   ├── appError.js
│   │   ├── auditLogger.js
│   │   ├── catchAsync.js
│   │   ├── mailer.js
│   │   ├── response.js
│   │   ├── roleResolver.js
│   │   └── token.js
│   ├── routes/index.js         # Ensamblador de las rutas modulares
│   └── modules/                # Cada dominio contiene su propia arquitectura
│       ├── asistencia/
│       │   ├── controllers/asistenciaController.js
│       │   ├── services/asistenciaService.js
│       │   ├── repositories/asistenciaRepository.js
│       │   ├── routes/asistenciaRoutes.js
│       │   └── validators/asistenciaValidator.js
│       ├── auth/
│       ├── usuarios/
│       ├── dashboard/
│       ├── programas/
│       ├── fichas/
│       ├── horarios/
│       ├── calificaciones/
│       ├── modulos/
│       ├── evidencias/
│       ├── notificaciones/
│       ├── comunicado/
│       ├── configuracion/
│       ├── documentos/
│       ├── matricula/
│       ├── mensaje/
│       ├── observacion/
│       └── reportes/
└── tests/
    ├── integration/            # Pruebas de integración
    │   ├── admin.test.js
    │   ├── app.test.js
    │   ├── asistencia.test.js
    │   ├── auth.endpoints.test.js
    │   ├── auth.register.test.js
    │   ├── calificaciones.test.js
    │   ├── evidencias.test.js
    │   ├── fichas.test.js
    │   ├── horarios.test.js
    │   ├── modulos.test.js
    │   ├── programas.test.js
    │   └── users.crud.test.js
    └── unit/                   # Pruebas unitarias
        └── roleResolver.test.js
```

---

## Flujo de Trabajo Git y Convención de Commits

El equipo utiliza una estrategia basada en **Git Flow** y la convención de **Conventional Commits**:

### Estrategia de Ramas
* `main`: Rama de código estable en producción.
* `develop`: Rama principal de integración para desarrollo.
* `feature/<nombre-feature>`: Ramas para el desarrollo de nuevas características.

### Formato de Commits
Formato estándar en español: `<tipo>(<alcance>): <descripción>`

* `feat(modulos)`: Agregar nueva característica en módulos/competencias.
* `fix(asistencia)`: Corrección de error en módulo de asistencias.
* `test(integration)`: Agregar o actualizar pruebas de integración.
* `docs(readme)`: Actualizaciones en documentación.
* `chore(repo)`: Tareas de mantenimiento o limpieza.
