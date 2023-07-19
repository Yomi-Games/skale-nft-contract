import { time, loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";
import { expect } from "chai";
import { utils } from "ethers";
import { ethers, upgrades } from "hardhat";
import { abi } from "../artifacts/contracts/YomiGardens.sol/YomiGardens.json";

// txn = await contract.mintNFTs(3, { value: utils.parseEther('0.03') });
// await txn.wait()

describe("YomiGardens", function () {
  // We define a fixture to reuse the same setup in every test.
  // We use loadFixture to run this setup once, snapshot that state,
  // and reset Hardhat Network to that snapshopt in every test.
  async function deployYomiGardensFixture() {
    // Contracts are deployed using the first signer/account by default
    const [owner, otherAccount] = await ethers.getSigners();

    const contractFactory = await ethers.getContractFactory("YomiGardens");

    const proxyContract = await upgrades.deployProxy(contractFactory, ["YomiGardens", "YGAR", "https://api.yomigardens.com/api/tokens/", "0x17D76B55EFC331e83b48Fe034420b47F6aF8e6a8", 5],{
      initializer: "initialize",
      });

    // Wait for this transaction to be mined
    await proxyContract.deployed();

    const implementationAddress = await hre.upgrades.erc1967.getImplementationAddress(proxyContract.address);

    const implementationContract = new ethers.Contract(implementationAddress, abi, owner);

    return { proxyContract, implementationAddress, implementationContract, owner, otherAccount };
  }

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      const { proxyContract, owner } = await loadFixture(deployYomiGardensFixture);

      expect(await proxyContract.owner()).to.equal(owner.address);
    });

    it("Should set the right symbol", async function () {
      const { proxyContract } = await loadFixture(deployYomiGardensFixture);

      expect(await proxyContract.symbol()).to.equal("YGAR");
    });

    it("Should set the right name", async function () {
      const { proxyContract } = await loadFixture(deployYomiGardensFixture);

      expect(await proxyContract.name()).to.equal("YomiGardens");
    });
  });

  describe("transferOwnership", function () {
    it("Should change owner", async function () {
      const { proxyContract, owner, otherAccount } = await loadFixture(deployYomiGardensFixture);

      const txn = await proxyContract.transferOwnership(otherAccount.address);
      await txn.wait()

      expect(await proxyContract.owner()).to.equal(otherAccount.address);
    });
  });

  describe("managers", function () {
    it("owner should be manager", async function () {
      const { proxyContract, owner, otherAccount } = await loadFixture(deployYomiGardensFixture);

      const managerIsOwner = await proxyContract.managers(owner);

      console.log("yoyoyoyo", managerIsOwner);
      
      expect(managerIsOwner).to.equal(true);
    });
  });

  describe("safeMint", function () {
    it("mint id 1 to address and ownerOf id 1 should be that address", async function () {
      const { proxyContract, owner, otherAccount } = await loadFixture(deployYomiGardensFixture);

      const txn = await proxyContract.safeMint(otherAccount.address, 1);
      await txn.wait();

      expect(await proxyContract.ownerOf(1)).to.equal(otherAccount.address);
    });

    it("mint ids 1,2 then totalSupply should be 2", async function () {
      const { proxyContract, owner, otherAccount } = await loadFixture(deployYomiGardensFixture);

      const txn = await proxyContract.safeMint(otherAccount.address, 1);
      await txn.wait();

      const txnTwo = await proxyContract.safeMint(otherAccount.address, 2);
      await txnTwo.wait();

      expect(await proxyContract.totalSupply()).to.equal(2);
    });

    it("mint id 1 then tokenByIndex 0 should be id 1", async function () {
      const { proxyContract, owner, otherAccount } = await loadFixture(deployYomiGardensFixture);

      const txn = await proxyContract.safeMint(otherAccount.address, 1);
      await txn.wait();

      expect(await proxyContract.tokenByIndex(0)).to.equal(1);
    });

    it("mint only ids 11,22 to address then ownedTokensByAddress for that address should be ids 11 and 22", async function () {
      const { proxyContract, owner, otherAccount } = await loadFixture(deployYomiGardensFixture);

      const txn = await proxyContract.safeMint(otherAccount.address, 11);
      await txn.wait();

      const txnTwo = await proxyContract.safeMint(otherAccount.address, 22);
      await txnTwo.wait();

      const txnThree = await proxyContract.safeMint(owner.address, 33);
      await txnThree.wait();

      const ob = await proxyContract.ownedTokensByAddress(otherAccount.address);

      //array will only have two item sinside because nft id 1 and 2 belong to otherAccount address
      const idOfTokenOne = ethers.BigNumber.from(ob[0]).toNumber();
      const idOfTokenTwo = ethers.BigNumber.from(ob[1]).toNumber();

      expect(idOfTokenOne).to.equal(11) && expect(idOfTokenTwo).to.equal(22);
    });

    it("mint only id 33 to address then ownedTokensByAddress for that address should be id 33", async function () {
      const { proxyContract, owner, otherAccount } = await loadFixture(deployYomiGardensFixture);

      const txn = await proxyContract.safeMint(otherAccount.address, 11);
      await txn.wait();

      const txnTwo = await proxyContract.safeMint(otherAccount.address, 22);
      await txnTwo.wait();

      const txnThree = await proxyContract.safeMint(owner.address, 33);
      await txnThree.wait();

      const ob = await proxyContract.ownedTokensByAddress(owner.address);

      //array will only have one item inside because nft id 3 belongs to owner address
      const idOfTokenOwned = ethers.BigNumber.from(ob[0]).toNumber();

      expect(idOfTokenOwned).to.equal(33);
    });

    it("mint ids 11,22 to address then tokenOfOwnerByIndex index 0 should be id 11 and index 1 should be id 22", async function () {
      const { proxyContract, owner, otherAccount } = await loadFixture(deployYomiGardensFixture);

      const txn = await proxyContract.safeMint(otherAccount.address, 11);
      await txn.wait();

      const txnTwo = await proxyContract.safeMint(otherAccount.address, 22);
      await txnTwo.wait();

      const txnThree = await proxyContract.safeMint(owner.address, 33);
      await txnThree.wait();

      const obZero = await proxyContract.tokenOfOwnerByIndex(otherAccount.address, 0);
      const idOfTokenAtIndexZero = ethers.BigNumber.from(obZero).toNumber();

      const obOne = await proxyContract.tokenOfOwnerByIndex(otherAccount.address, 1);
      const idOfTokenAtIndexOne = ethers.BigNumber.from(obOne).toNumber();

      expect(idOfTokenAtIndexZero).to.equal(11) && expect(idOfTokenAtIndexOne).to.equal(22)
    });
  });

  describe("setBaseURI", function () {
    it("Should change baseTokenURI", async function () {
      const { proxyContract, owner, otherAccount } = await loadFixture(deployYomiGardensFixture);

      const newTokenURI = "https://api.yomigardens.com/api/tokenuri/";

      const txn = await proxyContract.setBaseURI(newTokenURI);
      await txn.wait();

      expect(await proxyContract.baseTokenURI()).to.equal(newTokenURI);
    });

    it("Should change tokenURI", async function () {
      const { proxyContract, owner, otherAccount } = await loadFixture(deployYomiGardensFixture);

      const newTokenURI = "https://api.yomigardens.com/api/tokenuri/";

      const txnOne = await proxyContract.setBaseURI(newTokenURI);
      await txnOne.wait();

      const txnTwo = await proxyContract.safeMint(otherAccount.address, 1);
      await txnTwo.wait();

      expect(await proxyContract.tokenURI(1)).to.equal(`${newTokenURI}1`);
    });
  });

  /*
  scenarios
  study the contract here

  https://goerli.etherscan.io/address/0x43215468cf422Fd6D3BbA99C483FccE9D691b5E9#writeProxyContract
  
  1.
  send eth to contract and call withdrawMoney function and see if contract has 0 and owner has the amount withdrawn
  
  2.
  see if not owner address can call withdrawMoney function
  
  3.
  adding flipping, removing proxies 

  4.
  adding flipping, removing marketplaces

  5.
  checking royalty, updating it, checking royaltyinfo   
  
  6.
  burn id 

  7. check if proxying staking contract, saves you a tx 

  */
});
