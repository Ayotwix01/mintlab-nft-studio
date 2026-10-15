"use client";

import { useState } from "react";
import { useWaitForTransactionReceipt, useWriteContract } from "wagmi";
import { useWallet } from "@/src/hooks/useWallet";

const CONTRACT_ADDRESS = "0x944fA4a2D247ede82cd39FD75Ef9CadE014c6a7a" as const;

const CONTRACT_ABI = [
  {
    type: "function",
    name: "mintNFT",
    stateMutability: "nonpayable",
    inputs: [{ name: "metadataURI", type: "string" }],
    outputs: [{ name: "", type: "uint256" }],
  },
] as const;

type ApiError = {
  error?: string;
  uri?: string;
  cid?: string;
  gatewayUrl?: string;
};

async function readResponse(response: Response): Promise<ApiError> {
  const data: ApiError = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error || `Request failed (${response.status}).`);
  }

  return data;
}

export default function MintArtwork() {
  const {
    isConnected,
    isSepolia,
    connectWallet,
    isConnecting,
    switchToSepolia,
    isSwitching,
  } = useWallet();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [stage, setStage] = useState("");
  const [error, setError] = useState("");
  const [metadataUri, setMetadataUri] = useState("");
  const [hash, setHash] = useState<`0x${string}`>();

  const { writeContractAsync } = useWriteContract();

  const receipt = useWaitForTransactionReceipt({
    hash,
    chainId: 11155111,
  });

  async function handleMint(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setHash(undefined);
    setMetadataUri("");

    if (!isConnected) {
      setError("Connect MetaMask first.");
      return;
    }

    if (!isSepolia) {
      setError("Switch MetaMask to Sepolia first.");
      return;
    }

    if (!title.trim()) {
      setError("Enter an artwork title.");
      return;
    }

    if (!file) {
      setError("Choose an artwork image.");
      return;
    }

    if (
      !["image/jpeg", "image/png", "image/webp", "image/gif"].includes(
        file.type,
      )
    ) {
      setError("Choose a JPG, PNG, WebP, or GIF image.");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError("Your image must be 10 MB or smaller.");
      return;
    }

    setBusy(true);

    try {
      // 1. Upload the artwork image to Pinata.
      setStage("Uploading artwork image...");

      const imageForm = new FormData();
      imageForm.append("file", file);

      const imageResponse = await fetch("/api/image", {
        method: "POST",
        body: imageForm,
      });

      const imageData = await readResponse(imageResponse);

      if (!imageData.uri) {
        throw new Error("Image upload returned no IPFS URI.");
      }

      // 2. Upload NFT metadata to Pinata.
      setStage("Saving NFT metadata...");

      const metadataResponse = await fetch("/api/upload", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: title.trim(),
          description: description.trim(),
          image: imageData.uri,
        }),
      });

      const metadata = await readResponse(metadataResponse);

      if (!metadata.uri) {
        throw new Error("Metadata upload returned no IPFS URI.");
      }

      setMetadataUri(metadata.uri);

      // 3. Request the NFT mint transaction in MetaMask.
      setStage("Waiting for MetaMask approval...");

      const transactionHash = await writeContractAsync({
        address: CONTRACT_ADDRESS,
        abi: CONTRACT_ABI,
        functionName: "mintNFT",
        args: [metadata.uri],
        chainId: 11155111,
      });

      setHash(transactionHash);
      setStage("Transaction submitted successfully.");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Minting failed.";

      if (
        message.toLowerCase().includes("user rejected") ||
        message.toLowerCase().includes("user denied")
      ) {
        setError("You rejected the MetaMask transaction.");
      } else {
        setError(message);
      }

      setStage("");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mt-5">
      {!isConnected ? (
        <button
          type="button"
          onClick={() => {
            setError("");
            void connectWallet();
          }}
          disabled={isConnecting}
          className="w-full rounded-full bg-[#20211c] px-5 py-3.5 font-semibold text-white disabled:opacity-60"
        >
          {isConnecting ? "Connecting..." : "Connect MetaMask"}
        </button>
      ) : !isSepolia ? (
        <button
          type="button"
          onClick={() => {
            setError("");
            void switchToSepolia();
          }}
          disabled={isSwitching}
          className="w-full rounded-full bg-[#20211c] px-5 py-3.5 font-semibold text-white disabled:opacity-60"
        >
          {isSwitching ? "Switching network..." : "Switch to Sepolia"}
        </button>
      ) : (
        <form onSubmit={handleMint} className="space-y-4">
          <label className="block text-sm font-semibold">
            Artwork title
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              maxLength={100}
              required
              placeholder="Give your artwork a title"
              className="mt-2 w-full rounded-xl border border-[#e1dfd7] bg-white px-4 py-3 font-normal text-black outline-none focus:border-[#8ba751]"
            />
          </label>

          <label className="block text-sm font-semibold">
            Description
            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              maxLength={2000}
              rows={3}
              placeholder="Tell us about your artwork"
              className="mt-2 w-full rounded-xl border border-[#e1dfd7] bg-white px-4 py-3 font-normal text-black outline-none focus:border-[#8ba751]"
            />
          </label>

          <label className="block text-sm font-semibold">
            Artwork image (maximum 10 MB)
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              required
              onChange={(event) => setFile(event.target.files?.[0] ?? null)}
              className="mt-2 block w-full rounded-xl border border-[#e1dfd7] bg-white p-3 text-sm"
            />
          </label>

          {file && (
            <p className="break-all text-xs text-[#587535]">
              Selected: {file.name}
            </p>
          )}

          <button
            type="submit"
            disabled={busy || receipt.isLoading}
            className="w-full rounded-full bg-[#c7f36b] px-5 py-3.5 font-bold text-[#202719] transition hover:bg-[#b9e65d] disabled:opacity-60"
          >
            {busy
              ? stage || "Preparing mint..."
              : receipt.isLoading
                ? "Confirming on Sepolia..."
                : "Upload and mint NFT"}
          </button>
        </form>
      )}

      {stage && (
        <p role="status" className="mt-3 break-words text-sm">
          {stage}
        </p>
      )}

      {error && (
        <p role="alert" className="mt-4 break-words text-sm text-red-700">
          {error}
        </p>
      )}

      {hash && (
        <div className="mt-4 break-words rounded-xl border border-[#e1dfd7] bg-white p-4 text-sm text-black">
          <p className="font-bold">
            {receipt.isSuccess
              ? "NFT minted successfully."
              : receipt.isError
                ? "Transaction confirmation failed."
                : "Transaction submitted. Waiting for confirmation..."}
          </p>

          <a
            className="mt-2 block underline"
            target="_blank"
            rel="noreferrer"
            href={`https://sepolia.etherscan.io/tx/${hash}`}
          >
            View transaction on Sepolia Etherscan
          </a>

          {metadataUri && (
            <p className="mt-3 break-all text-xs">Metadata: {metadataUri}</p>
          )}
        </div>
      )}
    </div>
  );
}
