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

function fallbackYellow(msg) {
  return {
    color: "YELLOW",
    mensaje: msg,
    reasons: ["Fallback triggered"],
    red_flags_detected: [],
  };
}

function immediateRedResponse(keys) {
  return {
    color: "RED",
    mensaje: "Emergency warning signs detected. Seek immediate care.",
    reasons: [`Detected: ${keys.join(", ")}`],
    red_flags_detected: keys,
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
        fallbackYellow("Please enter symptoms."),
        { status: 400 }
      );
    }

    const sintomasLimited = sintomas.slice(0, 1200);

    console.log("INPUT:", sintomasLimited);

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

    const result = {
      color: normalizeColor(parsed.color),
      mensaje:
        parsed.mensaje ||
        "Please monitor your symptoms and seek medical care if they worsen.",
      reasons: ensureArray(parsed.reasons),
      red_flags_detected: ensureArray(parsed.red_flags_detected),
    };

    const insertError = await saveTriageRecord({
      nombre,
      sintomas: sintomasLimited,
      result,
    });

    if (insertError) {
      return NextResponse.json(
        {
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