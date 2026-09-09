const prisma = require('../src/config/database');

async function main() {
  console.log('🚀 Iniciando población de datos reales en PostgreSQL (Neon)...');

  // 1. Obtener o crear Programa ADSO
  const programa = await prisma.programa.upsert({
    where: { codigo: '228106' },
    update: {},
    create: {
      codigo: '228106',
      nombre: 'Análisis y Desarrollo de Software (ADSO)',
      nivel: 'Tecnólogo',
      duracion: '24 Meses',
      competenciasCount: 8,
      duracionMeses: 24,
      estado: 'Activo',
    },
  });
  console.log('✅ Programa asegurado:', programa.nombre, `(${programa.id})`);

  // 2. Obtener un Instructor existente o crear uno
  let instructor = await prisma.user.findFirst({
    where: { role: 'INSTRUCTOR' },
  });

  if (!instructor) {
    instructor = await prisma.user.create({
      data: {
        firstName: 'Samuel',
        lastName: 'Guarin',
        email: 'guarin090vvv@gmail.com',
        role: 'INSTRUCTOR',
        especialidad: 'Desarrollo de Software y Arquitectura Cloud',
        isEmailVerified: true,
        isActive: true,
      },
    });
  }
  console.log('✅ Instructor asignado:', instructor.email, `(${instructor.id})`);

  // 3. Crear Ficha 2670142
  const ficha = await prisma.ficha.upsert({
    where: { numero: '2670142' },
    update: {
      instructorId: instructor.id,
      programaId: programa.id,
    },
    create: {
      numero: '2670142',
      badgeCode: 'ADSO-2670142',
      jornada: 'Mañana (6:00 AM - 12:00 PM)',
      estado: 'Activo',
      programaId: programa.id,
      instructorId: instructor.id,
    },
  });
  console.log('✅ Ficha creada/asegurada:', ficha.numero, `(${ficha.id})`);

  // 4. Matricular a TODOS los usuarios con rol APRENDIZ en esta Ficha
  const aprendices = await prisma.user.findMany({
    where: { role: 'APRENDIZ' },
  });

  for (const ap of aprendices) {
    await prisma.matricula.upsert({
      where: {
        fichaId_aprendizId: {
          fichaId: ficha.id,
          aprendizId: ap.id,
        },
      },
      update: { estado: 'Activo' },
      create: {
        fichaId: ficha.id,
        aprendizId: ap.id,
        estado: 'Activo',
      },
    });
  }
  console.log(`✅ ${aprendices.length} aprendices matriculados en la Ficha ${ficha.numero}.`);

  // 5. Crear Evidencias Reales en la base de datos
  const evidenciasData = [
    {
      titulo: 'Taller 2: Modelado Entidad-Relación y Normalización en 3FN',
      descripcion:
        'Diseñar el diagrama relacional completo para el sistema académico. Aplicar las tres primeras formas normales y adjuntar el script DDL en PostgreSQL con las claves primarias y foráneas debidamente restringidas.',
      fechaLimite: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // En 7 días
      fichaId: ficha.id,
      instructorId: instructor.id,
    },
    {
      titulo: 'Proyecto Fase 2: Implementación de Patrones Creacionales en Java',
      descripcion:
        'Construir un módulo funcional utilizando Factory Method y Singleton para la gestión de conexiones y logs del sistema. Debe incluir pruebas unitarias con JUnit y cobertura mínima del 80%.',
      fechaLimite: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
      fichaId: ficha.id,
      instructorId: instructor.id,
    },
    {
      titulo: 'Documento de Especificación de Requisitos de Software (SRS)',
      descripcion:
        'Elaborar el documento IEEE 830 con los casos de uso detallados, diagramas de secuencia y matrices de trazabilidad para los módulos de autenticación y matrícula.',
      fechaLimite: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      fichaId: ficha.id,
      instructorId: instructor.id,
    },
    {
      titulo: 'Laboratorio 3: Pipeline de Limpieza y Transformación en Python',
      descripcion:
        'Procesar el dataset de inasistencias académicas utilizando Pandas y NumPy. Tratar valores nulos, eliminar duplicados y exportar el dataset limpio en formato Parquet.',
      fechaLimite: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
      fichaId: ficha.id,
      instructorId: instructor.id,
    },
  ];

  for (const evi of evidenciasData) {
    const existing = await prisma.evidencia.findFirst({
      where: {
        titulo: evi.titulo,
        fichaId: ficha.id,
      },
    });

    if (!existing) {
      const created = await prisma.evidencia.create({
        data: evi,
      });
      console.log(`✅ Evidencia creada en DB: "${created.titulo}" (${created.id})`);
    } else {
      console.log(`ℹ️ Evidencia ya existente: "${existing.titulo}" (${existing.id})`);
    }
  }

  console.log('🎉 ¡Población de datos reales en PostgreSQL completada con éxito!');
}

main()
  .catch((e) => {
    console.error('❌ Error en población de datos:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

