-- Migración de rendimiento: índices en claves foráneas
-- Generado: 2026-09-09 15:44:26 Colombia (UTC-5)

-- Matricula
CREATE INDEX "matriculas_ficha_id_idx"
ON "matriculas"("ficha_id");

CREATE INDEX "matriculas_aprendiz_id_idx"
ON "matriculas"("aprendiz_id");

-- SesionAsistencia
CREATE INDEX "sesiones_asistencia_ficha_id_idx"
ON "sesiones_asistencia"("ficha_id");

-- RegistroAsistencia
CREATE INDEX "registros_asistencia_sesion_id_idx"
ON "registros_asistencia"("sesion_id");

CREATE INDEX "registros_asistencia_aprendiz_id_idx"
ON "registros_asistencia"("aprendiz_id");

-- Competencia
CREATE INDEX "competencias_programa_id_idx"
ON "competencias"("programa_id");

-- Calificacion
CREATE INDEX "calificaciones_aprendiz_id_idx"
ON "calificaciones"("aprendiz_id");

CREATE INDEX "calificaciones_competencia_id_idx"
ON "calificaciones"("competencia_id");

CREATE INDEX "calificaciones_instructor_id_idx"
ON "calificaciones"("instructor_id");

-- Observacion
CREATE INDEX "observaciones_aprendiz_id_idx"
ON "observaciones"("aprendiz_id");

CREATE INDEX "observaciones_instructor_id_idx"
ON "observaciones"("instructor_id");

-- Comunicado
CREATE INDEX "comunicados_admin_id_idx"
ON "comunicados"("admin_id");

-- LecturaComunicado
CREATE INDEX "lecturas_comunicados_user_id_idx"
ON "lecturas_comunicados"("user_id");

CREATE INDEX "lecturas_comunicados_comunicado_id_idx"
ON "lecturas_comunicados"("comunicado_id");

-- Notificacion
CREATE INDEX "notificaciones_user_id_leida_idx"
ON "notificaciones"("user_id", "leida");

CREATE INDEX "notificaciones_user_id_idx"
ON "notificaciones"("user_id");

-- Mensaje
CREATE INDEX "mensajes_sender_id_idx"
ON "mensajes"("sender_id");

CREATE INDEX "mensajes_receptor_id_idx"
ON "mensajes"("receptor_id");

-- Horario
CREATE INDEX "horarios_ficha_id_idx"
ON "horarios"("ficha_id");