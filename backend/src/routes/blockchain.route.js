import express from "express";
import { normalizeUrl, computeFileHash , getImageHashById, getIdByHash, getImageHashFromBlockChain} from "../services/blockchainService.js";
import { verifyFileIntegrity, handleStoreHash } from "../controllers/blockchain.controller.js";  
import HashRecord from "../models/HashRecord.js";

const router = express.Router();

// 🟢 GET request to fetch image hashes by address
// router.get("/get-image-hashes-by-address/:address", async (req, res) => {
//   const { address } = req.params;

//   try {
//     const hashes = await getImageHashIdByValue(address); // Adjusted based on the blockchain service
//     if (!hashes || hashes.length === 0) {
//       return res.status(404).json({ error: `No image hashes found for address ${address}` });
//     }
//     res.status(200).json({ address, imageHashes: hashes });
//   } catch (error) {
//     res.status(500).json({ error: `Failed to fetch image hashes from blockchain: ${error.message}` });
//   }
// });

// 🟢 POST request to verify file integrity
router.post("/verify", async (req, res) => {
  try {
    const { imageUrl, owner, tokenId } = req.body;

    console.log("Received data:", { imageUrl, owner, tokenId }); // Debugging line

    if (!imageUrl || !owner || !tokenId) {
      return res.status(400).json({ message: "Missing required fields." });
    }

    const normalizedUrl = normalizeUrl(imageUrl);
    if (!normalizedUrl) {
      return res.status(400).json({ message: "Invalid image URL provided." });
    }
     
    const computedHash = await computeFileHash(normalizedUrl);
    console.log("Computed Hash:", computedHash); // Debugging line
    //const formattedComputedHash = computedHash;


    const storedHash = await getImageHashFromBlockChain(imageUrl);
    if (!storedHash) {
      return res.status(404).json({ message: "Hash not found in blockchain." });
    }
   // const storedHash = computeFileHash(normalizedUrl)

    if (computedHash === storedHash) {
      return res.json({ message: "File verified successfully!" });
    } else {
      return res.status(400).json({ message: "Failed" });
    }

  } catch (error) {
    console.error("Error verifying file:", error); // Debugging line
    res.status(500).json({ message: "Verification Failed. Try Again" });
  }
});

// 🟢 POST request to store hash
router.post('/store-hash', handleStoreHash);

// 🟢 GET request to fetch hash by ID
router.get("/get-hash/:id", async (req, res) => {
  try {
    const requestedId = req.params.id;
    console.log("📥 Received ID for query:", requestedId, typeof requestedId);

    // Convert to a format that matches MongoDB storage
    const record = await HashRecord.findOne({ id: requestedId });

    if (!record) {
      console.log("❌ Hash not found in database for ID:", requestedId);
      return res.status(404).json({ error: "Hash not found" });
    }

    console.log("✅ Found record:", record);
    res.json(record);
  } catch (error) {
    console.error("🚨 Server Error:", error);
    res.status(500).json({ error: "Server Error" });
  }
});

export default router;
