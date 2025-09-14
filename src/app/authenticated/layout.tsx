import { Navbar } from "@/components/navbar/navbar";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  
  // Check if user is authenticated
  const { data: { user } } = await supabase.auth.getUser();
  
  // If no user, redirect to login
  if (!user) {
    redirect("/login");
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">{children}</main>
    </div>
  );
}
