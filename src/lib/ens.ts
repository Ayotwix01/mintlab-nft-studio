import { createPublicClient, http } from "viem";
import { mainnet } from "viem/chains";

export const ensClient = createPublicClient({
  chain: mainnet,
  transport: http(),
});
