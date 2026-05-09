"use client";

import Link from "next/link";
import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";

const BUSINESS_START_HOUR = 8;
const BUSINESS_END_HOUR = 16;
const SLOT_MINUTES = 30;

function getTodayDate() {
  return new Date().toISOString().slice(0, 10);
}

function buildLocalDate(dateString, timeString) {
  return new Date(`${dateString}T${timeString}:00`);
}

function formatTime(dateValue) {
  return new Date(dateValue).toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });
}

function generateSlots(dateString) {
  const slots = [];

  for (let hour = BUSINESS_START_HOUR; hour < BUSINESS_END_HOUR; hour++) {
    for (let minute = 0; minute < 60; minute += SLOT_MINUTES) {
      const startHour = String(hour).padStart(2, "0");
      const startMinute = String(minute).padStart(2, "0");

      const startTimeLabel = `${startHour}:${startMinute}`;
      const start = buildLocalDate(dateString, startTimeLabel);
      const end = new Date(start.getTime() + SLOT_MINUTES * 60 * 1000);

      slots.push({
        id: `${dateString}-${startTimeLabel}`,
        label: start.toLocaleTimeString([], {
          hour: "numeric",
          minute: "2-digit",
        }),
        start,
        end,
      });
    }
  }

  return slots;
}

function normalizeColor(color) {
  const value = String(color || "GREEN").toUpperCase();

  if (["GREEN", "YELLOW", "RED"].includes(value)) {
    return value;
  }

  return "GREEN";
}

function getPriorityFromColor(color) {
  if (color === "YELLOW") return "PRIORITY";
  if (color === "RED") return "BLOCKED";
  return "ROUTINE";
}

function getAppointmentStyle(priority) {
  if (priority === "PRIORITY") {
    return {
      label: "Priority",
      card: "border-amber-200 bg-amber-50 text-amber-950",
      badge: "bg-amber-500 text-white",
      button: "bg-amber-600 hover:bg-amber-700 shadow-amber-600/20",
      icon: "⚠️",
    };
  }

  if (priority === "BLOCKED") {
    return {
      label: "Blocked",
      card: "border-red-200 bg-red-50 text-red-950",
      badge: "bg-red-600 text-white",
      button: "bg-red-600 hover:bg-red-700 shadow-red-600/20",
      icon: "🚨",
    };
  }

  return {
    label: "Routine",
    card: "border-emerald-200 bg-emerald-50 text-emerald-950",
    badge: "bg-emerald-600 text-white",
    button: "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20",
    icon: "📅",
  };
}

function AppointmentsPageContent() {
  const searchParams = useSearchParams();

  const initialName = searchParams.get("name") || "";
  const initialSymptoms = searchParams.get("symptoms") || "";
  const initialColor = normalizeColor(searchParams.get("color") || "GREEN");
  const initialPriority =
    searchParams.get("priority") || getPriorityFromColor(initialColor);

  const [selectedDate, setSelectedDate] = useState(getTodayDate());
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [savingSlotId, setSavingSlotId] = useState(null);
  const [notice, setNotice] = useState("");

  const [patientName, setPatientName] = useState(
    initialName || "Walk-in patient"
  );
  const [patientSymptoms, setPatientSymptoms] = useState(initialSymptoms);
  const [triageColor, setTriageColor] = useState(initialColor);
  const [appointmentPriority, setAppointmentPriority] =
    useState(initialPriority);
  const [doctorName, setDoctorName] = useState("General Care");
  const [notes, setNotes] = useState("");

  const slots = useMemo(() => generateSlots(selectedDate), [selectedDate]);

  const appointmentStyle = getAppointmentStyle(appointmentPriority);

  const appointmentsByStart = useMemo(() => {
    const map = new Map();

    for (const appointment of appointments) {
      const key = new Date(appointment.start_time).toISOString();
      map.set(key, appointment);
    }

    return map;
  }, [appointments]);

  const fetchAppointments = async () => {
    setLoading(true);
    setNotice("");

    try {
      const res = await fetch(`/api/appointments?date=${selectedDate}`, {
        cache: "no-store",
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        setNotice(data?.error || "Failed to load appointments.");
        return;
      }

      setAppointments(data?.appointments || []);
    } catch (error) {
      console.error("Error loading appointments:", error);
      setNotice("Network error loading appointments.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, [selectedDate]);

  const handleColorChange = (value) => {
    const nextColor = normalizeColor(value);
    setTriageColor(nextColor);
    setAppointmentPriority(getPriorityFromColor(nextColor));
  };

  const scheduleSlot = async (slot) => {
    setNotice("");

    if (triageColor === "RED" || appointmentPriority === "BLOCKED") {
      setNotice(
        "RED cases cannot be scheduled automatically. Please consult clinical staff."
      );
      return;
    }

    setSavingSlotId(slot.id);

    try {
      const res = await fetch("/api/appointments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          patient_name: patientName,
          patient_symptoms: patientSymptoms,
          triage_color: triageColor,
          appointment_priority: appointmentPriority,
          doctor_name: doctorName,
          notes,
          start_time: slot.start.toISOString(),
          end_time: slot.end.toISOString(),
        }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        setNotice(data?.error || "Failed to schedule appointment.");
        return;
      }

      setNotice("Appointment scheduled successfully.");
      setNotes("");
      await fetchAppointments();
    } catch (error) {
      console.error("Error saving appointment:", error);
      setNotice("Network error saving appointment.");
    } finally {
      setSavingSlotId(null);
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      <header className="border-b border-slate-200 bg-white/80 backdrop-blur">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-6 py-4">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 shadow-sm transition hover:bg-slate-100"
          >
            <span>←</span>
            <span>Back to Dashboard</span>
          </Link>

          <div className="text-right">
            <p className="text-sm font-black text-slate-900">MediFlow AI</p>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
              Appointments
            </p>
          </div>
        </div>
      </header>

      <section className="mx-auto grid w-full max-w-7xl gap-6 px-6 py-8 lg:grid-cols-[0.85fr_1.15fr]">
        <aside className="space-y-6">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-6">
              <div className="mb-3 inline-flex rounded-full bg-blue-50 px-3 py-1 text-xs font-black uppercase tracking-[0.2em] text-blue-700">
                Scheduling workflow
              </div>

              <h1 className="text-3xl font-black tracking-tight">
                Schedule patient care
              </h1>

              <p className="mt-3 text-sm leading-6 text-slate-600">
                Book routine appointments for GREEN cases and priority
                appointments for YELLOW cases. RED cases should be escalated
                instead of scheduled automatically.
              </p>
            </div>

            <div className="space-y-5">
              <div>
                <label className="mb-2 block text-sm font-bold text-slate-800">
                  Date
                </label>

                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-4 text-slate-900 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-bold text-slate-800">
                  Patient name
                </label>

                <input
                  value={patientName}
                  onChange={(e) => setPatientName(e.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-4 text-slate-900 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
                  placeholder="Patient name"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-bold text-slate-800">
                  Triage level
                </label>

                <select
                  value={triageColor}
                  onChange={(e) => handleColorChange(e.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-4 text-slate-900 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
                >
                  <option value="GREEN">GREEN - Routine</option>
                  <option value="YELLOW">YELLOW - Priority</option>
                  <option value="RED">RED - Escalation only</option>
                </select>
              </div>

              <div className={`rounded-2xl border p-4 ${appointmentStyle.card}`}>
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.2em]">
                      Appointment type
                    </p>
                    <p className="mt-1 text-lg font-black">
                      {appointmentPriority === "PRIORITY"
                        ? "Priority appointment"
                        : appointmentPriority === "BLOCKED"
                          ? "Blocked"
                          : "Routine appointment"}
                    </p>
                  </div>

                  <div className="text-3xl">{appointmentStyle.icon}</div>
                </div>

                <p className="mt-3 text-sm leading-6">
                  {appointmentPriority === "PRIORITY"
                    ? "This case should be handled as a same-day or priority visit."
                    : appointmentPriority === "BLOCKED"
                      ? "RED cases should not be scheduled automatically."
                      : "This case can be booked as routine care."}
                </p>
              </div>

              <div>
                <label className="mb-2 block text-sm font-bold text-slate-800">
                  Doctor / Area
                </label>

                <input
                  value={doctorName}
                  onChange={(e) => setDoctorName(e.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-4 text-slate-900 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
                  placeholder="General Care"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-bold text-slate-800">
                  Symptoms summary
                </label>

                <textarea
                  value={patientSymptoms}
                  onChange={(e) => setPatientSymptoms(e.target.value)}
                  className="min-h-28 w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 p-4 text-slate-900 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
                  placeholder="Short summary of symptoms or reason for visit"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-bold text-slate-800">
                  Notes
                </label>

                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="min-h-24 w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 p-4 text-slate-900 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
                  placeholder="Optional scheduling notes"
                />
              </div>

              {notice && (
                <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4 text-sm font-semibold text-blue-950">
                  {notice}
                </div>
              )}
            </div>
          </div>
        </aside>

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <div className="mb-3 inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-black uppercase tracking-[0.2em] text-slate-600">
                8:00 AM - 4:00 PM
              </div>

              <h2 className="text-2xl font-black tracking-tight">
                Available time slots
              </h2>

              <p className="mt-2 text-sm leading-6 text-slate-600">
                Each slot represents a 30-minute appointment block.
              </p>
            </div>

            <button
              onClick={fetchAppointments}
              disabled={loading}
              className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-black text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Refreshing..." : "Refresh"}
            </button>
          </div>

          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {slots.map((slot) => {
              const appointment = appointmentsByStart.get(
                slot.start.toISOString()
              );

              const isBooked = Boolean(appointment);
              const isSaving = savingSlotId === slot.id;

              return (
                <div
                  key={slot.id}
                  className={`rounded-2xl border p-4 transition ${isBooked
                      ? appointment.appointment_priority === "PRIORITY"
                        ? "border-amber-200 bg-amber-50 text-amber-950"
                        : "border-slate-200 bg-slate-100 text-slate-800"
                      : "border-emerald-100 bg-emerald-50/60 text-slate-900 hover:border-emerald-300 hover:bg-emerald-50"
                    }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-lg font-black">{slot.label}</p>

                      <p className="mt-1 text-xs font-bold uppercase tracking-[0.16em] opacity-70">
                        {formatTime(slot.start)} - {formatTime(slot.end)}
                      </p>
                    </div>

                    <span
                      className={`rounded-full px-3 py-1 text-xs font-black ${isBooked
                          ? appointment.appointment_priority === "PRIORITY"
                            ? "bg-amber-500 text-white"
                            : "bg-slate-800 text-white"
                          : "bg-emerald-600 text-white"
                        }`}
                    >
                      {isBooked ? "Booked" : "Open"}
                    </span>
                  </div>

                  {isBooked ? (
                    <div className="mt-4 rounded-2xl bg-white/70 p-3 text-sm shadow-sm">
                      <p className="font-black">
                        {appointment.patient_name || "Patient"}
                      </p>

                      <p className="mt-1 opacity-80">
                        {appointment.doctor_name || "General Care"}
                      </p>

                      <p className="mt-2 text-xs font-black uppercase tracking-[0.16em] opacity-70">
                        {appointment.appointment_priority || "ROUTINE"}
                      </p>
                    </div>
                  ) : (
                    <button
                      onClick={() => scheduleSlot(slot)}
                      disabled={
                        isSaving ||
                        triageColor === "RED" ||
                        appointmentPriority === "BLOCKED"
                      }
                      className={`mt-4 w-full rounded-2xl px-4 py-3 text-sm font-black text-white shadow-lg transition active:scale-[0.99] disabled:cursor-not-allowed disabled:bg-slate-400 disabled:shadow-none ${appointmentPriority === "PRIORITY"
                          ? "bg-amber-600 shadow-amber-600/20 hover:bg-amber-700"
                          : "bg-emerald-600 shadow-emerald-600/20 hover:bg-emerald-700"
                        }`}
                    >
                      {isSaving
                        ? "Scheduling..."
                        : appointmentPriority === "PRIORITY"
                          ? "Book Priority"
                          : "Book Slot"}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      </section>
    </main>
  );
}

export default function AppointmentsPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-slate-50 px-6 py-8 text-slate-950">
          <div className="mx-auto max-w-7xl rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-black text-slate-700">
              Loading appointments...
            </p>
          </div>
        </main>
      }
    >
      <AppointmentsPageContent />
    </Suspense>
  );
}