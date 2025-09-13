'use client';

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export default function VerifyMagicLinkPage() {
  const router = useRouter();

  useEffect(() => {
    // In a real app, you would verify the token from the URL params
    // and authenticate the user
    
    // Simulate verification process
    const verifyToken = async () => {
      try {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Show success message
        toast.success("Login successful!", {
          description: "You have been successfully logged in.",
        });
        
        // Redirect to buyers page
        router.push('/authenticated/buyers');
      } catch {
        toast.error("Login failed", {
          description: "Invalid or expired magic link.",
        });
        router.push('/login');
      }
    };

    verifyToken();
  }, [router]);

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