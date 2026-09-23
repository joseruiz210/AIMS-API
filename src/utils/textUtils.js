/**
 * Utilidades para sanitización y corrección de codificación de texto en el backend.
 */

/**
 * Corrige problemas de doble codificación UTF-8 (mojibake) en strings:
 * "DiseÃ±o" -> "Diseño"
 * "InformaciÃ³n" -> "Información"
 * "AnÃ¡lisis" -> "Análisis"
 */
function fixMojibake(text) {
  if (!text || typeof text !== 'string') return text || '';
  if (!/[ÃÂâ]/.test(text)) return text.trim();

  try {
    const fixed = Buffer.from(text, 'latin1').toString('utf8');
    if (!fixed.includes('\uFFFD')) {
      return fixed.trim();
    }
  } catch (_) {
    // Si Buffer falla, continuar con mapeo explícito
  }

  const map = {
    'Ã¡': 'á',
    'Ã©': 'é',
    'Ã\u00AD': 'í',
    'Ã³': 'ó',
    'Ãº': 'ú',
    'Ã±': 'ñ',
    'Ã¼': 'ü',
    'Ã\u0081': 'Á',
    'Ã\u0089': 'É',
    'Ã\u008D': 'Í',
    'Ã\u0093': 'Ó',
    'Ã\u009A': 'Ú',
    'Ã\u0091': 'Ñ',
    'Ã\u009C': 'Ü',
    'Â¿': '¿',
    'Â¡': '¡',
    'Â°': '°',
  };

  let result = text;
  for (const [bad, good] of Object.entries(map)) {
    result = result.split(bad).join(good);
  }
  return result.trim();
}

module.exports = {
  fixMojibake,
};
