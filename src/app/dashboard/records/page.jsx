export const dynamic = "force-dynamic";

export default function RecentRecordsPage() {
  return (
    <main className="px-6 py-8 text-slate-900">
      <div className="mx-auto max-w-7xl">
        <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          <div className="mb-3 inline-flex rounded-full border border-blue-200 bg-blue-50 px-4 py-1 text-sm font-semibold text-blue-700">
            Patient records
          </div>

          <h1 className="text-4xl font-bold tracking-tight text-slate-900">
            Recent records
          </h1>

          <p className="mt-3 max-w-3xl text-slate-600">
            This page will show the recent triage records table with filters for
            ALL, RED, YELLOW, and GREEN cases.
          </p>
        </div>
      </div>
    </main>
  );
}