'use client';

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";

export default function AuthCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  useEffect(() => {
    const handleAuth = async () => {
      try {
        // Get the error or success code from the URL
        const error = searchParams.get("error");
        const errorDescription = searchParams.get("error_description");
        
        if (error) {
          throw new Error(errorDescription || "Authentication failed");
        }

        // Get the current session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          throw new Error(sessionError.message);
        }

        if (session) {
          toast.success("Login successful!", {
            description: "You have been successfully logged in.",
            descriptionClassName: "text-muted-foreground",
          });
          router.push('/authenticated/buyers');
        } else {
          throw new Error("No session found");
        }
      } catch (error) {
        toast.error("Login failed", {
          description: error instanceof Error ? error.message : "Invalid or expired magic link.",
          descriptionClassName: "text-muted-foreground",
        });
        router.push('/login');
      }
    };

    handleAuth();
  }, [router, searchParams, supabase]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
        <h2 className="text-2xl font-semibold">Verifying your login...</h2>
        <p className="text-muted-foreground mt-2">
          Please wait while we verify your magic link
        </p>
      </div>
    </div>
  );
}