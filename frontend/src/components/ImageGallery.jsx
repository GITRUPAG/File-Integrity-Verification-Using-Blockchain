import React, { useState } from "react";
import axios from "axios";

const ImageGallery = ({ images }) => {
  const [verificationResults, setVerificationResults] = useState({});

  // Function to handle file verification
  const verifyFileIntegrity = async (filePath, fileId) => {
    try {
      const response = await axiosInstance.post("/blockchain/verify", {
        filePath,
        fileId,
      });     
      setVerificationResults((prevResults) => ({
        ...prevResults,
        [fileId]: response.data.message,
      }));
    } catch (error) {
      console.error("Error verifying file integrity:", error);
      setVerificationResults((prevResults) => ({
        ...prevResults,
        [fileId]: "Verification failed. Please try again.",
      }));
    }
  };

  return (
    <div className="image-gallery">
      {images.map((image) => (
        <div key={image.fileId} className="image-item">
          <img src={image.url} alt="Uploaded file" className="image-preview" />
          {image.isReceived && (
            <button
              onClick={() => verifyFileIntegrity(image.filePath, image.fileId)}
              className="verify-button"
            >
              Verify
            </button>
          )}
          {verificationResults[image.fileId] && (
            <p>{verificationResults[image.fileId]}</p>
          )}
        </div>
      ))}
    </div>
  );
};

export default ImageGallery;
