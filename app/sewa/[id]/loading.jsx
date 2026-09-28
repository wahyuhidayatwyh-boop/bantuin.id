import React from "react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import DetailSkeleton from "@/components/skeletons/DetailSkeleton";

export default function SewaDetailLoading() {
  return (
    <div className="min-h-screen flex flex-col bg-[#EEF2F6]">
      <Navbar />
      <main className="flex-1">
        <DetailSkeleton />
      </main>
      <Footer />
    </div>
  );
}
