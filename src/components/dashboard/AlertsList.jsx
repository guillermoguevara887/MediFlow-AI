function normalizeColor(color) {
  return String(color || "").toUpperCase();
}

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

export default function AlertsList({ alerts = [], title = "Critical alerts" }) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-5 flex items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-slate-900">{title}</h2>
          <p className="mt-1 text-sm text-slate-500">
            Recent RED cases that require immediate clinical review.
          </p>
        </div>

        <span className="rounded-full border border-red-200 bg-red-50 px-3 py-1 text-xs font-semibold text-red-700">
          LIVE
        </span>
      </div>

      {alerts.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 text-sm text-slate-500">
          No critical alerts at the moment.
        </div>
      ) : (
        <div className="space-y-4">
          {alerts.map((alert, index) => {
            const color = normalizeColor(alert.color);

            return (
              <div
                key={alert.id}
                className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
              >
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900">
                      {getPatientDisplayName(alert, index)}
                    </h3>

                    <p className="mt-2 text-sm text-slate-600">
                      <span className="font-medium text-slate-800">
                        Symptoms:
                      </span>{" "}
                      {alert.sintomas || "Not specified"}
                    </p>

                    <p className="mt-2 text-sm text-slate-500">
                      {alert.mensaje || "No message available"}
                    </p>

                    {Array.isArray(alert.red_flags) &&
                      alert.red_flags.length > 0 ? (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {alert.red_flags.map((flag) => (
                          <span
                            key={flag}
                            className="rounded-full border border-red-200 bg-red-50 px-3 py-1 text-xs font-semibold text-red-700"
                          >
                            {flag.replaceAll("_", " ")}
                          </span>
                        ))}
                      </div>
                    ) : null}
                  </div>

                  <div className="text-left md:text-right">
                    <span className="inline-flex rounded-full border border-red-200 bg-red-50 px-3 py-1 text-xs font-bold text-red-700">
                      {color || "RED"}
                    </span>

                    <p className="mt-2 text-xs text-slate-500">
                      {formatDate(alert.created_at)}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}