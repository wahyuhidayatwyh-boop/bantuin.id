"use client";

import React, { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import ProviderProfileView from "@/components/profile/ProviderProfileView";
import { getMitraStoreById } from "@/lib/mock/mitraData";

export default function UserPublicProfilePage() {
  const params = useParams();
  const router = useRouter();
  const rawId = params?.id;
  const profileId = rawId ? decodeURIComponent(rawId) : "";

  useEffect(() => {
    if (profileId && getMitraStoreById(profileId)) {
      router.replace(`/mitra/${encodeURIComponent(profileId)}`);
    }
  }, [profileId, router]);

  return <ProviderProfileView profileId={profileId} />;
}
