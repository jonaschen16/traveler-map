import type { ReactNode } from "react";

// Scrollable content area for non-map pages (the root layout's <main>
// has a fixed height so the map can fill it).
export default function PageContainer({
  children,
  wide = false,
}: {
  children: ReactNode;
  wide?: boolean;
}) {
  return (
    <div className="absolute inset-0 overflow-y-auto bg-white">
      <div className={`mx-auto px-4 py-8 ${wide ? "max-w-5xl" : "max-w-3xl"}`}>{children}</div>
    </div>
  );
}
