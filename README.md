# MINTLAB — NFT Studio

MINTLAB is a Web3 NFT studio built to help creators mint digital artwork on Ethereum. It combines NFT minting, IPFS metadata storage, wallet integration, ERC-4337 Account Abstraction, ENS identity lookup, and live mint notifications in one application.

The project was developed on the **Ethereum Sepolia testnet**.

## Features

- **NFT Minting:** Mint digital artwork through a smart contract.
- **IPFS Metadata:** Store artwork and metadata using Pinata and IPFS.
- **Account Abstraction:** Bundle multiple smart-account actions into a single ERC-4337 UserOperation.
- **Batch Minting:** Execute two NFT mint actions within one UserOperation.
- **ENS Integration:** Look up ENS names to help identify wallet addresses.
- **Live Mint Alerts:** Listen for mint events while the application is open.
- **NFT Gallery:** Display artwork and associated metadata.
- **Wallet Integration:** Connect a compatible Ethereum wallet.
- **Sepolia Explorer Links:** Inspect transactions and verify on-chain activity.

## Tech Stack

- Next.js
- React
- TypeScript
- Wagmi
- Viem
- Solidity and Ethereum smart contracts
- Ethereum Sepolia testnet
- ERC-4337 Account Abstraction
- Pimlico
- Pinata and IPFS
- Ethereum Name Service (ENS)
- Tailwind CSS

## Network and Smart Contract

**Network:** Ethereum Sepolia Testnet

**NFT Contract Address:**

`0x944fA4a2D247ede82cd39FD75Ef9CadE014c6a7a`

[View the NFT contract on Sepolia Etherscan](https://sepolia.etherscan.io/address/0x944fA4a2D247ede82cd39FD75Ef9CadE014c6a7a)

**ERC-4337 EntryPoint Address:**

`0x0000000071727De22E5E9d8BAf0edAc6f37da032`

[View the EntryPoint on Sepolia Etherscan](https://sepolia.etherscan.io/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)

Make sure MetaMask or another supported wallet is configured for the Sepolia network and has test ETH when required.

## Getting Started

### Prerequisites

Install the following before running the project:

- Node.js and npm
- Git
- A compatible Ethereum wallet, such as MetaMask
- A Pimlico API key
- A Pinata account and API credentials if using Pinata for uploads

### 1. Clone the repository

If you are working with an existing local project, open its directory instead.

```bash
git clone YOUR_REPOSITORY_URL
cd nft-studio
```

Replace `YOUR_REPOSITORY_URL` with your actual repository URL.

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Create a `.env.local` file in the project root and add the environment variables required by your implementation.

For example:

```env
PIMLICO_API_KEY=your_pimlico_api_key
```

If your application uses Pinata credentials, add the corresponding variables using the exact names referenced in your code.

**Security:** Never commit `.env.local`, private keys, seed phrases, or API secrets to GitHub. Keep secret API keys on the server and use environment variables in your deployment environment.

### 4. Start the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 5. Build the project

Check that the production build completes successfully:

```bash
npm run build
```

To run the production build locally:

```bash
npm run start
```

## Account Abstraction Batch Mint — Sepolia

MINTLAB successfully executed a batch mint using ERC-4337 Account Abstraction. The recorded operation used the **Execute Batch** method and included two NFT transactions in one UserOperation.

### Recorded transaction

- **Network:** Ethereum Sepolia Testnet
- **Method:** Execute Batch
- **UserOperation hash:** `0x1a9c394829188f7160c7301ce42a010eabb98d1f94b8751b8b7681bd883d448b`
- **Included transaction hash:** `0x9efcde0b4437f9db3858491b3f6dfc71d185eff79fdc8f3a47d5bddf432fcd9e`
- **Smart account:** `0x5D05B9937E1497d59AE957e1bfa02Af7efe6CA0c`
- **NFT transactions recorded:** 2

[View the recorded transaction on Sepolia Etherscan](https://sepolia.etherscan.io/tx/0x9efcde0b4437f9db3858491b3f6dfc71d185eff79fdc8f3a47d5bddf432fcd9e#aa)

### Understanding the transaction

**What does From mean?**

In the Account Abstraction transaction details, the smart account is shown as:

`0x5D05B9937E1497d59AE957e1bfa02Af7efe6CA0c`

The outer Ethereum transaction may show a different address because a bundler submits the transaction that calls the ERC-4337 EntryPoint.

**What does To mean?**

The outer transaction can have the ERC-4337 EntryPoint as its destination. The EntryPoint processes the UserOperation, which executes the requested actions through the smart account.

**Who paid the gas?**

The transaction fee displayed by Etherscan is approximately `0.0025337 ETH` in the recorded Account Abstraction row. The fee alone does not prove whether a paymaster sponsored the operation.

To determine who paid the gas, inspect the Account Abstraction details on Etherscan and verify whether a paymaster was used and whether it covered the operation's gas costs. Do not describe the transaction as gas-sponsored unless those details confirm it.

## Live Mint Alerts

MINTLAB can listen for NFT mint events and display notifications while the application is running. Where configured, ENS lookup can help associate an address with a human-readable name.

The browser-based event listener depends on the page remaining open and connected. If the user closes the page, loses connectivity, or stops the application, the listener may stop receiving events.

### How this could work in production

A production implementation could use a persistent backend service, blockchain event indexer, or reliable WebSocket infrastructure to monitor mint events independently of an individual browser session. The backend could then deliver notifications through in-app updates, email, or other notification channels.

## Deployment

MINTLAB can be deployed to a platform that supports Next.js, such as Vercel.

General deployment steps:

1. Push the project to a Git repository.
2. Import the repository into your hosting platform.
3. Configure the required environment variables in the hosting dashboard.
4. Deploy the application.
5. Test wallet connection, minting, metadata uploads, and Account Abstraction functionality on Sepolia.

Never upload `.env.local` or expose server-side API secrets in client-side code.

## Current Limitations

- The application is configured for the Sepolia testnet rather than a production mainnet deployment.
- Live browser-based event notifications depend on the page and listener remaining active.
- Some gallery artwork may be demonstration content rather than verified on-chain NFTs.
- ENS lookup depends on available ENS records and the implementation's supported lookup behavior.
- Gas sponsorship must be verified from the UserOperation's paymaster details; it should not be assumed from the transaction fee alone.
- Production deployment requires appropriate API-key management, monitoring, error handling, and security review.

## Future Improvements

- Add persistent blockchain event monitoring.
- Support push, email, or Telegram notifications.
- Improve NFT collection and creator profile pages.
- Add transaction history and clearer Account Abstraction status details.
- Improve upload validation and metadata management.
- Add automated tests for minting and batch execution.
- Conduct a smart contract security review before any mainnet deployment.

## License

Choose and add an appropriate open-source license before distributing the project publicly. Until a license is added, do not assume others have permission to reuse the code.

---

**MINTLAB** — Built for independent creators on Web3.
