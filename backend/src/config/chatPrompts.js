// Configuración de prompts e intenciones para el asistente conversacional
// Cada intención define un prompt de sistema base y parámetros específicos

export const CHAT_INTENTS = {
    DINAMICA: {
        id: "DINAMICA",
        title: "Dinámica grupal",
        description: "Diseña dinámicas participativas para grupos juveniles",
        systemPrompt: `Eres un asistente experto en animación juvenil.
Tu objetivo es diseñar dinâmicas participativas que fomenten el encuentro, la confianza,
la cooperación y la creatividad en grupos de adolescentes y jóvenes.

Si el usuario no especifica una franja de edad, pregunta una sola vez con brevedad.
El resultado debe incluir: objetivo pedagógico, descripción resumida, materiales,
pasos detallados y una breve propuesta de cierre/reflexión.
Adapta el lenguaje al contexto hispanohablante y evita anglicismos innecesarios.`,
        chromaCollection: process.env.CHROMA_COLLECTION_ACTIVIDADES || process.env.CHROMA_COLLECTION || "rpjia-actividades",
    },
    ORACION: {
        id: "ORACION",
        title: "Oración o reflexión",
        description: "Genera oraciones, reflexiones o momentos espirituales",
        systemPrompt: `Eres un asistente pastoral especializado en acompañar procesos de fe de adolescentes y jóvenes.
Cuando el usuario solicite una oración, reflexión o momento espiritual, ofrece un texto breve,
con lenguaje cercano y respetuoso, incluyendo una cita bíblica opcional y una invitación
a la acción o al compromiso.`,
        chromaCollection: process.env.CHROMA_COLLECTION_DOCUMENTOS || "rpjia-documentos",
    },
    PROYECTO: {
        id: "PROYECTO",
        title: "Proyecto o programación",
        description: "Elabora planificaciones completas de actividades o proyectos",
        systemPrompt: `Actúas como pedagogo y gestor de proyectos juveniles.
Debes elaborar planificaciones completas: objetivos SMART, calendario, recursos necesarios,
actores implicados, indicadores de seguimiento y recomendaciones de evaluación.
Añade un resumen final que pueda compartirse con equipos animadores.`,
        chromaCollection: process.env.CHROMA_COLLECTION_DOCUMENTOS || "rpjia-documentos",
    },
    GENERAL: {
        id: "GENERAL",
        title: "Consulta general",
        description: "Responde dudas generales sobre animación juvenil",
        systemPrompt: `Eres un asistente experto en animación y pastoral juvenil.
Responde en castellano, con un tono cercano y profesional.
Si necesitas más información, pide aclaraciones de forma breve.`,
        chromaCollection: process.env.CHROMA_COLLECTION_DOCUMENTOS || "rpjia-documentos",
    },
};

export const INTENT_KEYWORDS = {
    DINAMICA: ["dinámica", "dinamica", "juego", "actividad", "icebreaker", "cooperación", "confianza"],
    ORACION: ["oración", "oracion", "reflexión", "reflexion", "rezar", "espiritual"],
    PROYECTO: ["proyecto", "programación", "programacion", "plan", "planificación"],
};

export const DEFAULT_INTENT = CHAT_INTENTS.GENERAL;

export function detectIntentFromText(text = "") {
    const lowercase = text.toLowerCase();

    for (const [intent, keywords] of Object.entries(INTENT_KEYWORDS)) {
        if (keywords.some((keyword) => lowercase.includes(keyword))) {
            return CHAT_INTENTS[intent];
        }
    }

    return DEFAULT_INTENT;
}

export function resolveIntent(intentId) {
    if (!intentId) return DEFAULT_INTENT;
    const upper = intentId.toUpperCase();
    return CHAT_INTENTS[upper] || DEFAULT_INTENT;
}
