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
				await expect(crowdsale.connect(user1).buyTokens(tokens(10), { value: 0 })).to.be.reverted
			})

		})

	})

	describe('Sending ETH', () => {
		let transaction, result
		let amount = tokens(10)
		let amountETH = (amount * 1).toString()

		describe('Success', () => {
			beforeEach(async () => {
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

})
