"use client";

import { useEffect, useState } from "react";
import { createPublicClient, http, parseAbi } from "viem";
import { mainnet, sepolia } from "viem/chains";

const CONTRACT = "0x5dDc98cAdd973246F4E20a0E895E7D6fe723Aa09" as const;
const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

const abi = parseAbi([
  "event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)",
]);

const sepoliaClient = createPublicClient({
  chain: sepolia,
  transport: http("https://ethereum-sepolia-rpc.publicnode.com"),
});

const ensClient = createPublicClient({
  chain: mainnet,
  transport: http(),
});

function shortAddress(address: `0x${string}`) {
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

export default function LiveMintAlerts() {
  const [status, setStatus] = useState("Connecting to Sepolia events...");
  const [latestEvent, setLatestEvent] = useState("");
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    if (!("Notification" in window)) {
      setStatus("Browser notifications are not supported.");
    } else if (Notification.permission === "granted") {
      setNotificationsEnabled(true);
      setStatus("Browser notifications are enabled.");
    } else if (Notification.permission === "default") {
      setShowPrompt(
        sessionStorage.getItem("mintlab-notifications-dismissed") !== "yes",
      );
    } else {
      setStatus("Notifications are blocked in browser settings.");
    }

    let active = true;

    const unwatch = sepoliaClient.watchContractEvent({
      address: CONTRACT,
      abi,
      eventName: "Transfer",
      pollingInterval: 8_000,

      onLogs(logs) {
        void (async () => {
          for (const log of logs) {
            if (!active) return;

            const { from, to, tokenId } = log.args;

            // Only treat transfers from the zero address as new mints.
            if (
              !from ||
              from.toLowerCase() !== ZERO_ADDRESS ||
              !to ||
              tokenId === undefined
            ) {
              continue;
            }

            let creatorName = shortAddress(to);

            try {
              const ensName = await ensClient.getEnsName({ address: to });
              if (ensName) creatorName = ensName;
            } catch {
              // ENS is optional.
            }

            if (!active) return;

            const message = `NFT #${tokenId.toString()} was minted to ${creatorName}`;
            setLatestEvent(message);
            setStatus("Live Diamond mint monitoring is active.");

            if (
              "Notification" in window &&
              Notification.permission === "granted"
            ) {
              new Notification("New MINTLAB NFT minted", {
                body: message,
              });
            }
          }
        })();
      },

      onError(error) {
        if (active) {
          console.error("Diamond mint watcher error:", error);
          setStatus("Event connection interrupted; retrying.");
        }
      },
    });

    return () => {
      active = false;
      unwatch();
    };
  }, []);

  async function enableNotifications() {
    if (!("Notification" in window)) {
      setStatus("This browser does not support notifications.");
      setShowPrompt(false);
      return;
    }

    try {
      const permission = await Notification.requestPermission();
      const enabled = permission === "granted";

      setNotificationsEnabled(enabled);
      setShowPrompt(false);

      if (enabled) {
        sessionStorage.setItem("mintlab-notifications-dismissed", "yes");
        setStatus("Browser notifications enabled.");

        new Notification("MINTLAB notifications enabled", {
          body: "You'll be notified about newly observed Diamond NFT mints while the app is open.",
        });
      } else {
        setStatus(
          permission === "denied"
            ? "Notifications are blocked. Allow them in your browser settings."
            : "Notifications weren't enabled. You can enable them later.",
        );
      }
    } catch {
      setStatus("Couldn't request notification permission in this browser.");
      setShowPrompt(false);
    }
  }

  function dismissPrompt() {
    sessionStorage.setItem("mintlab-notifications-dismissed", "yes");
    setShowPrompt(false);
  }

  return (
    <section className="my-6 rounded-2xl border border-neutral-200 bg-white p-5 text-neutral-900">
      {showPrompt && (
        <div className="mb-5 rounded-2xl border border-lime-200 bg-lime-50 p-4">
          <h3 className="font-semibold">Stay in the loop</h3>
          <p className="mt-1 text-sm text-neutral-700">
            Enable browser notifications for newly detected NFT mints while
            MINTLAB is open.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => void enableNotifications()}
              className="rounded-xl bg-[#c7f36b] px-4 py-3 text-sm font-bold"
            >
              Enable notifications
            </button>
            <button
              type="button"
              onClick={dismissPrompt}
              className="rounded-xl border border-neutral-300 px-4 py-3 text-sm font-semibold"
            >
              Not now
            </button>
          </div>
        </div>
      )}

      <p className="text-xs font-bold uppercase tracking-widest text-neutral-500">
        On-chain activity
      </p>
      <h2 className="mt-2 text-xl font-semibold">Live mint alerts</h2>
      <p role="status" className="mt-2 text-sm text-neutral-600">
        {status}
      </p>

      {latestEvent && (
        <p className="mt-3 break-words rounded-xl bg-neutral-50 p-3 text-sm">
          {latestEvent}
        </p>
      )}

      {!showPrompt && (
        <button
          type="button"
          onClick={() => void enableNotifications()}
          disabled={notificationsEnabled}
          className="mt-4 rounded-xl bg-[#c7f36b] px-4 py-3 text-sm font-bold disabled:opacity-60"
        >
          {notificationsEnabled
            ? "Browser notifications enabled"
            : "Enable browser notifications"}
        </button>
      )}

      <p className="mt-3 text-xs text-neutral-500">
        Watches ERC-721 mint events on the MINTLAB Diamond on Sepolia. ENS names
        are resolved on Ethereum mainnet when available. Browser notifications
        require permission and this app to remain open.
      </p>
    </section>
  );
}
