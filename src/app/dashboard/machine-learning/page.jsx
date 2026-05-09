import Link from "next/link";

export const dynamic = "force-dynamic";

export default function MachineLearningPage() {
  return (
    <main className="min-h-screen bg-slate-50 px-6 py-8 text-slate-950">
      <div className="mx-auto w-full max-w-7xl">
        <header className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="mb-3 inline-flex rounded-full bg-violet-50 px-3 py-1 text-xs font-black uppercase tracking-[0.2em] text-violet-700">
              Machine Learning Insights
            </div>

            <h1 className="text-3xl font-black tracking-tight md:text-4xl">
              Hospital Load & Pattern Analysis
            </h1>

            <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
              This module will analyze historical triage data to detect unusual
              patterns, patient flow anomalies, and potential hospital load
              risks.
            </p>
          </div>

          <Link
            href="/dashboard"
            className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-black text-slate-700 shadow-sm transition hover:bg-slate-100"
          >
            Back to Dashboard
          </Link>
        </header>

        <section className="grid gap-6 md:grid-cols-3">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="text-3xl">📈</div>
            <h2 className="mt-4 text-xl font-black">
              Pattern Detection
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Identify increases in symptom categories, triage colors, and
              patient volume over time.
            </p>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="text-3xl">⚠️</div>
            <h2 className="mt-4 text-xl font-black">
              Anomaly Signals
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Surface unusual spikes in RED or YELLOW cases that may indicate
              operational pressure.
            </p>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="text-3xl">🏥</div>
            <h2 className="mt-4 text-xl font-black">
              Load Prediction
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Prepare the foundation for predicting high-demand windows using
              historical triage records.
            </p>
          </div>
        </section>

        <section className="mt-6 rounded-3xl border border-violet-200 bg-violet-50 p-6 text-violet-950">
          <h2 className="text-xl font-black">
            Next build step
          </h2>

          <p className="mt-2 text-sm leading-6">
            The next version of this page can connect to Supabase, calculate
            trends from triage_records, and show anomaly indicators using simple
            statistical thresholds before adding a trained ML model.
          </p>
        </section>
      </div>
    </main>
  );
}