"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";

export function Navbar() {
  // In a real app, this would come from auth context or session
  const userEmail = "user@example.com";

  const handleLogout = () => {
    // In a real app, this would call your logout API
    console.log("Logout clicked");
  };

  return (
    <header className="border-b">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-6">
          <Link href="/" className="text-xl font-bold">
            esahayak
          </Link>
        </div>

        <div className="flex items-center gap-2 sm:gap-4">
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

          <Button variant="outline" size="sm" onClick={handleLogout}>
            Logout
          </Button>
        </div>
      </div>
    </header>
  );
}
