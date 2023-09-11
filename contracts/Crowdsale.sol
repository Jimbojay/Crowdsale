//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "./Token.sol";

contract Crowdsale {
	address public owner;
	Token public token;
	uint256 public price;
	uint256 public maxTokens;
	uint256 public tokensSold;
	mapping(address => bool) public whitelist; 

	uint256 public minNumberOfTokensBuy;
	uint256 public maxNumberOfTokensBuy;

	uint256 public startTime;
	uint256 public endTime;

	event Buy(uint256 amount, address buyer);
	event Finalize(uint256 tokensSold, uint256 ethRaised);

	constructor(
		Token _token,
		uint256 _price,
		uint256 _maxTokens
	) {
		owner = msg.sender;
		token = _token;
		price = _price;
		maxTokens = _maxTokens;
		minNumberOfTokensBuy = 10;
		maxNumberOfTokensBuy = 1000;
		// startTime = Math.floor(Date.now() / 1000); // Get the current Unix timestamp
		// endTime = startTime + 3600; // Allow function execution for 1 hour
	}


    // startTime = Math.floor(Date.now() / 1000); // Get the current Unix timestamp
    // endTime = startTime + 3600; // Allow function execution for 1 hour



	modifier onlyOwner() {
		require(msg.sender == owner, 'Caller is not te owner'); 
		_;
	}

	function addToWhitelist (address whitelistAddress) public onlyOwner{
		whitelist[whitelistAddress] = true;
	}

	function removeFromWhitelist (address whitelistAddress) public onlyOwner{
		whitelist[whitelistAddress] = false;
	}

	function lookupAddressWhitelist (address whitelistAddress) public view returns (bool) {
		return whitelist[whitelistAddress];
	}

	// function setStartTime (uint256 _startTime) public onlyOwner {
	// 	startTime = _startTime;
	// }

	// function setEndTime (uint256 _endTime) public onlyOwner {
	// 	endTime = _endTime;
	// }

	receive() external payable {
		uint256 amount = msg.value / price;
		buyTokens(amount * 1e18);
	}

	function buyTokens(uint256 _amount) public payable {
		require(lookupAddressWhitelist(msg.sender), 'Caller is not whitelisted');
		require(msg.value == (_amount / 1e18) * price, 'Amount * price does not equal transaction value');

		require(_amount >= (minNumberOfTokensBuy* 1e18) , 'Minimum number of tokens to buy not reached');
		require((_amount + token.balanceOf(msg.sender)) <= (maxNumberOfTokensBuy* 1e18), 'Maximum number of tokens/contribution reached');

		// require(block.timestamp >startTime );
		// require(block.timestamp <endTime );

		require(token.balanceOf(address(this)) >= _amount, 'Insufficient amount in wallet'); 
		require(token.transfer(msg.sender, _amount),'Error during token transfer');


	
		tokensSold += _amount;

		emit Buy(_amount, msg.sender);
	}

	function setPrice(uint256 _price) public onlyOwner{
		price = _price;
	}

	function finalize() public onlyOwner {
		require(token.transfer(owner, token.balanceOf(address(this))));
		
		uint256 value  = address(this).balance;
		(bool sent, ) = owner.call{ value: value } ("");	
		require(sent);
	
		emit Finalize(tokensSold, value);
	}

}
