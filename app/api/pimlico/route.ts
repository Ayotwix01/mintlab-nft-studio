import { NextRequest, NextResponse } from "next/server";


const ALLOWED_METHODS = new Set([
  "eth_chainId",
  "eth_supportedEntryPoints",
  "eth_gasPrice",
  "eth_maxPriorityFeePerGas",
  "eth_feeHistory",
  "eth_estimateUserOperationGas",
  "eth_sendUserOperation",
  "eth_getUserOperationByHash",
  "eth_getUserOperationReceipt",
  "pm_getPaymasterData",
  "pm_getPaymasterStubData",
  "pimlico_getUserOperationGasPrice",
  "pimlico_getUserOperationStatus",
]);

export async function POST(request: NextRequest) {
  const apiKey = process.env.PIMLICO_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      { error: "PIMLICO_API_KEY is missing from server configuration." },
      { status: 500 },
    );
  }

  try {
    const payload = await request.json();

    if (
      !payload ||
      typeof payload.method !== "string" ||
      !ALLOWED_METHODS.has(payload.method)
    ) {
      return NextResponse.json(
        { error: "Unsupported JSON-RPC method." },
        { status: 400 },
      );
    }

    const upstream = await fetch(
      `https://api.pimlico.io/v2/sepolia/rpc?apikey=${encodeURIComponent(apiKey)}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        cache: "no-store",
      },
    );

    const body = await upstream.json();

    return NextResponse.json(body, {
      status: upstream.ok ? 200 : upstream.status,
    });
  } catch {
    return NextResponse.json(
      { error: "Pimlico request failed. Check the server logs." },
      { status: 502 },
    );
  }
}
