import assert from "node:assert/strict";
import test from "node:test";
import { parseProjectTokenLaunchRequestFormData } from "./input.js";

test("parseProjectTokenLaunchRequestFormData parses valid launch input", () => {
  const formData = new FormData();
  formData.set("workspaceSlug", "studio-alpha");
  formData.set("currentProjectSlug", "alpha-launch");
  formData.set("registryLabel", "Alpha Token");
  formData.set("tokenName", "Alpha Token");
  formData.set("tokenSymbol", "ALPHA");
  formData.set("cap", "1000000000000000000000000");
  formData.set("initialSupply", "250000000000000000000000");
  formData.set("adminAddress", "0x1111111111111111111111111111111111111111");
  formData.set("initialRecipient", "0x1111111111111111111111111111111111111111");
  formData.set("mintAuthority", "");
  formData.set("notes", "Initial Sepolia launch");

  assert.deepEqual(parseProjectTokenLaunchRequestFormData(formData), {
    adminAddress: "0x1111111111111111111111111111111111111111",
    cap: "1000000000000000000000000",
    currentProjectSlug: "alpha-launch",
    initialRecipient: "0x1111111111111111111111111111111111111111",
    initialSupply: "250000000000000000000000",
    mintAuthority: null,
    notes: "Initial Sepolia launch",
    registryLabel: "Alpha Token",
    tokenName: "Alpha Token",
    tokenSymbol: "ALPHA",
    workspaceSlug: "studio-alpha"
  });
});

test("parseProjectTokenLaunchRequestFormData rejects supply above cap", () => {
  const formData = new FormData();
  formData.set("workspaceSlug", "studio-alpha");
  formData.set("currentProjectSlug", "alpha-launch");
  formData.set("registryLabel", "Alpha Token");
  formData.set("tokenName", "Alpha Token");
  formData.set("tokenSymbol", "ALPHA");
  formData.set("cap", "10");
  formData.set("initialSupply", "11");
  formData.set("adminAddress", "0x1111111111111111111111111111111111111111");
  formData.set("initialRecipient", "0x1111111111111111111111111111111111111111");
  formData.set("mintAuthority", "");
  formData.set("notes", "");

  assert.throws(() => parseProjectTokenLaunchRequestFormData(formData));
});
