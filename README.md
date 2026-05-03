# Advance Supply Chain DApp

This project is a decentralized application (DApp) for tracking and managing supply chains using blockchain technology. It consists of a Next.js frontend and a Hardhat-based smart contract backend.

## Prerequisites

- [Node.js](https://nodejs.org/) (v16 or higher recommended)
- npm or yarn

## Project Structure

- `/` - Contains the Next.js frontend application.
- `/web3` - Contains the Hardhat environment for the smart contracts (`SupplyChain.sol`).

## Getting Started

### 1. Smart Contract Setup (Hardhat)

First, you need to set up the local blockchain and deploy the smart contracts.

1. Navigate to the `web3` directory:
   ```bash
   cd web3
   ```
2. Install the smart contract dependencies:
   ```bash
   npm install
   ```
3. Start the local Hardhat node (keep this terminal running):
   ```bash
   npm run node
   ```
4. Open a new terminal, navigate to the `web3` directory again, and deploy the contract to your local network:
   ```bash
   npm run deploy-local
   ```

*(Note: You can also deploy to testnets like Holesky or Polygon using `npm run deploy-holesky` and `npm run deploy-polygon` after configuring your `.env` file).*

### 2. Frontend Setup (Next.js)

After deploying the smart contract, you can start the frontend application.

1. Open a new terminal and navigate to the root directory of the project.
2. Install frontend dependencies:
   ```bash
   npm install
   ```
3. Run the development server:
   ```bash
   npm run dev
   ```

The application will start on port 3001 by default. Open [http://localhost:3001](http://localhost:3001) in your browser to view the DApp.

## Technologies Used

- **Frontend:** Next.js (React), Tailwind CSS, Wagmi, Web3Modal, Ethers.js
- **Backend/Smart Contracts:** Solidity, Hardhat, OpenZeppelin
