"use client";
import Image from "next/image";
import { useState } from "react";
export default function EditorialImage({
  src,
  alt,
  sizes,
  priority = false,
  privateImage = false,
}: {
  src: string;
  alt: string;
  sizes: string;
  priority?: boolean;
  privateImage?: boolean;
}) {
  const [failed, setFailed] = useState(false);
  return failed ? (
    <div
      role="img"
      aria-label={alt}
      className="absolute inset-0 flex items-center justify-center p-6 bg-surface-container-high text-on-surface font-headline italic text-center"
    >
      {alt}
    </div>
  ) : (
    <Image
      src={src}
      alt={alt}
      fill
      sizes={sizes}
      quality={65}
      loading={priority ? "eager" : "lazy"}
      fetchPriority={priority ? "high" : undefined}
      unoptimized={privateImage}
      className="object-cover"
      onError={() => setFailed(true)}
    />
  );
}
