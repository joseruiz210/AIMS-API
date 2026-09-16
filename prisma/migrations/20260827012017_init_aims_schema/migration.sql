-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'INSTRUCTOR', 'APRENDIZ');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "first_name" TEXT NOT NULL,
    "last_name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'APRENDIZ',
    "phone" TEXT,
    "especialidad" TEXT,
    "google_id" TEXT,
    "magic_link_token" TEXT,
    "magic_link_expires" TIMESTAMP(3),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "is_email_verified" BOOLEAN NOT NULL DEFAULT false,
    "email_verification_token" TEXT,
    "email_verification_expires" TIMESTAMP(3),
    "reset_password_token" TEXT,
    "reset_password_expires" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "refresh_tokens" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revoked_at" TIMESTAMP(3),
    "replaced_by_token" TEXT,

    CONSTRAINT "refresh_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "programas" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "nivel" TEXT NOT NULL,
    "duracion" TEXT NOT NULL,
    "competencias_count" INTEGER NOT NULL DEFAULT 0,
    "estado" TEXT NOT NULL DEFAULT 'Activo',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "programas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fichas" (
    "id" TEXT NOT NULL,
    "numero" TEXT NOT NULL,
    "badge_code" TEXT NOT NULL,
    "jornada" TEXT NOT NULL,
    "estado" TEXT NOT NULL DEFAULT 'Activo',
    "programa_id" TEXT NOT NULL,
    "instructor_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "fichas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "matriculas" (
    "id" TEXT NOT NULL,
    "ficha_id" TEXT NOT NULL,
    "aprendiz_id" TEXT NOT NULL,
    "fecha_matricula" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "estado" TEXT NOT NULL DEFAULT 'Activo',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "matriculas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sesiones_asistencia" (
    "id" TEXT NOT NULL,
    "ficha_id" TEXT NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "tema" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sesiones_asistencia_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "registros_asistencia" (
    "id" TEXT NOT NULL,
    "sesion_id" TEXT NOT NULL,
    "aprendiz_id" TEXT NOT NULL,
    "estado" TEXT NOT NULL,
    "observacion" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "registros_asistencia_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "competencias" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "programa_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "competencias_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "calificaciones" (
    "id" TEXT NOT NULL,
    "aprendiz_id" TEXT NOT NULL,
    "competencia_id" TEXT NOT NULL,
    "instructor_id" TEXT NOT NULL,
    "nota" DECIMAL(3,1) NOT NULL,
    "periodo" TEXT NOT NULL,
    "estado" TEXT NOT NULL DEFAULT 'Aprobado',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "calificaciones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "observaciones" (
    "id" TEXT NOT NULL,
    "aprendiz_id" TEXT NOT NULL,
    "instructor_id" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "materia" TEXT,
    "descripcion" TEXT NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "observaciones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "comunicados" (
    "id" TEXT NOT NULL,
    "admin_id" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "mensaje" TEXT NOT NULL,
    "destinatario" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "comunicados_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lecturas_comunicados" (
    "id" TEXT NOT NULL,
    "comunicado_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "leido_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lecturas_comunicados_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notificaciones" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "mensaje" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "leida" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notificaciones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mensajes" (
    "id" TEXT NOT NULL,
    "sender_id" TEXT NOT NULL,
    "receptor_id" TEXT NOT NULL,
    "texto" TEXT NOT NULL,
    "leido" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "mensajes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "horarios" (
    "id" TEXT NOT NULL,
    "ficha_id" TEXT NOT NULL,
    "dia_semana" TEXT NOT NULL,
    "hora_inicio" TEXT NOT NULL,
    "hora_fin" TEXT NOT NULL,
    "aula" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "horarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "configuracion_institucional" (
    "id" TEXT NOT NULL DEFAULT 'singleton',
    "nombre_centro" TEXT NOT NULL,
    "nit" TEXT NOT NULL,
    "direccion" TEXT NOT NULL,
    "correo" TEXT NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "configuracion_institucional_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

CREATE UNIQUE INDEX "refresh_tokens_token_key" ON "refresh_tokens"("token");

CREATE UNIQUE INDEX "programas_codigo_key" ON "programas"("codigo");

CREATE UNIQUE INDEX "fichas_numero_key" ON "fichas"("numero");

CREATE UNIQUE INDEX "matriculas_ficha_id_aprendiz_id_key"
ON "matriculas"("ficha_id", "aprendiz_id");

CREATE UNIQUE INDEX "registros_asistencia_sesion_id_aprendiz_id_key"
ON "registros_asistencia"("sesion_id", "aprendiz_id");

CREATE UNIQUE INDEX "lecturas_comunicados_comunicado_id_user_id_key"
ON "lecturas_comunicados"("comunicado_id", "user_id");

-- AddForeignKey
ALTER TABLE "refresh_tokens"
ADD CONSTRAINT "refresh_tokens_user_id_fkey"
FOREIGN KEY ("user_id") REFERENCES "users"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "fichas"
ADD CONSTRAINT "fichas_programa_id_fkey"
FOREIGN KEY ("programa_id") REFERENCES "programas"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "fichas"
ADD CONSTRAINT "fichas_instructor_id_fkey"
FOREIGN KEY ("instructor_id") REFERENCES "users"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "matriculas"
ADD CONSTRAINT "matriculas_ficha_id_fkey"
FOREIGN KEY ("ficha_id") REFERENCES "fichas"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "matriculas"
ADD CONSTRAINT "matriculas_aprendiz_id_fkey"
FOREIGN KEY ("aprendiz_id") REFERENCES "users"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "sesiones_asistencia"
ADD CONSTRAINT "sesiones_asistencia_ficha_id_fkey"
FOREIGN KEY ("ficha_id") REFERENCES "fichas"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "registros_asistencia"
ADD CONSTRAINT "registros_asistencia_sesion_id_fkey"
FOREIGN KEY ("sesion_id") REFERENCES "sesiones_asistencia"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "registros_asistencia"
ADD CONSTRAINT "registros_asistencia_aprendiz_id_fkey"
FOREIGN KEY ("aprendiz_id") REFERENCES "users"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "competencias"
ADD CONSTRAINT "competencias_programa_id_fkey"
FOREIGN KEY ("programa_id") REFERENCES "programas"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "calificaciones"
ADD CONSTRAINT "calificaciones_aprendiz_id_fkey"
FOREIGN KEY ("aprendiz_id") REFERENCES "users"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "calificaciones"
ADD CONSTRAINT "calificaciones_competencia_id_fkey"
FOREIGN KEY ("competencia_id") REFERENCES "competencias"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "calificaciones"
ADD CONSTRAINT "calificaciones_instructor_id_fkey"
FOREIGN KEY ("instructor_id") REFERENCES "users"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "observaciones"
ADD CONSTRAINT "observaciones_aprendiz_id_fkey"
FOREIGN KEY ("aprendiz_id") REFERENCES "users"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "observaciones"
ADD CONSTRAINT "observaciones_instructor_id_fkey"
FOREIGN KEY ("instructor_id") REFERENCES "users"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "comunicados"
ADD CONSTRAINT "comunicados_admin_id_fkey"
FOREIGN KEY ("admin_id") REFERENCES "users"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "lecturas_comunicados"
ADD CONSTRAINT "lecturas_comunicados_comunicado_id_fkey"
FOREIGN KEY ("comunicado_id") REFERENCES "comunicados"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "lecturas_comunicados"
ADD CONSTRAINT "lecturas_comunicados_user_id_fkey"
FOREIGN KEY ("user_id") REFERENCES "users"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "notificaciones"
ADD CONSTRAINT "notificaciones_user_id_fkey"
FOREIGN KEY ("user_id") REFERENCES "users"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "mensajes"
ADD CONSTRAINT "mensajes_sender_id_fkey"
FOREIGN KEY ("sender_id") REFERENCES "users"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "mensajes"
ADD CONSTRAINT "mensajes_receptor_id_fkey"
FOREIGN KEY ("receptor_id") REFERENCES "users"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "horarios"
ADD CONSTRAINT "horarios_ficha_id_fkey"
FOREIGN KEY ("ficha_id") REFERENCES "fichas"("id")
ON DELETE CASCADE ON UPDATE CASCADE;