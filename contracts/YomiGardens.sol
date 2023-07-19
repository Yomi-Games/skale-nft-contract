// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import "@openzeppelin/contracts-upgradeable/token/common/ERC2981Upgradeable.sol";

import "@openzeppelin/contracts-upgradeable/utils/StringsUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/math/SafeMathUpgradeable.sol";

import "@openzeppelin/contracts-upgradeable/token/ERC721/ERC721Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC721/IERC721Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC721/extensions/ERC721EnumerableUpgradeable.sol";

import "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";

import "@openzeppelin/contracts-upgradeable/token/ERC721/extensions/ERC721BurnableUpgradeable.sol";

import "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";

import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";

//proxy management system part 1 start======================================================
contract OwnableDelegateProxy {}

/**
 * Used to delegate ownership of a contract to another address, to save on unneeded transactions to approve contract use for users
 */
contract ProxyRegistry {
    mapping(address => OwnableDelegateProxy) public proxies;
}
//proxy management system part 1 end======================================================

// contract YomiGardens is
//     Initializable,
//     ERC721Upgradeable,
//     ERC721EnumerableUpgradeable,
//     PausableUpgradeable,
//     OwnableUpgradeable,
//     ERC2981Upgradeable,
//     ERC721BurnableUpgradeable,
//     ReentrancyGuardUpgradeable,
//     UUPSUpgradeable
// {

contract YomiGardens is Initializable, ERC721Upgradeable, ERC721EnumerableUpgradeable, PausableUpgradeable, OwnableUpgradeable, ERC2981Upgradeable, ERC721BurnableUpgradeable, UUPSUpgradeable, ReentrancyGuardUpgradeable {
    
    using SafeMathUpgradeable for uint256;

    // Used to send royalties
    address public receiverAddress;

    string public baseTokenURI;

    uint96 public royalty;

    mapping (address => bool) public allowedMarketplaces;
    mapping (address => bool) public managers;

    //proxy management system part 2 start======================================================

    // Mapping from token ID to approved proxy address
    mapping(address => bool) public proxyToApprove;
    address[] public includedProxies;

    //proxy management system part 2 end======================================================
    
    modifier onlyManagers {
      require(managers[msg.sender] == true);
      _;
   }

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(string calldata _name, string calldata _symbol, string calldata _baseUri, address _recAdd, uint96 _royalty, address _firstManager) public initializer {
        __ERC721_init(_name, _symbol);
        __ERC721Enumerable_init();
        __Pausable_init();
        __Ownable_init();
        __ERC721Burnable_init();
        __UUPSUpgradeable_init();
        __ReentrancyGuard_init();

        setBaseURI(_baseUri);
        receiverAddress = _recAdd;
        royalty = _royalty;
        managers[address(_firstManager)] = true;
        
        _setDefaultRoyalty(receiverAddress, royalty); 
        //I think this is setting it at 5% and the receiver to be the owner of the contract
    }

    //UUPS module required by openZ — Stops unauthorized upgrades
    function _authorizeUpgrade(address) internal override onlyOwner {

    }

    function updateRoyalty(uint96 _royalty) public onlyOwner {
        royalty = _royalty;
    }

    function setReceiverAddress(address _receiverAddress) external onlyOwner {
        receiverAddress = _receiverAddress;
    }

    /**
     * Update the base token URI
     */
    function setBaseURI(string calldata _newBaseURI) public onlyOwner {
        baseTokenURI = _newBaseURI;
    }
    function _baseURI() internal view virtual override returns (string memory) {
        return baseTokenURI;
    }

    function pause() public onlyManagers {
        _pause();
    }

    function unpause() public onlyManagers {
        _unpause();
    }

    function safeMint(address to, uint256 tokenId) public onlyManagers {
        _safeMint(to, tokenId);
    }

    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 tokenId,
        uint256 batchSize
    )
        internal
        override(ERC721Upgradeable, ERC721EnumerableUpgradeable)
        whenNotPaused
    {
        super._beforeTokenTransfer(from, to, tokenId, batchSize);
    }

    // The following functions are overrides required by Solidity.

    function supportsInterface(
        bytes4 interfaceId
    )
        public
        view
        override(
            ERC721Upgradeable,
            ERC721EnumerableUpgradeable,
            ERC2981Upgradeable
        )
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }

    /**
     * @dev See {IERC165-royaltyInfo}.
     */
    function royaltyInfo(uint256 _tokenId, uint256 _salePrice) public view virtual override returns (address, uint256) {
        require(_exists(_tokenId), "Nonexistent token");

        return (receiverAddress, SafeMathUpgradeable.div(SafeMathUpgradeable.mul(_salePrice, royalty), 100));
    }

    function withdrawMoney() external onlyOwner nonReentrant {
      (bool success, ) = msg.sender.call{value: address(this).balance}("");
      require(success, "Transfer failed.");
    }

    /**
     * Returns all the token ids owned by a given address
     */
    function ownedTokensByAddress(address owner) external view returns (uint256[] memory) {
        uint256 totalTokensOwned = balanceOf(owner);
        uint256[] memory allTokenIds = new uint256[](totalTokensOwned);
        for (uint256 i = 0; i < totalTokensOwned; i++) {
            allTokenIds[i] = (tokenOfOwnerByIndex(owner, i));
        }
        return allTokenIds;
    }

    function setManager(address _manager, bool _permission) public onlyManagers {
        managers[_manager] = _permission;
    }

    //proxy management system part 3 start======================================================

    //add to includedProxies
    function addApprovedProxy(address _newAddress) external onlyOwner() {
       includedProxies.push(_newAddress);
    }

    //remove from includedProxies
    //should probably just call flipProxyState
    function removeApprovedProxyIndex(uint index) external onlyOwner() {
        require(index < includedProxies.length, "Array does not have this index");

        for (uint i = index; i < includedProxies.length - 1; i++){
             includedProxies[i] = includedProxies[i+1];
        }
        includedProxies.pop();
    }

    /**
     * Override isApprovedForAll to allowlist user's OpenSea proxy accounts to enable gas-less listings.
     * and In addition, you can add other Proxy Approvals in the future.
     * Perhaps, you can skip the approval tx for future NFT Marketplaces (coinbase, kraken) or games.
     * This safeguards the collection for integrability.
     */
    function isApprovedForAll(address owner, address operator)
        public
        view
        override(ERC721Upgradeable, IERC721Upgradeable)
        returns (bool)
    {
        for (uint256 i = 0; i < includedProxies.length; i++) {
          address currentProxy = includedProxies[i];
          ProxyRegistry proxyRegistry = ProxyRegistry(currentProxy);
          if (
              proxyToApprove[currentProxy] &&
              address(proxyRegistry.proxies(owner)) == operator
          ) {
              return true;
          }
        }
        return super.isApprovedForAll(owner, operator);
    }

    /**
     * Function to disable gasless listings for security in case
     * opensea or other contracts ever shut down or are compromised
     */
    function flipProxyState(address proxyAddress) public onlyOwner {
        proxyToApprove[proxyAddress] = !proxyToApprove[proxyAddress];
    }
    //proxy management system part 3 end======================================================

    //marketplace filter code start======================================================
    function approve(address to, uint256 id) public virtual override(ERC721Upgradeable, IERC721Upgradeable) {
        require(allowedMarketplaces[to], "Invalid marketplace, not allowed");
        super.approve(to, id);
    }

    function setApprovalForAll(address operator, bool approved) public virtual override(ERC721Upgradeable, IERC721Upgradeable) {
        require(allowedMarketplaces[operator], "Invalid marketplace, not allowed");
        super.setApprovalForAll(operator, approved);
    }

    function setAllowedMarketplace(address marketplace, bool allowed) public onlyOwner {
        allowedMarketplaces[marketplace] = allowed;
    }
    //marketplace filter code end======================================================
}
