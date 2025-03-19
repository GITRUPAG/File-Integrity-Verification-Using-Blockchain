import { ethers } from "ethers";

// Connect to Sepolia testnet
const provider = new ethers.JsonRpcProvider(process.env.SEPOLIA_RPC_URL);
const contract = new ethers.Contract(
  process.env.CONTRACT_ADDRESS,
  ABI,
  provider
);

export const getStoredFileHashFromBlockchain = async (fileId) => {
  try {
    const storedHash = await contract.getFileHash(fileId);
    return storedHash;
  } catch (error) {
    console.error("Error fetching file hash from blockchain:", error);
    throw error;
  }
};
