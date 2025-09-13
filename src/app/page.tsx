import { redirect } from "next/navigation";

export default function HomePage() {
  // Redirect to the authenticated buyers page
  redirect("/authenticated/buyers");
}