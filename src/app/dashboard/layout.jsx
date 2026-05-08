import DashboardNav from "@/components/dashboard/DashboardNav";

export default function DashboardLayout({ children }) {
  return (
    <div className="min-h-screen bg-[#f4f7fb]">
      <DashboardNav />
      {children}
    </div>
  );
}