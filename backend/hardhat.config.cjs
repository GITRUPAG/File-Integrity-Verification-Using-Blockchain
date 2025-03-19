require("@nomicfoundation/hardhat-ethers");
require("dotenv").config();

//module.exports = {
  //solidity: "0.8.28", // Update to match your contract's version
  //networks: {
    //sepolia: {
      //url: process.env.ALCHEMY_SEPOLIA_URL,
      //accounts: [process.env.PRIVATE_KEY],
    //},
  //},
//};

module.exports = {
  solidity: {
    version: "0.8.28",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  networks: {
    localhost: {
      url: "http://127.0.0.1:8545",
    },
  },
};
