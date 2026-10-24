import { redirect } from "next/navigation";

/**
 * The converter lives on the landing page; this legacy route simply forwards
 * to it so old links keep working instead of duplicating the whole UI.
 */
export default function ConvertPage() {
  redirect("/");
}
