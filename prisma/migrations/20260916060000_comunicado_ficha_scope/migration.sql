-- Comunicados: permitir que un INSTRUCTOR publique avisos con alcance a
-- su propia ficha (por ejemplo "hoy no hay clase"), no solo el ADMIN
-- avisos globales.
--
-- 1) admin_id -> autor_id (ahora puede ser un admin o un instructor)
-- 2) se agrega ficha_id (nulo = aviso global, con valor = aviso de esa ficha)

-- DropForeignKey (constraint original sobre admin_id)
ALTER TABLE "comunicados" DROP CONSTRAINT IF EXISTS "comunicados_admin_id_fkey";

-- RenameColumn
ALTER TABLE "comunicados" RENAME COLUMN "admin_id" TO "autor_id";

-- AddColumn
ALTER TABLE "comunicados" ADD COLUMN "ficha_id" TEXT;

-- RenameIndex (el índice del init se llamaba distinto según cómo se haya nombrado;
-- si no existe con ese nombre, este DROP no falla porque usamos IF EXISTS)
DROP INDEX IF EXISTS "comunicados_admin_id_idx";
CREATE INDEX "comunicados_autor_id_idx" ON "comunicados"("autor_id");
CREATE INDEX "comunicados_ficha_id_idx" ON "comunicados"("ficha_id");

-- AddForeignKey
ALTER TABLE "comunicados" ADD CONSTRAINT "comunicados_autor_id_fkey" FOREIGN KEY ("autor_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "comunicados" ADD CONSTRAINT "comunicados_ficha_id_fkey" FOREIGN KEY ("ficha_id") REFERENCES "fichas"("id") ON DELETE CASCADE ON UPDATE CASCADE;
