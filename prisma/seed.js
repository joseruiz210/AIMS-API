const prisma = require('../src/config/database');
const bcrypt = require('bcryptjs');

const SALT_ROUNDS = 12;

async function main() {
  console.log('🌱 Iniciando la siembra de datos iniciales (Seed)...');

  const adminPassword = await bcrypt.hash('Admin123!', SALT_ROUNDS);
  const instructorPassword = await bcrypt.hash('Instructor123!', SALT_ROUNDS);
  const aprendizPassword = await bcrypt.hash('Aprendiz123!', SALT_ROUNDS);

  // 1. Usuarios principales
  const admin = await prisma.user.upsert({
    where: { email: 'admin@sena.edu.co' },
    update: {},
    create: {
      firstName: 'Administrador',
      lastName: 'SENA AIMS',
      email: 'admin@sena.edu.co',
      password: adminPassword,
      role: 'ADMIN',
      phone: '+57 300 000 0001',
      isEmailVerified: true,
    },
  });

  const instructor = await prisma.user.upsert({
    where: { email: 'carlos.instructor@sena.edu.co' },
    update: {},
    create: {
      firstName: 'Carlos',
      lastName: 'Rodríguez',
      email: 'carlos.instructor@sena.edu.co',
      password: instructorPassword,
      role: 'INSTRUCTOR',
      phone: '+57 300 000 0002',
      especialidad: 'Desarrollo de Software y Arquitectura Cloud',
      isEmailVerified: true,
    },
  });

  const aprendiz = await prisma.user.upsert({
    where: { email: 'maria.aprendiz@soy.sena.edu.co' },
    update: {},
    create: {
      firstName: 'María Paula',
      lastName: 'Gómez',
      email: 'maria.aprendiz@soy.sena.edu.co',
      password: aprendizPassword,
      role: 'APRENDIZ',
      phone: '+57 300 000 0003',
      isEmailVerified: true,
    },
  });

  // 2. Programa de Formación
  const programa = await prisma.programa.upsert({
    where: { codigo: '228106' },
    update: {},
    create: {
      codigo: '228106',
      nombre: 'Análisis y Desarrollo de Software (ADSO)',
      nivel: 'Tecnólogo',
      duracion: '24 Meses',
      competenciasCount: 8,
    },
  });

  // 3. Ficha
  const ficha = await prisma.ficha.upsert({
    where: { numero: '2670142' },
    update: {},
    create: {
      numero: '2670142',
      badgeCode: 'ADSO-2670142',
      jornada: 'Mañana (6:00 AM - 12:00 PM)',
      estado: 'Activo',
      programaId: programa.id,
      instructorId: instructor.id,
    },
  });

  // 4. Matrícula
  await prisma.matricula.upsert({
    where: {
      fichaId_aprendizId: {
        fichaId: ficha.id,
        aprendizId: aprendiz.id,
      },
    },
    update: {},
    create: {
      aprendizId: aprendiz.id,
      fichaId: ficha.id,
      estado: 'Activo',
    },
  });

  // 5. Configuración Institucional
  await prisma.configuracionInstitucional.upsert({
    where: { id: 'singleton' },
    update: {},
    create: {
      id: 'singleton',
      nombreCentro: 'Centro de Tecnología de la Manufactura Avanzada (CTMA) SENA',
      nit: '8999999034',
      direccion: 'Calle 104 # 67 - 120, Pedregal, Medellín',
      correo: 'contacto.ctma@sena.edu.co',
    },
  });

  // 6. Comunicado inicial
  await prisma.comunicado.create({
    data: {
      autorId: admin.id,
      fichaId: null,
      destinatario: 'Todos los usuarios',
      titulo: 'Bienvenida al Trimestre Académico AIMS SENA',
      mensaje: 'Les damos la bienvenida al nuevo ciclo lectivo. Recuerden mantener su asistencia y revisar sus calificaciones oportunamente.',
    },
  });

  // 7. Horarios
  await prisma.horario.createMany({
    data: [
      { fichaId: ficha.id, diaSemana: 'Lunes', horaInicio: '06:00', horaFin: '12:00', aula: 'Ambiente 302 - Edificio A' },
      { fichaId: ficha.id, diaSemana: 'Miércoles', horaInicio: '06:00', horaFin: '12:00', aula: 'Laboratorio de Computación 4' },
      { fichaId: ficha.id, diaSemana: 'Viernes', horaInicio: '06:00', horaFin: '12:00', aula: 'Ambiente Virtual Teams' },
    ],
    skipDuplicates: true,
  });

  console.log('🎉 ¡Siembra de datos (Seed) completada con éxito en PostgreSQL!');
  console.log('---------------------------------------------------------');
  console.log(`   🔑 ADMIN:      admin@sena.edu.co / Admin123!`);
  console.log(`   🔑 INSTRUCTOR: carlos.instructor@sena.edu.co / Instructor123!`);
  console.log(`   🔑 APRENDIZ:   maria.aprendiz@soy.sena.edu.co / Aprendiz123!`);
  console.log('---------------------------------------------------------');
}

main()
  .catch((e) => {
    console.error('❌ Error ejecutando seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
