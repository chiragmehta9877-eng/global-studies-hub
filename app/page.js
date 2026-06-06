"use client";
import { useState, useEffect, useRef } from "react";
import PusherJS from "pusher-js";
import CryptoJS from "crypto-js";
import { Send, Smile, LogOut, Lock, Bell } from "lucide-react";
import EmojiPicker from 'emoji-picker-react';

// THE FIX: Changed from "@/components/DecoyPortal" to "./components/DecoyPortal"
import DecoyPortal from "./components/DecoyPortal";

const SECRET_KEY = "tour-404-classified-key";

// --- ANONYMOUS CREDENTIALS ---
const STUDENT_REGISTRY = {
  "smw2022": { password: "9900", channel: "stealth_chat_room", name: "Student_A" },
  "dk2022": { password: "9901", channel: "stealth_chat_room", name: "Student_B" }
};

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
  
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [showEmojis, setShowEmojis] = useState(false);
  const [isPinging, setIsPinging] = useState(false);
  
  const bottomRef = useRef(null);
  const clientId = useRef(Math.random().toString(36).substring(7)).current;

  // --- SERVICE WORKER & PUSH SUBSCRIPTION ---
  const registerServiceWorkerAndSubscribe = async (user) => {
    if ("serviceWorker" in navigator && "PushManager" in window) {
      try {
        const registration = await navigator.serviceWorker.register("/sw.js");
        
        // Ensure ready before subscribing
        await navigator.serviceWorker.ready;
        
        const subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY),
        });

        // Send subscription to our backend
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

  // --- ROLLING 30-SEC DISAPPEAR ---
  useEffect(() => {
    if (appState !== "CHAT") return;
    const interval = setInterval(() => {
      const now = Date.now();
      setMessages((prev) => prev.filter((m) => now - m.createdAt < 30000));
    }, 1000);
    return () => clearInterval(interval);
  }, [appState]);

  // --- LOGIN LOGIC ---
  const handleLogin = async (e) => {
    e.preventDefault();
    const user = STUDENT_REGISTRY[studentId.trim()];
    if (user && user.password === password) {
      setCurrentUser(user);
      setAppState("CHAT");
      setError("");
      
      // Request push access silently upon login
      if (Notification.permission !== "granted") {
        await Notification.requestPermission();
      }
      await registerServiceWorkerAndSubscribe(user);
    } else {
      setError("Invalid University ID or PIN.");
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
        if (text) setMessages((prev) => [...prev, { id: data.id, text, sender: "them", time: new Date().toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'}), createdAt: Date.now() }]);
      } catch(e) {}
    });
    return () => { pusher.unsubscribe(currentUser.channel); pusher.disconnect(); };
  }, [appState, currentUser, clientId]);

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    const encryptedText = CryptoJS.AES.encrypt(input, SECRET_KEY).toString();
    setMessages((prev) => [...prev, { id: Date.now(), text: input, sender: "me", time: new Date().toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'}), createdAt: Date.now() }]);
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
  
  if (appState === "DECOY") return <DecoyPortal onTriggerLogin={() => setAppState("PORTAL_LOGIN")} />;

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
            <input type="text" placeholder="e.g., stu-1044" className="w-full bg-slate-50 border border-slate-200 p-3 rounded-lg text-sm focus:border-blue-500 outline-none" onChange={(e) => setStudentId(e.target.value)} />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase mb-1.5">Access PIN</label>
            <input type="password" placeholder="••••" className="w-full bg-slate-50 border border-slate-200 p-3 rounded-lg text-sm focus:border-blue-500 outline-none" onChange={(e) => setPassword(e.target.value)} />
          </div>
          {error && <p className="text-red-600 text-xs font-medium bg-red-50 p-2 rounded">{error}</p>}
          <button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg text-sm mt-2">Authenticate</button>
        </form>
        <button onClick={() => setAppState("DECOY")} className="mt-6 text-sm text-slate-500 hover:text-blue-600 font-medium">← Return to Directory</button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0f1115] flex flex-col font-sans">
      <div className="bg-[#1a1d24] border-b border-slate-800 px-6 py-4 flex justify-between items-center text-white">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
          <h1 className="text-sm font-semibold">Secure Session: <span className="text-emerald-400">{currentUser.name}</span></h1>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={handlePingPartner} disabled={isPinging} className={`flex items-center gap-2 text-xs px-3 py-1.5 rounded transition-colors ${isPinging ? "bg-slate-800 text-slate-500 cursor-not-allowed" : "bg-indigo-900/20 text-indigo-400 hover:bg-indigo-900/40"}`}>
            <Bell size={14} className={isPinging ? "" : "animate-bounce"} /> {isPinging ? "Signal Sent" : "Ping Node"}
          </button>
          <button onClick={() => setAppState("DECOY")} className="flex items-center gap-2 text-xs bg-red-900/20 text-red-400 hover:bg-red-900/40 px-3 py-1.5 rounded">
            <LogOut size={14} /> Close
          </button>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-24">
        {messages.map((m) => (
          <div key={m.id} className={`flex flex-col ${m.sender === "me" ? "items-end" : "items-start"}`}>
            <div className={`px-4 py-2 rounded-2xl max-w-[75%] text-sm ${m.sender === "me" ? "bg-indigo-600 text-white rounded-br-none" : "bg-[#1a1d24] text-slate-200 border border-slate-800 rounded-bl-none"}`}>{m.text}</div>
            <span className="text-[10px] text-slate-500 mt-1 px-1">{m.time}</span>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      <div className="absolute bottom-0 w-full bg-[#1a1d24] border-t border-slate-800 p-4 z-50">
        <div className="max-w-4xl mx-auto flex gap-2 items-center relative">
          <button onClick={() => setShowEmojis(!showEmojis)} className="text-slate-400 hover:text-indigo-400 p-2"><Smile size={20} /></button>
          {showEmojis && <div className="absolute bottom-14 left-0"><EmojiPicker onEmojiClick={(e) => setInput(p => p + e.emoji)} theme="dark" width={280} height={350} /></div>}
          <form onSubmit={sendMessage} className="flex-1 flex gap-2">
            <input type="text" value={input} onChange={(e) => setInput(e.target.value)} className="flex-1 bg-[#0f1115] border border-slate-700 text-white px-4 py-2.5 rounded-full outline-none focus:border-indigo-500 text-sm" placeholder="Type encrypted message..." autoFocus autoComplete="off" />
            <button type="submit" disabled={!input.trim()} className="bg-indigo-600 text-white w-10 h-10 rounded-full flex items-center justify-center disabled:opacity-50"><Send size={16} className="-ml-0.5" /></button>
          </form>
        </div>
      </div>
    </div>
  );
}