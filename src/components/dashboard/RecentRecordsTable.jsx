import { normalizeColor } from "@/lib/triage-analytics";

function getPatientDisplayName(record, index = 0) {
  const rawName = String(record?.nombre || "").trim();

  if (rawName && rawName.toLowerCase() !== "paciente simulado") {
    return rawName;
  }

  const shortId = record?.id
    ? String(record.id).split("-")[0]
    : String(index + 1).padStart(4, "0");

  return `Patient #${shortId}`;
}

function formatDate(dateString) {
  if (!dateString) return "No date";

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(dateString));
}

export default function RecentRecordsTable({ records = [] }) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-5 flex flex-col justify-between gap-3 md:flex-row md:items-center">
        <div>
          <h2 className="text-2xl font-semibold text-slate-900">
            Recent records
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Latest patients registered in the triage system.
          </p>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200">
        <table className="w-full border-collapse text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3 font-semibold">Patient</th>
              <th className="px-4 py-3 font-semibold">Symptoms</th>
              <th className="px-4 py-3 font-semibold">Triage level</th>
              <th className="px-4 py-3 font-semibold">Time</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-200 bg-white">
            {records.length === 0 ? (
              <tr>
                <td
                  colSpan="4"
                  className="px-4 py-8 text-center text-sm text-slate-500"
                >
                  No records found for this filter.
                </td>
              </tr>
            ) : (
              records.map((record, index) => {
                const color = normalizeColor(record.color);

                const badgeClass =
                  color === "RED"
                    ? "border-red-200 bg-red-50 text-red-700"
                    : color === "YELLOW"
                      ? "border-amber-200 bg-amber-50 text-amber-700"
                      : "border-emerald-200 bg-emerald-50 text-emerald-700";

                return (
                  <tr key={record.id} className="hover:bg-slate-50">
                    <td className="px-4 py-4 font-medium text-slate-900">
                      {getPatientDisplayName(record, index)}
                    </td>

                    <td className="px-4 py-4 text-slate-600">
                      {record.sintomas || "Not specified"}
                    </td>

                    <td className="px-4 py-4">
                      <span
                        className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold ${badgeClass}`}
                      >
                        {color || "N/A"}
                      </span>
                    </td>

                    <td className="px-4 py-4 text-slate-500">
                      {formatDate(record.created_at)}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}