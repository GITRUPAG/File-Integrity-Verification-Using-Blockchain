//import { getImageHashById, getImageHashIdByValue } from "../services/blockchainService.js";
import { keccak256 } from "ethers"; // Import keccak256 from ethers
import fs from "fs";
import axios from "axios";
import HashRecord from "../models/HashRecord.js";
import { ethers } from "ethers";
import mongoose from "mongoose";
import storeHash from "../services/hashRecordService.js";

import dotenv from "dotenv";
dotenv.config();

// ✅ MongoDB connection setup
mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log("Connected to MongoDB"))
    .catch((error) => console.error("❌ MongoDB Connection Error:", error));

// Ensure the database connection is ready before handling requests
const isDbConnected = mongoose.connection.readyState === 1;

// Store hash in the database
export const handleStoreHash = async (req, res) => {
    try {
        const { imageUrl, owner, tokenId } = req.body; // Accept imageUrl in the request body
        console.log("Received data:", { imageUrl, owner, tokenId });

        const computedHash = calculateFileHash(imageUrl); // Hash the image URL
        const result = await storeHash.storeHash(computedHash, owner, tokenId); // Store the URL hash in the DB
        console.log("Hash record saved:", result);
        res.status(200).json({ success: true, data: result });
    } catch (error) {
        console.error('Error in handleStoreHash:', error);
        res.status(500).json({ success: false, message: 'Failed to store hash' });
    }
};

// Blockchain provider and contract setup
const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
const contractAddress = process.env.CONTRACT_ADDRESS;
const abi = [
    "function getIdByHash(bytes32) view returns (uint256)",
    "function getImageHash(uint256) view returns (bytes32)"
];
const contract = new ethers.Contract(contractAddress, abi, provider);

// Endpoint to verify image integrity
export const verifyFileIntegrity = async (req, res) => {
    let { computedHash } = req.body;

    console.log("🟡 Received request body:", req.body);

    try {
        if (!computedHash) {
            console.error("❌ Error: Computed hash must be provided.");
            return res.status(400).json({ error: "Computed hash is required." });
        }

        console.log("🔍 Computed Hash:", computedHash); // ✅ Logging computed hash

        // 🔍 Fetch the corresponding tokenId from Blockchain using the computedHash
        let tokenId;
        try {
            tokenId = await contract.getIdByHash(computedHash); // Blockchain call with computed hash
            console.log("✅ Token ID retrieved from blockchain:", tokenId);

            if (!tokenId || tokenId === 0) {
                return res.status(404).json({ error: "No tokenId found for the provided hash on the blockchain." });
            }
        } catch (error) {
            console.error("❌ Error fetching tokenId from blockchain:", error);
            return res.status(500).json({ error: "Failed to fetch tokenId from blockchain." });
        }

        // 🔍 Fetch the stored hash from Blockchain using tokenId
        let blockchainHash;
        try {
            blockchainHash = await contract.getImageHash(tokenId); // Blockchain call with tokenId
            console.log("✅ Blockchain hash:", blockchainHash);

            if (!blockchainHash || blockchainHash === ethers.ZeroHash) {
                return res.status(404).json({ error: "No hash found for verification on blockchain." });
            }
        } catch (error) {
            console.error("❌ Error fetching blockchain hash:", error);
            return res.status(500).json({ error: "Failed to fetch hash from blockchain." });
        }

        // Compare blockchain hash with computed hash
        if (blockchainHash.toLowerCase() === computedHash.toLowerCase()) {
            return res.status(200).json({ verified: true, message: "File integrity verified." });
        } else {
            return res.status(400).json({ verified: false, message: "File integrity check failed!" });
        }
    } catch (error) {
        console.error("❌ Verification Error:", error);
        return res.status(500).json({ error: "Verification process failed." });
    }
};
