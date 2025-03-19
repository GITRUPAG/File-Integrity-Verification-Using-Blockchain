import { ethers } from 'ethers'; // No longer needed for hashing since we are using crypto
import contractABI from "../../artifacts/contracts/ImageHashStorage.sol/ImageHashStorage.json" assert { type: "json" };
import dotenv from "dotenv";
import HashRecord from "../models/HashRecord.js"; // Assuming HashRecord is already imported
import crypto from 'crypto'; // Import Node.js crypto module

dotenv.config();

// ✅ Connect to Hardhat Local Blockchain
const provider = new ethers.JsonRpcProvider("http://127.0.0.1:8545");

// ✅ Use a Private Key from Hardhat Node
const privateKey = "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"; // Replace if needed
const wallet = new ethers.Wallet(privateKey, provider);

// ✅ Deployed Contract Address
const contractAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3"; // Replace if redeployed

// ✅ Contract Instance
const contract = new ethers.Contract(contractAddress, contractABI.abi, wallet);

/**
 * ✅ Normalize the URL to ensure consistency (lowercase, no trailing slash)
 * @param {string} imageUrl - The image URL to normalize
 * @returns {string} - The normalized URL
 */
export const normalizeUrl = (imageUrl) => {
    try {
        if (!imageUrl || typeof imageUrl !== "string") {
            throw new Error(`Invalid imageUrl: ${imageUrl}`);
        }

        // Ensure the URL has a protocol
        const formattedUrl = imageUrl.startsWith("http") ? imageUrl : `https://${imageUrl}`;
        const parsedUrl = new URL(formattedUrl);

        // Remove 'image/upload/v<number>/' from Cloudinary URLs
        const pathWithoutVersion = parsedUrl.pathname.replace(/\/image\/upload\/v\d+\//, "/");

        // Construct the normalized URL: "res.cloudinary.com/dht9t8zye/jlb1sv5mlwt2rznl56en.png"
        const normalized = `${parsedUrl.hostname}${pathWithoutVersion}`;

        console.log("✅ Backend Normalized URL Before Hashing:", normalized);
        return normalized.toLowerCase();
    } catch (error) {
        console.error("❌ Error normalizing URL (Backend):", error.message);
        return ""; // Return empty string to avoid crashing
    }
};

// ✅ Test Normalization
const imageUrl = "https://res.cloudinary.com/dht9t8zye/image/upload/v1741156546/jppu66kxbz4k4i9hzet6.png";
console.log("Final Normalized URL:", normalizeUrl(imageUrl));

  /**
 * ✅ Calculate the hash of the image URL
 * @param {string} imageUrl - The image URL to hash
 * @returns {string} - The computed hash value
 */

  export const computeFileHash = async (imageUrl) => {
      try {
          const normalizedUrl = normalizeUrl(imageUrl);
          if (!normalizedUrl) {
              throw new Error("Normalized URL is empty!");
          }
  
          console.log("✅ Backend Normalized URL Before Hashing:", normalizedUrl);
  
          // Perform SHA-256 hashing using Node.js crypto module
          const hash = crypto.createHash("sha256").update(normalizedUrl, "utf-8").digest("hex");
  
          //console.log("🔹 Backend SHA-256 Hash Value:", hash);
          //console.log("🔹 Hash Length:", hash.length); // Ensure it's 64
  
          // Verify the length
          if (hash.length !== 64) {
              throw new Error(`Invalid hash length: ${hash.length}. Expected 64 hex characters.`);
          }
  
          return hash;
      } catch (error) {
          console.error("❌ Error calculating image URL hash (Backend):", error.message);
          throw new Error("Failed to calculate image URL hash");
      }
  };
    
/**
 * ✅ Store Image Hash on Blockchain
 * @param {string} imageUrl - The URL of the image to be hashed and stored
 * @returns {Promise<number|null>} - Returns hash ID if successful, `null` otherwise
 */
export const storeImageHashOnBlockchain = async (imageHash) => {
    
    try {
        console.log("🔄 Storing Image Hash:", imageHash);

        const formattedHash = formatBytes32(imageHash);
        console.log("📌 Formatted Hash (bytes32):", formattedHash);

        // Step 2: Store the Hash on the Blockchain
        const tx = await contract.storeImageHash(formattedHash, { gasLimit: 1000000 });
        console.log("⏳ Waiting for transaction confirmation...");

        const receipt = await tx.wait();
        console.log("📜 Full Transaction Receipt:", receipt);

        if (receipt.status === 1) {
            console.log("✅ Transaction successful!");

            let eventFound = false;
            for (const log of receipt.logs) {
                try {
                    const parsedLog = contract.interface.parseLog(log);
                    if (parsedLog.name === "HashStored") {
                        console.log("📌 Decoded Event:", parsedLog);
                        eventFound = true;
                    }
                } catch (err) {}
            }

            if (!eventFound) {
                console.error("⚠️ 'HashStored' event not found in logs!");
            }

            return true;
        } else {
            console.log("❌ Transaction failed!");
            return null;
        }
    } catch (error) {
        console.error("❌ Error storing image hash:", error.message);
        return null;
    }
};

//import { contract } from "./blockchain"; // Ensure contract instance is properly imported

/**
 * Retrieve the stored hash from the blockchain using the image URL.
 * @param {string} imageUrl - The image URL to retrieve the hash for.
 * @returns {Promise<string|null>} - The retrieved hash or null if not found.
 */
export const getImageHashFromBlockchain = async (imageUrl) => {
    try {
        console.log("🔹 Original Image URL:", imageUrl);

        const formattedUrl = normalizeUrl(imageUrl);
        console.log("🔹 Normalized URL:", formattedUrl);

        if (!formattedUrl) {
            throw new Error("Normalized URL is empty. Check if input URL is valid.");
        }

        // Compute hash of the normalized URL
        const computedHash = await computeFileHash(formattedUrl);
        const formattedComputedHash = "0x" + computedHash; // Ensure it matches blockchain format
        console.log("🔹 Computed Image Hash:", formattedComputedHash);

        // Retrieve ID associated with the hash from blockchain
        const id = await contract.getIdByHash(formattedComputedHash);
        console.log("🔹 Retrieved Hash ID:", id.toString());

        // Retrieve the actual stored hash from blockchain using the ID
        const storedHash = await contract.getHashById(id);
        console.log("✅ Retrieved Hash from Blockchain:", storedHash);

        return storedHash;
    } catch (error) {
        console.error("❌ Error retrieving image hash from blockchain:", error.message);
        return null;
    }
};


/**
 * ✅ Convert Hex String to `bytes32`
 * @param {string} hexString - 64-character hash (without "0x")
 * @returns {string} - 32-byte formatted `bytes32` string
 */
const formatBytes32 = (hexString) => {
    if (!/^0x/.test(hexString)) {
        hexString = "0x" + hexString;
    }
    if (hexString.length !== 66) {
        throw new Error("Invalid hash length. Expected 64 hex characters (32 bytes).");
    }
    return hexString;
};

/**
 * ✅ Fetch Stored Image Hash from Blockchain
 * @param {number} id - The ID of the stored hash
 * @returns {Promise<string|null>} - The stored hash as a hex string
 */
export const getImageHashById = async (id) => {
    try {
        // ✅ First, check MongoDB for hash
        const record = await HashRecord.findOne({ id });
        if (record) return record.hash;

        // ✅ If not in MongoDB, fetch from Blockchain
        const hash = await contract.getImageHash(id);
        return hash;
    } catch (error) {
        console.error(`❌ Error fetching hash for ID ${id}:`, error);
        return null;
    }
};

/**
 * ✅ Fetch Image Hash ID by Value
 * @param {string} imageHash - The image hash to search for
 * @returns {Promise<number|null>} - The ID of the stored hash or null if not found
 */


export const getIdByHash = async (imageHash) => {
    try {
        const record = await contract.getImageHashId(imageHash);
        console.log("📌 Hash ID:", record);
        return record ? record.toString() : null; // Convert BigNumber to string if needed
    } catch (error) {
        console.error("❌ Error fetching ID by hash:", error.message);
        return null;
    }
};

export const getImageHashFromBlockChain = async (imageUrl) => {
    try {
        console.log("🔹 Original Image URL:", imageUrl);

        const formattedUrl = normalizeUrl(imageUrl);
        console.log("🔹 Normalized URL:", formattedUrl);

        if (!formattedUrl) {
            throw new Error("Normalized URL is empty. Check if input URL is valid.");
        }

        const imageHash = await computeFileHash(formattedUrl);
        console.log("🔹 Computed Image Hash:", imageHash);

        return imageHash;
    } catch (error) {
        console.error("❌ Error fetching image hash from blockchain:", error.message);
        return null;
    }
};


