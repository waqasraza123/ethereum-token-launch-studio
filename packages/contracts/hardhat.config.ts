import { configVariable, defineConfig } from "hardhat/config";
import hardhatToolboxMochaEthers from "@nomicfoundation/hardhat-toolbox-mocha-ethers";

export default defineConfig({
  plugins: [hardhatToolboxMochaEthers],
  paths: {
    artifacts: "./artifacts",
    cache: "./cache",
    sources: "./contracts",
    tests: "./test"
  },
  solidity: {
    version: "0.8.28",
    preferWasm: true,
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  },
  networks: {
    hardhatMainnet: {
      type: "edr-simulated",
      chainType: "l1"
    },
    sepolia: {
      type: "http",
      chainType: "l1",
      chainId: 11155111,
      url: configVariable("SEPOLIA_RPC_URL"),
      accounts: [configVariable("SEPOLIA_PRIVATE_KEY")]
    }
  },
  verify: {
    etherscan: {
      apiKey: configVariable("ETHERSCAN_API_KEY")
    }
  },
  test: {
    mocha: {
      timeout: 20_000
    }
  },
  typechain: {
    alwaysGenerateOverloads: false,
    outDir: "./types"
  }
});
