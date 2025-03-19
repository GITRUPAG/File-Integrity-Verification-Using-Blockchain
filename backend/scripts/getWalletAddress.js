import dotenv from "dotenv";
dotenv.config();

import { ethers } from "ethers";

const privateKey = process.env.PRIVATE_KEY;
if (!privateKey) {
  console.error("PRIVATE_KEY is not set in .env file!");
  process.exit(1);
}

const wallet = new ethers.Wallet(privateKey);

console.log("Private Key:", process.env.PRIVATE_KEY);
console.log("Your wallet address:", wallet.address);
