import { network } from "hardhat";

const main = async (): Promise<void> => {
  const { ethers } = await network.connect("hardhatMainnet");
  const signers = await ethers.getSigners();
  const addresses = await Promise.all(signers.slice(0, 5).map((signer) => signer.getAddress()));

  console.info("contracts.shell.accounts", {
    addresses,
    count: signers.length,
  });
};

await main();
