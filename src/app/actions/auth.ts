"use server";

import { redirect } from "next/navigation";

/** Legacy server actions: auth UI uses Clerk at `/sign-in`. */
export async function signUp() {
  redirect("/sign-in");
}

export async function signIn() {
  redirect("/sign-in");
}

export async function signOut() {
  redirect("/sign-in");
}
