"use client";

import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();

  return (
    <main className="min-h-screen bg-slate-100 flex items-center justify-center p-6">
      <div className="bg-white p-10 rounded-3xl shadow-xl w-full max-w-md border border-slate-200 text-center">

        {/* TITLE */}
        <h1 className="text-3xl font-black text-slate-800 mb-2">
          MediFlow AI
        </h1>

        <p className="text-slate-600 text-sm font-bold uppercase tracking-widest">
          AI-powered hospital triage & load prediction system
        </p>

        <p className="text-slate-500 mt-4 text-sm">
          Helping hospitals reduce overcrowding using real-time patient data
        </p>

        {/* ROLE SELECTION */}
        <div className="mt-10 space-y-4">

          {/* PATIENT */}
          <button
            onClick={() => router.push("/patient")}
            className="w-full p-5 rounded-2xl bg-blue-600 text-white font-bold shadow-lg hover:bg-blue-700 transition-all active:scale-95"
          >
            Patient Intake
            <div className="text-xs mt-1 opacity-80">
              Submit symptoms for urgency classification
            </div>
          </button>

          {/* HOSPITAL */}
          <button
            onClick={() => router.push("/dashboard")}
            className="w-full p-5 rounded-2xl bg-slate-800 text-white font-bold shadow-lg hover:bg-slate-900 transition-all active:scale-95"
          >
            Hospital Dashboard
            <div className="text-xs mt-1 opacity-80">
              View real-time patient flow insights
            </div>
          </button>

        </div>

        {/* CONTEXT */}
        <p className="text-slate-400 mt-8 text-xs leading-relaxed">
          Emergency rooms are overwhelmed. MediFlow AI helps prioritize patients
          and anticipate demand before saturation happens.
        </p>

      </div>
    </main>
  );
}