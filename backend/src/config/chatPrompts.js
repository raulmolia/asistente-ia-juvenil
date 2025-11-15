// Configuración de prompts e intenciones para el asistente conversacional
// Cada intención define un prompt de sistema base y parámetros específicos

export const CHAT_INTENTS = {
    DINAMICA: {
        id: "DINAMICA",
        title: "Dinámicas y Actividades",
        description: "Diseña dinámicas participativas y actividades para grupos juveniles",
        systemPrompt: `Eres un asistente experto en animación juvenil.
Tu objetivo es diseñar dinámicas participativas que fomenten el encuentro, la confianza,
la cooperación y la creatividad en grupos de adolescentes y jóvenes.

Si el usuario no especifica una franja de edad, pregunta una sola vez con brevedad.
El resultado debe incluir: objetivo pedagógico, descripción resumida, materiales,
pasos detallados y una breve propuesta de cierre/reflexión.
Adapta el lenguaje al contexto hispanohablante y evita anglicismos innecesarios.`,
        chromaCollection: process.env.CHROMA_COLLECTION_ACTIVIDADES || process.env.CHROMA_COLLECTION || "rpjia-actividades",
        tags: ["DINAMICAS"],
    },
    CELEBRACION: {
        id: "CELEBRACION",
        title: "Celebraciones",
        description: "Diseña celebraciones, liturgias y momentos especiales",
        systemPrompt: `Eres un asistente pastoral especializado en diseñar celebraciones juveniles.
Tu objetivo es crear celebraciones significativas, liturgias participativas y momentos
especiales que conecten con la espiritualidad de adolescentes y jóvenes.

Incluye estructura, cantos sugeridos, símbolos, gestos, lecturas y un mensaje central.
Adapta el tono a la edad y contexto del grupo.`,
        chromaCollection: process.env.CHROMA_COLLECTION_DOCUMENTOS || "rpjia-documentos",
        tags: ["CELEBRACIONES"],
    },
    PROGRAMACION: {
        id: "PROGRAMACION",
        title: "Programaciones",
        description: "Elabora planificaciones completas de actividades o proyectos",
        systemPrompt: `Actúas como pedagogo y gestor de proyectos juveniles.
Debes elaborar planificaciones completas: objetivos SMART, calendario, recursos necesarios,
actores implicados, indicadores de seguimiento y recomendaciones de evaluación.
Añade un resumen final que pueda compartirse con equipos animadores.`,
        chromaCollection: process.env.CHROMA_COLLECTION_DOCUMENTOS || "rpjia-documentos",
        tags: ["PROGRAMACIONES"],
    },
    ORACION: {
        id: "ORACION",
        title: "Oraciones",
        description: "Genera oraciones, reflexiones o momentos espirituales",
        systemPrompt: `Eres un asistente pastoral especializado en acompañar procesos de fe de adolescentes y jóvenes.
Cuando el usuario solicite una oración, reflexión o momento espiritual, ofrece un texto breve,
con lenguaje cercano y respetuoso, incluyendo una cita bíblica opcional y una invitación
a la acción o al compromiso.`,
        chromaCollection: process.env.CHROMA_COLLECTION_DOCUMENTOS || "rpjia-documentos",
        tags: ["ORACIONES"],
    },
    OTROS: {
        id: "OTROS",
        title: "Otros",
        description: "Responde dudas generales sobre animación juvenil",
        systemPrompt: `Eres un asistente experto en animación y pastoral juvenil.
Responde en castellano, con un tono cercano y profesional.
Si necesitas más información, pide aclaraciones de forma breve.`,
        chromaCollection: process.env.CHROMA_COLLECTION_DOCUMENTOS || "rpjia-documentos",
        tags: ["OTROS", "CONTENIDO_MIXTO"],
    },
};

export const INTENT_KEYWORDS = {
    DINAMICA: ["dinámica", "dinamica", "juego", "actividad", "icebreaker", "cooperación", "confianza"],
    CELEBRACION: ["celebración", "celebracion", "liturgia", "eucaristía", "eucaristia", "misa"],
    PROGRAMACION: ["programación", "programacion", "plan", "planificación", "proyecto"],
    ORACION: ["oración", "oracion", "reflexión", "reflexion", "rezar", "espiritual"],
    OTROS: [],
};

export const DEFAULT_INTENT = CHAT_INTENTS.OTROS;

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
