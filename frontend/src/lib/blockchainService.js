import Web3 from "web3";
import contractABI from "./contractABI.json"; // Ensure you have the correct ABI file

const web3 = new Web3("http://127.0.0.1:8545"); // Connects to Hardhat local node
const contractAddress = "0x5fbdb2315678afecb367f032d93f642f64180aa3"; // Replace with actual contract address

const contract = new web3.eth.Contract(contractABI, contractAddress);

// Function to fetch stored hash from blockchain
export async function getStoredHash(fileId) {
  try {
    const storedHash = await contract.methods.getImageHash(fileId).call();
    console.log(`Retrieved hash from blockchain: ${storedHash}`);
    return storedHash;
  } catch (error) {
    console.error("Error fetching stored hash:", error);
    throw new Error("Failed to fetch stored hash from blockchain.");
  }
}
