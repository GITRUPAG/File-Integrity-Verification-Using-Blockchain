import React, { useState } from "react";
import { getStoredHash } from "../lib/blockchainService";
import crypto from "crypto-browserify"; // Use crypto for hashing

export default function FileVerification() {
  const [file, setFile] = useState(null);
  const [fileId, setFileId] = useState("");
  const [verificationResult, setVerificationResult] = useState(null);

  // Function to generate SHA256 hash of the file
  const generateFileHash = async (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const fileBuffer = Buffer.from(event.target.result);
        const hash = crypto.createHash("sha256").update(fileBuffer).digest("hex");
        resolve(hash);
      };
      reader.onerror = (error) => reject(error);
      reader.readAsArrayBuffer(file);
    });
  };

  const handleVerify = async () => {
    try {
      if (!file || !fileId) {
        setVerificationResult({ error: "Please select a file and enter a file ID." });
        return;
      }

      // Generate hash of the uploaded file
      const computedHash = await generateFileHash(file);
      console.log("Computed Hash:", computedHash);

      // Fetch the stored hash from blockchain
      const storedHash = await getStoredHash(fileId);
      console.log("Stored Hash:", storedHash);

      // Compare hashes
      const verified = computedHash === storedHash;
      setVerificationResult({
        verified,
        message: verified ? "✅ File integrity verified!" : "❌ File has been tampered with!",
      });
    } catch (error) {
      console.error("Verification failed:", error);
      setVerificationResult({ error: "Verification failed. Please try again." });
    }
  };

  return (
    <div>
      <h2>File Integrity Verification</h2>
      <input
        type="file"
        onChange={(e) => setFile(e.target.files[0])}
      />
      <input
        type="text"
        placeholder="File ID"
        value={fileId}
        onChange={(e) => setFileId(e.target.value)}
      />
      <button onClick={handleVerify}>Verify File Integrity</button>

      {verificationResult && (
        <div>
          <p>{verificationResult.verified ? "✅ File integrity verified!" : "❌ File has been tampered with!"}</p>
          <p>{verificationResult.message}</p>
        </div>
      )}
    </div>
  );
}
