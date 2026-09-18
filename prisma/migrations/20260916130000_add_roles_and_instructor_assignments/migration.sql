-- Agrega el rol administrativo superior sin eliminar roles existentes.
ALTER TYPE "Role" ADD VALUE IF NOT EXISTS 'SUPERADMIN';

ALTER TABLE "programas"
ADD COLUMN "centro_formacion" TEXT NOT NULL DEFAULT 'CTMA';

CREATE TABLE "instructor_fichas" (
    "id" TEXT NOT NULL,
    "ficha_id" TEXT NOT NULL,
    "instructor_id" TEXT NOT NULL,
    "is_leader" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "instructor_fichas_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "instructor_fichas_ficha_id_instructor_id_key"
ON "instructor_fichas"("ficha_id", "instructor_id");
CREATE INDEX "instructor_fichas_ficha_id_is_leader_idx"
ON "instructor_fichas"("ficha_id", "is_leader");
CREATE INDEX "instructor_fichas_instructor_id_idx"
ON "instructor_fichas"("instructor_id");

ALTER TABLE "instructor_fichas"
ADD CONSTRAINT "instructor_fichas_ficha_id_fkey"
FOREIGN KEY ("ficha_id") REFERENCES "fichas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "instructor_fichas"
ADD CONSTRAINT "instructor_fichas_instructor_id_fkey"
FOREIGN KEY ("instructor_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Conserva la asignación histórica como instructor líder.
INSERT INTO "instructor_fichas" ("id", "ficha_id", "instructor_id", "is_leader")
SELECT gen_random_uuid(), "id", "instructor_id", true
FROM "fichas"
WHERE "instructor_id" IS NOT NULL
ON CONFLICT ("ficha_id", "instructor_id") DO NOTHING;
