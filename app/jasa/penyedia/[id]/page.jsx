"use client";

import React from "react";
import { useParams } from "next/navigation";
import ProviderProfileView from "@/components/profile/ProviderProfileView";

export default function ProviderDetailPage() {
  const params = useParams();
  const rawId = params?.id;
  const profileId = rawId ? decodeURIComponent(rawId) : "";

  return <ProviderProfileView profileId={profileId} />;
}
