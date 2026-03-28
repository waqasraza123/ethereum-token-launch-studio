import hre, { network } from "hardhat";
import { verifyContract } from "@nomicfoundation/hardhat-verify/verify";
import {
  getProjectTokenDeploymentConfigPathFromArgv,
  readProjectTokenDeploymentConfig
} from "../src/config/project-token-deployment.js";
import { recordProjectTokenDeployment } from "../src/lib/project-token-registry.js";

type DeploymentReceipt = Readonly<{
  blockNumber: number;
}>;

type DeploymentTransaction = Readonly<{
  hash: string;
  wait(): Promise<DeploymentReceipt | null>;
}>;

type ProjectTokenContract = {
  waitForDeployment(): Promise<unknown>;
  getAddress(): Promise<string>;
  deploymentTransaction(): DeploymentTransaction | null;
  name(): Promise<string>;
  symbol(): Promise<string>;
  decimals(): Promise<bigint>;
  cap(): Promise<bigint>;
  totalSupply(): Promise<bigint>;
};

const wait = async (delayMs: number) =>
  await new Promise((resolve) => setTimeout(resolve, delayMs));

const getRequiredValue = <T>(value: T | undefined, label: string): T => {
  if (value === undefined) {
    throw new Error(`Missing required value: ${label}`);
  }

  return value;
};

const verifyProjectToken = async (
  contractAddress: string,
  constructorArgs: readonly unknown[]
) => {
  for (let attempt = 1; attempt <= 6; attempt += 1) {
    try {
      await verifyContract(
        {
          address: contractAddress,
          constructorArgs: [...constructorArgs],
          provider: "etherscan"
        },
        hre
      );

      return;
    } catch (error) {
      const message =
        error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase();

      if (message.includes("already verified")) {
        return;
      }

      if (attempt === 6) {
        throw error;
      }

      await wait(5_000);
    }
  }
};

const main = async () => {
  const configPath = getProjectTokenDeploymentConfigPathFromArgv();
  const deploymentConfig = await readProjectTokenDeploymentConfig(configPath);
  const { ethers } = await network.connect("sepolia");
  const deployer = getRequiredValue((await ethers.getSigners())[0], "deployer signer");

  const constructorArgs = [
    deploymentConfig.tokenName,
    deploymentConfig.tokenSymbol,
    BigInt(deploymentConfig.cap),
    BigInt(deploymentConfig.initialSupply),
    deploymentConfig.adminAddress,
    deploymentConfig.initialRecipient,
    deploymentConfig.mintAuthority ?? ethers.ZeroAddress
  ];

  const deployedContract = await ethers.deployContract(
    "ProjectToken",
    constructorArgs,
    deployer
  );

  const token = deployedContract as unknown as ProjectTokenContract;

  await token.waitForDeployment();

  const contractAddress = await token.getAddress();
  const deploymentTransaction = token.deploymentTransaction();

  if (!deploymentTransaction) {
    throw new Error("Could not read the deployment transaction for ProjectToken.");
  }

  const deploymentReceipt = await deploymentTransaction.wait();

  if (!deploymentReceipt) {
    throw new Error("Could not read the deployment receipt for ProjectToken.");
  }

  await verifyProjectToken(contractAddress, constructorArgs);

  const explorerUrl = `https://sepolia.etherscan.io/address/${contractAddress}`;
  const verificationUrl = `${explorerUrl}#code`;
  const projectContractId = crypto.randomUUID();

  const tokenName = await token.name();
  const tokenSymbol = await token.symbol();
  const tokenDecimals = Number(await token.decimals());
  const tokenCap = (await token.cap()).toString();
  const tokenInitialSupply = (await token.totalSupply()).toString();

  const registryRow = await recordProjectTokenDeployment({
    address: contractAddress,
    adminAddress: deploymentConfig.adminAddress,
    cap: tokenCap,
    chainId: 11155111,
    decimals: tokenDecimals,
    deployedBlockNumber: deploymentReceipt.blockNumber,
    deployerAddress: await deployer.getAddress(),
    deploymentEnvironment: "testnet",
    deploymentTxHash: deploymentTransaction.hash,
    explorerUrl,
    initialRecipient: deploymentConfig.initialRecipient,
    initialSupply: tokenInitialSupply,
    label: deploymentConfig.registryLabel,
    mintAuthority: deploymentConfig.mintAuthority,
    notes: deploymentConfig.notes,
    projectContractId,
    projectSlug: deploymentConfig.projectSlug,
    sourceContractName: "ProjectToken",
    tokenName,
    tokenSymbol,
    verificationProvider: "etherscan",
    verificationUrl,
    verifiedAt: new Date().toISOString(),
    workspaceSlug: deploymentConfig.workspaceSlug
  });

  console.info("project_token.deployment.succeeded", {
    address: contractAddress,
    deploymentTxHash: deploymentTransaction.hash,
    projectContractId: registryRow.project_contract_id,
    projectId: registryRow.project_id,
    tokenName,
    tokenSymbol,
    verificationUrl
  });
};

await main();
