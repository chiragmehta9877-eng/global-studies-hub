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
  
  const bottomRef = useRef(null);
  const inputRef = useRef(null);
  const prevMsgCount = useRef(0);
  const clientId = useRef(Math.random().toString(36).substring(7)).current;

  // --- THE NEW VIEWPORT HEIGHT STATE ---
  const [viewportHeight, setViewportHeight] = useState("100dvh");

  // --- EXPO TOKEN LISTENER & REGISTRATION ---
  const registerServiceWorkerAndSubscribe = async (user) => {
    // Retry function to wait for Expo to inject the token
    const getExpoToken = () => {
      return new Promise((resolve) => {
        if (window.EXPO_PUSH_TOKEN) {
          resolve(window.EXPO_PUSH_TOKEN);
        } else {
          // Fallback listener agar WebView message se token bhej raha ho
          const messageHandler = (event) => {
            try {
              const data = JSON.parse(event.data);
              if (data.type === "EXPO_PUSH_TOKEN") {
                window.EXPO_PUSH_TOKEN = data.token;
                document.removeEventListener("message", messageHandler);
                window.removeEventListener("message", messageHandler);
                resolve(data.token);
              }
            } catch (e) {}
          };
          document.addEventListener("message", messageHandler);
          window.addEventListener("message", messageHandler);
          
          // Fallback Polling (3 seconds timeout)
          let attempts = 0;
          const interval = setInterval(() => {
            if (window.EXPO_PUSH_TOKEN) {
              clearInterval(interval);
              resolve(window.EXPO_PUSH_TOKEN);
            }
            attempts++;
            if (attempts > 6) { // Give up after 3 seconds (6 * 500ms)
              clearInterval(interval);
              resolve(null);
            }
          }, 500);
        }
      });
    };

    const expoToken = await getExpoToken();

    if (expoToken) {
      try {
        await fetch("/api/subscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ subscription: expoToken, username: user.name }),
        });
        console.log("Native Expo Push Token saved successfully!");
      } catch (err) {
        console.error("Token save failed:", err);
      }
    } else {
      console.log("No Expo Push Token found. Are you running inside the Native Wrapper?");
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
      setMessages((prev) => {
        const filtered = prev.filter((m) => now - m.createdAt < 15000);
        return filtered.length === prev.length ? prev : filtered;
      });
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
        
        // Wrapped in try/catch to keep the execution unblocked on Native Android WebView
        try {
          if (typeof Notification !== "undefined" && Notification.permission !== "granted") {
            await Notification.requestPermission();
          }
        } catch (e) {
          console.log("Web notification request bypassed for Native push flow.");
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
        if (text) setMessages((prev) => [...prev, { id: data.id, text, sender: "them", time: new Date().toLocaleTimeString([], {hour:'2-digit', minute:'2-digit', second:'2-digit'}), createdAt: Date.now() }]);
      } catch(e) {}
    });
    return () => { pusher.unsubscribe(currentUser.channel); pusher.disconnect(); };
  }, [appState, currentUser, clientId]);

  // --- MASTER AUTO-SCROLL & VIEWPORT CONTROLLER ---
  const scrollToBottom = () => {
    setTimeout(() => {
      bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
    }, 50);
  };

  useEffect(() => {
    if (messages.length > prevMsgCount.current) {
      scrollToBottom();
    }
    prevMsgCount.current = messages.length;
  }, [messages]);

  useEffect(() => {
    if (appState !== "CHAT") return;
    
    const handleResize = () => {
      if (window.visualViewport) {
        setViewportHeight(`${window.visualViewport.height}px`);
      } else {
        setViewportHeight(`${window.innerHeight}px`);
      }
      scrollToBottom();
    };
    
    if (window.visualViewport) {
      window.visualViewport.addEventListener("resize", handleResize);
    } else {
      window.addEventListener("resize", handleResize);
    }
    
    handleResize();

    return () => {
      if (window.visualViewport) {
        window.visualViewport.removeEventListener("resize", handleResize);
      } else {
        window.removeEventListener("resize", handleResize);
      }
    };
  }, [appState]);

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    
    const encryptedText = CryptoJS.AES.encrypt(input, SECRET_KEY).toString();
    setMessages((prev) => [...prev, { id: Date.now(), text: input, sender: "me", time: new Date().toLocaleTimeString([], {hour:'2-digit', minute:'2-digit', second:'2-digit'}), createdAt: Date.now() }]);
    setInput("");
    setShowEmojis(false);
    
    inputRef.current?.focus();

    await fetch("/api/pusher", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: Date.now(), encryptedText, senderId: clientId, channel: currentUser.channel }),
    });
  };

  const handlePingPartner = async () => {
    setIsPinging(true);
    const myToken = window.EXPO_PUSH_TOKEN;

    if (!myToken) {
      alert("Error: Native Token nahi mila!");
      setIsPinging(false);
      return;
    }

    try {
      await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: myToken,
          title: "System Test",
          body: "Native Push is ALIVE!",
          priority: 'high',
          sound: 'default'
        }),
      });
      setTimeout(() => setIsPinging(false), 2000);
    } catch (error) {
      console.error(error);
      setIsPinging(false);
    }
  };

  if (appState === "DECOY") {
    return <ModernDecoy onTrigger={() => setAppState("PORTAL_LOGIN")} />;
  }

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
              id="username"
              name="username"
              type="text" 
              autoComplete="username"
              placeholder="e.g., stu-1044" 
              className="w-full bg-slate-50 border border-slate-200 p-3 rounded-lg text-sm focus:border-blue-500 outline-none" 
              onChange={(e) => setStudentId(e.target.value)} 
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase mb-1.5">Access PIN</label>
            <input 
              id="password"
              name="password"
              type="password" 
              autoComplete="current-password"
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
        <button type="button" onClick={() => setAppState("DECOY")} className="mt-6 text-sm text-slate-500 hover:text-blue-600 font-medium">← Return to Directory</button>
      </div>
    </div>
  );

  return (
    <div 
      style={{ height: viewportHeight }} 
      className="fixed top-0 left-0 w-full bg-[#0d1117] font-mono flex flex-col overflow-hidden text-[#c9d1d9] selection:bg-[#1f6feb] selection:text-white"
    >
      <div className="bg-[#161b22] border-b border-[#30363d] px-3 md:px-6 py-3 flex flex-wrap justify-between items-center z-10 shadow-md gap-2 shrink-0">
        <div className="flex items-center gap-2">
          <TerminalSquare size={16} className="text-[#8b949e] hidden sm:block" />
          <span className="text-[10px] sm:text-xs uppercase tracking-widest font-bold text-[#8b949e]">tty1 : {currentUser?.name}</span>
        </div>
        
        <div className="flex items-center gap-2">
          <button onClick={handlePingPartner} disabled={isPinging} className={`flex items-center gap-1.5 text-[10px] sm:text-xs px-2 py-1.5 rounded transition-colors border ${isPinging ? "bg-[#21262d] text-slate-500 border-[#30363d] cursor-not-allowed" : "bg-emerald-900/10 text-emerald-500 border-emerald-900/30 hover:bg-emerald-900/30"}`}>
            <Bell size={12} className={isPinging ? "" : "animate-bounce"} /> {isPinging ? "Signal Sent" : "Ping Node"}
          </button>
          <button onClick={() => setAppState("DECOY")} className="flex items-center gap-1.5 text-[10px] sm:text-xs bg-rose-900/10 text-rose-500 hover:bg-rose-900/30 border border-rose-900/30 px-2 py-1.5 rounded">
            <LogOut size={12} /> Exit
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-3 md:p-6 pb-6 space-y-1 z-10 scrollbar-hide">
        <AnimatePresence>
          {messages.map((m) => (
            <motion.div 
              key={m.id} 
              initial={{ opacity: 0, x: -10 }} 
              animate={{ opacity: 1, x: 0 }} 
              exit={{ opacity: 0, filter: "blur(12px)", y: -15, transition: { duration: 0.8, ease: "easeOut" } }}
              className="flex items-start gap-2 py-1 hover:bg-[#161b22]/50 transition-colors rounded group"
            >
              <span className="text-[#484f58] text-[9px] sm:text-[11px] mt-0.5 whitespace-nowrap select-none">
                [{m.time}]
              </span>
              
              <span className={`text-[10px] sm:text-[11px] font-bold mt-0.5 whitespace-nowrap select-none ${m.sender === "me" ? "text-[#58a6ff]" : "text-[#3fb950]"}`}>
                {m.sender === "me" ? "root@local:~$" : "admin@remote:~$"}
              </span>
              
              <span className="text-xs sm:text-sm leading-relaxed break-words text-[#c9d1d9] flex-1">
                {m.text}
              </span>
              
              <span className="text-[8px] sm:text-[9px] text-[#484f58] ml-auto opacity-0 group-hover:opacity-100 transition-opacity select-none hidden md:block">
                  exp:{15 - Math.floor((Date.now() - m.createdAt) / 1000)}s
              </span>
            </motion.div>
          ))}
        </AnimatePresence>
        <div ref={bottomRef} className="h-2" />
      </div>

      {showEmojis && (
        <div className="absolute bottom-[60px] left-2 sm:left-4 z-50 shadow-2xl opacity-95">
          <EmojiPicker 
            onEmojiClick={(emoji) => setInput(p => p + emoji.emoji)} 
            theme="dark" 
            width={280} 
            height={300} 
            previewConfig={{ showPreview: false }} 
          />
        </div>
      )}

      <div className="w-full bg-[#0d1117] border-t border-[#30363d] p-2 z-20 shrink-0">
        <div className="max-w-full mx-auto flex gap-2 items-center bg-[#0d1117] px-1">
          <button type="button" onClick={() => setShowEmojis(!showEmojis)} className="p-1.5 text-[#8b949e] hover:text-[#58a6ff]">
            <Smile size={18} />
          </button>
          
          <form onSubmit={sendMessage} className="flex-1 flex gap-2 items-center">
            <span className="text-[#3fb950] font-bold text-sm select-none">{'>'}</span>
            <input 
              ref={inputRef} 
              type="text" 
              value={input} 
              onChange={(e) => setInput(e.target.value)}
              onFocus={() => setTimeout(scrollToBottom, 300)}
              className="flex-1 bg-transparent border-none text-[#c9d1d9] text-sm outline-none font-mono focus:ring-0 placeholder-[#484f58] py-2"
              placeholder="inject command..." 
              autoComplete="off"
            />
            <button 
              type="submit" 
              disabled={!input.trim()} 
              onMouseDown={(e) => e.preventDefault()}
              onTouchStart={(e) => e.preventDefault()}
              className="p-1.5 text-[#58a6ff] hover:text-white disabled:opacity-50 transition-colors"
            >
              <Send size={16} />
            </button>
          </form>
        </div>
      </div>
      
    </div>
  );
}