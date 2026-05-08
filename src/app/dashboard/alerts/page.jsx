import Link from "next/link";
import { fetchAllTriageRecords } from "@/lib/triage-data";
import { normalizeColor } from "@/lib/triage-analytics";

export const dynamic = "force-dynamic";

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

function CriticalAlertCard({ record }) {
  const redFlags = normalizeArray(record.red_flags || record.red_flags_detected);
  const reasons = normalizeArray(record.reasons);

  return (
    <Link
      href={`/dashboard/patients/${record.id}`}
      className="block rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-red-200 hover:bg-red-50/40 hover:shadow-md"
    >
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-3">
            <span className="rounded-full bg-red-600 px-3 py-1 text-xs font-black text-white">
              RED
            </span>

            <span className="rounded-full border border-red-200 bg-red-50 px-3 py-1 text-xs font-bold text-red-700">
              Immediate review
            </span>

            <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-500">
              {formatFullDate(record.created_at)}
            </span>
          </div>

          <h2 className="mt-4 text-xl font-bold text-slate-900">
            {record.nombre || "Unknown patient"}
          </h2>

          <p className="mt-2 max-w-4xl text-sm leading-6 text-slate-600">
            {record.sintomas || "No symptoms provided"}
          </p>
        </div>

        <div className="shrink-0 text-sm font-bold text-blue-700">
          Open case →
        </div>
      </div>

      {record.mensaje ? (
        <div className="mt-4 rounded-2xl border border-slate-100 bg-slate-50 p-4">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">
            AI triage message
          </p>

          <p className="mt-2 text-sm leading-6 text-slate-600">
            {record.mensaje}
          </p>
        </div>
      ) : null}

      <div className="mt-4 flex flex-wrap gap-2">
        {redFlags.slice(0, 5).map((flag, index) => (
          <span
            key={index}
            className="rounded-full bg-slate-950 px-3 py-1 text-xs font-bold text-white"
          >
            {flag}
          </span>
        ))}

        {reasons.length > 0 ? (
          <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-bold text-slate-500">
            {reasons.length} reason{reasons.length === 1 ? "" : "s"}
          </span>
        ) : null}
      </div>
    </Link>
  );
}

function CriticalAlertsError({ error }) {
  return (
    <main className="px-6 py-8 text-slate-900">
      <div className="mx-auto max-w-7xl">
        <div className="rounded-3xl border border-red-200 bg-white p-6 shadow-sm">
          <h1 className="text-2xl font-bold text-slate-900">
            Critical alerts error
          </h1>

          <p className="mt-3 text-red-600">
            Records could not be loaded from Supabase.
          </p>

          <pre className="mt-4 overflow-auto rounded-2xl bg-slate-50 p-4 text-sm text-red-700">
            {JSON.stringify(error, null, 2)}
          </pre>
        </div>
      </div>
    </main>
  );
}

export default async function CriticalAlertsPage() {
  const { records, error } = await fetchAllTriageRecords();

  if (error) {
    return <CriticalAlertsError error={error} />;
  }

  const allRecords = records || [];

  const criticalAlerts = allRecords
    .filter((record) => normalizeColor(record.color) === "RED")
    .slice(0, 25);

  const redCount = allRecords.filter(
    (record) => normalizeColor(record.color) === "RED"
  ).length;

  return (
    <main className="px-6 py-8 text-slate-900">
      <div className="mx-auto max-w-7xl">
        <section className="mb-8">
          <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
            <div className="mb-3 inline-flex rounded-full border border-red-200 bg-red-50 px-4 py-1 text-sm font-semibold text-red-700">
              Critical alerts
            </div>

            <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
              <div>
                <h1 className="text-4xl font-bold tracking-tight text-slate-900">
                  Critical patient alerts
                </h1>

                <p className="mt-3 max-w-3xl text-slate-600">
                  RED triage cases requiring immediate clinical review, rapid
                  prioritization, and operational awareness. Click any patient
                  to open the full case profile.
                </p>
              </div>

              <div className="rounded-2xl border border-red-200 bg-red-50 px-6 py-4 text-right">
                <p className="text-sm font-medium text-red-700">
                  Total RED cases
                </p>

                <p className="mt-1 text-3xl font-bold text-red-700">
                  {redCount}
                </p>
              </div>
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href="/dashboard"
                className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 transition hover:bg-slate-100"
              >
                ← Back to Dashboard
              </Link>

              <Link
                href="/"
                className="rounded-full border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-bold text-blue-700 transition hover:bg-blue-100"
              >
                Register new patient →
              </Link>
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-5 flex flex-col justify-between gap-3 md:flex-row md:items-start">
            <div>
              <h2 className="text-2xl font-semibold text-slate-900">
                Latest critical alerts
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Showing the latest 25 RED cases from Supabase.
              </p>
            </div>

            <span className="rounded-full border border-red-200 bg-red-50 px-3 py-1 text-xs font-bold text-red-700">
              {criticalAlerts.length} shown
            </span>
          </div>

          {criticalAlerts.length > 0 ? (
            <div className="space-y-4">
              {criticalAlerts.map((record) => (
                <CriticalAlertCard key={record.id} record={record} />
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 text-sm text-slate-500">
              No RED critical alerts were found in the loaded records.
            </div>
          )}
        </section>
      </div>
    </main>
  );
}