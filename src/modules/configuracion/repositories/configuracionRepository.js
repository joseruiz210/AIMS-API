const prisma = require('../../../config/database');

class ConfiguracionRepository {
  async get() {
    let config = await prisma.configuracionInstitucional.findUnique({
      where: { id: 'singleton' },
    });

    if (!config) {
      config = await prisma.configuracionInstitucional.create({
        data: {
          id: 'singleton',
          nombreCentro: 'Centro de Formación SENA',
          nit: '8999999034',
          direccion: 'Calle 37 # 45, Medellín',
          correo: 'contacto@sena.edu.co',
        },
      });
    }

    return config;
  }

  async update(data) {
    return prisma.configuracionInstitucional.upsert({
      where: { id: 'singleton' },
      update: data,
      create: {
        id: 'singleton',
        nombreCentro: data.nombreCentro || 'Centro de Formación SENA',
        nit: data.nit || '8999999034',
        direccion: data.direccion || 'Calle 37 # 45, Medellín',
        correo: data.correo || 'contacto@sena.edu.co',
      },
    });
  }
}

module.exports = new ConfiguracionRepository();
