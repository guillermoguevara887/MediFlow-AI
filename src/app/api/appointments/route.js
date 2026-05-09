import { NextResponse } from "next/server";
import { supabase } from "../../../lib/supabase";

function getDayRange(dateString) {
  const date = dateString || new Date().toISOString().slice(0, 10);

  const start = new Date(`${date}T00:00:00`);
  const end = new Date(`${date}T23:59:59`);

  return {
    startIso: start.toISOString(),
    endIso: end.toISOString(),
  };
}

function normalizeColor(color) {
  const value = String(color || "GREEN").toUpperCase();

  if (["GREEN", "YELLOW", "RED"].includes(value)) {
    return value;
  }

  return "GREEN";
}

function normalizePriority(priority, color) {
  const value = String(priority || "").toUpperCase();

  if (["ROUTINE", "PRIORITY", "BLOCKED"].includes(value)) {
    return value;
  }

  if (color === "YELLOW") return "PRIORITY";
  if (color === "RED") return "BLOCKED";

  return "ROUTINE";
}

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const date = searchParams.get("date");

    const { startIso, endIso } = getDayRange(date);

    const { data, error } = await supabase
      .from("appointments")
      .select("*")
      .gte("start_time", startIso)
      .lte("start_time", endIso)
      .order("start_time", { ascending: true });

    if (error) {
      console.error("APPOINTMENTS GET ERROR:", error);

      return NextResponse.json(
        {
          success: false,
          error: "Failed to fetch appointments",
          details: error.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      appointments: data || [],
    });
  } catch (error) {
    console.error("APPOINTMENTS FINAL GET ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        error: "System error fetching appointments",
      },
      { status: 500 }
    );
  }
}

export async function POST(req) {
  try {
    const body = await req.json().catch(() => ({}));

    const patientName = String(body?.patient_name || "").trim();
    const patientSymptoms = String(body?.patient_symptoms || "").trim();
    const triageColor = normalizeColor(body?.triage_color);
    const appointmentPriority = normalizePriority(
      body?.appointment_priority,
      triageColor
    );

    const doctorName = String(body?.doctor_name || "General Care").trim();
    const notes = String(body?.notes || "").trim();

    const startTime = body?.start_time;
    const endTime = body?.end_time;

    if (!startTime || !endTime) {
      return NextResponse.json(
        {
          success: false,
          error: "Start time and end time are required.",
        },
        { status: 400 }
      );
    }

    if (triageColor === "RED" || appointmentPriority === "BLOCKED") {
      return NextResponse.json(
        {
          success: false,
          error:
            "RED cases cannot be scheduled automatically. Please consult clinical staff.",
        },
        { status: 400 }
      );
    }

    const startDate = new Date(startTime);
    const endDate = new Date(endTime);

    if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid appointment time.",
        },
        { status: 400 }
      );
    }

    // Prevent duplicate bookings for the exact same time block
    const { data: existing, error: existingError } = await supabase
      .from("appointments")
      .select("id")
      .eq("start_time", startDate.toISOString())
      .neq("status", "CANCELLED")
      .limit(1);

    if (existingError) {
      console.error("APPOINTMENT CHECK ERROR:", existingError);

      return NextResponse.json(
        {
          success: false,
          error: "Failed to validate appointment availability.",
          details: existingError.message,
        },
        { status: 500 }
      );
    }

    if (existing && existing.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: "This time slot is already booked.",
        },
        { status: 409 }
      );
    }

    const { data, error } = await supabase
      .from("appointments")
      .insert([
        {
          patient_name: patientName || "Walk-in patient",
          patient_symptoms: patientSymptoms || null,
          triage_color: triageColor,
          appointment_priority: appointmentPriority,
          doctor_name: doctorName || "General Care",
          start_time: startDate.toISOString(),
          end_time: endDate.toISOString(),
          status: "SCHEDULED",
          notes: notes || null,
        },
      ])
      .select("*")
      .single();

    if (error) {
      console.error("APPOINTMENT INSERT ERROR:", error);

      return NextResponse.json(
        {
          success: false,
          error: "Failed to create appointment.",
          details: error.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      appointment: data,
    });
  } catch (error) {
    console.error("APPOINTMENTS FINAL POST ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        error: "System error creating appointment.",
      },
      { status: 500 }
    );
  }
}