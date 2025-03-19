import HashRecord from '../models/HashRecord.js';

// Function to store the hash record
export const storeHash = async (hash, owner, tokenId) => {
  try {
    // Check if the hash and tokenId combination already exists in the database
    const existingRecord = await HashRecord.findOne({ hash, tokenId });

    if (existingRecord) {
      console.log('Hash and Token ID combination already exists:', existingRecord);
      return { message: 'Hash and Token ID combination already exists', record: existingRecord }; // Return a message and the existing record
    } else {
      // Create a new hash record
      const newHashRecord = new HashRecord({
        hash: hash,
        owner: owner,
        tokenId: tokenId,
      });

      // Save the new record to the database
      const savedRecord = await newHashRecord.save();
      console.log('Hash and Token ID saved successfully:', savedRecord);
      return savedRecord;
    }
  } catch (error) {
    console.error("❌ Error storing hash record:", error);
    throw error; // Rethrow to handle in the controller
  }
};

export default storeHash;
//Test code after MongoDB connection

// import mongoose from 'mongoose';
// //import HashRecord from './models/HashRecord.js';  // Ensure the correct path

// import HashRecord from '../models/HashRecord.js';  // Corrected path

// mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
//   .then(() => {
//     console.log('MongoDB connected successfully');
    
//     // Add a test record to ensure insertion works
//     const testHash = new HashRecord({
//       tokenId: 12345,
//       hash: 'testhash123',
//       owner: 'testOwner',
//     });
    
//     return testHash.save();
//   })
//   .then((result) => {
//     console.log('Test record saved:', result);
//   })
//   .catch((error) => {
//     console.error('MongoDB connection or record insertion error:', error);
//   });
