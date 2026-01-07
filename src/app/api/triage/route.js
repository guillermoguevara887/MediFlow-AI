import { NextResponse } from "next/server";

// ---- Config ----
const API_VERSION = "2024-02-15-preview";

// Hard rule: if any red flag appears, return RED immediately (no LLM needed)
const RED_FLAGS = [
  { key: "chest pain", re: /\b(chest pain|chest pressure|tightness in (my )?chest)\b/i },
  { key: "trouble breathing", re: /\b(shortness of breath|trouble breathing|can't breathe|cannot breathe|difficulty breathing)\b/i },
  { key: "loss of consciousness", re: /\b(fainted|fainting|unconscious|passed out|loss of consciousness)\b/i },
  { key: "seizure", re: /\b(seizure|convulsion)\b/i },
  { key: "stroke signs", re: /\b(face droop|slurred speech|one[- ]sided weakness|weakness on one side|stroke)\b/i },
  { key: "uncontrolled bleeding", re: /\b(heavy bleeding|bleeding won't stop|cannot stop bleeding|bleeding won'?t stop)\b/i },
  { key: "severe allergic reaction", re: /\b(anaphylaxis|throat closing|swelling of (my )?(face|lips|tongue)|severe allergic reaction)\b/i },
  { key: "severe head injury", re: /\b(severe head injury|hit my head and (i am|i'm) confused|head trauma)\b/i },
  { key: "severe confusion", re: /\b(confused|disoriented|not making sense)\b/i },
  { key: "suicidal intent", re: /\b(suicidal|kill myself|end my life)\b/i },
];

const SYSTEM_PROMPT = `
You are MediFlow AI, an administrative triage assistant for emergency-intake routing in emerging markets.
You do NOT provide medical diagnosis or treatment. You ONLY output an administrative urgency level for intake prioritization.

TASK:
Given a patient's symptom text, return a JSON object with:
- "color": one of "RED", "YELLOW", "GREEN"
- "mensaje": a short, calm explanation in English (1–2 sentences)
- "reasons": an array of 2–4 short bullet reasons (strings)
- "red_flags_detected": an array of red-flag keywords you detected (strings). Empty if none.

STRICT RULES:
1) Output MUST be valid JSON with double quotes. No markdown. No extra text.
2) RED is ONLY for clear red-flag symptoms suggesting immediate danger (e.g., chest pain/pressure, severe breathing trouble, fainting, seizure, stroke signs, heavy uncontrolled bleeding, severe allergic reaction with breathing/swelling, severe confusion).
3) If there are NO red flags, do NOT return RED.
4) YELLOW is for moderate symptoms that should be evaluated soon but are not clearly life-threatening:
   fever, sore throat, moderate pain, vomiting/diarrhea without severe dehydration, minor injuries with persistent pain, symptoms lasting multiple days, or worsening symptoms.
5) GREEN is for mild, common, self-limited symptoms with no red flags:
   mild cold/runny nose, mild sore throat WITHOUT breathing issues, mild headache, mild cough, etc.
6) If the text is too vague, default to YELLOW (safer than GREEN).

OUTPUT FORMAT EXAMPLE:
{"color":"YELLOW","mensaje":"Based on the symptoms, this needs a timely check but does not show clear emergency red flags.","reasons":["Detected: fever and sore throat","No red-flag signs like trouble breathing or chest pain mentioned"],"red_flags_detected":[]}
`.trim();

// ---- Helpers ----
function normalizeEndpoint(raw) {
  if (!raw) return null;
  // Ensure trailing slash
  return raw.endsWith("/") ? raw : `${raw}/`;
}

function safeJsonFromModel(text) {
  if (!text || typeof text !== "string") return null;

  // Remove fenced blocks if any
  const cleaned = text
    .replace(/```json/gi, "")
    .replace(/```/g, "")
    .trim();

  // Attempt to extract JSON object if extra text slipped in
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) return null;

  const jsonStr = cleaned.slice(start, end + 1);
  try {
    return JSON.parse(jsonStr);
  } catch {
    return null;
  }
}

function isValidColor(c) {
  return c === "RED" || c === "YELLOW" || c === "GREEN";
}

function fallbackYellow(message = "We could not confidently classify this input. Please ask a staff member to review.") {
  return {
    color: "YELLOW",
    mensaje: message,
    reasons: ["Classification fallback triggered", "Human review recommended"],
    red_flags_detected: [],
  };
}

function immediateRedResponse(detectedKeys) {
  return {
    color: "RED",
    mensaje: "Your symptoms include potential emergency warning signs. Please seek immediate medical attention or alert staff now.",
    reasons: [
      `Red-flag indicators detected: ${detectedKeys.join(", ")}`,
      "This is an administrative urgency alert, not a diagnosis",
    ],
    red_flags_detected: detectedKeys,
  };
}

// ---- Route ----
export async function POST(req) {
  try {
    const body = await req.json().catch(() => ({}));
    const sintomas = (body?.sintomas ?? "").toString().trim();

    if (!sintomas) {
      return NextResponse.json(
        fallbackYellow("Please enter symptoms to continue."),
        { status: 400 }
      );
    }

    // Basic length guard (prevents huge prompts)
    const sintomasLimited = sintomas.slice(0, 1200);

    // 1) Hard red-flag check (deterministic and defendible)
    const detected = [];
    for (const rf of RED_FLAGS) {
      if (rf.re.test(sintomasLimited)) detected.push(rf.key);
    }
    if (detected.length > 0) {
      return NextResponse.json(immediateRedResponse(detected));
    }

    // 2) Call Azure OpenAI for YELLOW vs GREEN classification (bounded by rules)
    const endpoint = normalizeEndpoint(process.env.AZURE_OPENAI_ENDPOINT);
    const deployment = process.env.AZURE_OPENAI_DEPLOYMENT;
    const apiKey = process.env.AZURE_OPENAI_KEY;

    if (!endpoint || !deployment || !apiKey) {
      return NextResponse.json(
        fallbackYellow("Server configuration is missing Azure OpenAI environment variables."),
        { status: 500 }
      );
    }

    const azureUrl =
      `${endpoint}openai/deployments/${deployment}/chat/completions?api-version=${API_VERSION}`;

    const response = await fetch(azureUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "api-key": apiKey,
      },
      body: JSON.stringify({
        temperature: 0,
        top_p: 1,
        max_tokens: 220,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: sintomasLimited },
        ],
      }),
    });

    if (!response.ok) {
      const errText = await response.text().catch(() => "");
      console.error("Azure OpenAI error:", response.status, errText);
      return NextResponse.json(
        fallbackYellow("The system could not reach the AI service. Please ask a staff member to review."),
        { status: 502 }
      );
    }

    const data = await response.json();

    const content = data?.choices?.[0]?.message?.content ?? "";
    const parsed = safeJsonFromModel(content);

    if (!parsed || !isValidColor(parsed.color) || typeof parsed.mensaje !== "string") {
      console.error("Invalid model JSON:", content);
      return NextResponse.json(
        fallbackYellow("The system could not produce a valid classification. Please ask a staff member to review."),
        { status: 502 }
      );
    }

    // Ensure required keys exist (keep your UI stable)
    const result = {
      color: parsed.color,
      mensaje: parsed.mensaje,
      reasons: Array.isArray(parsed.reasons) ? parsed.reasons : [],
      red_flags_detected: Array.isArray(parsed.red_flags_detected) ? parsed.red_flags_detected : [],
    };

    // Safety: If model ever returns RED without red_flags_detected, downgrade to YELLOW
    if (result.color === "RED" && (!result.red_flags_detected || result.red_flags_detected.length === 0)) {
      result.color = "YELLOW";
      result.reasons = [
        ...(result.reasons || []),
        "No explicit red-flag indicators detected; downgraded to YELLOW for safety consistency.",
      ];
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("DEBUG (route error):", error);
    return NextResponse.json(
      fallbackYellow("System error. Please ask a staff member to review."),
      { status: 500 }
    );
  }
}
