const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();

  // On Polygon, the deployer will grant admin rights to the provided wallet
  const NEW_ADMIN = "0x9f7A82baE2cb215E887bbBA1D73501c57163e210";

  console.log("Deploying contracts with the account:", deployer.address);
  console.log("Account balance:", (await deployer.getBalance()).toString());

  // Check if we're on Mainnet network
  const network = await hre.ethers.provider.getNetwork();
  //TOKEN ICO CONTRACT

  // Deploy CHAT_DAPP Contract
  console.log("\nDeploying SupplyChain contract...");
  const SupplyChain = await hre.ethers.getContractFactory("SupplyChain");
  const supplyChain = await SupplyChain.deploy();

  await supplyChain.deployed();

  // Grant ADMIN_ROLE and DEFAULT_ADMIN_ROLE to the new admin
  const ADMIN_ROLE = await supplyChain.ADMIN_ROLE();
  const DEFAULT_ADMIN_ROLE = await supplyChain.DEFAULT_ADMIN_ROLE();

  console.log("\nGranting admin roles to:", NEW_ADMIN);
  await (await supplyChain.grantRole(ADMIN_ROLE, NEW_ADMIN)).wait();
  await (await supplyChain.grantRole(DEFAULT_ADMIN_ROLE, NEW_ADMIN)).wait();
  console.log("Admin roles granted successfully!");

  console.log("\nDeployment Successful!");
  console.log("------------------------");
  console.log("NEXT_PUBLIC_OWNER_ADDRESS:", deployer.address);
  console.log("NEXT_PUBLIC_ADMIN_ADDRESS:", NEW_ADMIN);
  console.log("NEXT_PUBLIC_SupplyChain_ADDRESS:", supplyChain.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
