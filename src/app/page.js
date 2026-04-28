"use client";

import { useState } from "react";

export default function Home() {
  const [nombre, setNombre] = useState("");
  const [sintomas, setSintomas] = useState("");
  const [resultado, setResultado] = useState(null);
  const [cargando, setCargando] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const analizarTriage = async () => {
    setErrorMsg("");

    const sintomasTrim = sintomas.trim();
    if (!sintomasTrim) {
      alert("Please describe symptoms");
      return;
    }

    setCargando(true);
    setResultado(null);

    try {
      const res = await fetch("/api/triage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nombre: nombre.trim(), sintomas: sintomasTrim }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        const msg =
          data?.mensaje ||
          data?.error ||
          "Request failed. Please try again or ask staff to review.";
        setErrorMsg(msg);
        setResultado(null);
        return;
      }

      setResultado(data);
    } catch (error) {
      console.error("Error calling API:", error);
      setErrorMsg("Network error calling the triage API. Please try again.");
    } finally {
      setCargando(false);
    }
  };

  const colorClass =
    resultado?.color === "RED"
      ? "bg-red-600 text-white"
      : resultado?.color === "YELLOW"
        ? "bg-amber-400 text-slate-900"
        : "bg-emerald-500 text-white";

  return (
    <main className="min-h-screen bg-slate-100 flex flex-col items-center justify-center p-6">
      <div className="bg-white p-8 rounded-3xl shadow-xl w-full max-w-md border border-slate-200">

        {/* HEADER */}
        <h1 className="text-3xl font-black text-slate-800 text-center mb-2">
          MediFlow AI
        </h1>

        <p className="text-slate-600 text-center text-sm font-bold uppercase tracking-widest">
          AI-powered hospital triage & load prediction system
        </p>

        <p className="text-slate-500 text-center mt-3 text-sm">
          Helping hospitals reduce overcrowding using real-time patient data
        </p>

        <p className="text-slate-400 text-center mt-4 text-xs leading-relaxed">
          Emergency rooms are overwhelmed. MediFlow AI helps prioritize patients
          and anticipate demand before saturation happens.
        </p>

        {/* FORM */}
        <div className="space-y-4 mt-6">
          <input
            value={nombre}
            className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none"
            placeholder="Patient Name (optional)"
            onChange={(e) => setNombre(e.target.value)}
          />

          <textarea
            value={sintomas}
            className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl h-40 focus:ring-2 focus:ring-blue-500 outline-none"
            placeholder="Describe symptoms in detail..."
            onChange={(e) => setSintomas(e.target.value)}
          />

          <button
            onClick={analizarTriage}
            disabled={cargando}
            className={`w-full py-4 rounded-2xl font-bold text-white shadow-lg transition-all ${cargando
                ? "bg-slate-400"
                : "bg-blue-600 hover:bg-blue-700 active:scale-95"
              }`}
          >
            {cargando
              ? "Analyzing with Azure AI..."
              : "Analyze Patient & Update System"}
          </button>
        </div>

        {/* ERROR */}
        {errorMsg && (
          <div className="mt-6 p-4 rounded-2xl bg-slate-50 border border-slate-200 text-sm">
            <div className="font-bold mb-1">Couldn’t complete the request</div>
            <div className="opacity-90">{errorMsg}</div>
          </div>
        )}

        {/* RESULTADO */}
        {resultado && (
          <div
            className={`mt-8 p-6 rounded-2xl text-center animate-in fade-in slide-in-from-bottom-4 ${colorClass}`}
          >
            <h2 className="text-2xl font-black">
              {resultado.color}
            </h2>

            <p className="mt-2 text-sm">
              {resultado.mensaje}
            </p>

            {/* Explainability */}
            {Array.isArray(resultado.reasons) && resultado.reasons.length > 0 && (
              <div className="mt-4 text-left">
                <div className="text-xs font-bold uppercase">Why?</div>
                <ul className="mt-2 text-sm list-disc list-inside">
                  {resultado.reasons.slice(0, 4).map((r, idx) => (
                    <li key={idx}>{r}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Red flags */}
            {resultado.red_flags_detected?.length > 0 && (
              <div className="mt-4 text-left">
                <div className="text-xs font-bold uppercase">
                  Red flags detected
                </div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {resultado.red_flags_detected.map((rf, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1 text-xs font-bold bg-black/20 rounded-full"
                    >
                      {rf}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* NUEVO MENSAJE CLAVE */}
            <div className="mt-4 text-xs opacity-90">
              This case contributes to hospital load analysis
            </div>
          </div>
        )}

        {/* NUEVA SECCIÓN: LIVE INSIGHTS */}
        <div className="mt-8 p-4 rounded-2xl bg-slate-50 border border-slate-200">
          <h3 className="text-sm font-bold text-slate-700 mb-2">
            Live System Insights (Demo)
          </h3>

          <div className="text-xs text-slate-600 space-y-1">
            <div>Patients analyzed today: 43</div>
            <div>RED cases: 12%</div>
            <div>YELLOW cases: 38%</div>
            <div>GREEN cases: 50%</div>
            <div className="mt-2 font-semibold text-slate-700">
              Peak demand detected: 6–8 PM
            </div>
          </div>
        </div>

      </div>

      {/* FOOTER */}
      <p className="mt-8 text-slate-400 text-[10px] max-w-xs text-center">
        This tool uses Azure AI Language and Azure AI Foundry for administrative triage.
        It does not replace professional medical diagnosis.
      </p>
    </main>
  );
}