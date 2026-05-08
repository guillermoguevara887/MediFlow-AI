import { fetchAllTriageRecords } from "@/lib/triage-data";
import { normalizeColor } from "@/lib/triage-analytics";
import AlertsList from "@/components/dashboard/AlertsList";


export const dynamic = "force-dynamic";

export default async function CriticalAlertsPage() {
  const { records, error } = await fetchAllTriageRecords();

  if (error) {
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
                  prioritization, and operational awareness.
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
          </div>
        </section>

        <AlertsList
          alerts={criticalAlerts}
          title="Latest critical alerts"
        />
      </div>
    </main>
  );
}