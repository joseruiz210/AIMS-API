-- Datos de identidad necesarios para pre-registrar aprendices desde una ficha.
ALTER TABLE "users"
ADD COLUMN "document_type" TEXT,
ADD COLUMN "document_number" TEXT,
ADD COLUMN "is_pre_registered" BOOLEAN NOT NULL DEFAULT false;

CREATE UNIQUE INDEX "users_document_type_document_number_key"
ON "users"("document_type", "document_number");

CREATE TABLE "cargas_aprendices" (
    "id" TEXT NOT NULL,
    "ficha_id" TEXT NOT NULL,
    "uploaded_by_id" TEXT NOT NULL,
    "file_name" TEXT NOT NULL,
    "total_rows" INTEGER NOT NULL,
    "created_rows" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cargas_aprendices_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "cargas_aprendices_ficha_id_idx" ON "cargas_aprendices"("ficha_id");
CREATE INDEX "cargas_aprendices_uploaded_by_id_idx" ON "cargas_aprendices"("uploaded_by_id");

ALTER TABLE "cargas_aprendices"
ADD CONSTRAINT "cargas_aprendices_ficha_id_fkey"
FOREIGN KEY ("ficha_id") REFERENCES "fichas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "cargas_aprendices"
ADD CONSTRAINT "cargas_aprendices_uploaded_by_id_fkey"
FOREIGN KEY ("uploaded_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;