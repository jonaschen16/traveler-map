import Link from "next/link";
import type { ReactNode } from "react";

// Side panel on desktop, bottom sheet on mobile.
export default function Panel({
  title,
  closeHref,
  onClose,
  children,
}: {
  title: string;
  closeHref?: string;
  onClose?: () => void;
  children: ReactNode;
}) {
  const closeClass =
    "rounded-full p-1.5 text-xl leading-none text-gray-500 hover:bg-gray-100";

  return (
    <aside className="absolute inset-x-0 bottom-0 z-20 flex max-h-[60%] flex-col rounded-t-2xl bg-white shadow-[0_-4px_16px_rgba(0,0,0,0.12)] sm:inset-y-0 sm:left-0 sm:right-auto sm:max-h-none sm:w-[400px] sm:rounded-none sm:shadow-lg">
      <div className="flex items-start justify-between gap-2 border-b border-gray-100 px-5 py-4">
        <h2 className="text-xl font-bold text-gray-900">{title}</h2>
        {closeHref ? (
          <Link href={closeHref} className={closeClass} aria-label="關閉">
            ×
          </Link>
        ) : (
          <button onClick={onClose} className={closeClass} aria-label="關閉">
            ×
          </button>
        )}
      </div>
      <div className="flex-1 overflow-y-auto px-5 py-4">{children}</div>
    </aside>
  );
}
