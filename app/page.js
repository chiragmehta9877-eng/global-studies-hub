"use client";
import ModernDecoy from "./components/DecoyPortal";
import { useState, useEffect, useRef } from "react";
import PusherJS from "pusher-js";
import CryptoJS from "crypto-js";
import { Send, Smile, LogOut, Lock, Bell, TerminalSquare } from "lucide-react"; 
import EmojiPicker from 'emoji-picker-react';
import { motion, AnimatePresence } from "framer-motion";

const SECRET_KEY = "tour-404-classified-key";

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
  
  const bottomRef = useRef(null);
  const clientId = useRef(Math.random().toString(36).substring(7)).current;

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
      } catch (err) { console.error("Service Worker registration failed:", err); }
    }
  };

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

  useEffect(() => {
    if (appState !== "CHAT") return;
    const interval = setInterval(() => {
      const now = Date.now();
      setMessages((prev) => prev.filter((m) => now - m.createdAt < 15000));
    }, 1000);
    return () => clearInterval(interval);
  }, [appState]);

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
        if (Notification.permission !== "granted") await Notification.requestPermission();
        await registerServiceWorkerAndSubscribe(data.user);
      } else { setError("Invalid University ID or PIN."); }
    } catch (err) { setError("Network error."); } finally { setIsLoggingIn(false); }
  };

  useEffect(() => {
    if (appState !== "CHAT" || !currentUser) return;
    const pusher = new PusherJS(process.env.NEXT_PUBLIC_PUSHER_KEY, { cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER });
    const channel = pusher.subscribe(currentUser.channel);
    channel.bind("receive_message", (data) => {
      if (data.senderId === clientId) return;
      try {
        const bytes = CryptoJS.AES.decrypt(data.encryptedText, SECRET_KEY);
        const text = bytes.toString(CryptoJS.enc.Utf8);
        if (text) setMessages((prev) => [...prev, { id: data.id, text, sender: "them", time: new Date().toLocaleTimeString([], {hour:'2-digit', minute:'2-digit', second:'2-digit'}), createdAt: Date.now() }]);
      } catch(e) {}
    });
    return () => { pusher.unsubscribe(currentUser.channel); pusher.disconnect(); };
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
      await fetch("/api/ping", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ sender: currentUser.name }), });
      setTimeout(() => setIsPinging(false), 3000);
    } catch (error) { setIsPinging(false); }
  };

  if (appState === "DECOY") return <ModernDecoy onTrigger={() => setAppState("PORTAL_LOGIN")} />;

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
            <input id="username" name="username" type="text" autoComplete="username" placeholder="e.g., stu-1044" className="w-full bg-slate-50 border border-slate-200 p-3 rounded-lg text-sm focus:border-blue-500 outline-none" onChange={(e) => setStudentId(e.target.value)} />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase mb-1.5">Access PIN</label>
            <input id="password" name="password" type="password" autoComplete="current-password" placeholder="••••" className="w-full bg-slate-50 border border-slate-200 p-3 rounded-lg text-sm focus:border-blue-500 outline-none" onChange={(e) => setPassword(e.target.value)} />
          </div>
          {error && <p className="text-red-600 text-xs font-medium bg-red-50 p-2 rounded">{error}</p>}
          <button type="submit" disabled={isLoggingIn} className={`w-full text-white font-semibold py-3 rounded-lg text-sm mt-2 transition-colors ${isLoggingIn ? "bg-blue-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"}`}>
            {isLoggingIn ? "Authenticating..." : "Authenticate"}
          </button>
        </form>
        <button type="button" onClick={() => setAppState("DECOY")} className="mt-6 text-sm text-slate-500 hover:text-blue-600 font-medium">← Return to Directory</button>
      </div>
    </div>
  );

  return (
    // FIX: Changed min-h-screen to fixed inset-0 to prevent keyboard viewport resize issues
    <div className="fixed inset-0 bg-[#0d1117] font-mono flex flex-col text-[#c9d1d9] selection:bg-[#1f6feb]">
      
      <header className="bg-[#161b22] border-b border-[#30363d] px-3 py-3 flex justify-between items-center flex-shrink-0">
        <div className="flex items-center gap-2">
          <TerminalSquare size={16} className="text-[#8b949e]" />
          <span className="text-[10px] uppercase tracking-widest font-bold text-[#8b949e]">tty1 : {currentUser.name}</span>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handlePingPartner} disabled={isPinging} className={`flex items-center gap-1.5 text-[10px] px-2 py-1.5 rounded border ${isPinging ? "bg-[#21262d] text-slate-500 border-[#30363d]" : "bg-emerald-900/10 text-emerald-500 border-emerald-900/30"}`}>
            <Bell size={12} className={isPinging ? "" : "animate-bounce"} /> Ping
          </button>
          <button onClick={() => setAppState("DECOY")} className="text-[10px] bg-rose-900/10 text-rose-500 border border-rose-900/30 px-2 py-1.5 rounded">Exit</button>
        </div>
      </header>

      {/* MESSAGES CONTAINER */}
      <div className="flex-1 overflow-y-auto p-3 space-y-1 z-10 scrollbar-hide">
        <AnimatePresence>
          {messages.map((m) => (
            <motion.div key={m.id} exit={{ opacity: 0, filter: "blur(12px)", transition: { duration: 0.8 } }} className="flex items-start gap-2 py-1 hover:bg-[#161b22]/50 rounded">
              <span className="text-[#484f58] text-[9px] mt-0.5 whitespace-nowrap">[{m.time}]</span>
              <span className={`text-[10px] font-bold mt-0.5 whitespace-nowrap ${m.sender === "me" ? "text-[#58a6ff]" : "text-[#3fb950]"}`}>
                {m.sender === "me" ? "root@local:~$" : "admin@remote:~$"}
              </span>
              <span className="text-xs leading-relaxed text-[#c9d1d9] flex-1">{m.text}</span>
            </motion.div>
          ))}
        </AnimatePresence>
        <div ref={bottomRef} />
      </div>

      {/* INPUT CONTAINER - Now part of flex flow, not absolute */}
      <div className="bg-[#0d1117] border-t border-[#30363d] p-2 flex-shrink-0 relative">
        {showEmojis && (
            <div className="absolute bottom-full left-0 mb-2 z-50">
              <EmojiPicker onEmojiClick={(e) => setInput(p => p + e.emoji)} theme="dark" width={300} height={350} />
            </div>
        )}
        <div className="flex gap-2 items-center">
          <button onClick={() => setShowEmojis(!showEmojis)} className="text-[#8b949e] p-2"><Smile size={18} /></button>
          <form onSubmit={sendMessage} className="flex-1 flex gap-2 items-center">
            <span className="text-[#3fb950] font-bold text-sm">{'>'}</span>
            <input type="text" value={input} onChange={(e) => setInput(e.target.value)} className="flex-1 bg-transparent border-none text-[#c9d1d9] text-sm outline-none font-mono py-2" placeholder="inject command..." autoComplete="off" />
            <button type="submit" className="text-[#58a6ff] p-2"><Send size={16} /></button>
          </form>
        </div>
      </div>
    </div>
  );
}