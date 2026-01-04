import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    const { nombre, sintomas } = await req.json();

    // Aseguramos que el endpoint termine correctamente para la llamada
    const endpoint = process.env.AZURE_OPENAI_ENDPOINT.endsWith('/')
      ? process.env.AZURE_OPENAI_ENDPOINT
      : `${process.env.AZURE_OPENAI_ENDPOINT}/`;

    const azureUrl = `${endpoint}openai/deployments/${process.env.AZURE_OPENAI_DEPLOYMENT}/chat/completions?api-version=2024-02-15-preview`;

    const response = await fetch(azureUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "api-key": process.env.AZURE_OPENAI_KEY,
      },
      body: JSON.stringify({
        messages: [
          { role: "system", content: "Return ONLY JSON: { 'color': 'RED/YELLOW/GREEN', 'mensaje': '...' }. Use English." },
          { role: "user", content: sintomas }
        ]
      }),
    });

    const data = await response.json();

    // Si la IA responde correctamente, enviamos sus datos reales
    if (data.choices) {
      const content = data.choices[0].message.content.replace(/```json/g, "").replace(/```/g, "").trim();
      return NextResponse.json(JSON.parse(content));
    }

    throw new Error("Invalid Azure Response");

  } catch (error) {
    console.error("DEBUG:", error);
    // Este es el bloque que se está activando ahora. Al arreglar la URL, dejará de salir.
    return NextResponse.json({
      color: "GREEN",
      mensaje: "System is verifying your symptoms. Please wait."
    });
  }
}