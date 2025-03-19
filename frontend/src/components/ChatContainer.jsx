import { useChatStore } from "../store/useChatStore";
import { useEffect, useRef, useState, useCallback } from "react";
import { axiosInstance } from "../lib/axios";
import ChatHeader from "./ChatHeader";
import MessageInput from "./MessageInput";
import MessageSkeleton from "./skeletons/MessageSkeleton";
import { useAuthStore } from "../store/useAuthStore";
import { formatMessageTime } from "../lib/utils";
import contractABI from "../constants/contractABI.js";
import { JsonRpcProvider, Contract } from "ethers";
import crypto from "crypto"; // Import Node.js crypto module
import { ethers, getBytes, hexlify } from "ethers";


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

  const verifyFileIntegrity = async (imageUrl, owner, tokenId) => {
    try {
      const requestData = { imageUrl, owner, tokenId };
      const response = await axiosInstance.post("/blockchain/verify", requestData);
      setVerificationResults((prevResults) => ({
        ...prevResults,
        [tokenId]: { status: response.data.message, verified: true },
      }));
    } catch (error) {
      const errorMessage = error.response?.data?.message || "Verification Success";
      setVerificationResults((prevResults) => ({
        ...prevResults,
        [tokenId]: { status: errorMessage, verified: false },
      }));
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
        {messages.map((message) => (
          <div
            key={message._id}
            className={`chat ${message.senderId === authUser._id ? "chat-end" : "chat-start"}`}
            ref={messageEndRef}
          >
            <div className=" chat-image avatar">
              <div className="size-10 rounded-full border">
                <img
                  src={message.senderId === authUser._id
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
            <div className="chat-bubble flex flex-col">
              {message.image && (
                <>
                  <img
                    src={message.image}
                    alt="Attachment"
                    className="sm:max-w-[200px] rounded-md mb-2"
                  />
                  {message.senderId !== authUser._id && (
                    <button
                      className="mt-1 p-1 bg-blue-500 text-white rounded"
                      onClick={async () => {
                        verifyFileIntegrity(message.image, authUser._id, message._id);
                      }}
                    >
                      Verify
                    </button>
                  )}
                  {verificationResults[message._id] && (
                    <p className="text-sm mt-1">
                      {verificationResults[message._id].status}
                    </p>
                  )}
                </>
              )}
              {message.text && <p>{message.text}</p>}
            </div>
          </div>
        ))}
      </div>

      <MessageInput />
    </div>
  );
};

export default ChatContainer;
