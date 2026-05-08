import Link from "next/link";
import { fetchAllTriageRecords } from "@/lib/triage-data";
import { normalizeColor } from "@/lib/triage-analytics";

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

function formatDate(value) {
  if (!value) return "No date";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "No date";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function getPatientName(record) {
  return (
    record?.nombre ||
    record?.name ||
    record?.patient_name ||
    record?.patientName ||
    "Unnamed patient"
  );
}

function getSymptoms(record) {
  return record?.sintomas || record?.symptoms || "No symptoms registered";
}

function getMessage(record) {
  return record?.mensaje || record?.message || "No clinical message available.";
}

function getColorStyles(color) {
  const normalized = normalizeColor(color);

  if (normalized === "RED") {
    return "border-red-200 bg-red-50 text-red-700";
  }

  if (normalized === "YELLOW") {
    return "border-amber-200 bg-amber-50 text-amber-700";
  }

  if (normalized === "GREEN") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }

  return "border-slate-200 bg-slate-50 text-slate-700";
}

function ClickableRecordsList({ records }) {
  if (!records || records.length === 0) {
    return (
      <section className="rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <h2 className="text-xl font-bold text-slate-900">No records found</h2>
        <p className="mt-2 text-sm text-slate-500">
          There are no records matching this filter.
        </p>
      </section>
    );
  }

  return (
    <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-100 px-6 py-5">
        <h2 className="text-xl font-bold text-slate-900">
          Recent patient records
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          Click any patient record to open the individual patient file.
        </p>
      </div>

      <div className="divide-y divide-slate-100">
        {records.map((record) => {
          const color = normalizeColor(record?.color);
          const patientName = getPatientName(record);
          const symptoms = getSymptoms(record);
          const message = getMessage(record);
          const createdAt = formatDate(record?.created_at);
          const href = record?.id
            ? `/dashboard/patients/${record.id}`
            : "/dashboard/records";

          return (
            <Link
              key={record?.id}
              href={href}
              prefetch={false}
              className="group grid gap-4 px-6 py-5 transition hover:bg-blue-50/60 md:grid-cols-[1.2fr_1.6fr_0.8fr_0.8fr]"
            >
              <div>
                <p className="text-sm font-medium text-slate-500">Patient</p>
                <p className="mt-1 font-semibold text-slate-900 group-hover:text-blue-700">
                  {patientName}
                </p>

                {!record?.id && (
                  <p className="mt-1 text-xs font-medium text-red-600">
                    Missing patient ID
                  </p>
                )}
              </div>

              <div>
                <p className="text-sm font-medium text-slate-500">Symptoms</p>
                <p className="mt-1 line-clamp-2 text-sm text-slate-700">
                  {symptoms}
                </p>
                <p className="mt-2 line-clamp-1 text-xs text-slate-500">
                  {message}
                </p>
              </div>

              <div>
                <p className="text-sm font-medium text-slate-500">Severity</p>
                <span
                  className={`mt-2 inline-flex rounded-full border px-3 py-1 text-xs font-bold ${getColorStyles(
                    color
                  )}`}
                >
                  {color || "UNKNOWN"}
                </span>
              </div>

              <div className="md:text-right">
                <p className="text-sm font-medium text-slate-500">Created</p>
                <p className="mt-1 text-sm font-semibold text-slate-700">
                  {createdAt}
                </p>
                <p className="mt-2 text-xs font-semibold text-blue-700 opacity-0 transition group-hover:opacity-100">
                  Open patient →
                </p>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
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

        <ClickableRecordsList records={visibleRecords} />
      </div>
    </main>
  );
}