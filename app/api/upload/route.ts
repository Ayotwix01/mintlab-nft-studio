import { NextResponse } from "next/server";


export async function POST(request: Request) {
  try {
    const jwt = process.env.PINATA_JWT;

    if (!jwt) {
      return NextResponse.json(
        { error: "Upload service is not configured." },
        { status: 500 },
      );
    }

    const body: unknown = await request.json();

    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "Invalid metadata." }, { status: 400 });
    }

    const input = body as {
      name?: unknown;
      description?: unknown;
      image?: unknown;
    };

    if (
      typeof input.name !== "string" ||
      !input.name.trim() ||
      input.name.length > 100
    ) {
      return NextResponse.json(
        { error: "Title is required and must be at most 100 characters." },
        { status: 400 },
      );
    }

    if (
      typeof input.description !== "string" ||
      input.description.length > 2000
    ) {
      return NextResponse.json(
        { error: "Description must be at most 2000 characters." },
        { status: 400 },
      );
    }

    if (
      typeof input.image !== "string" ||
      !/^ipfs:\/\/[a-zA-Z0-9]+$/.test(input.image)
    ) {
      return NextResponse.json(
        { error: "A valid IPFS image URI is required." },
        { status: 400 },
      );
    }

    const metadata = {
      name: input.name.trim(),
      description: input.description.trim(),
      image: input.image,
    };

    const response = await fetch(
      "https://api.pinata.cloud/pinning/pinJSONToIPFS",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${jwt}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          pinataContent: metadata,
          pinataMetadata: {
            name: `${metadata.name} - MINTLAB metadata`,
          },
        }),
        cache: "no-store",
      },
    );

    if (!response.ok) {
      console.error("Pinata metadata upload failed:", response.status);

      return NextResponse.json(
        { error: "Pinata could not upload the NFT metadata." },
        { status: 502 },
      );
    }

    const result = (await response.json()) as {
      IpfsHash?: string;
    };

    if (!result.IpfsHash) {
      return NextResponse.json(
        { error: "Pinata returned no metadata identifier." },
        { status: 502 },
      );
    }

    return NextResponse.json({
      cid: result.IpfsHash,
      uri: `ipfs://${result.IpfsHash}`,
      gatewayUrl: `https://gateway.pinata.cloud/ipfs/${result.IpfsHash}`,
    });
  } catch (error) {
    console.error("Metadata upload route error:", error);

    return NextResponse.json(
      { error: "Could not process the metadata upload." },
      { status: 500 },
    );
  }
}
