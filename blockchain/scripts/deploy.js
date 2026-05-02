import hre from "hardhat";

async function main() {
  const UDIDRegistry = await hre.ethers.getContractFactory("UDIDRegistry");
  const registry = await UDIDRegistry.deploy();

  await registry.waitForDeployment();

  console.log(`UDIDRegistry deployed to: ${await registry.getAddress()}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
