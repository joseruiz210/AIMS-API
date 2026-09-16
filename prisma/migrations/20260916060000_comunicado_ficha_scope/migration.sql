-- Comunicados: permitir que un INSTRUCTOR publique avisos con alcance a
-- su propia ficha (por ejemplo "hoy no hay clase"), no solo el ADMIN.
--
-- 1) admin_id -> autor_id (autor admin o instructor)
-- 2) ficha_id nullable (null = aviso global)

ALTER TABLE "comunicados" DROP CONSTRAINT IF EXISTS "comunicados_admin_id_fkey";
ALTER TABLE "comunicados" RENAME COLUMN "admin_id" TO "autor_id";
ALTER TABLE "comunicados" ADD COLUMN "ficha_id" TEXT;
DROP INDEX IF EXISTS "comunicados_admin_id_idx";
CREATE INDEX "comunicados_autor_id_idx" ON "comunicados"("autor_id");
CREATE INDEX "comunicados_ficha_id_idx" ON "comunicados"("ficha_id");
ALTER TABLE "comunicados"
ADD CONSTRAINT "comunicados_autor_id_fkey"
FOREIGN KEY ("autor_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "comunicados"
ADD CONSTRAINT "comunicados_ficha_id_fkey"
FOREIGN KEY ("ficha_id") REFERENCES "fichas"("id") ON DELETE CASCADE ON UPDATE CASCADE;
