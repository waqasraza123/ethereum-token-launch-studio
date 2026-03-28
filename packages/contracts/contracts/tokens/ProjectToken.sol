// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Capped.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Pausable.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol";

contract ProjectToken is ERC20, ERC20Permit, ERC20Capped, ERC20Pausable, AccessControl {
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");

    error ProjectTokenAdminAddressZero();
    error ProjectTokenCapZero();
    error ProjectTokenInitialRecipientZero();
    error ProjectTokenInitialSupplyExceedsCap();

    constructor(
        string memory tokenName,
        string memory tokenSymbol,
        uint256 tokenCap,
        uint256 initialSupply,
        address adminAddress,
        address initialRecipient,
        address mintAuthority
    ) ERC20(tokenName, tokenSymbol) ERC20Permit(tokenName) ERC20Capped(tokenCap) {
        if (tokenCap == 0) {
            revert ProjectTokenCapZero();
        }

        if (adminAddress == address(0)) {
            revert ProjectTokenAdminAddressZero();
        }

        if (initialRecipient == address(0)) {
            revert ProjectTokenInitialRecipientZero();
        }

        if (initialSupply > tokenCap) {
            revert ProjectTokenInitialSupplyExceedsCap();
        }

        _grantRole(DEFAULT_ADMIN_ROLE, adminAddress);
        _grantRole(PAUSER_ROLE, adminAddress);

        if (mintAuthority != address(0)) {
            _grantRole(MINTER_ROLE, mintAuthority);
        }

        if (initialSupply > 0) {
            _mint(initialRecipient, initialSupply);
        }
    }

    function pause() external onlyRole(PAUSER_ROLE) {
        _pause();
    }

    function unpause() external onlyRole(PAUSER_ROLE) {
        _unpause();
    }

    function mint(address recipient, uint256 amount) external onlyRole(MINTER_ROLE) {
        _mint(recipient, amount);
    }

    function _update(
        address from,
        address to,
        uint256 value
    ) internal override(ERC20, ERC20Capped, ERC20Pausable) {
        super._update(from, to, value);
    }
}
