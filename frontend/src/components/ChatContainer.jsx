import { useChatStore } from "../store/useChatStore";
import { useEffect, useRef, useState, useCallback } from "react";
import { axiosInstance } from "../lib/axios";
import ChatHeader from "./ChatHeader";
import MessageInput from "./MessageInput";
import MessageSkeleton from "./skeletons/MessageSkeleton";
import { useAuthStore } from "../store/useAuthStore";
import { formatMessageTime } from "../lib/utils";
import { toast } from "react-hot-toast";

const ChatContainer = () => {
  const {
    messages,
    getMessages,
    isMessagesLoading,
    selectedUser,
    subscribeToMessages,
    unsubscribeFromMessages,
  } = useChatStore();

  const { authUser } = useAuthStore();
  const messageEndRef = useRef(null);

  const [verificationResults, setVerificationResults] = useState({});
  const [verifyingTokenId, setVerifyingTokenId] = useState(null);

  const fetchMessages = useCallback(() => getMessages(selectedUser._id), [selectedUser._id, getMessages]);
  const subscribe = useCallback(subscribeToMessages, []);
  const unsubscribe = useCallback(unsubscribeFromMessages, []);

  useEffect(() => {
    fetchMessages();
    subscribe();
    return () => unsubscribe();
  }, [fetchMessages, subscribe, unsubscribe]);

  useEffect(() => {
    if (messageEndRef.current && messages.length > 0) {
      const { scrollTop, scrollHeight, clientHeight } = messageEndRef.current.parentElement;
      const isNearBottom = scrollHeight - scrollTop - clientHeight < 150;

      if (isNearBottom) {
        messageEndRef.current.scrollIntoView({ behavior: "smooth" });
      }
    }
  }, [messages]);

  const verifyFileIntegrity = async (fileUrl, owner, tokenId) => {
    try {
      setVerifyingTokenId(tokenId);
      const requestData = { fileUrl, owner, tokenId };
      const response = await axiosInstance.post("/blockchain/verify", requestData);
      setVerificationResults((prev) => ({
        ...prev,
        [tokenId]: { status: response.data.message, verified: true },
      }));
      toast.success("File verified successfully!");
    } catch (error) {
      const errorMessage = error.response?.data?.message || "Verification failed";
      setVerificationResults((prev) => ({
        ...prev,
        [tokenId]: { status: errorMessage, verified: false },
      }));
      toast.error(errorMessage);
    } finally {
      setVerifyingTokenId(null);
    }
  };

  const getFileNameFromUrl = (url) => {
    try {
      const parts = url.split("/");
      return decodeURIComponent(parts[parts.length - 1]);
    } catch {
      return "File";
    }
  };

  if (isMessagesLoading) {
    return (
      <div className="flex-1 flex flex-col overflow-auto">
        <ChatHeader />
        <MessageSkeleton />
        <MessageInput />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-auto">
      <ChatHeader />
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => {
          const verification = verificationResults[message._id];
          const isVerified = verification?.verified;

          return (
            <div
              key={message._id}
              className={`chat ${message.senderId === authUser._id ? "chat-end" : "chat-start"}`}
              ref={messageEndRef}
            >
              <div className="chat-image avatar">
                <div className="size-10 rounded-full border">
                  <img
                    src={
                      message.senderId === authUser._id
                        ? authUser.profilePic || "/avatar.png"
                        : selectedUser.profilePic || "/avatar.png"
                    }
                    alt="profile pic"
                  />
                </div>
              </div>
              <div className="chat-header mb-1">
                <time className="text-xs opacity-50 ml-1">
                  {formatMessageTime(message.createdAt)}
                </time>
              </div>
              <div
                className={`chat-bubble flex flex-col transition-all duration-300 ${
                  isVerified ? "bg-green-100 border border-green-400 shadow-md scale-[1.02]" : ""
                }`}
              >
                {/* File Preview */}
                {message.image && (
                  <>
                    {message.image.endsWith(".pdf") ? (
                      <a
                        href={message.image}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 underline mb-2"
                      >
                        📄 {message.filename || getFileNameFromUrl(message.image)}
                      </a>
                    ) : (
                      <img
                        src={message.image}
                        alt="Attachment"
                        className="sm:max-w-[200px] rounded-md mb-2"
                      />
                    )}

                    {/* Verify Button */}
                    {message.senderId !== authUser._id && (
                      <button
                        className="mt-1 px-4 py-1 bg-blue-500 text-white rounded text-sm font-medium flex items-center justify-center"
                        onClick={() => verifyFileIntegrity(message.image, authUser._id, message._id)}
                      >
                        {verifyingTokenId === message._id ? (
                          <svg
                            className="animate-spin h-4 w-4 mr-2 text-white"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                          >
                            <circle
                              className="opacity-25"
                              cx="12"
                              cy="12"
                              r="10"
                              stroke="currentColor"
                              strokeWidth="4"
                            ></circle>
                            <path
                              className="opacity-75"
                              fill="currentColor"
                              d="M4 12a8 8 0 018-8v4l5-5-5-5v4a10 10 0 00-10 10h4z"
                            ></path>
                          </svg>
                        ) : (
                          "Verify"
                        )}
                      </button>
                    )}

                    {/* Verification Result */}
                    {verification && (
                      <p
                        className={`text-sm mt-1 flex items-center gap-1 ${
                          isVerified ? "text-green-700" : "text-red-500"
                        }`}
                      >
                        {verification.status}
                        {isVerified && <span className="ml-1">✔️ Verified</span>}
                      </p>
                    )}
                  </>
                )}

                {/* Text message */}
                {message.text && <p>{message.text}</p>}
              </div>
            </div>
          );
        })}
      </div>

      <MessageInput />
    </div>
  );
};

export default ChatContainer;
