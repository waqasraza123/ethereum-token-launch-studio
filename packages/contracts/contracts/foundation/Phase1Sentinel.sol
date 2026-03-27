// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

contract Phase1Sentinel {
  error Phase1SentinelLabelEmpty();

  event Pulse(address indexed caller, string message, uint256 pulseCount);

  string private _label;
  uint256 private _pulseCount;

  constructor(string memory initialLabel) {
    if (bytes(initialLabel).length == 0) {
      revert Phase1SentinelLabelEmpty();
    }

    _label = initialLabel;
  }

  function label() external view returns (string memory) {
    return _label;
  }

  function pulseCount() external view returns (uint256) {
    return _pulseCount;
  }

  function pulse(string calldata message) external {
    unchecked {
      _pulseCount += 1;
    }

    emit Pulse(msg.sender, message, _pulseCount);
  }
}
