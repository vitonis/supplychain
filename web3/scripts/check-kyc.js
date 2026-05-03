const { ethers } = require("ethers");
const fs = require("fs");
require("dotenv").config({ path: "../.env.local" });

const CONTRACT_ADDRESS = "0x1dfC6F323a3310b6473CD3820152346DeD61DFD6";
const RPC_URL = "https://polygon-bor-rpc.publicnode.com";
// We can use a random ABI that only has getPendingKYCUsers
const ABI = [
  "function getPendingKYCUsers() external view returns (address[])",
  "function hasRole(bytes32 role, address account) external view returns (bool)",
  "function ADMIN_ROLE() external view returns (bytes32)"
];

async function main() {
  const provider = new ethers.providers.JsonRpcProvider(RPC_URL);
  const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, provider);
  
  // Also create a signer with the admin private key to call it, since it has onlyRole(ADMIN_ROLE)
  const wallet = new ethers.Wallet(process.env.DEPLOYER_PRIVATE_KEY, provider);
  const contractWithSigner = contract.connect(wallet);

  try {
    const adminHash = await contract.ADMIN_ROLE();
    console.log("Admin Role Hash:", adminHash);
    const hasRole = await contract.hasRole(adminHash, wallet.address);
    console.log("Does our wallet have admin role?", hasRole);

    const pending = await contractWithSigner.getPendingKYCUsers();
    console.log("Pending KYC Users Array:", pending);
  } catch (error) {
    console.error("Error:", error);
  }
}

main();
