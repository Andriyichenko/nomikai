import { redirect } from "next/navigation";

/** Friendly alias: /signup opens the login page on the sign-up tab. */
export default function SignupPage() {
  redirect("/login?mode=signup");
}
