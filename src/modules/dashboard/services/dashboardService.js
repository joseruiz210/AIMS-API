const asistenciaService = require('../../asistencia/services/asistenciaService');
const calificacionService = require('../../calificaciones/services/calificacionService');
const horarioService = require('../../horarios/services/horarioService');
const notificacionService = require('../../notificaciones/services/notificacionService');

class DashboardService {
  async getLearnerDashboard(user) {
    const [asistencia, calificaciones, horario, notificaciones] = await Promise.all([
      asistenciaService.getMisAsistencias(user.id),
      calificacionService.getMisCalificaciones(user.id),
      horarioService.getMiHorario(user.id),
      notificacionService.getMisNotificaciones(user.id),
    ]);

    return {
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
      },
      statCards: [
        { label: 'PROMEDIO', value: String(calificaciones.promedioGeneral), highlight: true },
        { label: 'ASISTENCIA', value: `${asistencia.porcentajeGlobal}%`, highlight: true },
        { label: 'MATERIAS', value: String(calificaciones.gradesData.length), highlight: false },
      ],
      competencias: calificaciones.gradesData.map(grade => ({
        nombre: grade.subject,
        nota: grade.grade,
        max: 5,
      })),
      proximasClases: [],
      notificacionesRecientes: notificaciones.notificaciones.slice(0, 5),
      unreadNotificationsCount: notificaciones.unreadCount,
    };
  }
}

module.exports = new DashboardService();