import React from "react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { FormSkeleton } from "@/components/skeletons/FormSkeleton";

export default function CreateRequestLoading() {
  return (
    <div className="min-h-screen flex flex-col bg-[#EEF2F6]">
      <Navbar />
      <main className="flex-1">
        <FormSkeleton />
      </main>
      <Footer />
    </div>
  );
}
