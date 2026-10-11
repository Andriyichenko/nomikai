"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getViewer } from "@/lib/data";

export async function updateName(formData: FormData) {
  const name = String(formData.get("display_name") ?? "").trim().slice(0, 40);
  const viewer = await getViewer();
  if (!viewer?.profile || !name) return;
  const supabase = await createClient();
  await supabase.from("profiles").update({ display_name: name }).eq("id", viewer.profile.id);
  revalidatePath("/", "layout");
}
