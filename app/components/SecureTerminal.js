"use client";
import { useState, useEffect, useRef } from "react";
import PusherJS from "pusher-js";
import CryptoJS from "crypto-js";
import { ShieldCheck, Lock, Send, Smile, Paperclip, MoreVertical, BookOpen, Calendar, Clock, FileText, GraduationCap, LayoutDashboard, Settings, Video, ChevronRight, Award, User } from "lucide-react";
import EmojiPicker from 'emoji-picker-react';

const SECRET_KEY = "tour-404-classified-key";

// --- STUDENT DATABASE (Static & Secure) ---
const STUDENT_REGISTRY = {
  "STU-2026-042": { password: "pass1", channel: "room_alpha_99", name: "Chirag M." },
  "STU-2026-115": { password: "pass2", channel: "room_bravo_22", name: "Rahul S." },
  "STU-2026-089": { password: "pass3", channel: "room_gamma_55", name: "Amit K." }
};

export default function MasterPortal() {
  // App States: 'LOGIN' | 'PORTAL' | 'CHAT'
  const [appState, setAppState] = useState("LOGIN"); 
  const [studentId, setStudentId] = useState("");
  const [password, setPassword] = useState("");
  const [currentUser, setCurrentUser] = useState(null);
  const [error, setError] = useState("");

  // Chat States
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [showEmojis, setShowEmojis] = useState(false);
  const bottomRef = useRef(null);
  const clientId = useRef(Math.random().toString(36).substring(7)).current;

  // --- 1. LOGIN LOGIC ---
  const handleLogin = (e) => {
    e.preventDefault();
    const user = STUDENT_REGISTRY[studentId];
    if (user && user.password === password) {
      setCurrentUser(user);
      setAppState("PORTAL"); // Successfully logged into boring notes portal
      setError("");
    } else {
      setError("Invalid Student Credentials or Session Expired.");
    }
  };

  // --- 2. PUSHER REAL-TIME CONNECTION ---
  useEffect(() => {
    if (appState !== "CHAT" || !currentUser) return;

    const pusher = new PusherJS(process.env.NEXT_PUBLIC_PUSHER_KEY, {
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER,
    });

    // Subscribing to the user's UNIQUE private channel
    const channel = pusher.subscribe(currentUser.channel);

    channel.bind("receive_message", (data) => {
      if (data.senderId === clientId) return;

      try {
        const bytes = CryptoJS.AES.decrypt(data.encryptedText, SECRET_KEY);
        const decryptedText = bytes.toString(CryptoJS.enc.Utf8);
        if (decryptedText) {
          setMessages((prev) => [
            ...prev, 
            { id: data.id, text: decryptedText, sender: "them", time: getTime() }
          ]);
        }
      } catch (e) {
        console.error("Packet dropped.");
      }
    });

    return () => {
      pusher.unsubscribe(currentUser.channel);
      pusher.disconnect();
    };
  }, [appState, currentUser, clientId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const getTime = () => new Date().toLocaleTimeString("en-US", { hour12: false, hour: '2-digit', minute:'2-digit' });

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const currentInput = input;
    const encryptedText = CryptoJS.AES.encrypt(currentInput, SECRET_KEY).toString();
    const msgId = Date.now();

    setMessages((prev) => [...prev, { id: msgId, text: currentInput, sender: "me", time: getTime() }]);
    setInput("");
    setShowEmojis(false);

    // Hit the serverless route along with the dynamic channel name
    await fetch("/api/pusher", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: msgId, encryptedText, senderId: clientId, channel: currentUser.channel }),
    });
  };

  // =========================================================================
  // RENDER SCREEN 1: THE INNOCENT STUDENT PORTAL LOGIN
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
              <input 
                type="text" required placeholder="STU-2026-XXX" value={studentId} onChange={(e) => setStudentId(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Portal Password</label>
              <input 
                type="password" required placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500"
              />
            </div>
            <button type="submit" className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-2.5 rounded-lg text-sm transition-colors mt-2">
              Secure Sign In
            </button>
          </form>
        </div>
      </div>
    );
  }

  // =========================================================================
  // RENDER SCREEN 2: MODERN COURSE NOTES (THE PERFECT DISGUISE)
  // =========================================================================
  if (appState === "PORTAL") {
    return (
      <div className="flex flex-col md:flex-row min-h-screen bg-slate-50 text-slate-800">
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
          {/* THE SECRET TRIGGER: Double Clicking the copyright launches the chat */}
          <footer 
            onDoubleClick={() => setAppState("CHAT")} 
            className="p-4 text-[10px] text-slate-400 text-center cursor-default select-none hover:text-slate-600 transition-colors"
          >
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
            <p>The intersection of sustainable socio-economic development and international leisure corridors presents a severe geographical conflict. Resource strain heavily impacts local communities.</p>
            <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-r-xl">
              <p className="text-xs text-blue-900 font-medium">IMPORTANT Notice: Terminal evaluations (Mid-terms) begin from the upcoming weekday session. Please sync all notes locally.</p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // =========================================================================
  // RENDER SCREEN 3: HIGH-END CORPORATE CHAT WINDOW (THE TERMINAL)
  // =========================================================================
  if (appState === "CHAT") {
    return (
      <div className="min-h-screen bg-[#0f1115] font-sans flex flex-col relative overflow-hidden">
        <div className="bg-[#1a1d24] border-b border-slate-800 px-6 py-4 flex items-center justify-between z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-600/20 rounded-full flex items-center justify-center"><ShieldCheck size={20} className="text-indigo-500" /></div>
            <div>
              <h1 className="text-slate-100 font-semibold text-sm">Secure Workspace Channel: {currentUser.channel}</h1>
              <p className="text-indigo-400/80 text-xs flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span> Isolated Node Connection
              </p>
            </div>
          </div>
          <button onClick={() => setAppState("PORTAL")} className="text-xs bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 px-3 py-1.5 rounded-lg transition-colors">
            Exit Logs
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-32 z-10">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex flex-col ${msg.sender === "me" ? "items-end" : "items-start"}`}>
              <div className={`max-w-[70%] px-4 py-2 rounded-2xl text-sm ${msg.sender === "me" ? "bg-indigo-600 text-white rounded-br-none" : "bg-[#1a1d24] text-slate-200 border border-slate-800 rounded-bl-none"}`}>
                {msg.text}
              </div>
              <span className="text-[9px] text-slate-500 mt-1 px-1">{msg.time}</span>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>

        {showEmojis && (
          <div className="absolute bottom-20 left-4 z-50"><EmojiPicker onEmojiClick={(emoji) => setInput(p => p + emoji.emoji)} theme="dark" width={280} height={350} /></div>
        )}

        <div className="absolute bottom-0 w-full bg-[#1a1d24] border-t border-slate-800 p-4 z-20">
          <form onSubmit={sendMessage} className="max-w-4xl mx-auto flex gap-2 items-center">
            <button type="button" onClick={() => setShowEmojis(!showEmojis)} className="p-2 text-slate-400 hover:text-indigo-400"><Smile size={20} /></button>
            <input 
              type="text" value={input} onChange={(e) => setInput(e.target.value)}
              className="flex-1 bg-[#0f1115] border border-slate-700 rounded-full px-4 py-2 text-slate-200 text-sm outline-none focus:border-indigo-500"
              placeholder="Inject command context..." autoFocus autoComplete="off"
            />
            <button type="submit" disabled={!input.trim()} className="p-2 bg-indigo-600 text-white rounded-full disabled:opacity-50"><Send size={16} /></button>
          </form>
        </div>
      </div>
    );
  }
}