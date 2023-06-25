import { useState, useEffect } from 'react';
//import { NFTStorage, File } from 'nft.storage'
import { Buffer } from 'buffer';
import { ethers } from 'ethers';
import axios from 'axios';
import { NFTStorage,File } from 'nft.storage/dist/bundle.esm.min.js'

// Components
import Spinner from 'react-bootstrap/Spinner';
import Navigation from './components/Navigation';

// ABIs
import NFT from './abis/NFT.json'

// Config
import config from './config.json';
//import { METHODS } from 'http';
//import { constants } from 'fs/promises';

function App() {
  const [provider, setProvider] = useState(null);
  const [account, setAccount] = useState(null);
  const [name, setName]= useState('');
  const [description, setDescription]= useState('');
  const [image, setImage] = useState(null);
  const [url, setURL] = useState(null);
  const [nft, setNFT] = useState([]);
  const [message, setMessage] = useState("");
  const [isWaiting, setIsWaiting] = useState(false)


  const loadBlockchainData = async () => {
    const provider = new ethers.providers.Web3Provider(window.ethereum)
    setProvider(provider)
   const network = await provider.getNetwork()
   const chainid = await network.chainId
   console.log('chainid',chainid)
   //const chainId = Object.keys(config)[0]; //Assuming there's only one network in the config.json file
   //const networkConfig = config[chainId];
   //const nftAddress = networkConfig.nft.address;
 
   //console.log("ChainId:", chainId);
   //console.log("NFT Address:", nftAddress);
  const nft = new ethers.Contract(config[network.chainId].nft.address,NFT,provider)
  setNFT(nft)
   console.log('nft', nft)
  }

   const createImage = async()=>{
    setMessage("Generating Image...")
  const URL = `https://api-inference.huggingface.co/models/stabilityai/stable-diffusion-2`

  const response = await axios({
    url: URL,
    method: 'POST',
    headers:{'Authorization': `Bearer ${process.env.REACT_APP_HUGGING_FACE_API_KEY}`,
    Accept:'application/json',
    'Content-Type':'application/json',
    },
    data:JSON.stringify({
      inputs: description, options:{wait_for_model:true},
    }),
    responseType:'arraybuffer',
  })
  const type = response.headers['content-type']
  const data = response.data

  const base64data = Buffer.from(data).toString('base64')
  const img = `data:${type};base64,` + base64data // <-- This is so we can render it on the page
  setImage(img)

  return data
}
const uploadImage = async (imageData) => {
  setMessage("Uploading Image...")

  // Create instance to NFT.Storage
  const nftstorage = new NFTStorage({ token: process.env.REACT_APP_NFT_STORAGE_API_KEY })

  // Send request to store image
  const { ipnft } = await nftstorage.store({
    image: new File([imageData], "image.jpeg", { type: "image/jpeg" }),
    name: name,
    description: description,
  
  })

  // Save the URL
  const url = `https://ipfs.io/ipfs/${ipnft}/metadata.json`
  setURL(url)

  return url
}

const mintImage = async (tokenURI) => {
  setMessage("Waiting for Mint...")

  const signer = await provider.getSigner()
  const transaction = await nft.connect(signer).mint(tokenURI, { value: ethers.utils.parseUnits("1", "ether") })
  await transaction.wait()
}

const clickHandler = (e) => {
  setName(e.target.value);
}
const clickHandle = (e) =>{
  setDescription(e.target.value);
}
const submitHandler=async(e)=>{
  e.preventDefault()
  if (name === "" || description === "") {
    window.alert("Please provide a name and description")
    return
  }
  setIsWaiting(true)
  //call ai api
const imageData = createImage()

  //upload image to ipfs
 const url = await uploadImage(imageData)

 await mintImage(url)
 setIsWaiting(false)
 setMessage("")
}
  useEffect(() => {
    loadBlockchainData()
  }, [])

  return (
    <div>
      <Navigation account={account} setAccount={setAccount} />
      <div className='form'>
        <form onSubmit={submitHandler}>
          <input type='text' placeholder='Create a name.....'
          value={name} 
          onChange= {clickHandler}/>

          <input type='text' placeholder='Create a description....'
          value={description} 
          onChange={clickHandle}/>
          <input type='submit' value='Create and Mint'/>
        </form>
        <div className='image'>
        {!isWaiting && image ? (
          <img src={image} alt='Prompt to generate image '/>
          ) : isWaiting ? (
            <div className="image__placeholder">
              <Spinner animation="border" />
              <p>{message}</p>
            </div>
          ) : (
            <></>
          )}
          </div>
        </div>
        {!isWaiting && url && (
        <p>View&nbsp;<a href={url} target='_blank' rel='noreferrer'>Metadata</a></p> )}
    </div>
  );
}

export default App;
