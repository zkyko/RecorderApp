import { DeveloperSidebar } from "@/components/DeveloperSidebar";

export default function DeveloperLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-slate-950">
      <DeveloperSidebar />
      <main className="lg:ml-72 pt-16">
        {children}
      </main>
    </div>
  );
}


