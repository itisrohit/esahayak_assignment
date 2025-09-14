import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function Home() {
  const supabase = await createClient();
  
  // Check if user is authenticated
  const { data: { user } } = await supabase.auth.getUser();
  
  // If user is authenticated, redirect to buyers page
  if (user) {
    redirect("/authenticated/buyers");
  }
  
  // If not authenticated, redirect to login
  redirect("/login");
}