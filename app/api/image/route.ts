import { NextResponse } from "next/server";


export async function POST(request: Request) {
  try {
    const jwt = process.env.PINATA_JWT;
    if (!jwt) {
      return NextResponse.json({ error: "PINATA_JWT is not configured." }, { status: 500 });
    }

    const form = await request.formData();
    const file = form.get("file");

    if (!(file instanceof File) || !file.type.startsWith("image/")) {
      return NextResponse.json({ error: "Select a valid image." }, { status: 400 });
    }
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: "Image must be 10 MB or smaller." }, { status: 400 });
    }

    const data = new FormData();
    data.append("file", file, file.name);

    const response = await fetch("https://api.pinata.cloud/pinning/pinFileToIPFS", {
      method: "POST",
      headers: { Authorization: `Bearer ${jwt}` },
      body: data,
      cache: "no-store",
    });

    if (!response.ok) {
      console.error("Pinata image upload failed:", response.status);
      return NextResponse.json({ error: "Pinata image upload failed." }, { status: 502 });
    }

    const result = await response.json();
    if (!result.IpfsHash) {
      return NextResponse.json({ error: "Pinata returned no image CID." }, { status: 502 });
    }

    return NextResponse.json({
      cid: result.IpfsHash,
      uri: `ipfs://${result.IpfsHash}`,
      gatewayUrl: `https://gateway.pinata.cloud/ipfs/${result.IpfsHash}`,
    });
  } catch (error) {
    console.error("Image upload error:", error);
    return NextResponse.json({ error: "Could not upload image." }, { status: 500 });
  }
}
