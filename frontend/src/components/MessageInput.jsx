import { useRef, useState } from "react";
import { useChatStore } from "../store/useChatStore";
import { Image, Send, X } from "lucide-react";
import toast from "react-hot-toast";
import axios from "axios";

const MessageInput = () => {
  const [text, setText] = useState("");
  const [file, setFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const fileInputRef = useRef(null);
  const { sendMessage } = useChatStore();

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;

    const maxSize = 5 * 1024 * 1024;
    if (selectedFile.size > maxSize) {
      toast.error("File size must be under 5MB");
      return;
    }

    setFile(selectedFile);

    if (selectedFile.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFilePreview(reader.result);
      };
      reader.readAsDataURL(selectedFile);
    } else if (selectedFile.type === "application/pdf") {
      setFilePreview("PDF selected");
    } else {
      toast.error("Only images or PDFs allowed");
      return;
    }
  };

  const removeFile = () => {
    setFile(null);
    setFilePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const uploadToCloudinary = async () => {
    if (!file) return null;
  
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", "new_one"); // 👈 using your unsigned preset
  
    const resourceType = file.type === "application/pdf" ? "raw" : "image";
  
    const response = await axios.post(
      `https://api.cloudinary.com/v1_1/dht9t8zye/${resourceType}/upload`,
      formData
    );
  
    return response.data.secure_url;
  };
  

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!text.trim() && !file) return;
  
    try {
      let uploadedUrl = null;
      let fileName = null;
  
      if (file) {
        uploadedUrl = await uploadToCloudinary();
        fileName = file.name; // ✅ Capture the original filename
      }
  
      await sendMessage({
        text: text.trim(),
        image: uploadedUrl,
        filename: fileName, // ✅ Include filename in the message
      });
  
      setText("");
      removeFile();
    } catch (error) {
      console.error("Failed to send message:", error);
      toast.error("Failed to send message.");
    }
  };
  

  return (
    <div className="p-4 w-full">
      {/* File Preview */}
      {filePreview && (
        <div className="mb-3 flex items-center gap-2">
          <div className="relative">
            {file.type === "application/pdf" ? (
              <div className="w-32 h-20 flex items-center justify-center bg-zinc-800 text-white border border-zinc-700 rounded-lg">
                PDF Selected
              </div>
            ) : (
              <img
                src={filePreview}
                alt="Preview"
                className="w-20 h-20 object-cover rounded-lg border border-zinc-700"
              />
            )}
            <button
              onClick={removeFile}
              className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-base-300 flex items-center justify-center"
              type="button"
            >
              <X className="size-3" />
            </button>
          </div>
        </div>
      )}

      {/* Input Form */}
      <form onSubmit={handleSendMessage} className="flex items-center gap-2">
        <div className="flex-1 flex gap-2">
          <input
            type="text"
            className="w-full input input-bordered rounded-lg input-sm sm:input-md"
            placeholder="Type a message..."
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
          <input
            type="file"
            accept="image/*,application/pdf"
            className="hidden"
            ref={fileInputRef}
            onChange={handleFileChange}
          />

          <button
            type="button"
            className={`hidden sm:flex btn btn-circle ${filePreview ? "text-emerald-500" : "text-zinc-400"}`}
            onClick={() => fileInputRef.current?.click()}
          >
            <Image size={20} />
          </button>
        </div>
        <button
          type="submit"
          className="btn btn-sm btn-circle"
          disabled={!text.trim() && !file}
        >
          <Send size={22} />
        </button>
      </form>
    </div>
  );
};

export default MessageInput;
