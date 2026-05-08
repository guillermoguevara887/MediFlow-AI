import { fetchAllTriageRecords } from "@/lib/triage-data";
import { getAnomalyInsights } from "@/lib/triage-analytics";
import AnomalyInsights from "@/components/dashboard/AnomalyInsights";


export const dynamic = "force-dynamic";

export default async function AnomalyInsightsPage() {
  const { records, error } = await fetchAllTriageRecords();

  if (error) {
    return (
      <main className="px-6 py-8 text-slate-900">
        <div className="mx-auto max-w-7xl">
          <div className="rounded-3xl border border-red-200 bg-white p-6 shadow-sm">
            <h1 className="text-2xl font-bold text-slate-900">
              Anomaly insights error
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

  const allRecords = records || [];
  const anomalyInsights = getAnomalyInsights(allRecords);

  return (
    <main className="px-6 py-8 text-slate-900">
      <div className="mx-auto max-w-7xl">
        <section className="mb-8">
          <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
            <div className="mb-3 inline-flex rounded-full border border-violet-200 bg-violet-50 px-4 py-1 text-sm font-semibold text-violet-700">
              AI Monitoring Layer
            </div>

            <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
              <div>
                <h1 className="text-4xl font-bold tracking-tight text-slate-900">
                  Anomaly insights
                </h1>

                <p className="mt-3 max-w-3xl text-slate-600">
                  Detect unusual patient flow patterns, severity spikes, and
                  symptom clusters across the triage dataset.
                </p>
              </div>

              <div className="rounded-2xl border border-violet-200 bg-violet-50 px-6 py-4 text-right">
                <p className="text-sm font-medium text-violet-700">
                  Detected signals
                </p>

                <p className="mt-1 text-3xl font-bold text-violet-700">
                  {anomalyInsights.length}
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="mb-8 grid gap-5 md:grid-cols-3">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-medium text-slate-500">
              Monitoring scope
            </p>
            <h2 className="mt-3 text-3xl font-bold text-slate-900">
              {allRecords.length}
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              Records analyzed from the synthetic demo dataset.
            </p>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-medium text-slate-500">
              Detection method
            </p>
            <h2 className="mt-3 text-3xl font-bold text-slate-900">
              Baseline
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              Compares daily volume and RED case spikes against historical
              averages.
            </p>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-medium text-slate-500">
              Cluster tracking
            </p>
            <h2 className="mt-3 text-3xl font-bold text-slate-900">
              3 types
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              Respiratory, gastrointestinal, and heat-related clinical signals.
            </p>
          </div>
        </section>

        <AnomalyInsights
          insights={anomalyInsights}
          title="Detected anomaly signals"
          description="Days with abnormal case volume, increased RED cases, or dominant symptom clusters."
        />
      </div>
    </main>
  );
}