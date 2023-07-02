require('@nomiclabs/hardhat-ethers');
require('dotenv').config();



module.exports = {
  networks: {
    goerli: {
      url: 'https://eth-goerli.g.alchemy.com/v2/0Hh92ZeKBOAs8L8mJhat4cTZEWNUZUgf',
      chainId: 5,
      accounts: ['0af51be5b479c160caebd52746699bf24b8a734f7f75f85a1430bd405596bb3d'],
      allowUnlimitedContractSize: true,
    },
  },
  solidity: '0.8.17',
};
