"use client";
import { useState, useEffect, useRef } from "react";
import PusherJS from "pusher-js";
import CryptoJS from "crypto-js";
import { motion, AnimatePresence } from "framer-motion"; // Add Framer Motion
import { ShieldCheck, Send, Smile, Paperclip, BookOpen, Clock, FileText, GraduationCap, LayoutDashboard, Activity, TerminalSquare, Video, Mic } from "lucide-react";
import EmojiPicker from 'emoji-picker-react';

const SECRET_KEY = "tour-404-classified-key";

// --- STUDENT DATABASE (Static & Secure) ---
const STUDENT_REGISTRY = {
  "STU-2026-042": { password: "pass1", channel: "room_alpha_99", name: "Chirag M." },
  "STU-2026-115": { password: "pass2", channel: "room_bravo_22", name: "Rahul S." },
  "STU-2026-089": { password: "pass3", channel: "room_gamma_55", name: "Amit K." }
};

export default function MasterPortal() {
  const [appState, setAppState] = useState("LOGIN"); 
  const [studentId, setStudentId] = useState("");
  const [password, setPassword] = useState("");
  const [currentUser, setCurrentUser] = useState(null);
  const [error, setError] = useState("");

  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [showEmojis, setShowEmojis] = useState(false);
  const bottomRef = useRef(null);
  const clientId = useRef(Math.random().toString(36).substring(7)).current;
  
  // --- NEW: PRESENCE STATE ---
  const [isPeerActive, setIsPeerActive] = useState(false);
  const peerTimeout = useRef(null);

  // --- 1. LOGIN LOGIC ---
  const handleLogin = (e) => {
    e.preventDefault();
    const user = STUDENT_REGISTRY[studentId];
    if (user && user.password === password) {
      setCurrentUser(user);
      setAppState("PORTAL"); 
      setError("");
    } else {
      setError("Invalid Student Credentials or Session Expired.");
    }
  };

  // --- 2. PUSHER & PRESENCE LOGIC ---
  useEffect(() => {
    if (appState !== "CHAT" || !currentUser) return;

    const pusher = new PusherJS(process.env.NEXT_PUBLIC_PUSHER_KEY, {
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER,
    });
    const channel = pusher.subscribe(currentUser.channel);

    channel.bind("receive_message", (data) => {
      if (data.senderId === clientId) return;

      try {
        const bytes = CryptoJS.AES.decrypt(data.encryptedText, SECRET_KEY);
        const decryptedText = bytes.toString(CryptoJS.enc.Utf8);
        
        // INTERCEPT INVISIBLE PING FOR 'ACTIVE NOW' STATUS
        if (decryptedText === "SYS_PING_ACTIVE") {
          setIsPeerActive(true);
          clearTimeout(peerTimeout.current);
          peerTimeout.current = setTimeout(() => setIsPeerActive(false), 5000); // 5 sec no ping = Offline
          return;
        }

        if (decryptedText) {
          setMessages((prev) => [
            ...prev, 
            { id: data.id, text: decryptedText, sender: "them", time: getTime(), createdAt: Date.now() }
          ]);
        }
      } catch (e) {
        console.error("Packet dropped.");
      }
    });

    // START SENDING INVISIBLE PINGS
    const pingInterval = setInterval(() => {
      const pingText = CryptoJS.AES.encrypt("SYS_PING_ACTIVE", SECRET_KEY).toString();
      fetch("/api/pusher", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: Date.now(), encryptedText: pingText, senderId: clientId, channel: currentUser.channel }),
      });
    }, 3000); // Send ping every 3 seconds

    return () => {
      clearInterval(pingInterval);
      clearTimeout(peerTimeout.current);
      pusher.unsubscribe(currentUser.channel);
      pusher.disconnect();
    };
  }, [appState, currentUser, clientId]);

  // --- 3. THE 15-SECOND MESSAGE ANNIHILATOR ---
  useEffect(() => {
    if (appState !== "CHAT") return;
    const disintegrateInterval = setInterval(() => {
      const now = Date.now();
      setMessages(prev => prev.filter(msg => now - msg.createdAt < 15000));
    }, 1000);
    return () => clearInterval(disintegrateInterval);
  }, [appState]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const getTime = () => new Date().toLocaleTimeString("en-US", { hour12: false, hour: '2-digit', minute:'2-digit', second:'2-digit' });

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const currentInput = input;
    const encryptedText = CryptoJS.AES.encrypt(currentInput, SECRET_KEY).toString();
    const msgId = Date.now();

    setMessages((prev) => [...prev, { id: msgId, text: currentInput, sender: "me", time: getTime(), createdAt: Date.now() }]);
    setInput("");
    setShowEmojis(false);

    await fetch("/api/pusher", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: msgId, encryptedText, senderId: clientId, channel: currentUser.channel }),
    });
  };

  const throwFakeMediaError = () => {
    const msgId = Date.now();
    setMessages(prev => [...prev, { id: msgId, text: "[SYS_ERR: UPLINK_BLOCKED_BY_ADMIN_PROXY]", sender: "sys", time: getTime(), createdAt: Date.now() }]);
  };


  // =========================================================================
  // VIEW 1 & 2: LOGIN AND DECOY PORTAL
  // =========================================================================
  if (appState === "LOGIN") {
    return (
      <div className="min-h-screen bg-slate-900 font-sans flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-slate-800 rounded-2xl shadow-xl border border-slate-700 overflow-hidden">
          <div className="bg-blue-600 p-6 text-center text-white">
            <GraduationCap size={40} className="mx-auto mb-2" />
            <h2 className="text-xl font-bold">EduCore Student Portal</h2>
            <p className="text-blue-100 text-xs mt-1">Academic Session 2026 / 2027</p>
          </div>
          <form onSubmit={handleLogin} className="p-6 space-y-4">
            {error && <p className="text-red-400 text-xs font-medium text-center bg-red-500/10 py-2 rounded-lg">{error}</p>}
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Student UID / Login ID</label>
              <input type="text" required placeholder="STU-2026-XXX" value={studentId} onChange={(e) => setStudentId(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Portal Password</label>
              <input type="password" required placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500" />
            </div>
            <button type="submit" className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-2.5 rounded-lg text-sm transition-colors mt-2">Secure Sign In</button>
          </form>
        </div>
      </div>
    );
  }

  if (appState === "PORTAL") {
    return (
      <div className="flex flex-col md:flex-row min-h-screen bg-slate-50 text-slate-800 font-sans">
        <aside className="w-full md:w-64 bg-white border-r border-slate-200 flex flex-col shadow-sm">
          <div className="p-6">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center mb-3 shadow-md"><GraduationCap size={20} className="text-white" /></div>
            <h2 className="text-md font-bold text-slate-800">Welcome, {currentUser.name}</h2>
            <p className="text-xs text-slate-400">Status: Active Student</p>
          </div>
          <nav className="flex-1 px-4 space-y-1 text-sm">
            <button className="w-full flex items-center gap-3 px-3 py-2 text-slate-600 rounded-lg hover:bg-slate-50"><LayoutDashboard size={16} /> Dashboard</button>
            <button className="w-full flex items-center gap-3 px-3 py-2 bg-blue-50 text-blue-700 rounded-lg font-medium"><BookOpen size={16} /> My Courses</button>
            <button className="w-full flex items-center gap-3 px-3 py-2 text-slate-600 rounded-lg hover:bg-slate-50"><FileText size={16} /> Assignments</button>
          </nav>
          <footer onDoubleClick={() => setAppState("CHAT")} className="p-4 text-[10px] text-slate-400 text-center cursor-default select-none hover:text-slate-600 transition-colors">
            © 2026 EduCore Management Systems. v4.1.2
          </footer>
        </aside>
        <main className="flex-1 p-6 overflow-y-auto">
          <div className="flex items-center justify-between border-b pb-4 mb-6">
            <h1 className="text-xl font-bold text-slate-900">TOUR-304: Sustainable Eco-Tourism & Policy</h1>
            <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full">Attendance: 92%</span>
          </div>
          <div className="prose prose-slate max-w-none text-slate-600 space-y-4 text-sm sm:text-base">
            <p className="font-semibold text-slate-800">Module 3.2: Spatial Allocation & Resource Over-consumption</p>
            <p>The intersection of sustainable socio-economic development and international leisure corridors presents a severe geographical conflict.</p>
          </div>
        </main>
      </div>
    );
  }

  // =========================================================================
  // VIEW 3: STEALTH DEVELOPER TERMINAL (THE REAL CHAT)
  // =========================================================================
  if (appState === "CHAT") {
    return (
      <div className="min-h-screen bg-[#0d1117] font-mono flex flex-col relative overflow-hidden text-[#c9d1d9] selection:bg-[#1f6feb] selection:text-white">
        
        {/* HEADER: FAKE LOG VIEWER STATUS */}
        <div className="bg-[#161b22] border-b border-[#30363d] px-6 py-3 flex items-center justify-between z-10 shadow-md">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <TerminalSquare size={16} className="text-[#8b949e]" />
              <span className="text-xs uppercase tracking-widest font-bold text-[#8b949e]">tty1 : Node_{currentUser.channel.substring(0, 5)}</span>
            </div>
            <div className="h-4 w-[1px] bg-slate-700"></div>
            {/* REAL-TIME PRESENCE INDICATOR */}
            {isPeerActive ? (
              <p className="text-emerald-400 text-[10px] uppercase tracking-widest flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span> [ SYS: PEER_ONLINE ]
              </p>
            ) : (
              <p className="text-rose-400 text-[10px] uppercase tracking-widest flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span> [ SYS: PEER_OFFLINE ]
              </p>
            )}
          </div>
          <button onClick={() => setAppState("PORTAL")} className="text-[10px] uppercase tracking-widest hover:text-white text-[#8b949e] px-2 py-1 rounded transition-colors">
            Ctrl+C (Exit)
          </button>
        </div>

        {/* LOG VIEWER: MESSAGES WITH SMOKE ANIMATION */}
        <div className="flex-1 overflow-y-auto p-6 space-y-1 pb-32 z-10 scrollbar-hide">
          <AnimatePresence>
            {messages.map((msg) => (
              <motion.div 
                key={msg.id} 
                initial={{ opacity: 0, x: -10 }} 
                animate={{ opacity: 1, x: 0 }} 
                // THE SMOKE EFFECT
                exit={{ opacity: 0, filter: "blur(12px)", y: -15, transition: { duration: 0.8, ease: "easeOut" } }}
                className="flex items-start gap-3 py-1 hover:bg-[#161b22]/50 transition-colors rounded group"
              >
                <span className="text-[#484f58] text-[11px] mt-0.5 whitespace-nowrap select-none">
                  [{msg.time}]
                </span>
                
                {msg.sender === "sys" ? (
                  <span className="text-rose-500 text-[11px] font-bold mt-0.5 whitespace-nowrap select-none">
                    FATAL:
                  </span>
                ) : (
                  <span className={`text-[11px] font-bold mt-0.5 whitespace-nowrap select-none ${msg.sender === "me" ? "text-[#58a6ff]" : "text-[#3fb950]"}`}>
                    {msg.sender === "me" ? "root@local:~$" : "admin@remote:~$"}
                  </span>
                )}
                
                <span className={`text-sm leading-relaxed break-words ${msg.sender === "sys" ? "text-rose-400" : "text-[#c9d1d9]"}`}>
                  {msg.text}
                </span>
                
                {/* Countdown Timer (Only visible on hover for stealth) */}
                {msg.sender !== "sys" && (
                  <span className="text-[9px] text-[#484f58] ml-auto opacity-0 group-hover:opacity-100 transition-opacity select-none">
                     exp:{15 - Math.floor((Date.now() - msg.createdAt) / 1000)}s
                  </span>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
          <div ref={bottomRef} />
        </div>

        {showEmojis && (
          <div className="absolute bottom-16 left-4 z-50 shadow-2xl opacity-90"><EmojiPicker onEmojiClick={(emoji) => setInput(p => p + emoji.emoji)} theme="dark" width={280} height={350} /></div>
        )}

        {/* TERMINAL INPUT PROMPT */}
        <div className="absolute bottom-0 w-full bg-[#0d1117] border-t border-[#30363d] p-2 z-20">
          <form onSubmit={sendMessage} className="max-w-full mx-auto flex gap-3 items-center bg-[#0d1117] px-2">
            <span className="text-[#3fb950] font-bold text-sm select-none">{'>'}</span>
            <input 
              type="text" value={input} onChange={(e) => setInput(e.target.value)}
              className="flex-1 bg-transparent border-none text-[#c9d1d9] text-sm outline-none font-mono focus:ring-0 placeholder-[#484f58]"
              placeholder="inject command_sequence..." autoFocus autoComplete="off"
            />
            {/* INVISIBLE ICONS (Appear on hover) */}
            <div className="flex gap-2 opacity-10 hover:opacity-100 transition-opacity duration-300">
              <button type="button" onClick={() => setShowEmojis(!showEmojis)} className="p-1.5 text-[#8b949e] hover:text-[#58a6ff]"><Smile size={16} /></button>
              <button type="button" onClick={throwFakeMediaError} className="p-1.5 text-[#8b949e] hover:text-[#58a6ff]"><Paperclip size={16} /></button>
              <button type="button" onClick={throwFakeMediaError} className="p-1.5 text-[#8b949e] hover:text-[#58a6ff]"><Mic size={16} /></button>
              <button type="button" onClick={throwFakeMediaError} className="p-1.5 text-[#8b949e] hover:text-[#58a6ff]"><Video size={16} /></button>
            </div>
          </form>
        </div>
      </div>
    );
  }
}