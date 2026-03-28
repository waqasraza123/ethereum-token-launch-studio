import assert from "node:assert/strict";
import { network } from "hardhat";

type ProjectTokenContract = {
  waitForDeployment(): Promise<unknown>;
  name(): Promise<string>;
  symbol(): Promise<string>;
  totalSupply(): Promise<bigint>;
  balanceOf(address: string): Promise<bigint>;
  cap(): Promise<bigint>;
  pause(): Promise<unknown>;
  unpause(): Promise<unknown>;
  mint(address: string, amount: bigint): Promise<unknown>;
  transfer(address: string, amount: bigint): Promise<unknown>;
  connect(runner: unknown): ProjectTokenContract;
};

const getRequiredValue = <T>(value: T | undefined, label: string): T => {
  if (value === undefined) {
    throw new Error(`Missing required value: ${label}`);
  }

  return value;
};

describe("ProjectToken", function () {
  it("deploys with metadata initial supply and expected recipient balance", async function () {
    const { ethers } = await network.connect("hardhatMainnet");
    const signers = await ethers.getSigners();
    const admin = getRequiredValue(signers[0], "admin signer");
    const recipient = getRequiredValue(signers[1], "recipient signer");

    const deployedContract = await ethers.deployContract("ProjectToken", [
      "Alpha Token",
      "ALPHA",
      1_000n,
      400n,
      await admin.getAddress(),
      await recipient.getAddress(),
      ethers.ZeroAddress
    ]);

    const token = deployedContract as unknown as ProjectTokenContract;

    await token.waitForDeployment();

    assert.equal(await token.name(), "Alpha Token");
    assert.equal(await token.symbol(), "ALPHA");
    assert.equal((await token.totalSupply()).toString(), "400");
    assert.equal((await token.balanceOf(await recipient.getAddress())).toString(), "400");
    assert.equal((await token.cap()).toString(), "1000");
  });

  it("blocks transfers while paused and restores them after unpause", async function () {
    const { ethers } = await network.connect("hardhatMainnet");
    const signers = await ethers.getSigners();
    const admin = getRequiredValue(signers[0], "admin signer");
    const recipient = getRequiredValue(signers[1], "recipient signer");
    const other = getRequiredValue(signers[2], "other signer");

    const deployedContract = await ethers.deployContract("ProjectToken", [
      "Alpha Token",
      "ALPHA",
      1_000n,
      400n,
      await admin.getAddress(),
      await recipient.getAddress(),
      ethers.ZeroAddress
    ]);

    const token = deployedContract as unknown as ProjectTokenContract;

    await token.waitForDeployment();

    await token.pause();

    await assert.rejects(
      token.connect(recipient).transfer(await other.getAddress(), 1n)
    );

    await token.unpause();
    await token.connect(recipient).transfer(await other.getAddress(), 1n);

    assert.equal((await token.balanceOf(await other.getAddress())).toString(), "1");
  });

  it("allows only the mint authority to mint and still enforces the cap", async function () {
    const { ethers } = await network.connect("hardhatMainnet");
    const signers = await ethers.getSigners();
    const admin = getRequiredValue(signers[0], "admin signer");
    const recipient = getRequiredValue(signers[1], "recipient signer");
    const mintAuthority = getRequiredValue(signers[2], "mint authority signer");
    const other = getRequiredValue(signers[3], "other signer");

    const deployedContract = await ethers.deployContract("ProjectToken", [
      "Alpha Token",
      "ALPHA",
      1_000n,
      900n,
      await admin.getAddress(),
      await recipient.getAddress(),
      await mintAuthority.getAddress()
    ]);

    const token = deployedContract as unknown as ProjectTokenContract;

    await token.waitForDeployment();

    await token.connect(mintAuthority).mint(await recipient.getAddress(), 100n);

    assert.equal((await token.totalSupply()).toString(), "1000");

    await assert.rejects(
      token.connect(mintAuthority).mint(await recipient.getAddress(), 1n)
    );

    await assert.rejects(
      token.connect(other).mint(await recipient.getAddress(), 1n)
    );
  });
});
