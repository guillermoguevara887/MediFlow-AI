"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

const TRIAGE_STYLES = {
  RED: {
    label: "RED",
    title: "Immediate attention recommended",
    description:
      "This patient may require urgent medical evaluation based on the symptoms provided.",
    badgeClass: "bg-red-600 text-white",
    cardClass: "bg-red-50 border-red-200 text-red-950",
    icon: "🚨",
  },
  YELLOW: {
    label: "YELLOW",
    title: "Same-day clinical evaluation recommended",
    description:
      "This patient should be evaluated soon and may need same-day medical attention.",
    badgeClass: "bg-amber-400 text-slate-950",
    cardClass: "bg-amber-50 border-amber-200 text-amber-950",
    icon: "⚠️",
  },
  GREEN: {
    label: "GREEN",
    title: "Routine care or referral recommended",
    description:
      "This case appears lower urgency, but clinical judgment should still be applied.",
    badgeClass: "bg-emerald-500 text-white",
    cardClass: "bg-emerald-50 border-emerald-200 text-emerald-950",
    icon: "✅",
  },
};

function normalizeArray(value) {
  if (Array.isArray(value)) return value;
  if (typeof value === "string" && value.trim()) return [value];
  return [];
}

export default function Home() {
  const [nombre, setNombre] = useState("");
  const [sintomas, setSintomas] = useState("");
  const [resultado, setResultado] = useState(null);
  const [cargando, setCargando] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const sintomasTrim = sintomas.trim();
  const nombreTrim = nombre.trim();

  const color = resultado?.color?.toUpperCase?.() || "";
  const triageStyle = TRIAGE_STYLES[color] || TRIAGE_STYLES.GREEN;

  const reasons = useMemo(
    () => normalizeArray(resultado?.reasons),
    [resultado]
  );

  const redFlags = useMemo(() => {
    return normalizeArray(
      resultado?.red_flags_detected || resultado?.red_flags
    );
  }, [resultado]);

  const limpiarFormulario = () => {
    setNombre("");
    setSintomas("");
    setResultado(null);
    setErrorMsg("");
  };

  const analizarTriage = async () => {
    setErrorMsg("");

    if (!sintomasTrim) {
      setErrorMsg("Please describe the patient's symptoms before running triage.");
      return;
    }

    setCargando(true);
    setResultado(null);

    try {
      const res = await fetch("/api/triage", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          nombre: nombreTrim,
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

  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      {/* TOP BAR */}
      <header className="border-b border-slate-200 bg-white/80 backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-4">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 shadow-sm transition hover:bg-slate-100"
          >
            <span>←</span>
            <span>Back to Dashboard</span>
          </Link>

          <div className="text-right">
            <p className="text-sm font-black text-slate-900">MediFlow AI</p>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
              Patient Intake
            </p>
          </div>
        </div>
      </header>

      <section className="mx-auto grid w-full max-w-6xl gap-6 px-6 py-8 lg:grid-cols-[1.1fr_0.9fr]">
        {/* LEFT CARD - FORM */}
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
          <div className="mb-8">
            <div className="mb-3 inline-flex rounded-full bg-blue-50 px-3 py-1 text-xs font-black uppercase tracking-[0.2em] text-blue-700">
              Reception triage assistant
            </div>

            <h1 className="text-3xl font-black tracking-tight text-slate-950 md:text-4xl">
              Patient Intake
            </h1>

            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
              Enter the patient information and symptoms. MediFlow AI will
              classify urgency, detect possible red flags, and send the case to
              the hospital analytics system.
            </p>
          </div>

          <div className="space-y-5">
            <div>
              <label className="mb-2 block text-sm font-bold text-slate-800">
                Patient name
              </label>

              <input
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-4 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
                placeholder="Patient name optional"
              />

              <p className="mt-2 text-xs text-slate-500">
                Optional for demo mode. In production, this could connect to a
                patient ID or hospital record.
              </p>
            </div>

            <div>
              <label className="mb-2 block text-sm font-bold text-slate-800">
                Symptoms description
              </label>

              <textarea
                value={sintomas}
                onChange={(e) => setSintomas(e.target.value)}
                className="min-h-44 w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 p-4 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
                placeholder="Example: 45-year-old patient with chest discomfort, dizziness and shortness of breath for 30 minutes..."
              />

              <div className="mt-2 flex items-center justify-between gap-3 text-xs text-slate-500">
                <p>Include duration, severity, and relevant context if known.</p>
                <p className="font-semibold">{sintomas.length} characters</p>
              </div>
            </div>

            {errorMsg && (
              <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-900">
                <div className="mb-1 font-black">Error</div>
                <div>{errorMsg}</div>
              </div>
            )}

            <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
              <button
                onClick={analizarTriage}
                disabled={cargando || !sintomasTrim}
                className={`rounded-2xl px-5 py-4 text-sm font-black text-white shadow-lg shadow-blue-600/20 transition ${cargando || !sintomasTrim
                    ? "cursor-not-allowed bg-slate-400 shadow-none"
                    : "bg-blue-600 hover:bg-blue-700 active:scale-[0.99]"
                  }`}
              >
                {cargando
                  ? "Analyzing patient risk..."
                  : "Run AI Triage Assessment"}
              </button>

              <button
                onClick={limpiarFormulario}
                type="button"
                className="rounded-2xl border border-slate-200 bg-white px-5 py-4 text-sm font-black text-slate-700 transition hover:bg-slate-100"
              >
                New Patient
              </button>
            </div>
          </div>
        </div>

        {/* RIGHT CARD - FLOW */}
        <aside className="space-y-6">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
            <h2 className="text-xl font-black text-slate-950">
              How this supports hospital flow
            </h2>

            <p className="mt-2 text-sm leading-6 text-slate-600">
              This screen works as the entry point for the operational system:
              every case can become part of the hospital load analysis.
            </p>

            <div className="mt-6 space-y-4">
              {[
                {
                  step: "01",
                  title: "Reception enters symptoms",
                  text: "The patient information is captured at the front desk or intake area.",
                },
                {
                  step: "02",
                  title: "AI classifies urgency",
                  text: "The system returns a RED, YELLOW, or GREEN triage level.",
                },
                {
                  step: "03",
                  title: "Red flags are surfaced",
                  text: "Possible high-risk symptoms are highlighted for review.",
                },
                {
                  step: "04",
                  title: "Dashboard updates",
                  text: "The case contributes to hospital load and anomaly analysis.",
                },
              ].map((item) => (
                <div
                  key={item.step}
                  className="flex gap-4 rounded-2xl border border-slate-100 bg-slate-50 p-4"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-slate-900 text-xs font-black text-white">
                    {item.step}
                  </div>

                  <div>
                    <h3 className="text-sm font-black text-slate-900">
                      {item.title}
                    </h3>
                    <p className="mt-1 text-sm leading-5 text-slate-600">
                      {item.text}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-blue-100 bg-blue-50 p-6 text-blue-950">
            <h3 className="text-sm font-black uppercase tracking-[0.2em]">
              Clinical safety note
            </h3>

            <p className="mt-3 text-sm leading-6">
              MediFlow AI is a clinical decision-support prototype. It does not
              replace professional medical judgment, emergency protocols, or
              direct evaluation by qualified healthcare personnel.
            </p>
          </div>
        </aside>
      </section>

      {/* RESULT */}
      {resultado && (
        <section className="mx-auto w-full max-w-6xl px-6 pb-10">
          <div
            className={`rounded-3xl border p-6 shadow-sm md:p-8 ${triageStyle.cardClass}`}
          >
            <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
              <div>
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{triageStyle.icon}</span>

                  <span
                    className={`rounded-full px-4 py-2 text-sm font-black shadow-sm ${triageStyle.badgeClass}`}
                  >
                    {triageStyle.label}
                  </span>
                </div>

                <h2 className="mt-5 text-2xl font-black tracking-tight">
                  {triageStyle.title}
                </h2>

                <p className="mt-2 max-w-3xl text-sm leading-6">
                  {resultado.mensaje || triageStyle.description}
                </p>
              </div>

              <div className="rounded-2xl bg-white/70 p-4 text-sm shadow-sm">
                <p className="font-black">System status</p>
                <p className="mt-1 opacity-80">
                  Case saved for hospital load analysis.
                </p>
              </div>
            </div>

            <div className="mt-6 grid gap-4 lg:grid-cols-2">
              <div className="rounded-2xl bg-white/70 p-5 shadow-sm">
                <h3 className="text-xs font-black uppercase tracking-[0.2em]">
                  Reasoning
                </h3>

                {reasons.length > 0 ? (
                  <ul className="mt-3 space-y-2 text-sm leading-6">
                    {reasons.map((reason, index) => (
                      <li key={index} className="flex gap-2">
                        <span className="font-black">•</span>
                        <span>{reason}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-3 text-sm opacity-80">
                    No reasoning details were returned by the triage API.
                  </p>
                )}
              </div>

              <div className="rounded-2xl bg-white/70 p-5 shadow-sm">
                <h3 className="text-xs font-black uppercase tracking-[0.2em]">
                  Red flags detected
                </h3>

                {redFlags.length > 0 ? (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {redFlags.map((flag, index) => (
                      <span
                        key={index}
                        className="rounded-full bg-slate-950 px-3 py-1 text-xs font-black text-white"
                      >
                        {flag}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="mt-3 text-sm opacity-80">
                    No explicit red flags were detected in this response.
                  </p>
                )}
              </div>
            </div>
          </div>
        </section>
      )}
    </main>
  );
}