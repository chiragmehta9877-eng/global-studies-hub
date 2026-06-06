"use client";
import ModernDecoy from "./components/DecoyPortal";
import { useState, useEffect, useRef } from "react";
import PusherJS from "pusher-js";
import CryptoJS from "crypto-js";
import { Send, Smile, LogOut, Lock, Bell, TerminalSquare } from "lucide-react"; 
import EmojiPicker from 'emoji-picker-react';
import { motion, AnimatePresence } from "framer-motion"; 

const SECRET_KEY = "tour-404-classified-key";

// Vapid key helper function
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
  const [isPeerActive, setIsPeerActive] = useState(false);
  
  const bottomRef = useRef(null);
  const clientId = useRef(Math.random().toString(36).substring(7)).current;
  const peerTimeout = useRef(null);

  // --- SERVICE WORKER & PUSH SUBSCRIPTION ---
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
        console.log("Push registered for stealth mode.");
      } catch (err) {
        console.error("Service Worker registration failed:", err);
      }
    }
  };

  // --- THE PANIC BUTTON ---
  useEffect(() => {
    const handlePanicHide = () => {
      if (document.hidden || !document.hasFocus()) {
        setAppState("DECOY");
        setInput(""); 
        setShowEmojis(false);
      }
    };
    document.addEventListener("visibilitychange", handlePanicHide);
    window.addEventListener("blur", handlePanicHide);
    return () => {
      document.removeEventListener("visibilitychange", handlePanicHide);
      window.removeEventListener("blur", handlePanicHide);
    };
  }, []);

  // --- ROLLING 15-SEC DISAPPEAR (SMOKE EFFECT) ---
  useEffect(() => {
    if (appState !== "CHAT") return;
    const interval = setInterval(() => {
      const now = Date.now();
      setMessages((prev) => prev.filter((m) => now - m.createdAt < 15000));
    }, 1000);
    return () => clearInterval(interval);
  }, [appState]);

  // --- LOGIN LOGIC ---
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
        setAppState("CHAT");
        
        if (Notification.permission !== "granted") {
          await Notification.requestPermission();
        }
        await registerServiceWorkerAndSubscribe(data.user);
      } else {
        setError("Invalid University ID or PIN.");
      }
    } catch (err) {
      setError("Network error. Could not reach servers.");
    } finally {
      setIsLoggingIn(false);
    }
  };

  // --- PUSHER REAL-TIME ---
  useEffect(() => {
    if (appState !== "CHAT" || !currentUser) return;
    const pusher = new PusherJS(process.env.NEXT_PUBLIC_PUSHER_KEY, { cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER });
    const channel = pusher.subscribe(currentUser.channel);
    
    channel.bind("receive_message", (data) => {
      if (data.senderId === clientId) return;
      try {
        const bytes = CryptoJS.AES.decrypt(data.encryptedText, SECRET_KEY);
        const text = bytes.toString(CryptoJS.enc.Utf8);
        
        if (text === "SYS_PING_ACTIVE") {
          setIsPeerActive(true);
          clearTimeout(peerTimeout.current);
          peerTimeout.current = setTimeout(() => setIsPeerActive(false), 5000); 
          return;
        }

        if (text) setMessages((prev) => [...prev, { id: data.id, text, sender: "them", time: new Date().toLocaleTimeString([], {hour:'2-digit', minute:'2-digit', second:'2-digit'}), createdAt: Date.now() }]);
      } catch(e) {}
    });

    const pingInterval = setInterval(() => {
      const pingText = CryptoJS.AES.encrypt("SYS_PING_ACTIVE", SECRET_KEY).toString();
      fetch("/api/pusher", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: Date.now(), encryptedText: pingText, senderId: clientId, channel: currentUser.channel }),
      });
    }, 3000);

    return () => { 
      clearInterval(pingInterval);
      clearTimeout(peerTimeout.current);
      pusher.unsubscribe(currentUser.channel); 
      pusher.disconnect(); 
    };
  }, [appState, currentUser, clientId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    const encryptedText = CryptoJS.AES.encrypt(input, SECRET_KEY).toString();
    setMessages((prev) => [...prev, { id: Date.now(), text: input, sender: "me", time: new Date().toLocaleTimeString([], {hour:'2-digit', minute:'2-digit', second:'2-digit'}), createdAt: Date.now() }]);
    setInput("");
    setShowEmojis(false);
    await fetch("/api/pusher", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: Date.now(), encryptedText, senderId: clientId, channel: currentUser.channel }),
    });
  };

  const handlePingPartner = async () => {
    setIsPinging(true);
    try {
      await fetch("/api/ping", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sender: currentUser.name }),
      });
      setTimeout(() => setIsPinging(false), 3000);
    } catch (error) {
      setIsPinging(false);
    }
  };

  // ==========================================
  // RENDER VIEWS
  // ==========================================
  
  if (appState === "DECOY") {
    return <ModernDecoy onTrigger={() => setAppState("PORTAL_LOGIN")} />;
  }

  // --- RESTORED ORIGINAL LOGIN DESIGN WITH AUTOCOMPLETE DISABLED ---
  if (appState === "PORTAL_LOGIN") return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans text-slate-800">
      <div className="bg-white p-8 rounded-2xl border border-slate-200 w-full max-w-sm text-center shadow-lg">
        <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
          <Lock size={28} className="text-blue-600" />
        </div>
        <h2 className="mb-1 text-xl font-bold text-slate-900">Student Gateway</h2>
        <p className="text-sm text-slate-500 mb-8">Sign in to access secure academic modules</p>
        
        <form onSubmit={handleLogin} className="space-y-5 text-left">
          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase mb-1.5">University ID</label>
            <input 
              type="text" 
              autoComplete="off" 
              placeholder="e.g., stu-1044" 
              className="w-full bg-slate-50 border border-slate-200 p-3 rounded-lg text-sm focus:border-blue-500 outline-none" 
              onChange={(e) => setStudentId(e.target.value)} 
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase mb-1.5">Access PIN</label>
            <input 
              type="password" 
              autoComplete="new-password" 
              placeholder="••••" 
              className="w-full bg-slate-50 border border-slate-200 p-3 rounded-lg text-sm focus:border-blue-500 outline-none" 
              onChange={(e) => setPassword(e.target.value)} 
            />
          </div>
          {error && <p className="text-red-600 text-xs font-medium bg-red-50 p-2 rounded">{error}</p>}
          
          <button type="submit" disabled={isLoggingIn} className={`w-full text-white font-semibold py-3 rounded-lg text-sm mt-2 transition-colors ${isLoggingIn ? "bg-blue-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"}`}>
            {isLoggingIn ? "Authenticating..." : "Authenticate"}
          </button>
        </form>
        <button type="button" onClick={() => setAppState("DECOY")} className="mt-6 text-sm text-slate-500 hover:text-blue-600 font-medium">
          ← Return to Directory
        </button>
      </div>
    </div>
  );

  // ==========================================
  // VIEW 3: STEALTH DEVELOPER TERMINAL (FIXED MOBILE VIEWPORT)
  // ==========================================
  return (
    <div className="h-[100dvh] bg-[#0d1117] font-mono flex flex-col text-[#c9d1d9] selection:bg-[#1f6feb]">
      
      {/* HEADER */}
      <div className="flex-shrink-0 bg-[#161b22] border-b border-[#30363d] px-3 md:px-6 py-3 flex flex-wrap justify-between items-center z-10 shadow-md gap-2">
        <div className="flex items-center gap-2">
          <TerminalSquare size={16} className="text-[#8b949e] hidden sm:block" />
          <span className="text-[10px] sm:text-xs uppercase tracking-widest font-bold text-[#8b949e]">tty1 : {currentUser.name}</span>
        </div>
        
        <div className="flex items-center gap-2">
          {isPeerActive ? (
            <span className="text-emerald-500 text-[10px] uppercase tracking-widest hidden md:flex items-center gap-1.5 font-bold">
               [ ONLINE ]
            </span>
          ) : (
             <span className="text-rose-500 text-[10px] uppercase tracking-widest hidden md:flex items-center gap-1.5">
               [ OFFLINE ]
            </span>
          )}
          
          <button onClick={handlePingPartner} disabled={isPinging} className={`flex items-center gap-1.5 text-[10px] sm:text-xs px-2 py-1.5 rounded transition-colors border ${isPinging ? "bg-[#21262d] text-slate-500 border-[#30363d] cursor-not-allowed" : "bg-emerald-900/10 text-emerald-500 border-emerald-900/30 hover:bg-emerald-900/30"}`}>
            <Bell size={12} className={isPinging ? "" : "animate-bounce"} /> {isPinging ? "Signal Sent" : "Ping Node"}
          </button>
          <button onClick={() => setAppState("DECOY")} className="text-[10px] sm:text-xs bg-rose-900/10 text-rose-500 hover:bg-rose-900/30 border border-rose-900/30 px-2 py-1.5 rounded flex items-center gap-1"><LogOut size={12} /> Exit</button>
        </div>
      </div>

      {/* MESSAGES CONTAINER */}
      <div className="flex-1 overflow-y-auto p-3 md:p-6 space-y-1 z-10 scrollbar-hide">
        <AnimatePresence>
          {messages.map((m) => (
            <motion.div key={m.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, filter: "blur(12px)", y: -15, transition: { duration: 0.8, ease: "easeOut" } }} className="flex items-start gap-2 py-1 hover:bg-[#161b22]/50 rounded group">
              <span className="text-[#484f58] text-[9px] sm:text-[11px] mt-0.5 whitespace-nowrap select-none">[{m.time}]</span>
              <span className={`text-[10px] sm:text-[11px] font-bold mt-0.5 whitespace-nowrap ${m.sender === "me" ? "text-[#58a6ff]" : "text-[#3fb950]"}`}>
                {m.sender === "me" ? "root@local:~$" : "admin@remote:~$"}
              </span>
              <span className="text-xs sm:text-sm leading-relaxed break-words text-[#c9d1d9] flex-1">{m.text}</span>
              <span className="text-[8px] sm:text-[9px] text-[#484f58] ml-auto opacity-0 group-hover:opacity-100 transition-opacity select-none hidden md:block">
                 exp:{15 - Math.floor((Date.now() - m.createdAt) / 1000)}s
              </span>
            </motion.div>
          ))}
        </AnimatePresence>
        <div ref={bottomRef} />
      </div>

      {/* INPUT CONTAINER */}
      <div className="flex-shrink-0 w-full bg-[#0d1117] border-t border-[#30363d] p-2 relative z-20">
        {showEmojis && (
            <div className="absolute bottom-full left-2 sm:left-4 z-50 mb-2 shadow-2xl opacity-95">
              {/* FIX: Reduced width/height and removed "What's your mood" with previewConfig */}
              <EmojiPicker 
                onEmojiClick={(e) => setInput(p => p + e.emoji)} 
                theme="dark" 
                width={260} 
                height={300} 
                previewConfig={{ showPreview: false }} 
              />
            </div>
        )}
        <div className="max-w-full mx-auto flex gap-2 items-center bg-[#0d1117] px-1">
          <button onClick={() => setShowEmojis(!showEmojis)} className="text-[#8b949e] p-2 flex-shrink-0 hover:text-white transition-colors"><Smile size={18} /></button>
          
          <form onSubmit={sendMessage} className="flex-1 flex gap-2 items-center">
            <span className="text-[#3fb950] font-bold text-sm select-none">{'>'}</span>
            <input 
              type="text" value={input} onChange={(e) => setInput(e.target.value)} 
              className="flex-1 bg-transparent border-none text-[#c9d1d9] text-sm outline-none font-mono focus:ring-0 placeholder-[#484f58] py-2" 
              placeholder="inject command..." autoComplete="off" 
            />
            <button type="submit" disabled={!input.trim()} className="text-[#58a6ff] p-2 flex-shrink-0 disabled:opacity-50 hover:text-white transition-colors"><Send size={16} /></button>
          </form>
        </div>
      </div>
    </div>
  );
}