"use client";

import { useEffect, useState } from "react";
import { ensClient } from "@/src/lib/ens";

type Props = {
  address: `0x${string}`;
  compact?: boolean;
};

function shorten(address: string) {
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

export default function CreatorIdentity({ address, compact = false }: Props) {
  const [name, setName] = useState<string | null>(null);
  const [avatar, setAvatar] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function resolveIdentity() {
      try {
        const resolvedName = await ensClient.getEnsName({ address });

        if (!active) return;

        setName(resolvedName);

        if (resolvedName) {
          const resolvedAvatar = await ensClient.getEnsAvatar({
            name: resolvedName,
          });

          if (active) setAvatar(resolvedAvatar);
        }
      } catch {
        // ENS is optional. The wallet address remains the fallback.
      }
    }

    void resolveIdentity();

    return () => {
      active = false;
    };
  }, [address]);

  const label = name || shorten(address);

  return (
    <span className="inline-flex min-w-0 items-center gap-2">
      {avatar ? (
        <img
          src={avatar}
          alt=""
          className="h-6 w-6 shrink-0 rounded-full object-cover"
          loading="lazy"
        />
      ) : (
        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-[#e0ded6] bg-white text-[9px] font-bold text-[#42443a]">
          {address.slice(2, 4).toUpperCase()}
        </span>
      )}

      <span className="min-w-0 truncate" title={address}>
        {compact && label.length > 20 ? shorten(address) : label}
      </span>
    </span>
  );
}
