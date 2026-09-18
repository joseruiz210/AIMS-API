const XLSX = require('xlsx');

jest.mock('../../src/config/database', () => ({
  ficha: { findUnique: jest.fn() },
  $transaction: jest.fn(),
}));
jest.mock('../../src/utils/auditLogger', () => jest.fn());
jest.mock('../../src/modules/fichas/repositories/fichaRepository', () => ({}));
jest.mock('../../src/modules/usuarios/repositories/userRepository', () => ({}));

const prisma = require('../../src/config/database');
const fichaService = require('../../src/modules/fichas/services/fichaService');

const csvBuffer = (rows) => {
  const worksheet = XLSX.utils.aoa_to_sheet(rows);
  return XLSX.write({ Sheets: { Ficha: worksheet }, SheetNames: ['Ficha'] }, { type: 'buffer', bookType: 'csv' });
};

describe('Carga de aprendices por ficha', () => {
  beforeEach(() => jest.clearAllMocks());

  test('crea usuarios, matrículas y registro de carga en una transacción', async () => {
    prisma.ficha.findUnique.mockResolvedValue({ id: 'ficha-1', instructorId: 'inst-1' });
    const tx = {
      user: { findMany: jest.fn().mockResolvedValue([]), create: jest.fn().mockResolvedValue({ id: 'user-1' }) },
      matricula: { create: jest.fn().mockResolvedValue({}) },
      cargaAprendices: { create: jest.fn().mockResolvedValue({ id: 'carga-1', totalRows: 1, createdRows: 1 }) },
    };
    prisma.$transaction.mockImplementation((callback) => callback(tx));

    const result = await fichaService.importAprendices('inst-1', 'ficha-1', {
      originalname: 'aprendices.csv',
      buffer: csvBuffer([
        ['tipoDocumento', 'numeroDocumento', 'nombres', 'apellidos', 'correo'],
        ['CC', '1001', 'Ana', 'Perez', 'ana@example.com'],
      ]),
    });

    expect(tx.user.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ isPreRegistered: true }) }));
    expect(tx.matricula.create).toHaveBeenCalledWith({ data: { fichaId: 'ficha-1', aprendizId: 'user-1' } });
    expect(result.id).toBe('carga-1');
  });

  test('rechaza documentos duplicados antes de abrir la transacción', async () => {
    prisma.ficha.findUnique.mockResolvedValue({ id: 'ficha-1', instructorId: 'inst-1' });

    await expect(fichaService.importAprendices('inst-1', 'ficha-1', {
      originalname: 'duplicados.csv',
      buffer: csvBuffer([
        ['tipoDocumento', 'numeroDocumento', 'nombres', 'apellidos', 'correo'],
        ['CC', '1001', 'Ana', 'Perez', 'ana@example.com'],
        ['CC', '1001', 'Luis', 'Diaz', 'luis@example.com'],
      ]),
    })).rejects.toMatchObject({ statusCode: 400 });

    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  test('rechaza al instructor que no está asignado a la ficha', async () => {
    prisma.ficha.findUnique.mockResolvedValue({ id: 'ficha-1', instructorId: 'otro-inst-1' });

    await expect(fichaService.importAprendices('inst-1', 'ficha-1', {
      originalname: 'aprendices.csv',
      buffer: Buffer.from(''),
    })).rejects.toMatchObject({ statusCode: 403 });
  });
});