export const dynamic = "force-dynamic";

export default function AnomalyInsightsPage() {
  return (
    <main className="px-6 py-8 text-slate-900">
      <div className="mx-auto max-w-7xl">
        <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          <div className="mb-3 inline-flex rounded-full border border-violet-200 bg-violet-50 px-4 py-1 text-sm font-semibold text-violet-700">
            AI Monitoring Layer
          </div>

          <h1 className="text-4xl font-bold tracking-tight text-slate-900">
            Anomaly insights
          </h1>

          <p className="mt-3 max-w-3xl text-slate-600">
            This page will show abnormal case volume, RED case spikes, and
            clinical symptom clusters.
          </p>
        </div>
      </div>
    </main>
  );
}