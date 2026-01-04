"use client";
import { useState } from 'react';

export default function Home() {
  const [nombre, setNombre] = useState("");
  const [sintomas, setSintomas] = useState("");
  const [resultado, setResultado] = useState(null);
  const [cargando, setCargando] = useState(false);

  const analizarTriage = async () => {
    if (!sintomas) return alert("Please describe symptoms");
    setCargando(true);
    try {
      const res = await fetch('/api/triage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre, sintomas }),
      });
      const data = await res.json();
      setResultado(data);
    } catch (error) {
      console.error("Error calling API:", error);
    } finally {
      setCargando(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-100 flex flex-col items-center justify-center p-6">
      <div className="bg-white p-8 rounded-3xl shadow-xl w-full max-w-md border border-slate-200">
        <h1 className="text-3xl font-black text-slate-800 text-center mb-2">MediFlow AI</h1>
        <p className="text-slate-500 text-center mb-8 text-sm uppercase tracking-widest font-bold">Smart Triage System</p>

        <div className="space-y-4">
          <input
            className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
            placeholder="Patient Name"
            onChange={(e) => setNombre(e.target.value)}
          />
          <textarea
            className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl h-40 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
            placeholder="Describe symptoms in detail..."
            onChange={(e) => setSintomas(e.target.value)}
          />
          <button
            onClick={analizarTriage}
            disabled={cargando}
            className={`w-full py-4 rounded-2xl font-bold text-white transition-all shadow-lg active:scale-95 ${cargando ? 'bg-slate-400' : 'bg-blue-600 hover:bg-blue-700'
              }`}
          >
            {cargando ? "Analyzing with Azure AI..." : "CHECK URGENCY STATUS"}
          </button>
        </div>

        {resultado && (
          <div className={`mt-8 p-6 rounded-2xl text-center animate-in fade-in slide-in-from-bottom-4 duration-500 ${resultado.color === 'RED' ? 'bg-red-600 text-white' :
              resultado.color === 'YELLOW' ? 'bg-amber-400 text-slate-900' :
                'bg-emerald-500 text-white'
            }`}>
            <h2 className="text-2xl font-black tracking-tighter">{resultado.color}</h2>
            <p className="mt-2 text-sm font-medium opacity-90">{resultado.mensaje || resultado.note}</p>
            <div className="mt-4 pt-4 border-t border-white/20 text-xs font-bold uppercase tracking-widest">
              Administrative Classification Only
            </div>
          </div>
        )}
      </div>
      <p className="mt-8 text-slate-400 text-[10px] max-w-xs text-center leading-tight">
        This tool uses Azure AI Language and Azure AI Foundry for administrative triage. It does not replace professional medical diagnosis.
      </p>
    </main>
  );
}