"use client";

import { useState } from "react";
import { useWaitForTransactionReceipt, useWriteContract } from "wagmi";
import { useWallet } from "@/src/hooks/useWallet";

const contractAddress = "0x944fA4a2D247ede82cd39FD75Ef9CadE014c6a7a" as const;

const contractAbi = [
  {
    type: "function",
    name: "mintNFT",
    stateMutability: "nonpayable",
    inputs: [{ name: "metadataURI", type: "string" }],
    outputs: [{ name: "", type: "uint256" }],
  },
] as const;

export default function MintArtwork() {
  const { isConnected, isSepolia, connectWallet, isConnecting, switchToSepolia, isSwitching } = useWallet();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [metadataUri, setMetadataUri] = useState("");
  const [hash, setHash] = useState<`0x${string}` | undefined>();

  const { writeContractAsync } = useWriteContract();
  const receipt = useWaitForTransactionReceipt({ hash });

  async function handleMint(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setHash(undefined);
    setMetadataUri("");

    if (!isConnected) {
      setError("Connect your wallet first.");
      return;
    }
    if (!isSepolia) {
      setError("Switch your wallet to Sepolia first.");
      return;
    }
    if (!file) {
      setError("Choose an artwork image.");
      return;
    }

    setBusy(true);
    try {
      const imageForm = new FormData();
      imageForm.append("file", file);

      const imageResponse = await fetch("/api/image", {
        method: "POST",
        body: imageForm,
      });
      const imageData = await imageResponse.json();
      if (!imageResponse.ok) throw new Error(imageData.error || "Image upload failed.");

      const metadataResponse = await fetch("/api/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: title.trim(),
          description: description.trim(),
          image: imageData.uri,
        }),
      });
      const metadata = await metadataResponse.json();
      if (!metadataResponse.ok) throw new Error(metadata.error || "Metadata upload failed.");

      setMetadataUri(metadata.uri);

      const transactionHash = await writeContractAsync({
        address: contractAddress,
        abi: contractAbi,
        functionName: "mintNFT",
        args: [metadata.uri],
      });
      setHash(transactionHash);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Minting failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mt-5">
      {!isConnected ? (
        <button type="button" onClick={connectWallet} disabled={isConnecting}
          className="w-full rounded-full bg-[#20211c] px-5 py-3.5 font-semibold text-white disabled:opacity-60">
          {isConnecting ? "Connecting..." : "Connect wallet"}
        </button>
      ) : !isSepolia ? (
        <button type="button" onClick={switchToSepolia} disabled={isSwitching}
          className="w-full rounded-full bg-[#20211c] px-5 py-3.5 font-semibold text-white disabled:opacity-60">
          {isSwitching ? "Switching..." : "Switch to Sepolia"}
        </button>
      ) : (
        <form onSubmit={handleMint} className="space-y-4">
          <label className="block text-sm font-semibold">
            Artwork title
            <input value={title} onChange={(e) => setTitle(e.target.value)}
              maxLength={100} required placeholder="Give your artwork a title"
              className="mt-2 w-full rounded-xl border border-[#e1dfd7] bg-white px-4 py-3 font-normal outline-none focus:border-[#8ba751]" />
          </label>

          <label className="block text-sm font-semibold">
            Description
            <textarea value={description} onChange={(e) => setDescription(e.target.value)}
              maxLength={2000} rows={3} placeholder="Tell us about your artwork"
              className="mt-2 w-full rounded-xl border border-[#e1dfd7] bg-white px-4 py-3 font-normal outline-none focus:border-[#8ba751]" />
          </label>

          <label className="block text-sm font-semibold">
            Artwork image (maximum 10 MB)
            <input type="file" accept="image/jpeg,image/png,image/webp,image/gif"
              required onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              className="mt-2 block w-full rounded-xl border border-[#e1dfd7] bg-white p-3 text-sm" />
          </label>

          {file && <p className="break-all text-xs text-[#587535]">Selected: {file.name}</p>}

          <button type="submit" disabled={busy || receipt.isLoading}
            className="w-full rounded-full bg-[#c7f36b] px-5 py-3.5 font-bold text-[#202719] transition hover:bg-[#b9e65d] disabled:opacity-60">
            {busy ? "Uploading and preparing mint..." : receipt.isLoading ? "Confirming on Sepolia..." : "Upload and mint NFT"}
          </button>
        </form>
      )}

      {error && <p role="alert" className="mt-4 break-words text-sm text-red-700">{error}</p>}

      {hash && (
        <div className="mt-4 break-words rounded-xl border border-[#e1dfd7] bg-white p-4 text-sm">
          <p className="font-bold">
            {receipt.isSuccess ? "NFT minted successfully." : receipt.isError ? "Transaction confirmation failed." : "Transaction submitted."}
          </p>
          <a className="mt-2 block underline" target="_blank" rel="noreferrer"
            href={`https://sepolia.etherscan.io/tx/${hash}`}>
            View transaction on Sepolia Etherscan
          </a>
          {metadataUri && <p className="mt-3 break-all text-xs">Metadata: {metadataUri}</p>}
        </div>
      )}
    </div>
  );
}
