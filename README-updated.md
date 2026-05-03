# Advance Supply Chain DApp

A decentralized application (DApp) designed to track and manage supply chains using a tamper-proof blockchain ledger. The project provides end-to-end tracking of public fund flows, multi-role access control, and a trustless escrow payment system.

## 🌟 Key Features

- **End-to-End Tracking**: Monitor the complete lifecycle of shipments and fund flows on a transparent, immutable ledger.
- **Trustless Escrow System**: Implement secure payments through a three-party escrow framework. Funds are locked in the smart contract and require confirmation from the Carrier and Receiver before an Admin can authorize the final payment release (`adminReleasePayment`).
- **Role-Based Access Control**: Secure the platform using granular roles including Admin, Auditor, and Public, ensuring only authorized actions (like KYC verification or fund release) can be performed.
- **KYC Verification Workflow**: Built-in KYC submission process with an Admin Panel to verify and manage user compliance.
- **Multi-Network Support**: Compatible with local Hardhat network, as well as testnets and mainnets (Holesky, Polygon).

## 🛠️ Technologies Used

- **Frontend:** Next.js (React), Tailwind CSS, Wagmi, Ethers.js v5, RainbowKit
- **Backend / Smart Contracts:** Solidity, Hardhat, OpenZeppelin Contracts
- **Blockchain Networks:** Localhost, Polygon, Holesky

---

## 📁 Project Structure

- `/` (Root): The Next.js frontend application containing the UI, web3 integration, and React components.
- `/web3`: The Hardhat environment containing smart contract source code (`contracts/`), deployment scripts (`scripts/`), and contract tests.

---

## 🚀 Getting Started

Follow these step-by-step instructions to set up the environment, install dependencies, and run the project locally.

### Prerequisites

Ensure you have the following installed on your local machine:
- [Node.js](https://nodejs.org/) (v16.x or v18.x recommended - e.g., v18.17.1)
- `npm` (comes with Node.js) or `yarn`

### 1. Smart Contract Setup (Hardhat)

First, initialize the local blockchain and deploy the necessary smart contracts.

1. **Navigate to the smart contract directory:**
   ```bash
   cd web3
   ```

2. **Install contract dependencies:**
   ```bash
   npm install
   ```

3. **Start the local Hardhat blockchain node:**
   *(Keep this terminal window open and running)*
   ```bash
   npm run node
   ```

4. **Deploy the smart contracts to the local network:**
   *(Open a new terminal window, navigate to the `web3` directory)*
   ```bash
   npm run deploy-local
   ```
   > **Note:** For deploying to testnets or mainnets, you can use `npm run deploy-holesky` or `npm run deploy-polygon`. Make sure your `.env` file in the `web3` directory is properly configured with your private key and RPC URLs.

### 2. Frontend Setup (Next.js)

Once the smart contracts are deployed locally, set up and start the frontend web application.

1. **Navigate back to the root directory:**
   ```bash
   cd ..
   ```

2. **Install frontend dependencies:**
   ```bash
   npm install
   ```

3. **Set up Environment Variables:**
   If there is an `.env.example` or `.env.local` file, make sure it is configured correctly with your deployed contract addresses and preferred RPC endpoints.

4. **Start the frontend development server:**
   ```bash
   npm run dev
   ```

5. **Access the DApp:**
   Open your browser and navigate to [http://localhost:3001](http://localhost:3001).
   *(Note: The Next.js server is configured to run on port 3001 as defined in the `package.json`).*

---

## 📜 Available Commands Reference

### Frontend Commands (Root Directory)
- `npm run dev`: Starts the Next.js development server on port 3001.
- `npm run build`: Compiles the application for production deployment.
- `npm run start`: Starts the production server.
- `npm run lint`: Runs ESLint to check for code issues.
- `npm run clear`: Removes `node_modules`, `package-lock.json`, and Next.js cache.

### Smart Contract Commands (`/web3` Directory)
- `npm run compile`: Compiles the Solidity smart contracts using Hardhat.
- `npm run node`: Starts a local Hardhat Ethereum node.
- `npm run deploy-local`: Deploys the contracts to the local Hardhat node.
- `npm run deploy-holesky`: Deploys the contracts to the Holesky testnet.
- `npm run deploy-polygon`: Deploys the contracts to the Polygon network.
- `npm run clear`: Cleans Hardhat cache and removes `node_modules`.

## 🤝 Contributing

When contributing to this project, please ensure all smart contract changes include updated tests, and frontend modifications maintain the established design language and Tailwind utility classes.
