/**
 * CategoryIcon.jsx
 * Canonical reusable category icon component for Bantuin.
 * ALWAYS renders a valid Lucide icon component with Shapes fallback. NEVER blank.
 */

import React from "react";
import { resolveCategoryIcon } from "@/lib/categoryIcons";

export default function CategoryIcon({
  category,
  categoryName,
  name,
  label,
  className = "w-5 h-5",
  size,
  strokeWidth,
  ...props
}) {
  // Extract category name string safely from any possible format
  const rawInput =
    categoryName ||
    name ||
    label ||
    (typeof category === "string"
      ? category
      : (category?.name || category?.label || (typeof category?.id === "string" && category.id !== "Semua" ? category.id : "") || ""));

  const IconComponent = resolveCategoryIcon(rawInput);

  return (
    <IconComponent
      className={className}
      size={size}
      strokeWidth={strokeWidth}
      {...props}
    />
  );
}
