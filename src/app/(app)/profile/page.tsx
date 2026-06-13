import { redirect } from "next/navigation";

import { ProfileForm } from "./ProfileForm";
import { type ApiUser, normalizeUser } from "@/lib/auth";
import { serverApiGet } from "@/lib/server-api";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const result = await serverApiGet<ApiUser>("/auth/me");

  if (!result.ok) {
    redirect("/login?expired=1");
  }

  const user = normalizeUser(result.data);

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6">
      <ProfileForm user={user} />
    </div>
  );
}
