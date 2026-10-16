"use client";

import { useState } from "react";
import { useWalletClient } from "wagmi";
import { sepolia } from "wagmi/chains";
import { createPublicClient, encodeFunctionData, http } from "viem";
import { SimpleSmartAccount } from "permissionless/accounts/simple";
import { createSmartAccountClient } from "permissionless";

const CONTRACT_ADDRESS = "0x944fA4a2D247ede82cd39FD75Ef9CadE014c6a7a" as const;

const ENTRY_POINT = {
  address: "0x0000000071727De22E5E9d8BAf0edAc6f37da032" as const,
  version: "0.7" as const,
};

const mintAbi = [
  {
    type: "function",
    name: "mintNFT",
    stateMutability: "nonpayable",
    inputs: [{ name: "metadataURI", type: "string" }],
    outputs: [{ name: "", type: "uint256" }],
  },
] as const;

const publicClient = createPublicClient({
  chain: sepolia,
  transport: http("https://ethereum-sepolia-rpc.publicnode.com"),
});

export default function GaslessBatchMint() {
  const { data: walletClient } = useWalletClient({ chainId: sepolia.id });
  const [metadataUri, setMetadataUri] = useState("");
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [userOpHash, setUserOpHash] = useState("");
  const [transactionHash, setTransactionHash] = useState("");

  async function submitBatch(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setStatus("");
    setUserOpHash("");
    setTransactionHash("");

    if (!walletClient?.account) {
      setError("Connect MetaMask on Sepolia first.");
      return;
    }

    const uri = metadataUri.trim();
    if (!uri || !/^(ipfs:\/\/|https:\/\/)/i.test(uri)) {
      setError("Enter a valid ipfs:// or https:// metadata URI.");
      return;
    }

    if (
      !window.confirm(
        "This test will mint TWO NFTs using the same metadata URI. Continue?",
      )
    ) {
      return;
    }

    setBusy(true);

    try {
      setStatus("Creating your smart account...");
      const account = await SimpleSmartAccount.toSimpleSmartAccount({
        client: publicClient,
        owner: walletClient,
        entryPoint: ENTRY_POINT,
      });

      setStatus("Preparing sponsored batch UserOperation...");
      const smartAccountClient = createSmartAccountClient({
        account,
        chain: sepolia,
        client: publicClient,
        bundlerTransport: http("/api/pimlico"),
        paymaster: true,
      });

      const callData = encodeFunctionData({
        abi: mintAbi,
        functionName: "mintNFT",
        args: [uri],
      });

      setStatus("Fetching current Pimlico gas prices...");

      const gasPriceResponse = await fetch("/api/pimlico", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jsonrpc: "2.0",
          id: 1,
          method: "pimlico_getUserOperationGasPrice",
          params: [],
        }),
      });

      const gasPriceJson = await gasPriceResponse.json();

      if (!gasPriceResponse.ok || gasPriceJson.error || !gasPriceJson.result) {
        throw new Error(
          gasPriceJson.error?.message ??
            "Could not fetch current Pimlico gas prices.",
        );
      }

      const gasPrice = gasPriceJson.result.fast;

      if (!gasPrice?.maxFeePerGas || !gasPrice?.maxPriorityFeePerGas) {
        throw new Error(
          "Pimlico did not return the required gas-price values.",
        );
      }

      setStatus("Sending two mint calls in one UserOperation...");

      const hash = await smartAccountClient.sendUserOperation({
        calls: [
          { to: CONTRACT_ADDRESS, data: callData, value: 0n },
          { to: CONTRACT_ADDRESS, data: callData, value: 0n },
        ],
        maxFeePerGas: BigInt(gasPrice.maxFeePerGas),
        maxPriorityFeePerGas: BigInt(gasPrice.maxPriorityFeePerGas),
      });

      setUserOpHash(hash);
      setStatus("UserOperation submitted. Waiting for its receipt...");

      const result = await smartAccountClient.waitForUserOperationReceipt({
        hash,
      });

      const txHash = result.receipt.transactionHash;
      setTransactionHash(txHash);

      if (result.success) {
        setStatus("Batch completed successfully.");
      } else {
        setStatus("The UserOperation was included but execution failed.");
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Gasless batch submission failed.",
      );
      setStatus("");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="mt-8 rounded-2xl border border-neutral-200 p-5">
      <p className="text-xs font-semibold uppercase tracking-widest text-neutral-500">
        Account abstraction · Sepolia
      </p>
      <h2 className="mt-2 text-xl font-semibold">Gasless batch mint</h2>
      <p className="mt-2 text-sm text-neutral-600">
        Submit two NFT mint calls together in one UserOperation through Pimlico.
        Both NFTs will use the same metadata URI. Sponsorship depends on your
        Pimlico paymaster configuration.
      </p>

      <form onSubmit={submitBatch} className="mt-4 space-y-3">
        <label
          className="block text-sm font-medium"
          htmlFor="batch-metadata-uri"
        >
          NFT metadata URI
        </label>
        <input
          id="batch-metadata-uri"
          value={metadataUri}
          onChange={(event) => setMetadataUri(event.target.value)}
          placeholder="ipfs://... or https://..."
          className="w-full rounded-xl border border-neutral-300 px-3 py-3 text-sm"
          required
        />
        <button
          type="submit"
          disabled={busy || !walletClient}
          className="w-full rounded-full bg-[#20211c] px-5 py-3.5 font-semibold text-white disabled:opacity-50"
        >
          {busy ? "Processing batch..." : "Submit two gasless mints"}
        </button>
      </form>

      {status && (
        <p role="status" className="mt-3 text-sm">
          {status}
        </p>
      )}
      {error && (
        <p role="alert" className="mt-3 break-words text-sm text-red-600">
          {error}
        </p>
      )}

      {userOpHash && (
        <p className="mt-3 break-all text-sm">
          UserOperation:{" "}
          <a
            className="underline"
            href={`https://sepolia.etherscan.io/tx/${userOpHash}`}
            target="_blank"
            rel="noreferrer"
          >
            {userOpHash}
          </a>
        </p>
      )}

      {transactionHash && (
        <p className="mt-2 break-all text-sm">
          Included transaction:{" "}
          <a
            className="underline"
            href={`https://sepolia.etherscan.io/tx/${transactionHash}`}
            target="_blank"
            rel="noreferrer"
          >
            View on Etherscan
          </a>
        </p>
      )}
    </section>
  );
}
