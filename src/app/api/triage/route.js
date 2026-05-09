import { NextResponse } from "next/server";
import { supabase } from "../../../lib/supabase";

const API_VERSION = "2024-02-15-preview";

// ---- RED FLAGS ----
const RED_FLAGS = [
  {
    key: "chest pain",
    re: /\b(chest pain|chest pressure|tightness in (my )?chest)\b/i,
  },
  {
    key: "trouble breathing",
    re: /\b(shortness of breath|trouble breathing|can't breathe|cannot breathe|difficulty breathing)\b/i,
  },
];

// ---- MEDICAL INTENT CLASSIFIER ----
// Runs before Azure. Prevents non-medical text from being sent to AI or saved.

const MEDICAL_PATTERNS = {
  symptoms: [
    // English symptoms
    "pain",
    "ache",
    "aches",
    "fever",
    "headache",
    "cough",
    "vomit",
    "vomiting",
    "nausea",
    "dizzy",
    "dizziness",
    "breathing",
    "shortness of breath",
    "blood",
    "infection",
    "symptom",
    "symptoms",
    "sick",
    "fatigue",
    "diarrhea",
    "asthma",
    "pressure",
    "rash",
    "swelling",
    "burning",
    "allergy",
    "allergies",
    "allergic",
    "migraine",
    "weakness",
    "numbness",
    "fainting",
    "seizure",
    "chills",
    "sore throat",
    "sore",
    "cramps",
    "stomachache",

    // Spanish symptoms
    "dolor",
    "fiebre",
    "tos",
    "vomito",
    "vómito",
    "vomitando",
    "nausea",
    "náusea",
    "mareo",
    "mareos",
    "respirar",
    "respiracion",
    "respiración",
    "sangre",
    "infeccion",
    "infección",
    "sintoma",
    "síntoma",
    "sintomas",
    "síntomas",
    "enfermo",
    "cansancio",
    "diarrea",
    "asma",
    "presion",
    "presión",
    "roncha",
    "hinchazon",
    "hinchazón",
    "alergia",
    "alergias",
    "garganta",
    "estomago",
    "estómago",
    "migraña",
    "migrana",
    "debilidad",
    "desmayo",
    "convulsion",
    "convulsión",
    "escalofrios",
    "escalofríos",
  ],

  injuries: [
    // English injuries
    "cut",
    "bleed",
    "bleeding",
    "bled",
    "bledding",
    "bleading",
    "wound",
    "injury",
    "injured",
    "burn",
    "burned",
    "bruise",
    "bruised",
    "fracture",
    "broken",
    "sprain",
    "sprained",
    "twisted",
    "hit",
    "fell",
    "fall",
    "scratch",
    "scratched",

    // Spanish injuries
    "corte",
    "cortada",
    "sangrando",
    "sangro",
    "sangró",
    "herida",
    "lesion",
    "lesión",
    "lesionado",
    "quemadura",
    "quemado",
    "moreton",
    "moretón",
    "fractura",
    "quebrado",
    "torcedura",
    "torcido",
    "golpe",
    "golpeado",
    "caida",
    "caída",
    "raspon",
    "raspón",
  ],

  bodyParts: [
    // English
    "head",
    "eye",
    "ear",
    "nose",
    "mouth",
    "throat",
    "neck",
    "chest",
    "heart",
    "back",
    "stomach",
    "abdomen",
    "arm",
    "hand",
    "finger",
    "thumb",
    "leg",
    "knee",
    "foot",
    "toe",
    "skin",
    "face",
    "shoulder",
    "wrist",
    "ankle",

    // Spanish
    "cabeza",
    "ojo",
    "oreja",
    "nariz",
    "boca",
    "garganta",
    "cuello",
    "pecho",
    "corazon",
    "corazón",
    "espalda",
    "estomago",
    "estómago",
    "abdomen",
    "brazo",
    "mano",
    "dedo",
    "pierna",
    "rodilla",
    "pie",
    "piel",
    "cara",
    "hombro",
    "muneca",
    "muñeca",
    "tobillo",
  ],

  nonMedical: [
    "work tomorrow",
    "trabajar manana",
    "trabajar mañana",
    "homework",
    "meeting",
    "movie",
    "game",
    "restaurant",
    "weather",
    "school project",
    "my boss",
    "mi jefe",
    "tomorrow at work",
    "go to work",
    "going to work",
  ],
};

function stripAccents(text = "") {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function escapeRegExp(value = "") {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function termMatches(cleanText, rawTerm) {
  const cleanTerm = stripAccents(String(rawTerm || "").toLowerCase().trim());

  if (!cleanTerm) return false;

  if (cleanTerm.includes(" ")) {
    return cleanText.includes(cleanTerm);
  }

  const re = new RegExp(`\\b${escapeRegExp(cleanTerm)}\\b`, "i");
  return re.test(cleanText);
}

function countMatches(cleanText, terms) {
  return terms.reduce((count, term) => {
    return termMatches(cleanText, term) ? count + 1 : count;
  }, 0);
}

function classifyMedicalIntent(text = "") {
  const clean = stripAccents(text.toLowerCase().trim());

  if (clean.length < 4) {
    return {
      isMedical: false,
      confidence: 0,
      reason: "Text too short",
      score: 0,
    };
  }

  const symptomMatches = countMatches(clean, MEDICAL_PATTERNS.symptoms);
  const injuryMatches = countMatches(clean, MEDICAL_PATTERNS.injuries);
  const bodyPartMatches = countMatches(clean, MEDICAL_PATTERNS.bodyParts);
  const nonMedicalMatches = countMatches(clean, MEDICAL_PATTERNS.nonMedical);

  let score = 0;
  const reasons = [];

  if (symptomMatches > 0) {
    score += symptomMatches * 3;
    reasons.push("symptom detected");
  }

  if (injuryMatches > 0) {
    score += injuryMatches * 3;
    reasons.push("injury detected");
  }

  if (bodyPartMatches > 0) {
    score += bodyPartMatches * 2;
    reasons.push("body part detected");
  }

  if (injuryMatches > 0 && bodyPartMatches > 0) {
    score += 4;
    reasons.push("injury + body part detected");
  }

  if (symptomMatches > 0 && bodyPartMatches > 0) {
    score += 3;
    reasons.push("symptom + body part detected");
  }

  if (nonMedicalMatches > 0) {
    score -= nonMedicalMatches * 4;
    reasons.push("non-medical context detected");
  }

  const emergencyPattern =
    /\b(chest pain|chest pressure|shortness of breath|cannot breathe|can't breathe|difficulty breathing|heavy bleeding|severe pain|cut my|cut his|cut her|broken|fracture|burned|dolor en el pecho|no puedo respirar|no puede respirar|sangrado fuerte|dolor fuerte)\b/i;

  if (emergencyPattern.test(clean)) {
    score += 8;
    reasons.push("emergency or injury phrase detected");
  }

  const isMedical = score >= 3;

  return {
    isMedical,
    confidence: Math.min(Math.max(score / 10, 0), 1),
    reason:
      reasons.length > 0
        ? reasons.join(", ")
        : "No medical pattern detected",
    score,
  };
}

function invalidMedicalInputResponse(intent) {
  return {
    success: false,
    medical: false,
    color: null,
    mensaje:
      "Please enter a valid medical symptom or injury. MediFlow AI is intended for healthcare-related symptom evaluation only.",
    reasons: [
      "The provided text does not appear to describe a medical symptom or injury.",
      `Validation reason: ${intent?.reason || "No medical pattern detected"}`,
    ],
    red_flags_detected: [],
    appointment_eligible: false,
    appointment_priority: "BLOCKED",
    should_save: false,
  };
}

// ---- PROMPT ----
const SYSTEM_PROMPT = `
You are MediFlow AI, an administrative triage assistant.

IMPORTANT:
- ALWAYS respond in English.
- Do NOT use Spanish.
- Do NOT detect or switch language.
- Return ONLY valid JSON.
- Do NOT use markdown.
- Do NOT wrap arrays in quotes.
- "reasons" MUST be a JSON array, not a string.
- "red_flags_detected" MUST be a JSON array, not a string.

Return ONLY valid JSON with this exact structure:
{
  "color": "RED" | "YELLOW" | "GREEN",
  "mensaje": string,
  "reasons": string[],
  "red_flags_detected": string[]
}

Rules:
- RED only if clear emergency.
- No red flags → never RED.
- If unsure → YELLOW.
- This is not a diagnosis.
- Keep "mensaje" short, clear, and patient-facing.
`.trim();

// ---- HELPERS ----
function normalizeEndpoint(raw) {
  if (!raw) return null;
  return raw.endsWith("/") ? raw : `${raw}/`;
}

function safeJsonFromModel(text) {
  try {
    if (!text) return null;

    const cleaned = text.replace(/```json/g, "").replace(/```/g, "").trim();
    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");

    if (start === -1 || end === -1) return null;

    return JSON.parse(cleaned.slice(start, end + 1));
  } catch (err) {
    console.error("JSON PARSE ERROR:", err);
    return null;
  }
}

function ensureArray(value) {
  if (Array.isArray(value)) return value;

  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);

      if (Array.isArray(parsed)) return parsed;

      if (typeof parsed === "string") {
        const secondParsed = JSON.parse(parsed);
        return Array.isArray(secondParsed) ? secondParsed : [];
      }

      return [];
    } catch (err) {
      console.error("ARRAY PARSE ERROR:", err);
      return [];
    }
  }

  return [];
}

function normalizeColor(color) {
  const value = String(color || "YELLOW").toUpperCase();

  if (["RED", "YELLOW", "GREEN"].includes(value)) {
    return value;
  }

  return "YELLOW";
}

function getAppointmentPriority(color) {
  if (color === "GREEN") return "ROUTINE";
  if (color === "YELLOW") return "PRIORITY";
  return "BLOCKED";
}

function fallbackYellow(msg) {
  return {
    success: false,
    medical: true,
    color: "YELLOW",
    mensaje: msg,
    reasons: ["Fallback triggered"],
    red_flags_detected: [],
    appointment_eligible: true,
    appointment_priority: "PRIORITY",
    should_save: false,
  };
}

function immediateRedResponse(keys) {
  return {
    success: true,
    medical: true,
    color: "RED",
    mensaje: "Emergency warning signs detected. Seek immediate care.",
    reasons: [`Detected: ${keys.join(", ")}`],
    red_flags_detected: keys,
    appointment_eligible: false,
    appointment_priority: "BLOCKED",
    should_save: true,
  };
}

async function saveTriageRecord({ nombre, sintomas, result }) {
  const { error } = await supabase.from("triage_records").insert([
    {
      nombre: nombre || null,
      sintomas,
      color: result.color,
      mensaje: result.mensaje,
      reasons: result.reasons,
      red_flags: result.red_flags_detected,
    },
  ]);

  if (error) {
    console.error("SUPABASE INSERT ERROR:", error);
    return error;
  }

  console.log("DB INSERT OK");
  return null;
}

// ---- ROUTE ----
export async function POST(req) {
  try {
    console.log("---- NEW REQUEST ----");

    const body = await req.json().catch(() => ({}));
    const sintomas = (body?.sintomas ?? "").trim();
    const nombre = (body?.nombre ?? "").trim();

    if (!sintomas) {
      return NextResponse.json(
        {
          success: false,
          medical: false,
          color: null,
          mensaje: "Please enter symptoms before submitting.",
          reasons: ["No symptom text was provided."],
          red_flags_detected: [],
          appointment_eligible: false,
          appointment_priority: "BLOCKED",
          should_save: false,
        },
        { status: 400 }
      );
    }

    const sintomasLimited = sintomas.slice(0, 1200);

    console.log("INPUT:", sintomasLimited);

    // ✅ Local medical intent validation before Azure and before Supabase
    const medicalIntent = classifyMedicalIntent(sintomasLimited);

    console.log("MEDICAL INTENT:", medicalIntent);

    if (!medicalIntent.isMedical) {
      console.log("NON MEDICAL INPUT - NOT SAVED");

      return NextResponse.json(
        invalidMedicalInputResponse(medicalIntent),
        { status: 400 }
      );
    }

    // 🔴 RED FLAGS LOCAL CHECK
    const detected = [];

    for (const rf of RED_FLAGS) {
      if (rf.re.test(sintomasLimited)) {
        detected.push(rf.key);
      }
    }

    if (detected.length > 0) {
      const result = immediateRedResponse(detected);

      const insertError = await saveTriageRecord({
        nombre,
        sintomas: sintomasLimited,
        result,
      });

      if (insertError) {
        return NextResponse.json(
          {
            success: false,
            error: "Database insert failed",
            details: insertError.message,
          },
          { status: 500 }
        );
      }

      return NextResponse.json(result);
    }

    // 🧠 AZURE CONFIG
    const endpoint = normalizeEndpoint(process.env.AZURE_OPENAI_ENDPOINT);
    const deployment = process.env.AZURE_OPENAI_DEPLOYMENT;
    const apiKey = process.env.AZURE_OPENAI_KEY;

    if (!endpoint || !deployment || !apiKey) {
      console.error("MISSING ENV VARIABLES");

      return NextResponse.json(
        fallbackYellow("Server configuration error."),
        { status: 500 }
      );
    }

    const azureUrl = `${endpoint}openai/deployments/${deployment}/chat/completions?api-version=${API_VERSION}`;

    const response = await fetch(azureUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "api-key": apiKey,
      },
      body: JSON.stringify({
        temperature: 0,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: sintomasLimited },
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AZURE ERROR:", errorText);

      return NextResponse.json(
        fallbackYellow("AI service error."),
        { status: 500 }
      );
    }

    const data = await response.json();
    const content = data?.choices?.[0]?.message?.content ?? "";

    const parsed = safeJsonFromModel(content);

    if (!parsed) {
      console.error("INVALID AI RAW CONTENT:", content);

      return NextResponse.json(
        fallbackYellow("Invalid AI response."),
        { status: 500 }
      );
    }

    console.log("RAW parsed.reasons:", parsed.reasons);
    console.log("TYPE parsed.reasons:", typeof parsed.reasons);

    const color = normalizeColor(parsed.color);
    const appointmentPriority = getAppointmentPriority(color);

    const result = {
      success: true,
      medical: true,
      color,
      mensaje:
        parsed.mensaje ||
        "Please monitor your symptoms and seek medical care if they worsen.",
      reasons: ensureArray(parsed.reasons),
      red_flags_detected: ensureArray(parsed.red_flags_detected),
      appointment_eligible: color === "GREEN" || color === "YELLOW",
      appointment_priority: appointmentPriority,
      should_save: true,
    };

    const insertError = await saveTriageRecord({
      nombre,
      sintomas: sintomasLimited,
      result,
    });

    if (insertError) {
      return NextResponse.json(
        {
          success: false,
          error: "Database insert failed",
          details: insertError.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("FINAL ERROR:", error);

    return NextResponse.json(
      fallbackYellow("System error."),
      { status: 500 }
    );
  }
}