import User from "../models/user.model.js";
import Message from "../models/message.model.js";

import cloudinary from "../lib/cloudinary.js";
import { getReceiverSocketId, io } from "../lib/socket.js";
import crypto from "crypto"; // Import crypto module for hashing
import { Network, Alchemy } from "alchemy-sdk";
import dotenv from "dotenv";
import { storeImageHashOnBlockchain } from "../services/blockchainService.js";
//import { getImageHashIdByValue } from "../services/blockchainService.js";
import { normalizeUrl } from "../services/blockchainService.js";
import { computeFileHash } from "../services/blockchainService.js";

dotenv.config();

// Alchemy setup
const settings = {
  apiKey: process.env.ALCHEMY_API_KEY, // Replace with your Alchemy API Key
  network: Network.ETH_SEPOLIA, // Sepolia testnet
};
const alchemy = new Alchemy(settings);

export const getUsersForSidebar = async (req, res) => {
  try {
    const loggedInUserId = req.user._id;
    const filteredUsers = await User.find({ _id: { $ne: loggedInUserId } }).select("-password");

    res.status(200).json(filteredUsers);
  } catch (error) {
    console.error("Error in getUsersForSidebar: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getMessages = async (req, res) => {
  try {
    const { id: userToChatId } = req.params;
    const myId = req.user._id;

    const messages = await Message.find({
      $or: [
        { senderId: myId, receiverId: userToChatId },
        { senderId: userToChatId, receiverId: myId },
      ],
    });

    res.status(200).json(messages);
  } catch (error) {
    console.log("Error in getMessages controller: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const sendMessage = async (req, res) => {
  try {
    const { text, image } = req.body;
    const { id: receiverId } = req.params;
    const senderId = req.user._id;

    let imageUrl;
    let imageHash;

    if (image) {

      // Upload base64 image to cloudinary
      const uploadResponse = await cloudinary.uploader.upload(image);
      imageUrl = uploadResponse.secure_url;

      const normalizedImageUrl = normalizeUrl(imageUrl);

      // Generate SHA-256 hash of the image
      imageHash = await computeFileHash(normalizedImageUrl); // Use await here!
      console.log("🔄 Storing Image Hash:", imageHash);  // Should log the plain string, not a Promise

      
      // Store hash in Sepolia blockchain 
      const blockchainSuccess = await storeImageHashOnBlockchain(imageHash);
      if (!blockchainSuccess) {
        return res.status(500).json({ error: "Failed to store image hash on blockchain" });
      }
    }

    const newMessage = new Message({
      senderId,
      receiverId,
      text,
      image: imageUrl,
      imageHash, // Store the hash of the image
    });
    await newMessage.save();

    const receiverSocketId = getReceiverSocketId(receiverId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("newMessage", newMessage);
    }

    res.status(201).json(newMessage);
  } catch (error) {
    console.log("Error in sendMessage controller: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

// export const getImageHashes = async (req, res) => {
//   const { address } = req.params;
//   try {
//     const hashes = await getImageHashIdByValue(address);
//     res.status(200).json({ hashes });
//   } catch (error) {
//     console.error("Error retrieving image hashes:", error);
//     res.status(500).json({ error: "Failed to retrieve image hashes" });
//   }
// };
