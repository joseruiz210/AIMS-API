-- Sincronización incremental del esquema usado por la API.
-- No elimina datos ni reconstruye tablas existentes.

DO $$
BEGIN
  ALTER TYPE "Role" ADD VALUE IF NOT EXISTS 'SUPERADMIN';
EXCEPTION
  WHEN undefined_object THEN NULL;
END $$;

DO $$
BEGIN
  CREATE TYPE "AuthProvider" AS ENUM ('LOCAL', 'GOOGLE');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  CREATE TYPE "EstadoAprendiz" AS ENUM ('EN_FORMACION', 'EN_RIESGO', 'CONDICIONADO', 'RETIRO_VOLUNTARIO', 'CERTIFICADO');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE "users"
  ADD COLUMN IF NOT EXISTS "auth_provider" "AuthProvider" NOT NULL DEFAULT 'LOCAL',
  ADD COLUMN IF NOT EXISTS "estado_academico" "EstadoAprendiz" DEFAULT 'EN_FORMACION',
  ADD COLUMN IF NOT EXISTS "document_type" TEXT,
  ADD COLUMN IF NOT EXISTS "document_number" TEXT,
  ADD COLUMN IF NOT EXISTS "is_pre_registered" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "users" ALTER COLUMN "password" DROP NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS "users_document_type_document_number_key"
  ON "users"("document_type", "document_number");

ALTER TABLE "programas"
  ADD COLUMN IF NOT EXISTS "centro_formacion" TEXT NOT NULL DEFAULT 'CTMA';

ALTER TABLE "fichas"
  ALTER COLUMN "badge_code" DROP NOT NULL,
  ALTER COLUMN "jornada" SET DEFAULT 'Mañana',
  ALTER COLUMN "jornada" DROP NOT NULL,
  ALTER COLUMN "instructor_id" DROP NOT NULL;

CREATE TABLE IF NOT EXISTS "cargas_aprendices" (
  "id" TEXT NOT NULL,
  "ficha_id" TEXT NOT NULL,
  "uploaded_by_id" TEXT NOT NULL,
  "file_name" TEXT NOT NULL,
  "total_rows" INTEGER NOT NULL,
  "created_rows" INTEGER NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "cargas_aprendices_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "cargas_aprendices_ficha_id_idx" ON "cargas_aprendices"("ficha_id");
CREATE INDEX IF NOT EXISTS "cargas_aprendices_uploaded_by_id_idx" ON "cargas_aprendices"("uploaded_by_id");
DO $$
BEGIN
  ALTER TABLE "cargas_aprendices"
    ADD CONSTRAINT "cargas_aprendices_ficha_id_fkey"
    FOREIGN KEY ("ficha_id") REFERENCES "fichas"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
DO $$
BEGIN
  ALTER TABLE "cargas_aprendices"
    ADD CONSTRAINT "cargas_aprendices_uploaded_by_id_fkey"
    FOREIGN KEY ("uploaded_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "instructor_fichas" (
  "id" TEXT NOT NULL,
  "ficha_id" TEXT NOT NULL,
  "instructor_id" TEXT NOT NULL,
  "is_leader" BOOLEAN NOT NULL DEFAULT false,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "instructor_fichas_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "instructor_fichas_ficha_id_instructor_id_key"
  ON "instructor_fichas"("ficha_id", "instructor_id");
CREATE INDEX IF NOT EXISTS "instructor_fichas_ficha_id_is_leader_idx"
  ON "instructor_fichas"("ficha_id", "is_leader");
CREATE INDEX IF NOT EXISTS "instructor_fichas_instructor_id_idx"
  ON "instructor_fichas"("instructor_id");
DO $$
BEGIN
  ALTER TABLE "instructor_fichas"
    ADD CONSTRAINT "instructor_fichas_ficha_id_fkey"
    FOREIGN KEY ("ficha_id") REFERENCES "fichas"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
DO $$
BEGIN
  ALTER TABLE "instructor_fichas"
    ADD CONSTRAINT "instructor_fichas_instructor_id_fkey"
    FOREIGN KEY ("instructor_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

INSERT INTO "instructor_fichas" ("id", "ficha_id", "instructor_id", "is_leader")
SELECT gen_random_uuid(), "id", "instructor_id", true
FROM "fichas"
WHERE "instructor_id" IS NOT NULL
ON CONFLICT ("ficha_id", "instructor_id") DO NOTHING;
