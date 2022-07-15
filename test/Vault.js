const {
  time,
  loadFixture,
} = require("@nomicfoundation/hardhat-network-helpers");
const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");
const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Vault", function () {
  // We define a fixture to reuse the same setup in every test.
  // We use loadFixture to run this setup once, snapshot that state,
  // and reset Hardhat Network to that snapshopt in every test.
  async function deployVaultv1AndFactory() {
    // Contracts are deployed using the first signer/account by default
    const [owner, otherAccount] = await ethers.getSigners();

    const Factory = await ethers.getContractFactory("Factory");
    const Vaultv1 = await ethers.getContractFactory("Vaultv1");

    const v1 = await Vaultv1.deploy(); const factory = await
    Factory.deploy(v1.address);

    return { factory, v1, owner, otherAccount };
  }

  describe("Factory", function () {
    it("Should set the right implmentation", async function () {
      const { factory, v1 } = await loadFixture(deployVaultv1AndFactory);

      expect(v1);
      expect(await factory.getImplementation()).equal(v1.address);
    });

    it("Should allow creating a vault", async function () {
      const { factory } = await loadFixture(deployVaultv1AndFactory);

      const slot = 1; // vault slot number
      await factory.create("slot1", 100, slot);

      const vault_addr = await factory.getVault(slot)
      expect(vault_addr);
    });

    it("Should allow updating created vault", async function () {
      const { factory } = await loadFixture(deployVaultv1AndFactory);
      
      const slot = 1; // vault slot number
      await factory.create("slot1", 100, slot);

      const vault_addr = await factory.getVault(slot)
      const Vaultv1 = await ethers.getContractFactory("Vaultv1");
      const vault = await Vaultv1.attach(vault_addr);
      
      expect(await vault.name()).equal("slot1");
      expect(await vault.vaLue()).equal(100);

      await vault.down();
      expect(await vault.vaLue()).equal(99);
    });

    it("Should allow creating multiple vaults", async function () {
      const { factory } = await loadFixture(deployVaultv1AndFactory);
      
      await factory.create("slot1", 100, 1);
      await factory.create("slot2", 200, 2);

      const Vaultv1 = await ethers.getContractFactory("Vaultv1");

      const vault_1 = await Vaultv1.attach(await factory.getVault(1));
      const vault_2 = await Vaultv1.attach(await factory.getVault(2));

      expect(await vault_1.name()).equal("slot1");
      expect(await vault_2.name()).equal("slot2");
      
      expect(await vault_1.vaLue()).equal(100);
      expect(await vault_2.vaLue()).equal(200);
    });
    
  });


  describe("Beacon", function(){
    it("Should update the implementation", async function(){
      const { factory } = await loadFixture(deployVaultv1AndFactory);
      const Vaultv2 = await ethers.getContractFactory("Vaultv2");
      const v2 = await Vaultv2.deploy();
      expect(v2.address);
      
      const beacon_addr = await factory.getBeacon();
      expect(beacon_addr);

      const VaultBeacon =await ethers.getContractFactory("VaultBeacon");
      const beacon = await VaultBeacon.attach(beacon_addr);

      await beacon.update(v2.address);
      expect(await factory.getImplementation()).equal(v2.address);

      await factory.create("slot3", 300, 3);
      const vault_addr = await factory.getVault(3);
      const vault = await Vaultv2.attach(vault_addr);

      expect(await vault.vaLue()).equal(300);

      await vault.up();
      expect(await vault.vaLue()).equal(301);
    });
  });
});
