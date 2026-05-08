import Link from "next/link";
import { fetchAllTriageRecords } from "@/lib/triage-data";
import { normalizeColor } from "@/lib/triage-analytics";
import RecentRecordsTable from "@/components/dashboard/RecentRecordsTable";

export const dynamic = "force-dynamic";

function FilterButton({ href, active, children }) {
  return (
    <Link
      href={href}
      prefetch={false}
      className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${active
          ? "border-blue-600 bg-blue-600 text-white shadow-sm"
          : "border-slate-200 bg-white text-slate-600 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
        }`}
    >
      {children}
    </Link>
  );
}

export default async function RecentRecordsPage({ searchParams }) {
  const params = await searchParams;
  const selectedColor = normalizeColor(params?.color || "ALL");

  const { records, error } = await fetchAllTriageRecords();

  if (error) {
    return (
      <main className="px-6 py-8 text-slate-900">
        <div className="mx-auto max-w-7xl">
          <div className="rounded-3xl border border-red-200 bg-white p-6 shadow-sm">
            <h1 className="text-2xl font-bold text-slate-900">
              Records error
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

  const filteredRecords =
    selectedColor === "ALL"
      ? allRecords
      : allRecords.filter(
        (record) => normalizeColor(record.color) === selectedColor
      );

  const visibleRecords = filteredRecords.slice(0, 50);

  const redCount = allRecords.filter(
    (record) => normalizeColor(record.color) === "RED"
  ).length;

  const yellowCount = allRecords.filter(
    (record) => normalizeColor(record.color) === "YELLOW"
  ).length;

  const greenCount = allRecords.filter(
    (record) => normalizeColor(record.color) === "GREEN"
  ).length;

  return (
    <main className="px-6 py-8 text-slate-900">
      <div className="mx-auto max-w-7xl">
        <section className="mb-8">
          <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
            <div className="mb-3 inline-flex rounded-full border border-blue-200 bg-blue-50 px-4 py-1 text-sm font-semibold text-blue-700">
              Patient records
            </div>

            <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
              <div>
                <h1 className="text-4xl font-bold tracking-tight text-slate-900">
                  Recent triage records
                </h1>

                <p className="mt-3 max-w-3xl text-slate-600">
                  Review recent patient intake records and filter by triage
                  severity level.
                </p>
              </div>

              <div className="rounded-2xl border border-blue-200 bg-blue-50 px-6 py-4 text-right">
                <p className="text-sm font-medium text-blue-700">
                  Loaded records
                </p>

                <p className="mt-1 text-3xl font-bold text-blue-700">
                  {allRecords.length}
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="mb-8 grid gap-5 md:grid-cols-3">
          <div className="rounded-3xl border border-red-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-medium text-slate-500">RED cases</p>
            <h2 className="mt-3 text-3xl font-bold text-red-700">
              {redCount}
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              Requires immediate clinical review.
            </p>
          </div>

          <div className="rounded-3xl border border-amber-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-medium text-slate-500">YELLOW cases</p>
            <h2 className="mt-3 text-3xl font-bold text-amber-700">
              {yellowCount}
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              May require same-day or scheduled care.
            </p>
          </div>

          <div className="rounded-3xl border border-emerald-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-medium text-slate-500">GREEN cases</p>
            <h2 className="mt-3 text-3xl font-bold text-emerald-700">
              {greenCount}
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              Suitable for routine non-urgent guidance.
            </p>
          </div>
        </section>

        <section className="mb-8 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">
                Filter records
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Current view:{" "}
                {selectedColor === "ALL" ? "All records" : selectedColor} ·
                Showing{" "}
                <span className="font-semibold text-slate-700">
                  {visibleRecords.length}
                </span>{" "}
                of{" "}
                <span className="font-semibold text-slate-700">
                  {filteredRecords.length}
                </span>{" "}
                matching records
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <FilterButton
                href="/dashboard/records"
                active={selectedColor === "ALL"}
              >
                All
              </FilterButton>

              <FilterButton
                href="/dashboard/records?color=RED"
                active={selectedColor === "RED"}
              >
                RED
              </FilterButton>

              <FilterButton
                href="/dashboard/records?color=YELLOW"
                active={selectedColor === "YELLOW"}
              >
                YELLOW
              </FilterButton>

              <FilterButton
                href="/dashboard/records?color=GREEN"
                active={selectedColor === "GREEN"}
              >
                GREEN
              </FilterButton>
            </div>
          </div>
        </section>

        <RecentRecordsTable records={visibleRecords} />
      </div>
    </main>
  );
}