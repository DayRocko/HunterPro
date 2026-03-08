import { GoogleGenAI, Type } from "@google/genai";
import { Vacancy, ParsedCV, MatchAnalysis } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const PROMPT_MAESTRO = `
SYSTEM PROMPT — HUNTERPRO AI ENGINE v3.0 (JOB INTELLIGENCE & CAREER COPILOT)
Eres HunterPro AI, un especialista híbrido en inteligencia del mercado laboral, interacción conversacional avanzada y optimización de perfiles profesionales.

Tu rol combina tres capacidades principales:
1. Investigación laboral avanzada: Búsquedas precisas y verificadas de vacantes laborales.
2. Especialista en interacción conversacional: Simulación de entrevistas, diseño de guías personalizadas y mejora estratégica de perfiles.
3. Copiloto de carrera profesional: Análisis de CVs, optimización de LinkedIn, evaluación de compatibilidad y recomendaciones de empleabilidad.

PRINCIPIOS QUE RIGEN TU ANÁLISIS:
1. Siempre lees el perfil completo del candidato antes de evaluar cualquier vacante.
2. Distingues entre experiencia demostrada, experiencia potencial y brechas reales.
3. Tu escritura es profesional, directa y adaptada al tono de la empresa evaluada.
4. Cuando das un puntaje, siempre lo acompañas de razonamiento lógico y accionable.
5. No inflas resultados: un 60% con razonamiento honesto vale más que un 90% vacío.
6. Tu idioma de trabajo es el español. Piensas, evalúas y escribes en español.
7. Analizas la "Cultura" de Ventas: Detectas si la vacante es para un Hunter (cazador) o un Farmer (mantenimiento) y lo comparas con la experiencia histórica.
8. Cruce de Datos Externos: Infieres metodologías usadas por empresas anteriores del candidato para ver si coinciden con la vacante nueva.

REGLAS ESTRICTAS Y ABSOLUTAS:
1. NUNCA inventes información de contacto (correos, teléfonos, LinkedIn). Si no la encuentras mediante búsqueda, indica "No encontrado".
2. NUNCA muestres vacantes que exijan inglés avanzado si el usuario no lo permite explícitamente.
3. NUNCA muestres vacantes con salarios inferiores a $4.000.000 COP (o equivalente).
4. SIEMPRE prioriza posiciones 100% en español para el mercado hispanohablante (Latam/España).
5. Tu tono debe ser el de un consultor senior de RRHH y Headhunter Tech/SaaS con 15 años de experiencia.
`;

export async function searchVacancies(filters: any, cvText?: string): Promise<Vacancy[]> {
  const prompt = `
Eres HunterPro Colombia Edition, un agente de inteligencia artificial especializado en reclutamiento comercial B2B de alto valor. Tu enfoque principal es Colombia: empresas colombianas, empresas internacionales con operaciones en Colombia, y roles 100% remotos que contraten talento colombiano.

Filtros actuales:
- Alcance: ${filters.countries.join(', ')}
- Modalidad: ${filters.modalities.join(', ')} (No importa si es presencial o remoto)
- Salario mínimo: ${filters.minSalary} COP (Solo básico)
- Roles buscados: ${filters.roles.join(', ')}
- Seniority: ${filters.seniority.join(', ')}
- Idioma: ${filters.spanishOnly ? 'SOLO 100% ESPAÑOL. DESCARTA CUALQUIER VACANTE QUE MENCIONE INGLÉS.' : filters.maxEnglishA2 ? 'Inglés máximo A2. Descarta si exige B1, B2, C1 o Advanced English.' : 'Cualquier nivel de inglés permitido.'}

REGLAS ESTRICTAS Y OBLIGATORIAS:
- SALARIO: NUNCA mostrar vacantes con salario base inferior a $4.000.000 COP mensual (o equivalente).
- IDIOMA (Filtro Idiomático Inteligente): Sigue estrictamente la regla de idioma definida arriba. Analiza semánticamente si el requisito es "deseable" o "excluyente".
- ANTIGÜEDAD: NUNCA mostrar vacantes publicadas hace más de 2 meses (60 días). Solo ofertas recientes.
- MODALIDAD: No importa si es presencial, híbrido o remoto.
- PRIORIDAD: Empresas con sede en Colombia o empresas globales que contraten talento colombiano.
- NUNCA mostrar vacantes de nivel Junior o Trainee.
- Solo vacantes del área comercial/ventas o RevOps.

CATEGORÍAS Y VARIANTES DE PUESTOS A BUSCAR:

Para Comercial:
1. Perfiles de Prospección (Abren el negocio): SDR (Sales Development Representative), BDR (Business Development Representative), Inside Sales Representative, Lead Generation Specialist.
2. Perfiles de Cierre (Cierran el contrato): Account Executive (AE), Ejecutivo Comercial, Asesor Comercial, Sales Specialist.
3. Perfiles de Cuentas Estratégicas (Peces Gordos): Key Account Manager (KAM), Enterprise Account Executive.
4. Perfiles de Mantenimiento y Crecimiento (Post-Venta): Account Manager (AM), Customer Success Associate, Farmer.

Para RevOps (Revenue Operations):
Revenue Operations Specialist, Sales Operations Analyst (SalesOps), CRM Administrator, Commercial Strategy Analyst, Marketing Operations Coordinator (MarketingOps), Business Process Analyst, Data & Insights Specialist, Revenue Operations Analyst, Customer Success Operations Specialist, Revenue Enablement Specialist, Growth Operations Analyst, RevOps Data Analyst, Go-To-Market Operations (GTM Operations) Specialist, Commercial Operations Analyst, Business Operations Analyst.

ESTRATEGIA DE BÚSQUEDA (Deep Search & Maps Integration):
Aplica búsquedas profundas:
1. "Haz una búsqueda profunda" / "Deep search" / "Deep dive": Activa análisis más exhaustivo, cruzando varias fuentes.
2. "Haz una búsqueda ampliada en múltiples fuentes": Pide no solo una consulta superficial sino varias rutas de información.
3. "Haz una búsqueda a nivel experto" / "Expert-level research": Prioriza rigor, precisión, detalles y datos técnicos.
4. "Haz un análisis exhaustivo" / "Exhaustive analysis": Ideal para no perder datos relevantes.
5. "Verifica con fuentes actualizadas" / "Use up-to-date sources": Fuerza al modelo a usar herramientas de búsqueda recientes.
6. "Busca patrones, tendencias y datos ocultos": Ve más allá de la primera capa de resultados.
7. "Haz una búsqueda comparativa entre diferentes sitios": Obliga a contrastar.
8. "Incluye datos verificables y fuentes concretas": Cita y no inventes.
9. "Explora bases de datos especializadas": Busca lugares más allá de Google.
10. "Dame resultados con contexto histórico y actual": Profundidad temporal.

Busca exhaustivamente en los siguientes portales:
- elempleo.com (Colombia)
- computrabajo.com/co (Colombia)
- magneto365.com
- linkedin.com/jobs (LinkedIn en español)
- indeed.com/co (Indeed en español)
- torre.ai
- getonbrd.com
- ihispano.com (iHispano - Hispanic Career Network)
- hirelatinos.org (United Latino Job Bank)
- hispanic-jobs.com (Hispanic-Jobs.com)
- hispanicjobs.com (HispanicJobs.com)
- saludos.com (Saludos.com)
- diversityjobs.com/hispanic-latinx/ (DiversityJobs – Hispanic/Latinx)
- virtuallatinos.com (Virtual Latinos)
- infojobs.net (InfoJobs)
- occ.com.mx (OCCMundial - México)
- bumeran.com (Bumeran - LATAM)
- zonajobs.com (Zonajobs)
- buscojobs.com (BuscoJobs)
- glassdoor.com.mx (Glassdoor en español)
- trabajo.org (Trabajo.org)
- turijobs.com (Turijobs - sector turismo)
- jobomas.com (Jobomas)
- co.jobsora.com (Jobsora)
- co.jooble.org (Jooble LATAM/ES)

Ejecuta queries específicas para los roles mencionados arriba.
Para cada empresa encontrada, busca noticias recientes (ej. "¿Recibieron inversión?", "Expansión en Latam") para priorizar vacantes estables y pon este resumen en "companyInsights".
Mapea todos los portales donde encuentres la vacante. Si la encuentras en un solo portal, indícalo. Llena el campo "mappedPortals" con la lista de portales donde se encontró.

ESTRATEGIA PARA ENCONTRAR AL RECLUTADOR (Extracción de Contacto 360°):
- Debes hacer un esfuerzo activo por encontrar quién es el reclutador de la vacante.
- Busca en LinkedIn: "[nombre empresa] recruiter OR talent acquisition OR HRBP Colombia"
- Extrae el nombre completo y la URL exacta del perfil de LinkedIn del reclutador.
- Simula técnicas de OSINT / Apollo / Hunter.io: infiere el email corporativo (ej. nombre.apellido@empresa.com) y busca un número de teléfono si es público.
- NUNCA inventes nombres. Si no lo encuentras tras buscar, pon "No identificado".

Devuelve un JSON con un array de vacantes.
`;

  const response = await ai.models.generateContent({
    model: "gemini-3.1-pro-preview",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            id: { type: Type.STRING },
            title: { type: Type.STRING },
            company: { type: Type.STRING },
            location: { type: Type.STRING },
            modality: { type: Type.STRING },
            contractType: { type: Type.STRING },
            salary: { type: Type.STRING },
            publishedDate: { type: Type.STRING },
            applicationLink: { type: Type.STRING },
            description: { type: Type.STRING },
            requirements: { type: Type.ARRAY, items: { type: Type.STRING } },
            stack: { type: Type.ARRAY, items: { type: Type.STRING } },
            companyInsights: { type: Type.STRING, description: "Noticias recientes o datos clave de la empresa (ej. rondas de inversión, estabilidad)." },
            mappedPortals: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Lista de portales donde se encontró la vacante. Si es solo uno, pon ese único portal." },
            recruiter: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                email: { type: Type.STRING },
                linkedin: { type: Type.STRING },
                company: { type: Type.STRING },
                phone: { type: Type.STRING }
              }
            }
          },
          required: ["id", "title", "company", "location", "modality", "salary", "applicationLink", "description", "recruiter"]
        }
      }
    }
  });

  let vacancies: Vacancy[] = [];
  try {
    vacancies = JSON.parse(response.text || "[]");
  } catch (e) {
    console.error("Error parsing vacancies", e);
  }

  if (cvText && vacancies.length > 0) {
    // Calculate match score for each vacancy
    for (const vac of vacancies) {
      vac.matchAnalysis = await calculateMatch(cvText, vac);
    }
  }

  return vacancies;
}

export async function parseCV(fileText: string): Promise<ParsedCV> {
  const prompt = `
Analiza esta hoja de vida de forma exhaustiva y extrae la información estructurada.
Realiza un Análisis Multimodal (inferido a partir de la estructura del texto):
Entiende las jerarquías profesionales, la progresión de carrera y la calidad estructural del perfil.

CV:
${fileText}
  `;

  const response = await ai.models.generateContent({
    model: "gemini-3.1-pro-preview",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING },
          email: { type: Type.STRING },
          phone: { type: Type.STRING },
          linkedin: { type: Type.STRING },
          summary: { type: Type.STRING },
          experience: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { company: { type: Type.STRING }, role: { type: Type.STRING }, description: { type: Type.STRING } } } },
          education: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { institution: { type: Type.STRING }, degree: { type: Type.STRING } } } },
          skills: { type: Type.ARRAY, items: { type: Type.STRING } },
          softSkills: { type: Type.ARRAY, items: { type: Type.STRING } },
          metrics: { type: Type.ARRAY, items: { type: Type.STRING } },
          englishLevel: { type: Type.STRING },
          sectors: { type: Type.ARRAY, items: { type: Type.STRING } },
          seniority: { type: Type.STRING }
        }
      }
    }
  });

  const parsed = JSON.parse(response.text || "{}");
  parsed.rawText = fileText;
  return parsed;
}

async function calculateMatch(cvText: string, vacancy: any): Promise<MatchAnalysis> {
  const prompt = `
MÓDULO: MATCH_ENGINE
USER:
Analiza la compatibilidad entre el siguiente candidato y la vacante. Tu análisis debe ser profundo,
no superficial. Lee el CV completo y la descripción completa antes de evaluar.

Instrucciones de Análisis Profundo:
1. FÓRMULA DE MATCHING OBLIGATORIA: Skills (40%), Experiencia (30%), Industria (10%), Herramientas (10%), Idioma (10%).
2. Cruce de Datos Externos: Si el CV menciona empresas específicas, infiere qué tipo de metodología usan y compáralo con la vacante.
3. Análisis de "Cultura" de Ventas: Detecta si la vacante es para un Hunter (cazador) o un Farmer (mantenimiento) y compáralo con la experiencia histórica del candidato.

CV DEL CANDIDATO:
${cvText}

DESCRIPCIÓN DE LA VACANTE:
${JSON.stringify(vacancy)}
  `;

  const response = await ai.models.generateContent({
    model: "gemini-3.1-pro-preview",
    contents: prompt,
    config: {
      systemInstruction: PROMPT_MAESTRO,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          score_total: { type: Type.NUMBER, description: "0-100" },
          breakdown: {
            type: Type.OBJECT,
            properties: {
              experiencia: { type: Type.NUMBER },
              habilidades: { type: Type.NUMBER },
              seniority: { type: Type.NUMBER },
              logros: { type: Type.NUMBER },
              keywords: { type: Type.NUMBER },
              formacion: { type: Type.NUMBER }
            }
          },
          razonamiento: { type: Type.STRING, description: "texto explicando el score en 3-4 oraciones" },
          cultura_ventas: { type: Type.STRING, description: "Análisis de alineación Hunter vs Farmer" },
          fortalezas: { type: Type.ARRAY, items: { type: Type.STRING } },
          brechas: { type: Type.ARRAY, items: { type: Type.STRING } },
          recomendaciones: { type: Type.ARRAY, items: { type: Type.STRING } }
        }
      }
    }
  });

  const data = JSON.parse(response.text || "{}");
  
  // Map to the existing MatchAnalysis interface
  return {
    score: data.score_total || 0,
    label: data.score_total >= 80 ? 'Excelente' : data.score_total >= 60 ? 'Bueno' : 'Bajo',
    breakdown: {
      experience: data.breakdown?.experiencia || 0,
      skills: data.breakdown?.habilidades || 0,
      industry: data.breakdown?.keywords || 0,
      seniority: data.breakdown?.seniority || 0,
      tools: data.breakdown?.formacion || 0
    },
    missingSkills: data.brechas || [],
    matchingStrengths: data.fortalezas || [],
    recommendation: data.razonamiento || '',
    cultureFit: data.cultura_ventas || ''
  };
}

export async function generateCoverLetter(cvText: string, vacancy: Vacancy): Promise<string> {
  const prompt = `
MÓDULO: COVER_LETTER_ENGINE
USER:
Redacta una carta de presentación profesional en español para el siguiente candidato.
La carta debe sonar humana, persuasiva y alineada al tono real de la empresa.
NO uses frases genéricas como 'soy una persona proactiva y con capacidad de trabajo en equipo'.
CADA párrafo debe referenciar algo concreto del CV o de la vacante.

DATOS DEL CANDIDATO (del CV): ${cvText}
VACANTE A LA QUE APLICA: ${JSON.stringify(vacancy)}
NOMBRE DEL RECLUTADOR (si disponible): ${vacancy.recruiter?.name || 'Equipo de Selección'}
EMPRESA: ${vacancy.company}
Longitud: 3 párrafos. Directa al grano. Sin relleno.
  `;

  const response = await ai.models.generateContent({
    model: "gemini-3.1-pro-preview",
    contents: prompt,
    config: {
      systemInstruction: PROMPT_MAESTRO,
    }
  });

  return response.text || "";
}

export async function optimizeCV(cvText: string, vacancy: Vacancy): Promise<any> {
  const prompt = `
MÓDULO: CV_WRITER
USER:
Analiza el siguiente CV y propone optimizaciones específicas para la vacante indicada.
Tu rol es el de un consultor de empleabilidad senior que conoce el mercado hispanohablante.

CV ACTUAL DEL CANDIDATO: ${cvText}
VACANTE OBJETIVO: ${JSON.stringify(vacancy)}
  `;

  const response = await ai.models.generateContent({
    model: "gemini-3.1-pro-preview",
    contents: prompt,
    config: {
      systemInstruction: PROMPT_MAESTRO,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          resumen_profesional_sugerido: { type: Type.STRING },
          bullets_a_reescribir: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                original: { type: Type.STRING },
                mejorado: { type: Type.STRING },
                razon: { type: Type.STRING }
              }
            }
          },
          logros_a_agregar: { type: Type.ARRAY, items: { type: Type.STRING } },
          orden_secciones_recomendado: { type: Type.ARRAY, items: { type: Type.STRING } },
          observaciones_generales: { type: Type.STRING }
        }
      }
    }
  });

  return JSON.parse(response.text || "{}");
}

export async function decodeJob(vacancy: Vacancy): Promise<any> {
  const prompt = `
MÓDULO: JOB_DECODER
USER:
Decodifica la siguiente descripción de vacante con razonamiento profundo.
Ve más allá de lo literal: interpreta lo que la empresa realmente necesita.

DESCRIPCIÓN DE LA VACANTE: ${JSON.stringify(vacancy)}
  `;

  const response = await ai.models.generateContent({
    model: "gemini-3.1-pro-preview",
    contents: prompt,
    config: {
      systemInstruction: PROMPT_MAESTRO,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          que_buscan_realmente: { type: Type.STRING },
          habilidades_diferenciadores: { type: Type.ARRAY, items: { type: Type.STRING } },
          nivel_seniority_real: { type: Type.STRING },
          preguntas_entrevista_probables: { type: Type.ARRAY, items: { type: Type.STRING } },
          senales_positivas: { type: Type.ARRAY, items: { type: Type.STRING } },
          senales_de_alerta: { type: Type.ARRAY, items: { type: Type.STRING } }
        }
      }
    }
  });

  return JSON.parse(response.text || "{}");
}

export async function generateRecruiterMessage(vacancy: Vacancy, cvText: string, matchScore: number): Promise<string> {
  const prompt = `
  MÓDULO: RECRUITER_MESSAGE_GENERATOR
  USER:
  Actúa como un Especialista en Interacción Conversacional.
  Escribe un mensaje altamente persuasivo, profesional y conciso para enviar al reclutador de esta vacante (por LinkedIn o Email).
  
  El candidato tiene un ${matchScore}% de compatibilidad con la vacante.
  
  Vacante:
  Cargo: ${vacancy.title}
  Empresa: ${vacancy.company}
  Reclutador: ${vacancy.recruiter?.name || 'Equipo de Selección'}
  
  CV del Candidato (para extraer 2-3 puntos clave de valor):
  ${cvText}
  
  El mensaje debe:
  - Ser directo (máximo 3-4 párrafos cortos).
  - Mencionar el alto nivel de match.
  - Destacar 1 o 2 logros del CV que resuelvan un dolor probable de la empresa.
  - Terminar con un Call to Action (CTA) claro para una llamada de 10 minutos.
  - Tono: Seguro, profesional, orientado a resultados (estilo ventas B2B).
  
  Devuelve solo el cuerpo del mensaje en Markdown.
  `;

  const response = await ai.models.generateContent({
    model: "gemini-3.1-pro-preview",
    contents: prompt,
    config: { systemInstruction: PROMPT_MAESTRO }
  });

  return response.text || "No se pudo generar el mensaje.";
}

export async function simulateInterview(vacancy: Vacancy, cvText: string): Promise<string> {
  const prompt = `
  MÓDULO: INTERVIEW_SIMULATOR
  USER:
  Actúa como un Headhunter y Especialista en Interacción Conversacional.
  Genera una simulación de entrevista y guía de preparación para el candidato que aplicará a esta vacante.
  
  Vacante:
  Cargo: ${vacancy.title}
  Empresa: ${vacancy.company}
  Descripción: ${vacancy.description}
  
  CV del Candidato:
  ${cvText}
  
  Proporciona en formato Markdown:
  1. **Análisis del Entrevistador:** ¿Qué buscará evaluar el reclutador de ${vacancy.company} para este rol?
  2. **5 Preguntas Difíciles / Técnicas:** Basadas en los requisitos de la vacante y los posibles "huecos" en el CV del candidato.
  3. **Estrategia de Respuesta (Framework STAR):** Cómo debería el candidato estructurar sus respuestas basándose en su experiencia real.
  4. **Preguntas para hacerle al Reclutador:** 3 preguntas inteligentes y estratégicas que el candidato debe hacer al final de la entrevista para demostrar autoridad y visión de negocio.
  `;

  const response = await ai.models.generateContent({
    model: "gemini-3.1-pro-preview",
    contents: prompt,
    config: { systemInstruction: PROMPT_MAESTRO }
  });

  return response.text || "No se pudo generar la simulación.";
}

export async function improveLinkedInProfile(cvText: string): Promise<string> {
  const prompt = `
  MÓDULO: LINKEDIN_OPTIMIZER
  USER:
  Actúa como un Copiloto de Carrera Profesional experto en marca personal B2B.
  Analiza el siguiente CV y genera una guía paso a paso para optimizar el perfil de LinkedIn del candidato, atrayendo a reclutadores del sector SaaS/Tech.
  
  CV del Candidato:
  ${cvText}
  
  Proporciona en formato Markdown:
  1. **Headline (Titular) Optimizado:** 3 opciones atractivas y ricas en palabras clave.
  2. **Sección "Acerca de" (About):** Un borrador persuasivo que cuente la historia profesional del candidato, enfocado en logros y propuesta de valor.
  3. **Optimización de Experiencia:** Cómo transformar las descripciones de sus roles actuales en logros cuantificables (dar 3 ejemplos concretos basados en su CV).
  4. **Palabras Clave (Skills):** Las 10 habilidades principales que debe fijar en su perfil.
  `;

  const response = await ai.models.generateContent({
    model: "gemini-3.1-pro-preview",
    contents: prompt,
    config: { systemInstruction: PROMPT_MAESTRO }
  });

  return response.text || "No se pudo generar la guía de LinkedIn.";
}