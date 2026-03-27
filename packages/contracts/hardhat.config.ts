import { defineConfig } from "hardhat/config";
import hardhatToolboxMochaEthers from "@nomicfoundation/hardhat-toolbox-mocha-ethers";

export default defineConfig({
  plugins: [hardhatToolboxMochaEthers],
  paths: {
    artifacts: "./artifacts",
    cache: "./cache",
    sources: "./contracts",
    tests: {
      mocha: "./test",
    },
  },
  solidity: {
    version: "0.8.28",
    preferWasm: true,
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  networks: {
    hardhatMainnet: {
      type: "edr-simulated",
      chainType: "l1",
    },
  },
  test: {
    mocha: {
      timeout: 20_000,
    },
  },
  typechain: {
    alwaysGenerateOverloads: false,
    outDir: "./types",
  },
});
