-- Migracion de rendimiento: indices en claves foraneas
-- Generado: 2026-09-09 15:44:26 Colombia (UTC-5)

-- CreateIndex: Matricula
CREATE INDEX "matriculas_ficha_id_idx" ON "matriculas"("ficha_id");
CREATE INDEX "matriculas_aprendiz_id_idx" ON "matriculas"("aprendiz_id");

-- CreateIndex: SesionAsistencia
CREATE INDEX "sesiones_asistencia_ficha_id_idx" ON "sesiones_asistencia"("ficha_id");

-- CreateIndex: RegistroAsistencia
CREATE INDEX "registros_asistencia_sesion_id_idx" ON "registros_asistencia"("sesion_id");
CREATE INDEX "registros_asistencia_aprendiz_id_idx" ON "registros_asistencia"("aprendiz_id");

-- CreateIndex: Competencia
CREATE INDEX "competencias_programa_id_idx" ON "competencias"("programa_id");

-- CreateIndex: Calificacion
CREATE INDEX "calificaciones_aprendiz_id_idx" ON "calificaciones"("aprendiz_id");
CREATE INDEX "calificaciones_competencia_id_idx" ON "calificaciones"("competencia_id");
CREATE INDEX "calificaciones_instructor_id_idx" ON "calificaciones"("instructor_id");

-- CreateIndex: Observacion
CREATE INDEX "observaciones_aprendiz_id_idx" ON "observaciones"("aprendiz_id");
CREATE INDEX "observaciones_instructor_id_idx" ON "observaciones"("instructor_id");

-- CreateIndex: Comunicado
CREATE INDEX "comunicados_admin_id_idx" ON "comunicados"("admin_id");

-- CreateIndex: LecturaComunicado
CREATE INDEX "lecturas_comunicados_user_id_idx" ON "lecturas_comunicados"("user_id");
CREATE INDEX "lecturas_comunicados_comunicado_id_idx" ON "lecturas_comunicados"("comunicado_id");

-- CreateIndex: Notificacion (compuesto + simple)
CREATE INDEX "notificaciones_user_id_leida_idx" ON "notificaciones"("user_id", "leida");
CREATE INDEX "notificaciones_user_id_idx" ON "notificaciones"("user_id");

-- CreateIndex: Mensaje
CREATE INDEX "mensajes_sender_id_idx" ON "mensajes"("sender_id");
CREATE INDEX "mensajes_receptor_id_idx" ON "mensajes"("receptor_id");

-- CreateIndex: Horario
CREATE INDEX "horarios_ficha_id_idx" ON "horarios"("ficha_id");

-- CreateIndex: AuditLog
CREATE INDEX "audit_logs_user_id_idx" ON "audit_logs"("user_id");
CREATE INDEX "audit_logs_created_at_idx" ON "audit_logs"("created_at");

-- CreateIndex: Evidencia
CREATE INDEX "evidencias_ficha_id_idx" ON "evidencias"("ficha_id");
CREATE INDEX "evidencias_instructor_id_idx" ON "evidencias"("instructor_id");

-- CreateIndex: EntregaEvidencia
CREATE INDEX "entrega_evidencias_evidencia_id_idx" ON "entrega_evidencias"("evidencia_id");
CREATE INDEX "entrega_evidencias_aprendiz_id_idx" ON "entrega_evidencias"("aprendiz_id");