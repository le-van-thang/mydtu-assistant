"use client";

import React from "react";

interface SkeletonProps {
  className?: string;
  shimmer?: boolean;
}

export default function Skeleton({ className = "", shimmer = true }: SkeletonProps) {
  return (
    <div
      className={`
        bg-[var(--bg-soft)]/60 rounded-xl overflow-hidden relative
        ${className}
        ${shimmer ? "after:absolute after:inset-0 after:-translate-x-full after:bg-gradient-to-r after:from-transparent after:via-[var(--bg-main)]/5 after:to-transparent after:animate-[shimmer_2s_infinite]" : ""}
      `}
    >
      <style jsx>{`
        @keyframes shimmer {
          100% {
            transform: translateX(100%);
          }
        }
      `}</style>
    </div>
  );
}
