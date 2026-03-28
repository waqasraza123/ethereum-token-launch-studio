import { writeFile } from "node:fs/promises";
import hre, { network } from "hardhat";
import {
  getOptionalProjectTokenDeploymentResultPathFromArgv,
  getProjectTokenDeploymentConfigPathFromArgv,
  readProjectTokenDeploymentConfig
} from "../src/config/project-token-deployment.js";
import { recordProjectTokenDeployment } from "../src/lib/project-token-registry.js";

type HardhatRuntimeWithRun = typeof hre & {
  run(taskName: string, options?: Record<string, unknown>): Promise<unknown>;
};

type ProjectTokenContract = {
  getAddress(): Promise<string>;
  waitForDeployment(): Promise<unknown>;
  deploymentTransaction(): {
    hash: string;
    wait(): Promise<{ blockNumber: number } | null>;
  } | null;
  name(): Promise<string>;
  symbol(): Promise<string>;
  decimals(): Promise<bigint | number>;
  cap(): Promise<bigint>;
  totalSupply(): Promise<bigint>;
};

const hardhatRuntime = hre as HardhatRuntimeWithRun;

const wait = async (delayMs: number) =>
  await new Promise((resolve) => setTimeout(resolve, delayMs));

const verifyProjectToken = async (
  contractAddress: string,
  constructorArguments: readonly unknown[]
) => {
  for (let attempt = 1; attempt <= 6; attempt += 1) {
    try {
      await hardhatRuntime.run("verify:verify", {
        address: contractAddress,
        constructorArgs: [...constructorArguments]
      });

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
  const resultPath = getOptionalProjectTokenDeploymentResultPathFromArgv();
  const deploymentConfig = await readProjectTokenDeploymentConfig(configPath);
  const { ethers } = await network.connect("sepolia");
  const signers = await ethers.getSigners();
  const deployer = signers[0];

  if (!deployer) {
    throw new Error("Could not resolve the Sepolia deployer signer.");
  }

  const constructorArguments: unknown[] = [
    deploymentConfig.tokenName,
    deploymentConfig.tokenSymbol,
    BigInt(deploymentConfig.cap),
    BigInt(deploymentConfig.initialSupply),
    deploymentConfig.adminAddress,
    deploymentConfig.initialRecipient,
    deploymentConfig.mintAuthority ?? ethers.ZeroAddress
  ];

  const deployedContract = await ethers.deployContract("ProjectToken", constructorArguments);
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

  await verifyProjectToken(contractAddress, constructorArguments);

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

  const result = {
    address: contractAddress,
    deploymentTxHash: deploymentTransaction.hash,
    projectContractId: registryRow.project_contract_id,
    projectId: registryRow.project_id,
    tokenName,
    tokenSymbol,
    verificationUrl
  };

  if (resultPath) {
    await writeFile(resultPath, JSON.stringify(result, null, 2) + "\n", "utf8");
  }

  console.info("project_token.deployment.succeeded", result);
};

await main();
