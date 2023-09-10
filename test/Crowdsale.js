const { expect } = require('chai')
const { ethers } = require('hardhat')

const tokens = (n) => {
	return ethers.utils.parseUnits(n.toString(), 'ether')
}

const ether = tokens

describe('Crowdsale', () => {
	let crowdsale, token, accounts, deployer, user1
	
	beforeEach(async () => {
		// Load contracts
		const Crowdsale = await ethers.getContractFactory('Crowdsale')
		const Token = await ethers.getContractFactory('Token')

		//Deploy tokens
		token = await Token.deploy('Dapp University', 'DAPP', '1000000')

		//Configure accounts
		accounts = await ethers.getSigners()
		deployer = accounts[0]
		user1 = accounts[1]

		//Deploy Crowdsale
		crowdsale = await Crowdsale.deploy(token.address, ether(1), '1000000')

		//Sent tokens to crowdsale
		let transaction = await token.connect(deployer).transfer(crowdsale.address, tokens(1000000))
		await transaction.wait()
	})

	describe('Deployment', () => {

		it('sends tokens to the Crowdsale contract', async () => {
			expect(await token.balanceOf(crowdsale.address)).to.eq(tokens(1000000))
		})

		it('returns the price', async () => {
			expect(await crowdsale.price()).to.eq(ether(1))
		})

		it('returns token address', async () =>{
			expect(await crowdsale.token()).to.eq(token.address)
		})

	})

	describe('Buying tokens', () => {
		let transaction, result
		let amount = tokens(10)
		let amountETH = (amount * 1).toString()

		describe('Success', () => {
			beforeEach(async () => {
				// ethBalanceUser1Pre = (await ethers.provider.getBalance(user1.address)).toString()
				transaction = await crowdsale.connect(deployer).addToWhitelist(user1.address)
				result = await transaction.wait()

				transaction = await crowdsale.connect(user1).buyTokens(amount, { value: ether(10) })
				result = await transaction.wait()
			})

			// it('updates ether balance of the user', async () =>{
			// 	expect(await ethers.provider.getBalance(user1.address)).to.eq((ethBalanceUser1Pre - amountETH).toString())
			// })

			it('transfers tokens', async () =>{
				expect(await token.balanceOf(crowdsale.address)).to.eq(tokens(999990))
				expect(await token.balanceOf(user1.address)).to.eq(amount)
			})

			it('updates contracts ether balance', async () =>{
				expect(await ethers.provider.getBalance(crowdsale.address)).to.eq(amountETH)
			})

			it('updates tokensSold', async () =>{
				expect(await crowdsale.tokensSold()).to.eq(amount)
			})

			it('emits a buy event', async () =>{
				await expect(transaction).to.emit(crowdsale, 'Buy')
					.withArgs(amount, user1.address)
			})

		})

		describe('Failure', () => {
			it('rejects insufficient ETH', async () =>{
				await expect(crowdsale.connect(user1).buyTokens(tokens(10), { value: 0 })).to.be.reverted;
			})

			it('rejects non-whitelisted user', async () =>{
				await expect(crowdsale.connect(deployer).buyTokens(amount, { value: ether(10)})).to.be.reverted;
			})

		})

	})

	describe('Sending ETH', () => {
		let transaction, result
		let amount = tokens(10)
		let amountETH = (amount * 1).toString()

		describe('Success', () => {
			beforeEach(async () => {
				transaction = await crowdsale.connect(deployer).addToWhitelist(user1.address)
				result = await transaction.wait()

				// ethBalanceUser1Pre = (await ethers.provider.getBalance(user1.address)).toString()
				transaction = await user1.sendTransaction({ to: crowdsale.address, value: amount })
				result = await transaction.wait()
			})

			it('updates contracts ether balance', async () =>{
				expect(await ethers.provider.getBalance(crowdsale.address)).to.eq(amount)
			})

			it('updates contracts token balance', async () =>{
				expect(await token.balanceOf(user1.address)).to.eq(amount)
			})

		})		
	})

	describe('Finalize the sale', () =>{
		let transaction, result
		let amount = tokens(10)
		let value = ether(10)

		describe('Success', () =>{
			beforeEach(async() => {
				transaction = await crowdsale.connect(deployer).addToWhitelist(user1.address)
				result = await transaction.wait()


				transaction = await crowdsale.connect(user1).buyTokens(amount, { value: value })
				result = await transaction.wait()

				transaction = await crowdsale.connect(deployer).finalize()
				result = await transaction.wait()
			})

			it('transfers remaining tokens to owner', async () => {
				expect(await token.balanceOf(crowdsale.address)).to.eq(0)
				expect(await token.balanceOf(deployer.address)).to.eq(tokens(999990))
			})

			it('transfers ETH balance to owner', async () => {
				expect(await ethers.provider.getBalance(crowdsale.address)).to.eq(tokens(0))
			})

			it('emits Finalize event', async () =>{
				await expect(transaction).to.emit(crowdsale, 'Finalize')
					.withArgs(amount, value)
			})			

		})

		describe('Failure', () =>{
			it('prevents non-owner from finalizing', async () => {
				await expect(crowdsale.connect(user1).finalize()).to.be.reverted
			})
			
		})

	})

	describe('Updating price', () => {
		let transaction, result
		let price = ether(2)

		describe('Success', () => {
			
			beforeEach(async () => {
				transaction = await crowdsale.connect(deployer).setPrice(ether(2))
				result = await transaction.wait()
			})

			it('updates the price', async () => {
				expect(await crowdsale.price()).to.be.eq(ether(2))
			})

		})

		describe('Failure', () => {

			it('prevents non-owner from updating price', async () => {
				await expect(crowdsale.connect(user1).setPrice(price)).to.be.reverted
			})
		})
	})

	describe('Whitelisting', () =>{
		describe('Success',  () => {

			beforeEach(async () => {
				transaction = await crowdsale.connect(deployer).addToWhitelist(user1.address)
				result = await transaction.wait()
			})
			
			it('correctly retuns a whitelisted address', async () => {
				expect (await crowdsale.connect(deployer).lookupAddressWhitelist(user1.address)).to.eq(true);
			})

			it('correctly retuns a non-whitelisted address', async () => {
				expect (await crowdsale.connect(deployer).lookupAddressWhitelist(deployer.address)).to.eq(false);
			})

		})

		describe('Failure', () => {
			it('reject whitelisting by non-owner', async () => {
				await expect(  crowdsale.connect(user1).addToWhitelist(user1.address)).to.be.revertedWith('caller is not te owner');
			})
			
		})

	})

})
