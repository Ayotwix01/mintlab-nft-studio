import { createPublicClient, http, parseAbi, parseEventLogs } from "viem";
import { sepolia } from "viem/chains";
import type { Log } from "viem";

const CONTRACT = "0x5dDc98cAdd973246F4E20a0E895E7D6fe723Aa09" as const;

const abi = parseAbi([
  "function totalMinted() view returns (uint256)",
  "function tokenURI(uint256 tokenId) view returns (string)",
  "function ownerOf(uint256 tokenId) view returns (address)",
  "event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)",
]);

const client = createPublicClient({
  chain: sepolia,
  transport: http("https://ethereum-sepolia-rpc.publicnode.com"),
});

export type GalleryNFT = {
  id: string;
  title: string;
  artist: string;
  category: string;
  image: string;
  metadataURI: string;
  tokenId: string;
  creator: `0x${string}`;
  transactionHash: `0x${string}`;
  network: "Sepolia";
};

function ipfsUrl(uri: string): string {
  if (!uri) return "";

  if (uri.startsWith("ipfs://")) {
    return `https://gateway.pinata.cloud/ipfs/${uri
      .slice(7)
      .replace(/^ipfs\//, "")}`;
  }

  return uri;
}

async function readMetadata(metadataURI: string, tokenId: bigint) {
  let title = `NFT #${tokenId}`;
  let image = "";

  try {
    const response = await fetch(ipfsUrl(metadataURI), {
      cache: "no-store",
    });

    if (response.ok) {
      const metadata = await response.json();
      title = metadata.name || title;
      image = ipfsUrl(metadata.image || "");
    }
  } catch (error) {
    console.warn("Could not load NFT metadata:", tokenId.toString(), error);
  }

  return { title, image };
}

export async function getMintedNFTs(): Promise<GalleryNFT[]> {
  const totalMinted = await client.readContract({
    address: CONTRACT,
    abi,
    functionName: "totalMinted",
  });

  if (totalMinted === BigInt(0)) return [];

  const latestBlock = await client.getBlockNumber();
  const nftMap = new Map<string, GalleryNFT>();

  // Transfer events with the zero address as sender identify mints.
  // Search in chunks to avoid oversized RPC requests.
  const chunkSize = BigInt(2000);
  let fromBlock = BigInt(11927726);

  while (fromBlock <= latestBlock) {
    const toBlock =
      fromBlock + chunkSize - BigInt(1) > latestBlock
        ? latestBlock
        : fromBlock + chunkSize - BigInt(1);

    const logs = await client.getLogs({
      address: CONTRACT,
      event: parseAbi([
        "event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)",
      ])[0],
      args: { from: "0x0000000000000000000000000000000000000000" },
      fromBlock,
      toBlock,
    });

    const decoded = parseEventLogs({
      abi,
      eventName: "Transfer",
      logs: logs as Log[],
      strict: false,
    });

    for (const event of decoded) {
      const { from, to, tokenId } = event.args;
      if (
        !from ||
        from.toLowerCase() !== "0x0000000000000000000000000000000000000000" ||
        !to ||
        tokenId === undefined
      ) {
        continue;
      }

      try {
        const metadataURI = await client.readContract({
          address: CONTRACT,
          abi,
          functionName: "tokenURI",
          args: [tokenId],
        });

        const [metadata, owner] = await Promise.all([
          readMetadata(metadataURI, tokenId),
          client.readContract({
            address: CONTRACT,
            abi,
            functionName: "ownerOf",
            args: [tokenId],
          }),
        ]);

        nftMap.set(tokenId.toString(), {
          id: `${CONTRACT.toLowerCase()}-${tokenId.toString()}`,
          tokenId: tokenId.toString(),
          title: metadata.title,
          artist: `${to.slice(0, 6)}…${to.slice(-4)}`,
          category: "On-chain",
          image: metadata.image,
          metadataURI,
          creator: to,
          transactionHash: event.transactionHash,
          network: "Sepolia",
        });

        // ownerOf is deliberately checked to ensure the token exists.
        void owner;
      } catch (error) {
        console.warn("Could not load Diamond NFT:", tokenId.toString(), error);
      }
    }

    fromBlock = toBlock + BigInt(1);
  }

  return Array.from(nftMap.values()).sort((a, b) =>
    Number(BigInt(b.tokenId) - BigInt(a.tokenId)),
  );
}
