import { auth } from "@/auth";
import Navbar from "@/components/Navbar";
import { redirect } from "next/navigation";

export default async function SellLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen text-slate-100 flex flex-col selection:bg-[#1ecbe1]/30 selection:text-white">
      <Navbar user={session.user} />
      <main className="flex-1 max-w-7xl w-full mx-auto p-3 sm:p-6 lg:p-8 flex flex-col pb-24 lg:pb-8">
        {children}
      </main>
    </div>
  );
}

