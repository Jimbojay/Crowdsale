import { useEffect, useState } from 'react';
import { Container } from 'react-bootstrap';
import { ethers } from 'ethers'

// Components
import Navigation from './Navigation';
import Buy from'./Buy';

import Info from './Info';
import Progress from './Progress';
import Loading from './Loading';

// Artifacts
import CROWDSALE_ABI from '../abis/Crowdsale.json';
import TOKEN_ABI from '../abis/Token.json';

//Config
import config from '../Config.json';

function App() {
  const [provider, setProvider] = useState(null)
  const [crowdsale, setCrowdsale] = useState(null)

  const [account, setAccount] = useState(null)
  const [accountBalance, setAccountBalance] = useState(0)

  const [price, setPrice] = useState(0)
  const [maxTokens, setMaxTokens] = useState(0)
  const [tokensSold, setTokensSold] = useState(0)

  const [metamaskLocked, setMetamaskLocked] = useState(false);

  const [isLoading, setIsLoading] = useState(true)

  const loadBlockchainData = async () => {
    // Intiantiate provider
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    setProvider(provider);

    // Intiantiate contracts
    const token = new ethers.Contract(config[31337].token.address , TOKEN_ABI, provider);
    const crowdsale = new ethers.Contract(config[31337].crowdsale.address, CROWDSALE_ABI, provider);
    setCrowdsale(crowdsale);

    // Fetch account

    // try {
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      console.log(accounts)
      const account = ethers.utils.getAddress(accounts[0]);
      setAccount(account);
    
    // } catch {
    //   window.alert('Install and unlock metamask')
    //   return;
    // }

    

    // Fetch account balance
    const accountBalance = ethers.utils.formatUnits(await token.balanceOf(account), 18)
    setAccountBalance(accountBalance)

    //Fetch price
    const price = ethers.utils.formatUnits(await crowdsale.price(), 18)
    setPrice(price)

    //Fetch max tokens
    const maxTokens = ethers.utils.formatUnits(await crowdsale.maxTokens(), 18)
    setMaxTokens(maxTokens)

    //Fetch tokens sold
    const tokensSold = ethers.utils.formatUnits(await crowdsale.tokensSold(), 18)
    setTokensSold(tokensSold)


    setIsLoading(false)

  }



  useEffect(() => {
    if (isLoading) {
      loadBlockchainData()
    }
  }, [isLoading])
  


  return (
    <Container>
      <Navigation />

      <h1 className='my=4 text-center'>Introducing DApp Token! </h1>

      {metamaskLocked ? (
        <>
          <p className='text-center'>MetaMask is locked. Please unlock it and click the button below to retry.</p>
          <button onClick={loadBlockchainData}>Retry Connection</button>
        </>
      ) : isLoading ? (
        <Loading />
      ) : (
        <>
          <p className='text-center'><strong>Current Price: </strong>{price} ETH</p>
          <Buy provider={provider} price={price} crowdsale={crowdsale} setIsLoading={setIsLoading} />
          <Progress maxTokens={maxTokens} tokensSold={tokensSold} />
        </>
      )}

      <hr />
      {account && (
        <Info account={account} accountBalance={accountBalance} />
      )}
    </Container>
  );

}

export default App;
