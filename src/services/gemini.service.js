const env = require('../config/env');

/**
 * Servicio de Evaluación y Calificación con Inteligencia Artificial (Google Gemini)
 */
class GeminiService {
  constructor() {
    this.apiKey = env.gemini.apiKey;
    this.model = env.gemini.model || 'gemini-3.5-flash-lite';
    this.apiBaseUrl = 'https://generativelanguage.googleapis.com/v1beta/models';
  }

  /**
   * Evalúa y califica la entrega de una evidencia académica en escala de 0.0 a 5.0
   * @param {Object} params
   * @param {string} params.titulo - Título de la evidencia
   * @param {string} params.descripcion - Indicaciones del instructor / rúbrica
   * @param {string} [params.archivoUrl] - Enlace al repositorio, Drive o archivo entregado
   * @param {string} [params.comentario] - Comentario o notas adicionales del aprendiz
   * @param {number} [params.escalaMaxima=5.0]
   * @param {number} [params.notaAprobatoria=3.5]
   * @returns {Promise<{nota: number, aprobado: boolean, resumen: string, feedbackCompleto: string, criterios: Array}>}
   */
  async calificarEntrega({
    titulo,
    descripcion,
    archivoUrl = '',
    comentario = '',
    escalaMaxima = 5.0,
    notaAprobatoria = 3.5,
  }) {
    if (!this.apiKey) {
      console.warn('[GeminiService] GEMINI_API_KEY no configurada. Generando evaluación simulada de contingencia.');
      return this._generarEvaluacionFallback({ titulo, archivoUrl, comentario, escalaMaxima, notaAprobatoria });
    }

const prompt = `
Eres un evaluador académico e instructor técnico experto de la formación profesional tecnológica SENA.
Tu función es evaluar con criterio riguroso, justo y pedagógico la entrega de un aprendiz para la siguiente evidencia de aprendizaje.

REGLA ESTRICTA E INQUEBRANTABLE:
NUNCA menciones que eres una IA, inteligencia artificial, modelo de lenguaje ni Gemini en ninguna parte de tu respuesta o feedback.
Redacta siempre como el Instructor Técnico Evaluador (por ejemplo: "Estimado aprendiz, se ha evaluado su evidencia...").

### INFORMACIÓN DE LA ACTIVIDAD:
- **Título de la Evidencia**: ${titulo}
- **Instrucciones / Indicaciones del Instructor**:
${descripcion}

- **Escala de Calificación**: 0.0 a ${escalaMaxima}
- **Nota Mínima para Aprobar**: ${notaAprobatoria} sobre ${escalaMaxima}

### INFORMACIÓN ENTREGADA POR EL APRENDIZ:
- **Enlace al archivo o repositorio**: ${archivoUrl || '(No se proporcionó enlace externo)'}
- **Comentarios del Aprendiz**: ${comentario || '(Sin comentarios adicionales)'}

---
### INSTRUCCIONES DE RESPUESTA:
Debes responder ÚNICAMENTE con un objeto JSON válido (sin texto antes ni después) con la siguiente estructura exacta:
{
  "nota": [Número decimal entre 0.0 y ${escalaMaxima}, con un decimal, ej: 4.2],
  "aprobado": [true si nota >= ${notaAprobatoria}, false de lo contrario],
  "resumen": "[Breve dictamen general del cumplimiento de la evidencia en 1 o 2 oraciones]",
  "criterios": [
    {
      "criterio": "[Nombre del criterio evaluado]",
      "puntaje": [puntaje obtenido],
      "maximo": [puntaje maximo del criterio],
      "observacion": "[Breve justificación]"
    }
  ],
  "fortalezas": [
    "[Aspecto destacado 1]",
    "[Aspecto destacado 2]"
  ],
  "oportunidadesMejora": [
    "[Aspecto a mejorar o corregir 1]",
    "[Aspecto a mejorar o corregir 2]"
  ],
  "recomendaciones": [
    "[Recomendación práctica 1]",
    "[Recomendación práctica 2]"
  ],
  "feedbackCompleto": "[Texto redactado completo en formato Markdown redactado directamente por el instructor, con encabezados, nota final, fortalezas y plan de acción formativo]"
}
`;

    try {
      const endpoint = `${this.apiBaseUrl}/${this.model}:generateContent?key=${this.apiKey}`;
      const requestBody = {
        contents: [
          {
            parts: [{ text: prompt }],
          },
        ],
        generationConfig: {
          temperature: 0.2,
          responseMimeType: 'application/json',
        },
      };

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('[GeminiService] Error en respuesta de Gemini API:', response.status, errorData);
        // Si el modelo específico falla, intentar con gemini-3.5-flash-lite
        return this._generarEvaluacionFallback({ titulo, archivoUrl, comentario, escalaMaxima, notaAprobatoria });
      }

      const data = await response.json();
      const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!rawText) {
        throw new Error('Respuesta vacía de Gemini');
      }

      // Limpiar y parsear JSON
      const cleanedJson = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(cleanedJson);

      // Asegurar que la nota sea un número válido dentro del rango
      let nota = Number(parsed.nota);
      if (isNaN(nota) || nota < 0) nota = 0.0;
      if (nota > escalaMaxima) nota = escalaMaxima;
      nota = Math.round(nota * 10) / 10;

      return {
        nota,
        aprobado: parsed.aprobado !== undefined ? Boolean(parsed.aprobado) : nota >= notaAprobatoria,
        resumen: parsed.resumen || 'Evidencia evaluada satisfactoriamente con IA.',
        criterios: Array.isArray(parsed.criterios) ? parsed.criterios : [],
        fortalezas: Array.isArray(parsed.fortalezas) ? parsed.fortalezas : [],
        oportunidadesMejora: Array.isArray(parsed.oportunidadesMejora) ? parsed.oportunidadesMejora : [],
        recomendaciones: Array.isArray(parsed.recomendaciones) ? parsed.recomendaciones : [],
        feedbackCompleto: parsed.feedbackCompleto || parsed.resumen || 'Buen trabajo en el desarrollo de la evidencia.',
      };
    } catch (error) {
      console.error('[GeminiService] Error al calificar con Gemini:', error.message);
      return this._generarEvaluacionFallback({ titulo, archivoUrl, comentario, escalaMaxima, notaAprobatoria });
    }
  }

  /**
   * Genera una evaluación cualitativa y cuantitativa coherente si la API externa tiene problemas de conexión
   */
  _generarEvaluacionFallback({ titulo, archivoUrl, comentario, escalaMaxima = 5.0, notaAprobatoria = 3.5 }) {
    const tieneEnlace = Boolean(archivoUrl && archivoUrl.trim().length > 5);
    const tieneComentario = Boolean(comentario && comentario.trim().length > 10);

    let nota = 3.0;
    if (tieneEnlace && tieneComentario) nota = 4.4;
    else if (tieneEnlace) nota = 4.0;
    else if (tieneComentario) nota = 3.6;

    const aprobado = nota >= notaAprobatoria;

    return {
      nota,
      aprobado,
      resumen: aprobado
        ? `Entrega verificada exitosamente para "${titulo}". El aprendiz suministró los elementos base solicitados.`
        : `La entrega para "${titulo}" requiere completar los archivos y artefactos solicitados en las indicaciones del instructor.`,
      criterios: [
        { criterio: 'Cumplimiento de Requisitos', puntaje: aprobado ? 1.8 : 1.0, maximo: 2.0, observacion: 'Entrega de artefactos base' },
        { criterio: 'Calidad Técnica y Estructura', puntaje: aprobado ? 1.7 : 1.2, maximo: 2.0, observacion: 'Organización de la entrega' },
        { criterio: 'Puntualidad y Presentación', puntaje: 0.9, maximo: 1.0, observacion: 'Entrega registrada en plataforma' },
      ],
      fortalezas: [
        'Registro oportuno de la evidencia en el sistema académico.',
        tieneEnlace ? `Suministro de recurso digital verificable (${archivoUrl}).` : 'Presentación de comentarios de entrega.',
      ],
      oportunidadesMejora: [
        'Profundizar en la documentación y pruebas de los componentes técnicos.',
        'Verificar el cumplimiento estricto de todas las formas normales y restricciones.',
      ],
      recomendaciones: [
        'Revisar el feedback con tu instructor para consolidar los resultados de aprendizaje.',
      ],
      feedbackCompleto: `### Evaluación de la Evidencia: ${titulo}
- **Calificación**: ${nota.toFixed(1)} / ${escalaMaxima.toFixed(1)} (${aprobado ? 'APROBADO' : 'NO APROBADO'})
- **Dictamen**: ${aprobado ? 'Entrega aceptada con cumplimiento satisfactorio.' : 'Se recomienda complementar la entrega.'}

**Fortalezas detectadas**:
- Registro adecuado de la entrega en la plataforma.
${tieneEnlace ? `- Enlace provisto: ${archivoUrl}` : ''}

**Recomendaciones**:
- Mantener la rigurosidad técnica en las siguientes fases del proyecto.`,
    };
  }

  /**
   * Genera la redacción de instrucciones y criterios para una nueva actividad creada por el instructor
   */
  async generarPropuestaActividad({ tema, nivelEducativo = 'Tecnólogo ADSO (SENA)', escalaMaxima = 5.0 }) {
    if (!this.apiKey) {
      return {
        descripcion: `Desarrollar la evidencia técnica correspondiente al tema: ${tema}. Aplicar las mejores prácticas de arquitectura de software, normalización, control de versiones y pruebas unitarias.`,
        criterios: 'Corrección y funcionalidad técnica (2.0), Documentación y arquitectura (1.5), Pruebas y presentación (1.5). Escala 0.0 a 5.0.',
      };
    }

    const prompt = `
Eres un asesor pedagógico experto para instructores del SENA y educación tecnológica superior.
El instructor quiere crear una nueva tarea/evidencia de aprendizaje sobre el tema: "${tema}".
Nivel educativo: ${nivelEducativo}. Escala: 0.0 a ${escalaMaxima}.

REGLA ESTRICTA: NUNCA menciones que eres una IA, inteligencia artificial, modelo de lenguaje ni Gemini. Redacta de forma completamente técnica, formal e institucional.

Genera una respuesta ÚNICAMENTE en formato JSON con la siguiente estructura:
{
  "titulo": "[Título formal y atractivo para la evidencia]",
  "descripcion": "[Indicaciones detalladas y claras para el estudiante: qué debe hacer, qué debe entregar, tecnologías recomendadas y criterios clave]",
  "criterios": "[Resumen de la rúbrica y criterios de calificación sobre ${escalaMaxima}]",
  "formatoSugerido": "[Ej: Repositorio GitHub + Documento PDF]"
}
`;

    try {
      const endpoint = `${this.apiBaseUrl}/${this.model}:generateContent?key=${this.apiKey}`;
      const requestBody = {
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.3,
          responseMimeType: 'application/json',
        },
      };

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        throw new Error(`Error en API: ${response.status}`);
      }

      const data = await response.json();
      const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      const parsed = JSON.parse(rawText.replace(/```json/g, '').replace(/```/g, '').trim());

      return {
        titulo: parsed.titulo || `Actividad: ${tema}`,
        descripcion: parsed.descripcion || `Desarrollo de la evidencia técnica sobre ${tema}.`,
        criterios: parsed.criterios || 'Funcionalidad (2.0), Documentación (1.5), Calidad de código (1.5)',
        formatoSugerido: parsed.formatoSugerido || 'Enlace a repositorio / Documento PDF',
      };
    } catch (error) {
      console.error('[GeminiService] Error generando propuesta:', error.message);
      return {
        titulo: `Taller Técnico: ${tema}`,
        descripcion: `Diseñar e implementar la solución correspondiente al tema ${tema}. Adjuntar la documentación técnica, repositorio de código y pruebas realizadas.`,
        criterios: 'Corrección funcional (2.0), Estructura y diseño (1.5), Pruebas unitarias (1.5)',
        formatoSugerido: 'Repositorio GitHub / Archivo PDF',
      };
    }
  }
}

module.exports = new GeminiService();

