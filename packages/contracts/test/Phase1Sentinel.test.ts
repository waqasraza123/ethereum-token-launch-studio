import assert from "node:assert/strict";
import { network } from "hardhat";

describe("Phase1Sentinel", function () {
  it("stores the sentinel label and starts with zero pulses", async function () {
    const { ethers } = await network.connect("hardhatMainnet");
    const sentinel = await ethers.deployContract("Phase1Sentinel", ["foundation"]);
    await sentinel.waitForDeployment();

    const label = await sentinel.getFunction("label").staticCall();
    const pulseCount = await sentinel.getFunction("pulseCount").staticCall();

    assert.equal(label, "foundation");
    assert.equal(pulseCount.toString(), "0");
  });

  it("records a pulse and emits the expected sentinel event", async function () {
    const { ethers } = await network.connect("hardhatMainnet");
    const signers = await ethers.getSigners();
    const deployer = signers[0];

    if (deployer === undefined) {
      assert.fail("Expected at least one signer.");
    }

    const sentinel = await ethers.deployContract("Phase1Sentinel", ["foundation"]);
    await sentinel.waitForDeployment();

    const pulse = sentinel.getFunction("pulse");
    const pulseCount = sentinel.getFunction("pulseCount");

    const transactionResponse = await pulse("boundary-ready");
    const receipt = await transactionResponse.wait();

    if (receipt === null) {
      assert.fail("Expected a transaction receipt.");
    }

    type ParsedLog = NonNullable<ReturnType<typeof sentinel.interface.parseLog>>;
    const parsedPulseLogs: ParsedLog[] = [];

    for (const receiptLog of receipt.logs) {
      try {
        const parsedLog = sentinel.interface.parseLog(receiptLog);

        if (parsedLog !== null) {
          parsedPulseLogs.push(parsedLog);
        }
      } catch {
        continue;
      }
    }

    const parsedPulseLog = parsedPulseLogs.find((parsedLog) => parsedLog.name === "Pulse");

    if (parsedPulseLog === undefined) {
      assert.fail("Pulse event was not found in the receipt logs.");
    }

    assert.equal(parsedPulseLog.args.caller, await deployer.getAddress());
    assert.equal(parsedPulseLog.args.message, "boundary-ready");
    assert.equal(parsedPulseLog.args.pulseCount.toString(), "1");
    assert.equal((await pulseCount.staticCall()).toString(), "1");
  });
});
