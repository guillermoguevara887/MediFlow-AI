import Link from "next/link";
import { notFound } from "next/navigation";
import { supabase } from "@/lib/triage-data";

export const dynamic = "force-dynamic";

function normalizeColor(value) {
  const color = value?.toString?.().trim().toUpperCase();

  if (color === "RED") return "RED";
  if (color === "YELLOW") return "YELLOW";
  if (color === "GREEN") return "GREEN";

  return "GREEN";
}

function normalizeArray(value) {
  if (Array.isArray(value)) return value;

  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);

      if (Array.isArray(parsed)) return parsed;
      if (parsed) return [parsed];

      return [];
    } catch {
      return value.trim() ? [value] : [];
    }
  }

  if (value) return [value];

  return [];
}

function formatFullDate(dateString) {
  if (!dateString) return "No date available";

  try {
    return new Intl.DateTimeFormat("en-US", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(dateString));
  } catch {
    return "No date available";
  }
}

function getTriageMeta(colorValue) {
  const color = normalizeColor(colorValue);

  const meta = {
    RED: {
      label: "RED",
      icon: "🚨",
      title: "Immediate attention recommended",
      description:
        "This patient may require urgent clinical evaluation based on the symptoms and red flags detected.",
      badge: "bg-red-600 text-white",
      soft: "border-red-200 bg-red-50 text-red-800",
      card: "border-red-200 bg-red-50 text-red-950",
      action: "Prioritize this case for immediate review.",
    },
    YELLOW: {
      label: "YELLOW",
      icon: "⚠️",
      title: "Same-day clinical evaluation recommended",
      description:
        "This patient may require same-day review or scheduled clinical follow-up.",
      badge: "bg-amber-400 text-slate-950",
      soft: "border-amber-200 bg-amber-50 text-amber-800",
      card: "border-amber-200 bg-amber-50 text-amber-950",
      action: "Review soon and route to same-day or scheduled care.",
    },
    GREEN: {
      label: "GREEN",
      icon: "✅",
      title: "Routine care or referral recommended",
      description:
        "This patient appears lower urgency, but clinical judgment should still be applied.",
      badge: "bg-emerald-500 text-white",
      soft: "border-emerald-200 bg-emerald-50 text-emerald-800",
      card: "border-emerald-200 bg-emerald-50 text-emerald-950",
      action: "Route to routine care, guidance, or referral if appropriate.",
    },
  };

  return meta[color] || meta.GREEN;
}

async function fetchPatientCase(id) {
  if (!supabase) {
    return {
      record: null,
      error: {
        message:
          "Missing Supabase environment variables. Check NEXT_PUBLIC_SUPABASE_URL and SUPABASE_ANON_KEY.",
      },
    };
  }

  const { data, error } = await supabase
    .from("triage_records")
    .select(
      "id, nombre, sintomas, color, mensaje, reasons, red_flags, created_at"
    )
    .eq("id", id)
    .single();

  if (error) {
    return {
      record: null,
      error,
    };
  }

  return {
    record: data,
    error: null,
  };
}

function DetailCard({ title, children }) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-xl font-bold text-slate-900">{title}</h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function EmptyState({ children }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-500">
      {children}
    </div>
  );
}

export default async function PatientCasePage({ params }) {
  const { id } = await params;

  const { record, error } = await fetchPatientCase(id);

  if (error && !record) {
    notFound();
  }

  if (!record) {
    notFound();
  }

  const patient = {
    ...record,
    nombre: record.nombre || "Unknown patient",
    sintomas: record.sintomas || "No symptoms provided",
    color: normalizeColor(record.color),
    mensaje: record.mensaje || "No triage message available",
    reasons: normalizeArray(record.reasons),
    red_flags: normalizeArray(record.red_flags),
  };

  const meta = getTriageMeta(patient.color);

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-8 text-slate-900">
      <div className="mx-auto max-w-6xl">
        {/* TOP NAV */}
        <section className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <Link
            href="/dashboard"
            className="inline-flex w-fit items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 shadow-sm transition hover:bg-slate-100"
          >
            <span>←</span>
            <span>Back to Hospital Intelligence</span>
          </Link>

          <Link
            href="/"
            className="inline-flex w-fit items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-bold text-blue-700 transition hover:bg-blue-100"
          >
            Register new patient →
          </Link>
        </section>

        {/* HERO */}
        <section
          className={`mb-6 rounded-3xl border p-6 shadow-sm md:p-8 ${meta.card}`}
        >
          <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-start">
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-4xl">{meta.icon}</span>

                <span
                  className={`rounded-full px-4 py-2 text-sm font-black shadow-sm ${meta.badge}`}
                >
                  {meta.label}
                </span>

                <span
                  className={`rounded-full border px-4 py-2 text-xs font-bold ${meta.soft}`}
                >
                  Patient case
                </span>
              </div>

              <h1 className="mt-6 text-4xl font-black tracking-tight text-slate-950 md:text-5xl">
                {patient.nombre}
              </h1>

              <p className="mt-3 max-w-3xl text-base leading-7">
                {meta.title}
              </p>

              <p className="mt-2 max-w-3xl text-sm leading-6 opacity-80">
                {meta.description}
              </p>
            </div>

            <div className="rounded-3xl border border-white/70 bg-white/75 p-5 shadow-sm lg:min-w-72">
              <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">
                Created at
              </p>

              <p className="mt-2 text-sm font-bold text-slate-900">
                {formatFullDate(patient.created_at)}
              </p>

              <div className="mt-4 border-t border-slate-200 pt-4">
                <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">
                  Case ID
                </p>

                <p className="mt-2 break-all text-xs font-semibold text-slate-600">
                  {patient.id}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* MAIN CONTENT */}
        <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          {/* LEFT COLUMN */}
          <div className="space-y-6">
            <DetailCard title="Symptoms reported">
              <div className="whitespace-pre-wrap rounded-2xl border border-slate-200 bg-slate-50 p-5 text-sm leading-7 text-slate-700">
                {patient.sintomas}
              </div>
            </DetailCard>

            <DetailCard title="AI triage result">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                <div className="flex flex-wrap items-center gap-3">
                  <span
                    className={`rounded-full px-4 py-2 text-xs font-black ${meta.badge}`}
                  >
                    {meta.label}
                  </span>

                  <span className="text-sm font-bold text-slate-900">
                    {meta.title}
                  </span>
                </div>

                <p className="mt-4 text-sm leading-7 text-slate-700">
                  {patient.mensaje}
                </p>
              </div>
            </DetailCard>

            <DetailCard title="Recommended operational action">
              <div className={`rounded-2xl border p-5 text-sm leading-7 ${meta.soft}`}>
                {meta.action}
              </div>
            </DetailCard>
          </div>

          {/* RIGHT COLUMN */}
          <aside className="space-y-6">
            <DetailCard title="Reasoning">
              {patient.reasons.length > 0 ? (
                <ul className="space-y-3">
                  {patient.reasons.map((reason, index) => (
                    <li
                      key={index}
                      className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-700"
                    >
                      <span className="mr-2 font-black text-slate-900">
                        {index + 1}.
                      </span>
                      {reason}
                    </li>
                  ))}
                </ul>
              ) : (
                <EmptyState>
                  No reasoning details were stored for this patient case.
                </EmptyState>
              )}
            </DetailCard>

            <DetailCard title="Red flags detected">
              {patient.red_flags.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {patient.red_flags.map((flag, index) => (
                    <span
                      key={index}
                      className="rounded-full bg-slate-950 px-3 py-2 text-xs font-black text-white"
                    >
                      {flag}
                    </span>
                  ))}
                </div>
              ) : (
                <EmptyState>No explicit red flags were detected.</EmptyState>
              )}
            </DetailCard>

            <DetailCard title="Hospital intelligence impact">
              <div className="space-y-3 text-sm leading-6 text-slate-600">
                <p>
                  This record contributes to triage distribution, patient intake
                  volume, RED/YELLOW/GREEN monitoring, and anomaly detection.
                </p>

                <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4 text-blue-900">
                  <p className="font-bold">Why this matters</p>
                  <p className="mt-1">
                    The dashboard can use this case to detect pressure points in
                    hospital flow and identify abnormal clinical patterns.
                  </p>
                </div>
              </div>
            </DetailCard>

            <div className="rounded-3xl border border-blue-100 bg-blue-50 p-6 text-blue-950 shadow-sm">
              <h2 className="text-sm font-black uppercase tracking-[0.2em]">
                Clinical safety note
              </h2>

              <p className="mt-4 text-sm leading-6">
                MediFlow AI is a clinical decision-support prototype. It does
                not replace professional medical judgment, emergency protocols,
                or direct evaluation by qualified healthcare personnel.
              </p>
            </div>
          </aside>
        </section>
      </div>
    </main>
  );
}