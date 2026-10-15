"use client";

import { useState } from "react";
import { isAddress } from "viem";
import { normalize } from "viem/ens";
import { ensClient } from "@/src/lib/ens";

export default function EnsLookup() {
  const [input, setInput] = useState("");
  const [result, setResult] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleResolve() {
    const value = input.trim();

    setResult("");
    setError("");

    if (!value) {
      setError("Enter an ENS name or Ethereum address.");
      return;
    }

    setLoading(true);

    try {
      if (isAddress(value)) {
        const name = await ensClient.getEnsName({
          address: value,
        });

        if (!name) {
          setError("No primary ENS name was found for this address.");
        } else {
          setResult(name);
        }
      } else {
        const address = await ensClient.getEnsAddress({
          name: normalize(value),
        });

        if (!address) {
          setError("No Ethereum address was found for this ENS name.");
        } else {
          setResult(address);
        }
      }
    } catch {
      setError("Could not resolve that input. Check it and try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="my-8 rounded-2xl border border-neutral-200 bg-white p-5 text-neutral-900 shadow-sm sm:p-7">
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-neutral-500">
        Ethereum Name Service
      </p>

      <h2 className="mt-2 text-2xl font-semibold tracking-tight">
        Find an ENS identity
      </h2>

      <p className="mt-2 text-sm leading-6 text-neutral-600">
        Look up an ENS name or discover the primary ENS name associated with an
        Ethereum address.
      </p>

      <form
        className="mt-5 flex flex-col gap-3 sm:flex-row"
        onSubmit={(event) => {
          event.preventDefault();
          void handleResolve();
        }}
      >
        <input
          value={input}
          onChange={(event) => {
            setInput(event.target.value);
            setError("");
            setResult("");
          }}
          placeholder="e.g. vitalik.eth or 0x..."
          aria-label="ENS name or Ethereum address"
          className="min-w-0 flex-1 rounded-xl border border-neutral-300 bg-transparent px-4 py-3 text-sm outline-none transition focus:border-neutral-900"
        />

        <button
          type="submit"
          disabled={loading}
          className="rounded-xl bg-[#c7f36b] px-5 py-3 text-sm font-bold text-neutral-900 transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? "Resolving..." : "Resolve"}
        </button>
      </form>

      {result && (
        <div className="mt-4 rounded-xl border border-neutral-200 bg-neutral-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
            Result
          </p>

          <p className="mt-2 break-all font-mono text-sm">{result}</p>

          <button
            type="button"
            onClick={() => {
              void navigator.clipboard.writeText(result);
            }}
            className="mt-3 text-sm font-semibold underline underline-offset-4"
          >
            Copy result
          </button>
        </div>
      )}

      {error && (
        <p role="alert" className="mt-4 text-sm text-red-600">
          {error}
        </p>
      )}

      <p className="mt-4 text-xs text-neutral-500">
        ENS lookups use Ethereum mainnet. They do not require connecting a
        wallet.
      </p>
    </section>
  );
}
