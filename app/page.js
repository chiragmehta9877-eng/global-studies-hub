"use client";
import ModernDecoy from "./components/DecoyPortal";
import { useState, useEffect, useRef } from "react";
import PusherJS from "pusher-js";
import CryptoJS from "crypto-js";
import { Send, Smile, LogOut, Lock, Bell, CheckCheck, Camera, Image as ImageIcon, Download, X } from "lucide-react";
import EmojiPicker from 'emoji-picker-react';
import { motion, AnimatePresence } from "framer-motion";

const SECRET_KEY = "tour-404-classified-key";

// SECURED CLOUDINARY CREDENTIALS FROM .ENV
const CLOUDINARY_CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME; 
const CLOUDINARY_UPLOAD_PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET; 

function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding).replace(/\-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) { outputArray[i] = rawData.charCodeAt(i); }
  return outputArray;
}

export default function Home() {
  const [appState, setAppState] = useState("DECOY"); 
  const [studentId, setStudentId] = useState("");
  const [password, setPassword] = useState("");
  const [currentUser, setCurrentUser] = useState(null);
  const [error, setError] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false); 
  
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [showEmojis, setShowEmojis] = useState(false);
  const [isPinging, setIsPinging] = useState(false);
  
  const [targetNode, setTargetNode] = useState(""); 
  const [activeChannel, setActiveChannel] = useState(""); 
  
  const [isPeerActive, setIsPeerActive] = useState(false);
  const [isPeerTyping, setIsPeerTyping] = useState(false);
  
  const [isUploading, setIsUploading] = useState(false);
  const [tick, setTick] = useState(0); 

  const [expandedImage, setExpandedImage] = useState(null);
  
  const bottomRef = useRef(null);
  const inputRef = useRef(null);
  const cameraInputRef = useRef(null); 
  const galleryInputRef = useRef(null); 
  
  const prevMsgCount = useRef(0);
  const clientId = useRef(Math.random().toString(36).substring(7)).current;
  const peerTimeout = useRef(null);
  const typingTimeout = useRef(null);
  const lastTypingTime = useRef(0);

  const registerServiceWorkerAndSubscribe = async (user) => {
    if ("serviceWorker" in navigator && "PushManager" in window) {
      try {
        const registration = await navigator.serviceWorker.register("/sw.js");
        await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY),
        });
        await fetch("/api/subscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ subscription, username: user.name }),
        });
      } catch (err) { console.error("SW failed:", err); }
    }
  };

  // BUG FIX: Master Logout & Cleanup Function
  const handleLogout = () => {
    setAppState("DECOY");
    setStudentId("");
    setPassword("");
    setCurrentUser(null);
    setMessages([]);
    setIsPeerActive(false);
    setIsPeerTyping(false);
    setTargetNode("");
    setActiveChannel("");
    setInput("");
    setShowEmojis(false);
    setExpandedImage(null);
    clearTimeout(peerTimeout.current);
    clearTimeout(typingTimeout.current);
  };
/*
  useEffect(() => {
    const handlePanicHide = () => {
      if (document.visibilityState === "hidden") {
        handleLogout();
      }
    };
    document.addEventListener("visibilitychange", handlePanicHide);
    return () => {
      document.removeEventListener("visibilitychange", handlePanicHide);
    };
  }, []);
*/
  // --- 15 SEC DISAPPEAR & CLOUDINARY NUKE PROTOCOL ---
  useEffect(() => {
    if (appState !== "CHAT") return;
    const interval = setInterval(() => {
      const now = Date.now();
      setTick(now); 

      setMessages((prev) => prev.filter((msg) => {
        if (msg.sender === "me" && !msg.seenAt) return true;
        if (msg.seenAt) {
          const isExpired = (now - msg.seenAt) >= 15000;
          if (isExpired && msg.sender === "them" && msg._id) {
             fetch("/api/messages/delete", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ messageId: msg._id }),
             }).catch(e => console.log("DB Delete fail", e));

             if (msg.text.startsWith("IMG_SYS::")) {
               const parts = msg.text.split("::");
               const dToken = parts[2]; 
               if (dToken && dToken !== "no_token") {
                 fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/delete_by_token`, {
                   method: "POST",
                   headers: { "Content-Type": "application/json" },
                   body: JSON.stringify({ token: dToken })
                 }).catch(e => console.log("Cloudinary Nuke fail", e));
               }
             }
          }
          return !isExpired; 
        }
        return true;
      }));
    }, 1000);
    return () => clearInterval(interval);
  }, [appState]);

  useEffect(() => {
    if (appState === "CHAT" && currentUser && activeChannel) {
      const fetchPendingMessages = async () => {
        try {
          const res = await fetch("/api/messages/fetch", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userId: currentUser.name }), 
          });
          const data = await res.json();
          if (data.success && data.messages.length > 0) {
            const fetched = data.messages.map((m) => {
              const bytes = CryptoJS.AES.decrypt(m.encryptedText, SECRET_KEY);
              const exactTime = m.timeStr || (m.createdAt ? new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));

              return {
                id: m.id || m._id, 
                _id: m._id, 
                text: bytes.toString(CryptoJS.enc.Utf8),
                sender: "them",
                time: exactTime,
                seenAt: Date.now() 
              };
            });

            setMessages((prev) => {
              const uniqueFetched = fetched.filter(newMsg => !prev.some(p => p.id === newMsg.id || p._id === newMsg._id));
              return [...prev, ...uniqueFetched];
            });

            fetched.forEach(async (m) => {
              await fetch("/api/messages/seen", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id: m.id || m._id, channel: activeChannel })
              });
            });
          }
        } catch (error) { console.error("Fetch failed", error); }
      };
      fetchPendingMessages();
    }
  }, [appState, currentUser, activeChannel]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoggingIn(true);
    setError("");
    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uid: studentId.trim(), pin: password })
      });
      const data = await res.json();
      if (data.success) {
        setCurrentUser(data.user); 
        try {
          const nodeRes = await fetch("/api/nodes/getPartner", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username: studentId.trim() }) 
          });
          const nodeData = await nodeRes.json();
          if (nodeData.success) {
            setTargetNode(nodeData.partner);
            setActiveChannel(nodeData.nodeName); 
          } else {
            setError("No active communication node found.");
            setIsLoggingIn(false);
            return;
          }
        } catch (e) { console.log(e); }
        setAppState("CHAT");
        try { if (typeof Notification !== "undefined" && Notification.permission !== "granted") await Notification.requestPermission(); } 
        catch (e) {}
        await registerServiceWorkerAndSubscribe(data.user);
      } else { setError("Invalid University ID or PIN."); }
    } catch (err) { setError("Network error."); } finally { setIsLoggingIn(false); }
  };

  useEffect(() => {
    if (appState !== "CHAT" || !currentUser || !activeChannel) return;
    
    // Safety Net: Ensure clean state when newly connecting to a channel
    setIsPeerActive(false);
    setIsPeerTyping(false);

    const pusher = new PusherJS(process.env.NEXT_PUBLIC_PUSHER_KEY, { cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER });
    const channel = pusher.subscribe(activeChannel);
    
    channel.bind("receive_message", async (data) => {
      if (String(data.senderId).trim().toLowerCase() === String(currentUser.name).trim().toLowerCase()) return;

      try {
        const bytes = CryptoJS.AES.decrypt(data.encryptedText, SECRET_KEY);
        const text = bytes.toString(CryptoJS.enc.Utf8);
        
        if (text === "SYS_PING_ACTIVE") {
          setIsPeerActive(true);
          clearTimeout(peerTimeout.current);
          peerTimeout.current = setTimeout(() => setIsPeerActive(false), 5000); 
          return;
        }

        if (text === "SYS_TYPING_ACTIVE") {
          setIsPeerTyping(true);
          clearTimeout(typingTimeout.current);
          typingTimeout.current = setTimeout(() => setIsPeerTyping(false), 2000); 
          return;
        }

        if (text) {
          setIsPeerTyping(false); 
          setMessages((prev) => {
            const msgId = data.id || data._id;
            
            if (prev.some(p => p.id === msgId || p._id === msgId)) return prev;

            setTimeout(() => {
              fetch("/api/messages/seen", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id: msgId, channel: activeChannel })
              }).catch(() => {});
            }, 50);

            return [...prev, { 
              id: msgId || Date.now(), 
              _id: data._id, 
              text, 
              sender: "them", 
              time: data.timeStr || new Date().toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'}), 
              seenAt: Date.now() 
            }];
          });
        }
      } catch(e) {}
    });

    channel.bind("message_seen", (data) => {
       setMessages((prev) => prev.map((msg) => {
          if (msg.sender === "me" && !msg.seenAt) {
             return { ...msg, seenAt: Date.now() };
          }
          return msg;
       }));
    });

    const pingInterval = setInterval(() => {
      const pingText = CryptoJS.AES.encrypt("SYS_PING_ACTIVE", SECRET_KEY).toString();
      fetch("/api/pusher", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: Date.now(), encryptedText: pingText, senderId: currentUser.name, channel: activeChannel }),
      });
    }, 3000);

    return () => { 
      clearInterval(pingInterval); 
      clearTimeout(peerTimeout.current); 
      clearTimeout(typingTimeout.current); 
      pusher.unsubscribe(activeChannel); 
      pusher.disconnect(); 
    };
  }, [appState, currentUser, activeChannel]);

  const scrollToBottom = () => setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" }), 50);

  useEffect(() => {
    if (messages.length > prevMsgCount.current) scrollToBottom();
    prevMsgCount.current = messages.length;
  }, [messages]);

  const dispatchMessage = async (msgText) => {
    if (!msgText || !targetNode) return;
    
    const encryptedText = CryptoJS.AES.encrypt(msgText, SECRET_KEY).toString();
    const tempId = Date.now();
    const timeStr = new Date().toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'});

    setMessages((prev) => [...prev, { 
      id: tempId, _id: tempId, text: msgText, sender: "me", 
      time: timeStr, 
      seenAt: null 
    }]);
    
    await fetch("/api/messages/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: tempId, encryptedText, senderId: currentUser.name, receiverId: targetNode, channel: activeChannel, timeStr }),
    });
  };

  const handleTextSubmit = (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    dispatchMessage(input);
    setInput("");
    setShowEmojis(false);
    inputRef.current?.focus();
  };

  const handleInputChange = (e) => {
    setInput(e.target.value);
    
    if (Date.now() - lastTypingTime.current > 1500) {
      const typingText = CryptoJS.AES.encrypt("SYS_TYPING_ACTIVE", SECRET_KEY).toString();
      fetch("/api/pusher", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: Date.now(), encryptedText: typingText, senderId: currentUser.name, channel: activeChannel }),
      });
      lastTypingTime.current = Date.now();
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);

    try {
      const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`, {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (data.secure_url) {
        const delToken = data.delete_token || "no_token";
        await dispatchMessage(`IMG_SYS::${data.secure_url}::${delToken}`);
      } else {
        alert("Upload failed. Please try again.");
      }
    } catch (err) {
      console.error(err);
      alert("Error uploading file.");
    } finally {
      setIsUploading(false);
      if (cameraInputRef.current) cameraInputRef.current.value = "";
      if (galleryInputRef.current) galleryInputRef.current.value = "";
    }
  };

  const handlePingPartner = async () => {
    setIsPinging(true);
    try {
      await fetch("/api/ping", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ sender: currentUser.name }) });
      setTimeout(() => setIsPinging(false), 3000);
    } catch (error) { setIsPinging(false); }
  };

  const downloadImage = async (url) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = `Photo_${Date.now()}.jpg`; 
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
      const link = document.createElement('a');
      link.href = url;
      link.target = '_blank';
      link.download = `Photo_${Date.now()}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  // ==========================================
  // RENDER VIEWS
  // ==========================================
  
  if (appState === "DECOY") return <ModernDecoy onTrigger={() => setAppState("PORTAL_LOGIN")} />;

  if (appState === "PORTAL_LOGIN") return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans text-slate-800">
      <div className="bg-white p-8 rounded-3xl border border-slate-100 w-full max-w-sm text-center shadow-xl shadow-blue-900/5">
        <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-blue-100">
          <Lock size={28} className="text-blue-600" />
        </div>
        <h2 className="mb-1 text-2xl font-bold text-slate-900">Student Gateway</h2>
        <p className="text-sm text-slate-500 mb-8">Access restricted academic modules</p>
        <form onSubmit={handleLogin} className="space-y-4 text-left">
          <div>
            <input type="text" autoComplete="off" placeholder="University ID" className="w-full bg-slate-50 border border-slate-200 p-4 rounded-xl text-sm focus:border-blue-500 outline-none transition" onChange={(e) => setStudentId(e.target.value)} />
          </div>
          <div>
            <input type="password" autoComplete="new-password" placeholder="Access PIN" className="w-full bg-slate-50 border border-slate-200 p-4 rounded-xl text-sm focus:border-blue-500 outline-none transition" onChange={(e) => setPassword(e.target.value)} />
          </div>
          {error && <p className="text-rose-500 text-xs font-medium bg-rose-50 p-3 rounded-lg">{error}</p>}
          <button type="submit" disabled={isLoggingIn} className={`w-full text-white font-semibold py-4 rounded-xl text-sm mt-2 transition-colors shadow-lg ${isLoggingIn ? "bg-blue-400 shadow-blue-400/30 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700 shadow-blue-600/30"}`}>
            {isLoggingIn ? "Authenticating..." : "Authenticate"}
          </button>
        </form>
      </div>
    </div>
  );

  return (
    <div className="h-[100dvh] bg-[#f4f5f9] font-sans flex flex-col overflow-hidden text-slate-800 relative">
      <input type="file" accept="image/*" capture="camera" ref={cameraInputRef} className="hidden" onChange={handleImageUpload} />
      <input type="file" accept="image/*" ref={galleryInputRef} className="hidden" onChange={handleImageUpload} />

      {/* HEADER - Updated LogOut functionality */}
      <div className="bg-white border-b border-slate-100 px-4 py-3 flex justify-between items-center z-20 shadow-sm shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-full bg-slate-100 border-2 border-white flex items-center justify-center relative shadow-sm overflow-hidden">
            <img src="https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=150&h=150&fit=crop" alt="Profile" className="w-full h-full object-cover" />
            {isPeerActive && <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 border-2 border-white rounded-full"></span>}
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-slate-800 text-base leading-tight">{targetNode || "Partner"}</span>
            {isPeerActive ? <span className="text-xs text-green-500 font-medium">Online now</span> : <span className="text-xs text-slate-400">Away</span>}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" onClick={handlePingPartner} disabled={isPinging} className={`p-2 rounded-full transition-colors ${isPinging ? "bg-slate-100 text-slate-400" : "bg-indigo-50 text-indigo-500 hover:bg-indigo-100"}`}>
            <Bell size={18} className={isPinging ? "" : "animate-bounce"} />
          </button>
          {/* LOGOUT BUTTON MAPPED TO NEW CLEANUP FUNCTION */}
          <button type="button" onClick={handleLogout} className="p-2 bg-rose-50 text-rose-500 hover:bg-rose-100 rounded-full transition-colors">
            <LogOut size={18} />
          </button>
        </div>
      </div>

      {/* CHAT MESSAGES AREA */}
      <div 
        className="flex-1 overflow-y-auto p-4 space-y-4 z-10 scrollbar-hide relative will-change-scroll"
        style={{
          backgroundColor: "#f4f5f9",
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='180' height='180' viewBox='0 0 180 180' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23d0d5df' fill-opacity='0.4' font-family='sans-serif'%3E%3Ctext x='20' y='30' font-size='16'%3E%F0%9F%98%BA%3C/text%3E%3Ctext x='80' y='80' font-size='12'%3E%E2%99%A1%3C/text%3E%3Ctext x='140' y='40' font-size='14'%3E%E2%98%86%3C/text%3E%3Ctext x='30' y='120' font-size='16'%3E%E2%98%BA%3C/text%3E%3Ctext x='110' y='150' font-size='12'%3E%E2%9C%A8%3C/text%3E%3Ctext x='160' y='110' font-size='14'%3E%E2%99%A1%3C/text%3E%3Ctext x='80' y='10' font-size='10'%3E%E2%98%BA%3C/text%3E%3Ctext x='10' y='80' font-size='10'%3E%E2%9C%A8%3C/text%3E%3C/g%3E%3C/svg%3E")`,
          backgroundSize: "180px 180px"
        }}
      >
        <AnimatePresence>
          {messages.map((m) => {
            const isImage = m.text.startsWith("IMG_SYS::");
            const parts = isImage ? m.text.split("::") : [];
            const imageUrl = isImage ? parts[1] : null;
            const isMe = m.sender === "me";

            return (
            <motion.div key={m.id} 
              initial={{ opacity: 0, y: 10, scale: 0.95 }} 
              animate={{ opacity: 1, y: 0, scale: 1 }} 
              exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.3 } }}
              className={`flex flex-col w-full ${isMe ? "items-end" : "items-start"} will-change-transform`}
            >
              <div className={`relative max-w-[75%] flex flex-col gap-1 ${isMe ? "items-end" : "items-start"}`}>
                <div className={`px-4 py-2.5 shadow-sm text-[15px] leading-relaxed break-words
                  ${isMe ? "bg-gradient-to-tr from-indigo-500 to-blue-500 text-white rounded-2xl rounded-tr-sm" : "bg-white text-slate-800 rounded-2xl rounded-tl-sm border border-slate-100"}`
                }>
                  {isImage ? (
                    <img src={imageUrl} alt="Photo" onClick={() => setExpandedImage(imageUrl)} className="max-w-[200px] sm:max-w-[250px] rounded-lg cursor-pointer active:opacity-80 transition-opacity" />
                  ) : (
                    <span>{m.text}</span>
                  )}
                </div>
                <div className={`flex items-center gap-1.5 px-1 ${isMe ? "justify-end" : "justify-start"}`}>
                  <span className="text-[10px] text-slate-400 font-medium">{m.time}</span>
                  {isMe && ( !m.seenAt ? <CheckCheck size={14} className="text-slate-400" /> : <CheckCheck size={14} className="text-blue-500" /> )}
                </div>
              </div>
            </motion.div>
          )})}
        </AnimatePresence>
        <div ref={bottomRef} className="h-4" />
      </div>

      {/* FULLSCREEN IMAGE MODAL */}
      <AnimatePresence>
        {expandedImage && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 p-4 will-change-transform" onClick={() => setExpandedImage(null)}>
            <button className="absolute top-6 right-20 p-2.5 bg-white/10 text-white rounded-full hover:bg-white/20 transition" onClick={(e) => { e.stopPropagation(); downloadImage(expandedImage); }}><Download size={20} /></button>
            <button className="absolute top-6 right-6 p-2.5 bg-white/10 text-white rounded-full hover:bg-white/20 transition" onClick={() => setExpandedImage(null)}><X size={20} /></button>
            <motion.img initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0 }} src={expandedImage} alt="Photo View" className="max-w-full max-h-full object-contain rounded-2xl shadow-2xl will-change-transform" onClick={(e) => e.stopPropagation()} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* 3D PEEKING CAT */}
      <div className="absolute bottom-[72px] left-4 z-10 pointer-events-none flex flex-col items-center">
        <AnimatePresence>
          {isPeerActive && (
            <motion.div
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }} 
              exit={{ y: 30, opacity: 0 }}
              transition={{ type: "spring", stiffness: 200, damping: 20 }}
              className="relative flex flex-col items-center will-change-transform"
            >
              {isPeerTyping && (
                <motion.div
                  initial={{ scale: 0, opacity: 0, y: 10 }}
                  animate={{ scale: 1, opacity: 1, y: -5 }}
                  exit={{ scale: 0, opacity: 0 }}
                  className="absolute -top-10 bg-white border border-slate-100 shadow-sm rounded-2xl rounded-bl-sm px-3 py-1.5 flex items-center justify-center z-20 will-change-transform"
                >
                  <span className="flex gap-0.5 text-indigo-500 font-bold text-lg leading-none pb-1">
                    <span className="animate-bounce">.</span>
                    <span className="animate-bounce" style={{animationDelay: '100ms'}}>.</span>
                    <span className="animate-bounce" style={{animationDelay: '200ms'}}>.</span>
                  </span>
                </motion.div>
              )}

              <div className="relative w-16 h-14 overflow-visible">
                <div className="absolute -left-1 bottom-0 w-[18px] h-[14px] bg-gradient-to-b from-[#ffb74d] to-[#f57c00] rounded-[10px] shadow-sm transform -rotate-[15deg] z-20"></div>
                <div className="absolute -right-1 bottom-0 w-[18px] h-[14px] bg-gradient-to-b from-[#ffb74d] to-[#f57c00] rounded-[10px] shadow-sm transform rotate-[15deg] z-20"></div>
                <img src="https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Animals/Cat%20Face.png" alt="Cute 3D Cat" className="w-16 h-16 absolute bottom-[4px] left-0 z-10" />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {showEmojis && (
        <div className="absolute bottom-[85px] left-2 sm:left-4 z-50 shadow-xl opacity-100 rounded-3xl overflow-hidden bg-white">
          <EmojiPicker onEmojiClick={(emoji) => setInput(p => p + emoji.emoji)} theme="light" width={280} height={320} previewConfig={{ showPreview: false }} />
        </div>
      )}

      {/* INPUT BAR */}
      <div className="w-full bg-[#f4f5f9] p-3 z-20 shrink-0 pb-safe relative">
        <div className="max-w-full mx-auto flex gap-2 items-center relative z-20">
          <div className="flex-1 flex items-center bg-white rounded-full px-3 py-1 border border-slate-200 focus-within:border-[#a3c2f5] transition-colors shadow-sm relative z-20 h-[48px]">
            <button type="button" onClick={() => setShowEmojis(!showEmojis)} className="p-1 text-slate-400 hover:text-slate-600 transition-colors">
              <Smile size={22} strokeWidth={1.5} />
            </button>
            <form onSubmit={handleTextSubmit} className="flex-1 flex items-center h-full px-2">
              <input 
                ref={inputRef} type="text" value={input} 
                onChange={handleInputChange} 
                onFocus={() => setTimeout(scrollToBottom, 300)} 
                className="flex-1 bg-transparent border-none text-slate-700 text-[15px] outline-none placeholder-slate-400 h-full" 
                placeholder={isUploading ? "Sending photo..." : "Message..."} 
                autoComplete="off" 
                disabled={isUploading}
              />
            </form>
            <div className="flex gap-1.5 items-center shrink-0">
              <button type="button" disabled={isUploading} onClick={(e) => { e.preventDefault(); cameraInputRef.current?.click(); }} className="p-1 text-slate-400 hover:text-slate-600 disabled:opacity-50 transition-colors">
                <Camera size={22} strokeWidth={1.5} />
              </button>
              <button type="button" disabled={isUploading} onClick={(e) => { e.preventDefault(); galleryInputRef.current?.click(); }} className="p-1 text-slate-400 hover:text-slate-600 disabled:opacity-50 transition-colors">
                <ImageIcon size={22} strokeWidth={1.5} />
              </button>
            </div>
          </div>
          <button onClick={handleTextSubmit} disabled={!input.trim() || isUploading} className="w-[48px] h-[48px] flex items-center justify-center bg-[#a3c2f5] text-white rounded-full hover:bg-[#8fb2ed] disabled:opacity-50 disabled:scale-95 transition-transform shadow-sm relative z-20 shrink-0 will-change-transform">
            <Send size={20} className="ml-1" strokeWidth={1.5} />
          </button>
        </div>
      </div>
    </div>
  );
}