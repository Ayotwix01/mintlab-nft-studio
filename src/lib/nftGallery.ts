import { createPublicClient, http, parseAbi, parseEventLogs } from "viem";
import { sepolia } from "viem/chains";
import type { Log } from "viem";

const CONTRACT = "0x944fA4a2D247ede82cd39FD75Ef9CadE014c6a7a" as const;

const FIRST_MINT_TX =
  "0x35bdd355acc1888d1aeb4e0d937a2e4fc4573454cfa675198d30717ec88f1dfc" as const;

const KNOWN_IMAGE = "ipfs://QmfKHMAfUchr2htHxzbHiN9TGP289VEc6BgYKNw9rffg8s";

const abi = parseAbi([
  "event ArtworkMinted(address indexed creator, uint256 indexed tokenId, string metadataURI)",
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

async function readNFTsFromLogs(logs: Log[]): Promise<GalleryNFT[]> {
  const decoded = parseEventLogs({
    abi,
    eventName: "ArtworkMinted",
    logs,
    strict: false,
  });

  const nfts: GalleryNFT[] = [];

  for (const event of decoded) {
    if (event.address.toLowerCase() !== CONTRACT.toLowerCase()) continue;

    const { creator, tokenId, metadataURI } = event.args;

    if (!creator || tokenId === undefined || !metadataURI) {
      continue;
    }

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

    // Keep Ayotwix visible even if its metadata gateway is temporarily down.
    if (tokenId === BigInt("1") && !image) {
      title = "Ayotwix";
      image = ipfsUrl(KNOWN_IMAGE);
    }

    nfts.push({
      id: `${CONTRACT.toLowerCase()}-${tokenId.toString()}`,
      tokenId: tokenId.toString(),
      title,
      artist: `${creator.slice(0, 6)}…${creator.slice(-4)}`,
      category: "On-chain",
      image,
      metadataURI,
    });
  }

  return nfts;
}

export async function getMintedNFTs(): Promise<GalleryNFT[]> {
  // First retrieve the confirmed mint directly. This does not require
  // the RPC provider to search its entire historical log database.
  const receipt = await client.getTransactionReceipt({
    hash: FIRST_MINT_TX,
  });

  const nftMap = new Map<string, GalleryNFT>();

  const firstNFTs = await readNFTsFromLogs(receipt.logs);
  for (const nft of firstNFTs) {
    nftMap.set(nft.id, nft);
  }

  // Try to discover additional mints from this known mint's block onward.
  // If historical log access fails, retain the NFTs already loaded above.
  try {
    const latestBlock = await client.getBlockNumber();
    const chunkSize = BigInt("10000");
    let fromBlock = receipt.blockNumber;

    while (fromBlock <= latestBlock) {
      const toBlock =
        fromBlock + chunkSize - BigInt("1") > latestBlock
          ? latestBlock
          : fromBlock + chunkSize - BigInt("1");

      const logs = await client.getLogs({
        address: CONTRACT,
        fromBlock,
        toBlock,
      });

      const moreNFTs = await readNFTsFromLogs(logs);

      for (const nft of moreNFTs) {
        nftMap.set(nft.id, nft);
      }

      fromBlock = toBlock + BigInt("1");
    }
  } catch (error) {
    console.warn(
      "Additional NFT history could not be loaded; keeping confirmed mints.",
      error,
    );
  }

  return Array.from(nftMap.values()).sort((a, b) =>
    Number(BigInt(b.tokenId) - BigInt(a.tokenId)),
  );
}
