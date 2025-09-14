"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { Session } from '@supabase/supabase-js';

export function Navbar() {
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    // Get the current user
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUserEmail(user?.email || null);
    };

    getUser();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event: string, session: Session | null) => {
      setUserEmail(session?.user?.email || null);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase]);

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      console.error("Error logging out:", error);
    } else {
      router.push("/login");
      router.refresh();
    }
  };

  return (
    <header className="border-b">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-6">
          <Link href="/authenticated/buyers" className="text-xl font-bold">
            esahayak
          </Link>
        </div>

        <div className="flex items-center gap-2 sm:gap-4">
          {userEmail && (
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-xs font-medium text-primary">
                  {userEmail.charAt(0).toUpperCase()}
                </span>
              </div>
              <span className="hidden sm:inline-block text-sm font-medium truncate max-w-[150px]">
                {userEmail}
              </span>
            </div>
          )}

          <Button variant="outline" size="sm" onClick={handleLogout}>
            Logout
          </Button>
        </div>
      </div>
    </header>
  );
}
