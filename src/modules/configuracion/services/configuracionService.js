const configuracionRepository = require('../repositories/configuracionRepository');

class ConfiguracionService {
  async get() {
    return configuracionRepository.get();
  }

  async update(data) {
    return configuracionRepository.update(data);
  }
}

module.exports = new ConfiguracionService();
