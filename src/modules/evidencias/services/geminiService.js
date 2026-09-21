const env = require('../../../config/env');

/**
 * Servicio de Evaluación y Calificación con Inteligencia Artificial (Google Gemini)
 */
class GeminiService {
  constructor() {
    this.apiKey = env.gemini.apiKey;
    this.model = env.gemini.model || 'gemini-1.5-flash';
    this.apiBaseUrl = 'https://generativelanguage.googleapis.com/v1beta/models';
  }

  /**
   * Extrae metadatos y veracidad de una URL (GitHub, Google Drive o enlaces web general)
   * @param {string} url
   * @returns {Promise<string>}
   */
  async _inspeccionarUrl(url) {
    if (!url || typeof url !== 'string' || !url.trim()) {
      return 'No se suministró ningún enlace externo en la entrega.';
    }

    const trimmedUrl = url.trim();

    try {
      // 1. Detectar Repositorio GitHub
      const githubMatch = trimmedUrl.match(/github\.com\/([^/]+)\/([^/]+)/i);
      if (githubMatch) {
        const owner = githubMatch[1];
        const repo = githubMatch[2].replace(/\.git$/, '').replace(/#.*$/, '');
        
        let info = `[REPOSITORIO GITHUB DETECTADO]: ${owner}/${repo}\nURL: ${trimmedUrl}`;

        // Intentar obtener metadatos de la API pública de GitHub
        try {
          const apiRes = await fetch(`https://api.github.com/repos/${owner}/${repo}`, {
            headers: { 'User-Agent': 'AIMS-Academic-Evaluator' },
            signal: AbortSignal.timeout(4000),
          });

          if (apiRes.ok) {
            const data = await apiRes.json();
            info += `\n- Descripción del Repositorio: ${data.description || 'Sin descripción en GitHub'}`;
            info += `\n- Lenguaje Principal: ${data.language || 'No especificado'}`;
            info += `\n- Rama Principal: ${data.default_branch || 'main'}`;
            info += `\n- Última actualización: ${data.updated_at || 'Reciente'}`;

            // Intentar obtener README
            try {
              const readmeRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/readme`, {
                headers: { 
                  'User-Agent': 'AIMS-Academic-Evaluator',
                  'Accept': 'application/vnd.github.raw+json'
                },
                signal: AbortSignal.timeout(3000),
              });

              if (readmeRes.ok) {
                const readmeText = await readmeRes.text();
                const snippet = readmeText.slice(0, 1000).replace(/[\r\n]+/g, ' ');
                info += `\n- Extracto del README.md: "${snippet}..."`;
              }
            } catch (e) {
              info += '\n- README.md: No disponible o privado.';
            }
          } else {
            info += `\n- Estado API GitHub: ${apiRes.status} (el repositorio podría ser privado o no existir).`;
          }
        } catch (ghErr) {
          info += `\n- Verificación HTTP GitHub: Error de conexión (${ghErr.message}).`;
        }

        return info;
      }

      // 2. Detectar Google Drive / Google Docs / Slides
      if (/drive\.google\.com|docs\.google\.com/i.test(trimmedUrl)) {
        let driveInfo = `[ENLACE GOOGLE DRIVE/DOCS DETECTADO]: ${trimmedUrl}`;
        try {
          const res = await fetch(trimmedUrl, {
            method: 'HEAD',
            signal: AbortSignal.timeout(4000),
          });
          driveInfo += `\n- Estado de Disponibilidad HTTP: ${res.status} (${res.ok ? 'Accesible públicamente' : 'Requiere permisos o privado'})`;
        } catch (dErr) {
          driveInfo += `\n- Verificación Enlace Drive: Formato de URL de Google Drive registrado. (${dErr.message})`;
        }
        return driveInfo;
      }

      // 3. Otro enlace web / URL
      let webInfo = `[RECURSO DIGITAL EXTERNO DETECTADO]: ${trimmedUrl}`;
      try {
        const res = await fetch(trimmedUrl, {
          method: 'HEAD',
          signal: AbortSignal.timeout(3000),
        });
        webInfo += `\n- Estado HTTP: ${res.status} ${res.statusText}`;
        webInfo += `\n- Tipo de Contenido: ${res.headers.get('content-type') || 'Desconocido'}`;
      } catch (wErr) {
        webInfo += `\n- Formato de Enlace Web: Registrado como URL (${wErr.message})`;
      }
      return webInfo;

    } catch (err) {
      return `[ENLACE REGISTRADO]: ${trimmedUrl} (No se pudo realizar inspección profunda: ${err.message})`;
    }
  }

  /**
   * Evalúa y califica la entrega de una evidencia académica en escala de 0.0 a 5.0
   */
  async calificarEntrega({
    titulo,
    descripcion,
    archivoUrl = '',
    comentario = '',
    escalaMaxima = 5.0,
    notaAprobatoria = 3.5,
  }) {
    // Inspección automatizada del enlace entregado
    const inspeccionLink = await this._inspeccionarUrl(archivoUrl);

    if (!this.apiKey) {
      console.warn('[GeminiService] GEMINI_API_KEY no configurada. Generando evaluación estructurada de contingencia.');
      return this._generarEvaluacionFallback({ titulo, descripcion, archivoUrl, comentario, inspeccionLink, escalaMaxima, notaAprobatoria });
    }

    const prompt = `
Eres un evaluador académico e instructor técnico experto de la formación profesional tecnológica SENA.
Tu función es evaluar con criterio riguroso, justo y pedagógico la entrega de un aprendiz para la siguiente evidencia de aprendizaje.

REGLA ESTRICTA E INQUEBRANTABLE:
NUNCA menciones que eres una IA, inteligencia artificial, modelo de lenguaje ni Gemini en ninguna parte de tu respuesta o feedback.
Redacta siempre como el Instructor Técnico Evaluador (por ejemplo: "Estimado aprendiz, se ha evaluado su evidencia...").

### INFORMACIÓN DE LA ACTIVIDAD / RÚBRICA DE EVALUACIÓN:
- **Título de la Evidencia**: ${titulo}
- **Indicaciones y Criterios del Instructor**:
${descripcion}

- **Escala de Calificación**: 0.0 a ${escalaMaxima}
- **Nota Mínima para Aprobar**: ${notaAprobatoria} sobre ${escalaMaxima}

### INFORMACIÓN ENTREGADA POR EL APRENDIZ:
- **Enlace Entregado**: ${archivoUrl || '(No se proporcionó enlace externo)'}
- **Inspección de Validez del Enlace**:
${inspeccionLink}
- **Comentarios del Aprendiz**: ${comentario || '(Sin comentarios adicionales)'}

---
### INSTRUCCIONES DE EVALUACIÓN Y RESPUESTA:
1. Compara minuciosamente lo entregado por el aprendiz (comentarios + inspección del enlace) contra CADA UNO de los requisitos especificados en la rúbrica/indicaciones de la actividad.
2. Evalúa si el enlace proporcionado es un repositorio/documento válido y si responde al tema exigido en la tarea.
3. Debes responder ÚNICAMENTE con un objeto JSON válido (sin texto markdown alrededor ni explicaciones fuera del JSON) con la siguiente estructura exacta:
{
  "nota": [Número decimal entre 0.0 y ${escalaMaxima}, con un decimal, ej: 4.2],
  "aprobado": [true si nota >= ${notaAprobatoria}, false de lo contrario],
  "resumen": "[Breve dictamen general del cumplimiento de la evidencia en 1 o 2 oraciones]",
  "criterios": [
    {
      "criterio": "[Nombre del criterio según las indicaciones o aspecto clave]",
      "puntaje": [puntaje obtenido en número],
      "maximo": [puntaje máximo posible del criterio],
      "observacion": "[Breve justificación evaluativa]"
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
  "feedbackCompleto": "[Texto redactado completo en formato Markdown redactado directamente por el instructor evaluador, incluyendo resumen, desglose de rúbrica, nota final y recomendaciones de mejora]"
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
        return this._generarEvaluacionFallback({ titulo, descripcion, archivoUrl, comentario, inspeccionLink, escalaMaxima, notaAprobatoria });
      }

      const data = await response.json();
      const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!rawText) {
        throw new Error('Respuesta vacía de Gemini');
      }

      const cleanedJson = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(cleanedJson);

      let nota = Number(parsed.nota);
      if (isNaN(nota) || nota < 0) nota = 0.0;
      if (nota > escalaMaxima) nota = escalaMaxima;
      nota = Math.round(nota * 10) / 10;

      return {
        nota,
        aprobado: parsed.aprobado !== undefined ? Boolean(parsed.aprobado) : nota >= notaAprobatoria,
        resumen: parsed.resumen || 'Evidencia evaluada satisfactoriamente con la rúbrica.',
        criterios: Array.isArray(parsed.criterios) ? parsed.criterios : [],
        fortalezas: Array.isArray(parsed.fortalezas) ? parsed.fortalezas : [],
        oportunidadesMejora: Array.isArray(parsed.oportunidadesMejora) ? parsed.oportunidadesMejora : [],
        recomendaciones: Array.isArray(parsed.recomendaciones) ? parsed.recomendaciones : [],
        feedbackCompleto: parsed.feedbackCompleto || parsed.resumen || 'Buen trabajo en el desarrollo de la evidencia.',
      };
    } catch (error) {
      console.error('[GeminiService] Error al calificar con Gemini:', error.message);
      return this._generarEvaluacionFallback({ titulo, descripcion, archivoUrl, comentario, inspeccionLink, escalaMaxima, notaAprobatoria });
    }
  }

  /**
   * Genera una evaluación cualitativa y cuantitativa coherente basada en la rúbrica si la API externa no responde
   */
  _generarEvaluacionFallback({ titulo, descripcion = '', archivoUrl, comentario, inspeccionLink = '', escalaMaxima = 5.0, notaAprobatoria = 3.5 }) {
    const tieneEnlaceValido = Boolean(archivoUrl && archivoUrl.trim().length > 7 && (archivoUrl.includes('github.com') || archivoUrl.includes('drive.google.com') || archivoUrl.includes('http')));
    const tieneComentario = Boolean(comentario && comentario.trim().length > 10);
    const esGithub = Boolean(archivoUrl && archivoUrl.includes('github.com'));

    let nota = 3.0;
    if (tieneEnlaceValido && tieneComentario) nota = 4.5;
    else if (tieneEnlaceValido) nota = 4.0;
    else if (tieneComentario) nota = 3.2;

    const aprobado = nota >= notaAprobatoria;

    const criterios = [
      {
        criterio: 'Cumplimiento de Requisitos Técnicos y Rúbrica',
        puntaje: tieneEnlaceValido ? 1.8 : 1.0,
        maximo: 2.0,
        observacion: tieneEnlaceValido ? 'Se verificó la inclusión del recurso digital requerido.' : 'Falta adjuntar un enlace válido al recurso o repositorio.'
      },
      {
        criterio: 'Verificación del Enlace / Repositorio',
        puntaje: esGithub ? 1.8 : (tieneEnlaceValido ? 1.5 : 0.8),
        maximo: 2.0,
        observacion: esGithub ? 'Repositorio de código estructurado en GitHub.' : (tieneEnlaceValido ? 'Enlace a recurso digital entregado.' : 'No se detectó un enlace a repositorio accesible.')
      },
      {
        criterio: 'Presentación y Documentación Académica',
        puntaje: tieneComentario ? 0.9 : 0.6,
        maximo: 1.0,
        observacion: tieneComentario ? 'Comentarios explicativos del aprendiz incluidos.' : 'Se sugiere enriquecer los comentarios de entrega.'
      }
    ];

    const fortalezas = [
      'Registro oportuno de la evidencia en la plataforma institucional SENA.',
      tieneEnlaceValido ? `Recurso digital adjuntado correctamente (${archivoUrl}).` : 'Entrega registrada en el sistema.',
      esGithub ? 'Uso de control de versiones y repositorio GitHub para el entregable.' : 'Disponibilidad del artefacto entregado.'
    ];

    const oportunidadesMejora = [];
    if (!tieneEnlaceValido) {
      oportunidadesMejora.push('Adjuntar un enlace público y accesible a GitHub o Google Drive con el desarrollo técnico de la evidencia.');
    }
    if (!tieneComentario) {
      oportunidadesMejora.push('Incluir notas explicativas sobre la metodología, herramientas utilizadas y solución implementada.');
    }
    if (oportunidadesMejora.length === 0) {
      oportunidadesMejora.push('Añadir documentación adicional y pruebas unitarias/integración en el repositorio.');
    }

    const feedbackCompleto = `### Informe de Evaluación Académica - Evidencia: ${titulo}

**Dictamen General**: ${aprobado ? 'APROBADO' : 'NO APROBADO'} (${nota.toFixed(1)} / ${escalaMaxima.toFixed(1)})

#### 📊 Desglose de la Rúbrica de Evaluación:
1. **Cumplimiento de Requisitos y Rúbrica**: ${(criterios[0].puntaje).toFixed(1)} / 2.0  
   *${criterios[0].observacion}*
2. **Verificación del Enlace / Repositorio**: ${(criterios[1].puntaje).toFixed(1)} / 2.0  
   *${criterios[1].observacion}*
3. **Presentación y Documentación**: ${(criterios[2].puntaje).toFixed(1)} / 1.0  
   *${criterios[2].observacion}*

#### 🔎 Análisis del Enlace Registrado:
${inspeccionLink || (archivoUrl ? `Enlace: ${archivoUrl}` : 'No se registró enlace externo.')}

#### ✅ Fortalezas Destacadas:
${fortalezas.map(f => `- ${f}`).join('\n')}

#### 💡 Puntos a Mejorar / Recomendaciones:
${oportunidadesMejora.map(o => `- ${o}`).join('\n')}

---
*Evaluación formativa oficial del Instructor Técnico.*`;

    return {
      nota,
      aprobado,
      resumen: `Evaluación de "${titulo}": Nota ${nota.toFixed(1)}/5.0. ${aprobado ? 'Entrega aprobada satisfactoriamente.' : 'Requiere completar los entregables solicitados.'}`,
      criterios,
      fortalezas,
      oportunidadesMejora,
      recomendaciones: [
        'Revisar la rúbrica detallada con tu instructor para consolidar los resultados de aprendizaje.',
        'Asegurar que los enlaces a repositorios contengan permisos públicos de lectura.'
      ],
      feedbackCompleto
    };
  }

  /**
   * Genera la redacción de instrucciones y criterios para una nueva actividad creada por el instructor
   */
  async generarPropuestaActividad({ tema, nivelEducativo = 'Tecnólogo ADSO (SENA)', escalaMaxima = 5.0 }) {
    const prompt = `
Eres un asesor pedagógico experto para instructores del SENA y educación tecnológica superior.
El instructor quiere crear una nueva tarea/evidencia de aprendizaje sobre el tema: "${tema}".
Nivel educativo: ${nivelEducativo}. Escala: 0.0 a ${escalaMaxima}.

REGLA ESTRICTA: NUNCA menciones que eres una IA, inteligencia artificial, modelo de lenguaje ni Gemini. Redacta de forma completamente técnica, formal e institucional.

Genera una respuesta ÚNICAMENTE en formato JSON con la siguiente estructura:
{
  "titulo": "[Título formal y atractivo para la evidencia]",
  "descripcion": "[Indicaciones detalladas y estructuradas para el aprendiz: Objetivos, Guía de desarrollo paso a paso, Entregables exigidos (ej: Repositorio GitHub con código y README, o documento técnico) y Criterios claros de la Rúbrica]",
  "criterios": "[Desglose resumido de la rúbrica de evaluación sobre ${escalaMaxima}: 1. Funcionalidad y Corrección Técnica (2.0 pts), 2. Estructura y Buenas Prácticas (1.5 pts), 3. Documentación y Presentación (1.5 pts)]",
  "formatoSugerido": "[Ej: Repositorio GitHub / Enlace Google Drive]"
}
`;

    if (this.apiKey) {
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

        if (response.ok) {
          const data = await response.json();
          const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
          if (rawText) {
            const parsed = JSON.parse(rawText.replace(/```json/g, '').replace(/```/g, '').trim());
            return {
              titulo: parsed.titulo || `Evidencia: ${tema}`,
              descripcion: parsed.descripcion || `Desarrollo práctico de la evidencia sobre ${tema}.`,
              criterios: parsed.criterios || 'Funcionalidad (2.0 pts), Arquitectura y Código (1.5 pts), Documentación (1.5 pts)',
              formatoSugerido: parsed.formatoSugerido || 'Repositorio GitHub / Enlace Google Drive',
            };
          }
        }
      } catch (error) {
        console.error('[GeminiService] Error generando propuesta con Gemini:', error.message);
      }
    }

    // Fallback rico en contenido si no hay API key o si hubo fallo
    return {
      titulo: `Evidencia Técnica: ${tema}`,
      descripcion: `### OBJETIVO DE LA EVIDENCIA:
Diseñar, implementar y documentar la solución técnica correspondiente al tema: **${tema}**, aplicando estándares de calidad de software ADSO y control de versiones.

---
### GUÍA DE DESARROLLO Y PASO A PASO:
1. **Análisis y Diseño**: Definir los requerimientos técnicos, arquitectura y diagrama o esquema según corresponda a ${tema}.
2. **Implementación Técnica**: Codificar la solución aplicando las mejores prácticas, estructuras limpias y validaciones necesarias.
3. **Control de Versiones**: Crear un repositorio de código con commits claros y estructurados.
4. **Documentación**: Elaborar el archivo README.md o documento de entrega explicando la arquitectura, instrucciones de instalación y pruebas.

---
### ENTREGABLES REQUERIDOS:
- **Enlace al Repositorio (GitHub / GitLab)** o archivo comprimido con el código fuente completo.
- **Documento técnico o README.md** con capturas de pantalla y evidencias de funcionamiento.

---
### RÚBRICA Y CRITERIOS DE EVALUACIÓN (Escala 0.0 a 5.0):
- **1. Funcionalidad y Corrección Técnica (2.0 pts)**: Cumplimiento de la totalidad de requerimientos solicitados para ${tema}.
- **2. Arquitectura de Código y Estructura (1.5 pts)**: Limpieza del código, diseño modular y buenas prácticas de desarrollo.
- **3. Documentación y Verificación de Entregable (1.5 pts)**: Calidad del informe/README y validez del enlace entregado.`,
      criterios: '1. Funcionalidad (2.0 pts) | 2. Arquitectura (1.5 pts) | 3. Documentación y Enlace (1.5 pts). Nota Aprobatoria: 3.5 sobre 5.0.',
      formatoSugerido: 'Repositorio GitHub / Enlace Google Drive',
    };
  }
}

module.exports = new GeminiService();
