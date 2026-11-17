"use client";

import { useEffect, useState, type ReactNode } from "react";

type UserAvatarProps = {
  /** Profile picture URL from the user record; empty or missing shows the fallback. */
  image?: string | null;
  name?: string | null;
  className?: string;
  /** Shown when there is no usable image. Defaults to the first letter of `name`. */
  fallback?: ReactNode;
};

export function UserAvatar({ image, name, className = "", fallback }: UserAvatarProps) {
  const src = image?.trim();
  const [failed, setFailed] = useState(false);

  // A new URL deserves a fresh attempt even if the previous one failed to load.
  useEffect(() => setFailed(false), [src]);

  const base = `relative shrink-0 overflow-hidden rounded-full ${className}`;

  if (src && !failed) {
    return (
      // A plain <img> keeps any host working (Google, Cloudinary, ...) without next/image domain config.
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={name ? `${name}'s profile picture` : "Profile picture"}
        referrerPolicy="no-referrer"
        onError={() => setFailed(true)}
        className={`${base} object-cover`}
      />
    );
  }

  return (
    <div className={`${base} flex items-center justify-center`} aria-hidden={!name}>
      {fallback ?? (name?.trim().charAt(0).toUpperCase() || "?")}
    </div>
  );
}
