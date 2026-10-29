import { redirect } from "next/navigation";

export default function BundlingRedirectPage() {
  redirect("/mitra/dashboard?menu=catalog");
}
