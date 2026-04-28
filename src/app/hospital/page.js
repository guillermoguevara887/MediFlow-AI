export default function HospitalPage() {
  return (
    <main className="min-h-screen bg-slate-100 flex items-center justify-center p-6">
      <div className="bg-white p-8 rounded-3xl shadow-xl w-full max-w-md border border-slate-200">

        <h1 className="text-2xl font-black text-slate-800 mb-4 text-center">
          Hospital Dashboard
        </h1>

        <p className="text-center text-slate-500 mb-6 text-sm">
          Real-time patient flow insights (demo)
        </p>

        <div className="space-y-2 text-sm text-slate-600">
          <div>Patients analyzed today: 43</div>
          <div>RED cases: 12%</div>
          <div>YELLOW cases: 38%</div>
          <div>GREEN cases: 50%</div>

          <div className="mt-4 font-semibold text-slate-700">
            Peak demand detected: 6–8 PM
          </div>
        </div>

      </div>
    </main>
  );
}