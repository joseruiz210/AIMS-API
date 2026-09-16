const reportesRepository = require('../repositories/reportesRepository');

class ReportesService {
  async getDashboardStats() {
    return reportesRepository.getDashboardStats();
  }

  async getRecentActivity(limit) {
    return reportesRepository.getRecentActivity(limit);
  }
}

module.exports = new ReportesService();