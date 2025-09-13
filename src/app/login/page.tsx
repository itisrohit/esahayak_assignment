'use client';

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch('/api/send-magic-link', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();
      
      if (response.ok && data.success) {
        toast.success("Magic link sent!", {
          description: "Check your email for the login link.",
        });
        // In a real app, you would redirect after the user clicks the magic link
        // For demo purposes, we'll redirect immediately
        setTimeout(() => {
          router.push('/authenticated/buyers');
        }, 2000);
      } else {
        throw new Error(data.message || "Failed to send magic link");
      }
    } catch (error) {
      toast.error("Error sending magic link", {
        description: error instanceof Error ? error.message : "Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight">Sign in to your account</h1>
          <p className="text-muted-foreground mt-2">
            We&apos;ll email you a magic link to sign in
          </p>
        </div>
        
        <div className="bg-card rounded-2xl shadow-lg border p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium">
                Email Address
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-12 px-4 rounded-xl border-muted-foreground/20 focus-visible:ring-2 focus-visible:ring-primary"
              />
            </div>
            
            <Button 
              className="w-full h-12 rounded-xl font-medium text-base transition-all duration-300 hover:shadow-lg bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary" 
              type="submit" 
              disabled={isLoading}
            >
              {isLoading ? (
                <span className="flex items-center justify-center">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent mr-2"></span>
                  Sending link...
                </span>
              ) : (
                "Send Magic Link"
              )}
            </Button>
          </form>
        </div>
        
        <div className="text-center text-sm text-muted-foreground">
          <p>Need help? <a href="#" className="text-primary font-medium hover:underline">Contact support</a></p>
        </div>
      </div>
    </div>
  );
}