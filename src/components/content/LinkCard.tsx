"use client";

import { useState } from "react";

type Props = {
  url: string;
  title: string | null;
  description: string | null;
  image: string | null;
  siteName: string | null;
};

export default function LinkCard({ url, title, description, image, siteName }: Props) {
  const [imageFailed, setImageFailed] = useState(false);

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer nofollow ugc"
      className="block overflow-hidden rounded-lg border border-gray-200 hover:bg-gray-50"
    >
      {image && !imageFailed && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={image}
          alt=""
          loading="lazy"
          referrerPolicy="no-referrer"
          onError={() => setImageFailed(true)}
          className="aspect-[1.91/1] w-full bg-gray-100 object-cover"
        />
      )}
      <div className="p-3">
        {siteName && <div className="text-xs text-gray-500">{siteName}</div>}
        <div className="line-clamp-2 font-medium break-words text-gray-900">{title || url}</div>
        {description && (
          <div className="mt-1 line-clamp-2 text-sm text-gray-600">{description}</div>
        )}
      </div>
    </a>
  );
}
