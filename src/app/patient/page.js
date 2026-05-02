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
        body: JSON.stringify({
          nombre: nombre.trim(),
          sintomas: sintomasTrim,
        }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        const msg =
          data?.mensaje ||
          data?.error ||
          "Request failed. Please try again.";
        setErrorMsg(msg);
        setResultado(null);
        return;
      }

      setResultado(data);
    } catch (error) {
      console.error("Error calling API:", error);
      setErrorMsg("Network error calling the triage API.");
    } finally {
      setCargando(false);
    }
  };

  // 🔥 FIX COLOR
  const color = resultado?.color?.toUpperCase();

  const colorClass =
    color === "RED"
      ? "bg-red-600 text-white"
      : color === "YELLOW"
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

        {/* FORM */}
        <div className="space-y-4 mt-6">
          <input
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            className="w-full p-4 bg-slate-50 text-slate-900 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none"
            placeholder="Patient Name (optional)"
          />

          <textarea
            value={sintomas}
            onChange={(e) => setSintomas(e.target.value)}
            className="w-full p-4 bg-slate-50 text-slate-900 border border-slate-200 rounded-2xl h-40 focus:ring-2 focus:ring-blue-500 outline-none"
            placeholder="Describe symptoms in detail..."
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
          <div className="mt-6 p-4 rounded-2xl bg-slate-50 border text-slate-900 border-slate-200 text-sm">
            <div className="font-bold mb-1">Error</div>
            <div>{errorMsg}</div>
          </div>
        )}

        {/* RESULTADO */}
        {resultado && (
          <div className={`mt-8 p-6 rounded-2xl text-center ${colorClass}`}>
            <h2 className="text-2xl font-black">{color}</h2>

            <p className="mt-2 text-sm">{resultado.mensaje}</p>

            {/* Reasons */}
            {resultado.reasons?.length > 0 && (
              <div className="mt-4 text-left">
                <div className="text-xs font-bold uppercase">Why?</div>
                <ul className="mt-2 text-sm list-disc list-inside">
                  {resultado.reasons.map((r, i) => (
                    <li key={i}>{r}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Red Flags */}
            {resultado.red_flags_detected?.length > 0 && (
              <div className="mt-4 text-left">
                <div className="text-xs font-bold uppercase">
                  Red flags detected
                </div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {resultado.red_flags_detected.map((rf, i) => (
                    <span
                      key={i}
                      className="px-3 py-1 text-xs font-bold bg-black/20 rounded-full"
                    >
                      {rf}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* MESSAGE */}
            <div className="mt-4 text-xs opacity-90">
              This case contributes to hospital load analysis
            </div>
          </div>
        )}
      </div>
    </main>
  );
}