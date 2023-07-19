/*
    npx hardhat run --network skale_nebula_staging scripts/deploy_YomiGardens.js
        
        proxy contract
            0x70Ce48e9CE46aaa7B1ED9632A39FDedF9cc16284

    all chains
        https://staging-v3.skalenodes.com/

    docs
        skale team provided me in telegram
            https://skalelabs.notion.site/SKALE-Deployment-Track-Nebula-Onboarding-bf6813d0bfdf4f6f91fe04583aa8b28c
            
        public
            https://docs.skale.network/develop/#_get_a_skale_endpoint
*/

/*
proxy sandverse deploy
    npx hardhat run --network sandverse scripts/deploy_YomiGardens.js
    npx hardhat run --network homeverse scripts/deploy_YomiGardens.js

        0x405A9097EEEC4B5A206048551BD3648E37d11c67
            
            https://scan.sandverse.oasys.games/address/0x405A9097EEEC4B5A206048551BD3648E37d11c67

implementation sandverse contract verificaiton
    npx hardhat verify --network sandverse <>
*/

/*
https://www.chainshot.com/article/how-to-make-contracts-upgradeable
https://medium.com/deeblueangel/how-to-write-an-upgradeable-erc721-nft-contract-b0d51e74a89f

step 1
npx hardhat run --network goerli scripts/deploy_MyToken.js

step 1 output:
deployed 0x43215468cf422Fd6D3BbA99C483FccE9D691b5E9
    
    https://goerli.etherscan.io/address/0x43215468cf422Fd6D3BbA99C483FccE9D691b5E9

npx hardhat verify --network goerli 0x2374f18791c5286025314b243a447c9f7eff0566 
    https://goerli.etherscan.io/address/0x2374f18791c5286025314b243a447c9f7eff0566#code

*/  
const { utils } = require("ethers");
const { ethers, upgrades } = require("hardhat");

async function main() {
    // const baseTokenURI = "<<BASE TOKEN URL FOR THE NFT IPFS>> ";

    // Get owner/deployer's wallet address
    const [owner] = await hre.ethers.getSigners();

    // Get contract that we want to deploy
    const contractFactory = await hre.ethers.getContractFactory("YomiGardens");
	console.log("Deploying YomiGardens...");
	
	//{Replace the below with upgrade.deploy} 
    // Deploy contract with the correct constructor arguments
   // const contract = await contractFactory.deploy(baseTokenURI); 
	// const contract = await upgrades.deployProxy(contractFactory, [baseTokenURI],{
	// initializer: "initialize",
	// });
	const contract = await upgrades.deployProxy(contractFactory, ["YomiGardens", "YGAR", "https://api.yomigardens.com/api/companion_tokens/", "0x1219F779510EFbD6f6Ec7C9ceAc9970Fe2613444", 5, "0xA59137FD7C9cF5de04E9cF4770A2af5d2BD2cB89"],{
    initializer: "initialize",
    });

    // Wait for this transaction to be mined
    await contract.deployed();

    // Get contract address
    console.log("Proxy Contract deployed to:", contract.address);

    // Reserve NFTs
    // let txn = await contract.reserveNFTs();
    // await txn.wait();
    // console.log("10 NFTs have been reserved");

    // Mint 3 NFTs by sending 0.03 ether
    // txn = await contract.mintNFTs(3, { value: utils.parseEther('0.03') });
    // await txn.wait()

    // Get all token IDs of the owner
   // let tokens = await contract.tokensOfOwner(owner.address)
  //  console.log("Owner has tokens: ", tokens);

}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });