import assert from "node:assert/strict";
import test from "node:test";
import {
  normalizeContractAddress,
  parseContractAttachFormData,
  parseContractDetachFormData
} from "./input.js";

test("normalizeContractAddress lowercases and trims the address", () => {
  assert.equal(
    normalizeContractAddress("  0xABCDEFabcdefABCDEFabcdefABCDEFabcdefABCD  "),
    "0xabcdefabcdefabcdefabcdefabcdefabcdefabcd"
  );
});

test("parseContractAttachFormData parses valid contract attachment input", () => {
  const formData = new FormData();
  formData.set("workspaceSlug", "studio-alpha");
  formData.set("currentProjectSlug", "alpha-launch");
  formData.set("chainId", "11155111");
  formData.set("address", "0x1111111111111111111111111111111111111111");
  formData.set("contractKind", "project_token");
  formData.set("deploymentEnvironment", "testnet");
  formData.set("label", "Alpha Token");
  formData.set("explorerUrl", "https://sepolia.etherscan.io/address/0x1111111111111111111111111111111111111111");
  formData.set("notes", "Initial project token deployment");

  assert.deepEqual(parseContractAttachFormData(formData), {
    address: "0x1111111111111111111111111111111111111111",
    chainId: 11155111,
    contractKind: "project_token",
    currentProjectSlug: "alpha-launch",
    deploymentEnvironment: "testnet",
    explorerUrl:
      "https://sepolia.etherscan.io/address/0x1111111111111111111111111111111111111111",
    label: "Alpha Token",
    notes: "Initial project token deployment",
    workspaceSlug: "studio-alpha"
  });
});

test("parseContractDetachFormData parses valid contract detachment input", () => {
  const formData = new FormData();
  formData.set("workspaceSlug", "studio-alpha");
  formData.set("currentProjectSlug", "alpha-launch");
  formData.set("projectContractId", "40000000-0000-0000-0000-000000000001");

  assert.deepEqual(parseContractDetachFormData(formData), {
    currentProjectSlug: "alpha-launch",
    projectContractId: "40000000-0000-0000-0000-000000000001",
    workspaceSlug: "studio-alpha"
  });
});
