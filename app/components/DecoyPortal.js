"use client";
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence, useScroll, useTransform } from "framer-motion";
import { Search, GraduationCap, ChevronRight, FileText, X, BookOpen, Beaker, Library, LayoutDashboard, Globe, Shield, Database, Users, Award, Zap, Send, Menu, Cpu, TrendingUp, Compass, Monitor } from "lucide-react";

export default function ModernDecoy({ onTrigger }) {
  const [query, setQuery] = useState("");
  const [studyData, setStudyData] = useState([]);
  const [triggerWord, setTriggerWord] = useState("");
  const [selectedReport, setSelectedReport] = useState(null);
  const [activeTab, setActiveTab] = useState("home"); 
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Contact Form State
  const [contactForm, setContactForm] = useState({ name: "", email: "", message: "" });
  const [isSending, setIsSending] = useState(false);

  // Parallax Scroll Setup
  const { scrollY } = useScroll();
  const y1 = useTransform(scrollY, [0, 1000], [0, 300]);
  const y2 = useTransform(scrollY, [0, 1000], [0, -200]);
  const opacityHero = useTransform(scrollY, [0, 400], [1, 0]);

  // DOUBLE-COUNT FIX: React StrictMode runs useEffect twice. This ref stops it.
  const hasInitialized = useRef(false);

  useEffect(() => {
    if (!hasInitialized.current) {
      fetchContent();
      fetchSettings();
      trackEvent("VIEW_TAB", "home"); // Initial page load tracked only once
      hasInitialized.current = true;
    }
  }, []);

  // --- ANALYTICS TRACKING ENGINE ---
  const trackEvent = async (actionType, details = "") => {
    try {
      await fetch("/api/analytics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ actionType, details })
      });
    } catch(e) { console.error("Tracking failed"); }
  };

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    trackEvent("VIEW_TAB", tabId);
    setIsMobileMenuOpen(false); // Close mobile sidebar after clicking a tab
  };

  const fetchContent = async () => {
    const res = await fetch("/api/admin/content");
    const data = await res.json();
    if (data.success) setStudyData(data.items);
  };

  const fetchSettings = async () => {
    const res = await fetch("/api/settings");
    const data = await res.json();
    if (data.success) setTriggerWord(data.triggerWord);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    trackEvent("SEARCH", query); // Track Search

    const activeTrigger = triggerWord ? triggerWord.trim().toUpperCase() : "TOUR-404-LIVE";
    const userQuery = query.trim().toUpperCase();

    if (userQuery === activeTrigger) {
      setQuery(""); 
      onTrigger(); 
    } else {
      alert("Searching global archives for: " + query);
      setQuery(""); 
    }
  };

  const handleContactSubmit = async (e) => {
    e.preventDefault();
    setIsSending(true);
    try {
      await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(contactForm)
      });
      alert('Enquiry submitted successfully.'); // Normal Message
      setContactForm({ name: "", email: "", message: "" });
    } catch(err) {
      alert("Error sending message.");
    }
    setIsSending(false);
  };

  const openReport = (item) => {
    setSelectedReport(item);
    trackEvent("VIEW_REPORT", item.title); // Track Report View
  };

  const getFilteredData = () => {
    if (activeTab === "home") return studyData.slice(0, 3);
    if (activeTab === "research") return studyData.filter(item => item.category?.toLowerCase().includes("research") || item.category?.toLowerCase().includes("journal"));
    if (activeTab === "courses") return studyData.filter(item => item.category?.toLowerCase().includes("course") || item.category?.toLowerCase().includes("module"));
    if (activeTab === "library") return studyData.filter(item => item.category?.toLowerCase().includes("library") || item.category?.toLowerCase().includes("book"));
    return studyData;
  };

  const filteredData = getFilteredData();

  return (
    <div className="min-h-screen bg-[#fafbfc] text-slate-900 font-sans selection:bg-indigo-100 overflow-x-hidden">
      
      {/* NAVBAR */}
      <nav className="border-b border-slate-200/60 py-4 px-6 md:px-8 flex justify-between items-center sticky top-0 bg-white/80 backdrop-blur-xl z-50 transition-all">
        <div onClick={() => handleTabChange("home")} className="flex items-center gap-2 cursor-pointer group">
          <div className="bg-gradient-to-tr from-indigo-600 to-violet-500 p-1.5 rounded-lg text-white shadow-lg shadow-indigo-500/20 group-hover:rotate-12 transition-transform">
            <GraduationCap size={20} />
          </div>
          <span className="font-bold tracking-tight text-slate-800 text-lg md:text-xl">Global Studies Archive</span>
        </div>
        
        {/* DESKTOP TABS */}
        <div className="hidden md:flex gap-8 text-sm font-semibold text-slate-500">
          {[
            { id: "research", label: "Research", icon: <Beaker size={16}/> },
            { id: "courses", label: "Courses", icon: <BookOpen size={16}/> },
            { id: "library", label: "Library", icon: <Library size={16}/> }
          ].map((navItem) => (
            <button 
              key={navItem.id}
              onClick={() => handleTabChange(navItem.id)}
              className={`relative flex items-center gap-2 transition-all duration-300 ${activeTab === navItem.id ? "text-indigo-600 drop-shadow-sm" : "hover:text-indigo-500"}`}
            >
              {navItem.icon} {navItem.label}
              {activeTab === navItem.id && <motion.div layoutId="navIndicator" className="absolute -bottom-5 left-0 right-0 h-0.5 bg-indigo-600 rounded-full" />}
            </button>
          ))}
        </div>

        {/* MOBILE MENU ICON */}
        <button onClick={() => setIsMobileMenuOpen(true)} className="md:hidden text-slate-600 hover:text-indigo-600 p-1">
          <Menu size={28} />
        </button>
      </nav>

      {/* MOBILE SLIDE BAR (SIDEBAR) */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[60] md:hidden"
            />
            <motion.div 
              initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 bottom-0 w-3/4 max-w-sm bg-white z-[70] shadow-2xl flex flex-col md:hidden"
            >
              <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                <div className="flex items-center gap-2 text-indigo-600">
                  <LayoutDashboard size={20}/>
                  <span className="font-bold text-slate-800 text-lg">Menu</span>
                </div>
                <button onClick={() => setIsMobileMenuOpen(false)} className="text-slate-400 hover:text-rose-500 bg-slate-50 p-2 rounded-full">
                  <X size={20}/>
                </button>
              </div>
              
              <div className="flex flex-col p-4 gap-2">
                {[
                  { id: "home", label: "Home", icon: <LayoutDashboard size={20}/> },
                  { id: "research", label: "Research", icon: <Beaker size={20}/> },
                  { id: "courses", label: "Courses", icon: <BookOpen size={20}/> },
                  { id: "library", label: "Library", icon: <Library size={20}/> }
                ].map((navItem) => (
                  <button 
                    key={navItem.id} 
                    onClick={() => handleTabChange(navItem.id)} 
                    className={`flex items-center gap-4 p-4 rounded-xl font-bold transition-all ${activeTab === navItem.id ? "bg-indigo-50 text-indigo-600" : "text-slate-600 hover:bg-slate-50"}`}
                  >
                    {navItem.icon} {navItem.label}
                  </button>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* SEARCH BAR */}
      <div className="bg-white border-b border-slate-100 py-4 md:py-6 px-4 md:px-8 shadow-sm relative z-40">
        <form onSubmit={handleSearch} className="max-w-4xl mx-auto relative group">
          <div className="absolute inset-y-0 left-4 md:left-5 flex items-center text-slate-400 group-focus-within:text-indigo-600 transition-colors"><Search size={20} /></div>
          <input type="text" value={query} onChange={e => setQuery(e.target.value)} placeholder="Search global databases, courses, or encrypted journals..." className="w-full bg-slate-50 border border-slate-200 py-3.5 pl-12 pr-6 rounded-full shadow-inner outline-none focus:bg-white focus:ring-4 ring-indigo-500/10 focus:border-indigo-500 transition-all text-sm font-medium" />
        </form>
      </div>

      <main className="relative">
        <AnimatePresence mode="wait">
          
          {/* VIEW 1: HOME PAGE */}
          {activeTab === "home" && (
            <motion.div key="home" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              
              {/* HERO SECTION */}
              <section className="relative overflow-hidden pt-16 md:pt-24 pb-20 md:pb-32 text-center border-b border-slate-100 px-4">
                <motion.div style={{ y: y1 }} className="absolute -top-20 -left-20 w-72 md:w-96 h-72 md:h-96 bg-indigo-100 rounded-full mix-blend-multiply filter blur-3xl opacity-50 z-0" />
                <motion.div style={{ y: y2 }} className="absolute top-20 -right-20 w-56 md:w-72 h-56 md:h-72 bg-violet-100 rounded-full mix-blend-multiply filter blur-3xl opacity-50 z-0" />
                <motion.div style={{ opacity: opacityHero }} className="relative z-10 max-w-4xl mx-auto">
                  <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="inline-block mb-4 md:mb-6 px-4 py-1.5 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-600 text-[10px] md:text-xs font-bold tracking-widest uppercase shadow-sm">Open Source Academic Intelligence</motion.div>
                  <motion.h1 initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 }} className="text-4xl md:text-7xl font-black text-slate-900 mb-6 tracking-tighter leading-tight">Advancing Global Knowledge <br/> <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-violet-500">Beyond Borders.</span></motion.h1>
                  <motion.p initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }} className="max-w-2xl mx-auto text-slate-500 text-base md:text-xl font-medium leading-relaxed">Access peer-reviewed journals, policy frameworks, and comprehensive course materials curated by the world's leading research institutions.</motion.p>
                </motion.div>
              </section>

              {/* STATS SECTION */}
              <section className="py-10 bg-white border-b border-slate-100 relative z-20 shadow-sm">
                <div className="max-w-7xl mx-auto px-4 md:px-8 grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8 md:divide-x divide-slate-100">
                  <div className="text-center px-2"><Database className="mx-auto text-indigo-500 mb-2 md:mb-3" size={24}/><h3 className="text-2xl md:text-3xl font-black text-slate-800">12.5M+</h3><p className="text-[10px] md:text-xs font-bold text-slate-400 uppercase mt-1">Indexed Papers</p></div>
                  <div className="text-center px-2"><Globe className="mx-auto text-violet-500 mb-2 md:mb-3" size={24}/><h3 className="text-2xl md:text-3xl font-black text-slate-800">140+</h3><p className="text-[10px] md:text-xs font-bold text-slate-400 uppercase mt-1">Global Partners</p></div>
                  <div className="text-center px-2 mt-4 md:mt-0"><Users className="mx-auto text-blue-500 mb-2 md:mb-3" size={24}/><h3 className="text-2xl md:text-3xl font-black text-slate-800">850k</h3><p className="text-[10px] md:text-xs font-bold text-slate-400 uppercase mt-1">Active Researchers</p></div>
                  <div className="text-center px-2 mt-4 md:mt-0"><Shield className="mx-auto text-emerald-500 mb-2 md:mb-3" size={24}/><h3 className="text-2xl md:text-3xl font-black text-slate-800">99.9%</h3><p className="text-[10px] md:text-xs font-bold text-slate-400 uppercase mt-1">Data Integrity</p></div>
                </div>
              </section>

              {/* FEATURED RESEARCH SECTION */}
              <section className="py-16 md:py-24 max-w-7xl mx-auto px-6 md:px-8">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-10 gap-4">
                  <div>
                    <h2 className="text-2xl md:text-3xl font-black text-slate-900 flex items-center gap-2 md:gap-3"><LayoutDashboard size={24} className="text-indigo-500 md:w-7 md:h-7"/> Featured Research Briefs</h2>
                    <p className="text-slate-500 mt-2 font-medium text-sm md:text-base">Recently curated documents from our top-tier academic network.</p>
                  </div>
                  <button onClick={() => handleTabChange("research")} className="text-indigo-600 font-bold text-sm flex items-center gap-1 hover:gap-2 transition-all">View Complete Archive <ChevronRight size={18}/></button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
                  <AnimatePresence>
                    {filteredData.map((item, i) => (
                      <motion.div 
                        layout key={item._id}
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, margin: "-50px" }}
                        transition={{ delay: i * 0.1, duration: 0.5 }}
                        onClick={() => openReport(item)} 
                        className="group relative p-6 md:p-8 bg-white border border-slate-200/75 rounded-3xl md:rounded-[2rem] hover:shadow-2xl hover:shadow-indigo-500/10 hover:-translate-y-2 transition-all duration-300 cursor-pointer flex flex-col h-full overflow-hidden"
                      >
                        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-indigo-50 to-transparent rounded-bl-full opacity-50 transition-opacity group-hover:opacity-100 z-0"></div>
                        <div className="w-12 h-12 md:w-14 md:h-14 bg-slate-50 text-slate-400 border border-slate-100 rounded-2xl flex items-center justify-center mb-5 md:mb-6 group-hover:bg-indigo-600 group-hover:text-white group-hover:border-indigo-600 transition-all z-10 shadow-sm"><FileText size={20} className="md:w-6 md:h-6" /></div>
                        <h3 className="text-lg md:text-xl font-bold mb-3 text-slate-800 leading-tight z-10">{item.title}</h3>
                        <p className="text-slate-500 text-xs md:text-sm leading-relaxed mb-6 md:mb-8 line-clamp-3 flex-grow z-10">{item.description}</p>
                        <div className="flex items-center justify-between pt-4 md:pt-5 border-t border-slate-100 z-10">
                          <span className="text-[9px] md:text-[10px] font-bold uppercase tracking-widest text-indigo-600 bg-indigo-50 px-2.5 py-1 md:px-3 md:py-1.5 rounded-md">{item.category || "General"}</span>
                          <span className="text-slate-300 group-hover:text-indigo-600 group-hover:translate-x-1 transition-all"><ChevronRight size={18}/></span>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </section>

              {/* ACADEMIC COURSE NOTES INFOGRAPHIC */}
              <section className="py-20 md:py-28 bg-white border-t border-slate-100 relative z-20">
                <div className="max-w-7xl mx-auto px-6 md:px-8">
                  <div className="text-center max-w-3xl mx-auto mb-16">
                    <motion.div initial={{ scale: 0.9, opacity: 0 }} whileInView={{ scale: 1, opacity: 1 }} viewport={{ once: true }} className="inline-block mb-4 px-4 py-1.5 rounded-full bg-blue-50 border border-blue-100 text-blue-600 text-[10px] md:text-xs font-bold tracking-widest uppercase shadow-sm">Academic Disciplines</motion.div>
                    <h2 className="text-3xl md:text-5xl font-black text-slate-900 mb-6">Comprehensive Course Materials</h2>
                    <p className="text-slate-500 text-base md:text-lg">Our archives house meticulously curated lecture notes, research papers, and exam preparations across major undergraduate and postgraduate programs.</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {[
                      { icon: <Cpu size={28}/>, title: "Engineering & IT", courses: "B.Tech • M.Tech • BCA", color: "from-blue-500 to-cyan-500", bg: "bg-blue-50", text: "text-blue-600" },
                      { icon: <TrendingUp size={28}/>, title: "Business & Management", courses: "BBA • MBA • PGDM", color: "from-emerald-500 to-teal-500", bg: "bg-emerald-50", text: "text-emerald-600" },
                      { icon: <Compass size={28}/>, title: "Tourism & Hospitality", courses: "BTTM • MTTM • Aviation", color: "from-amber-500 to-orange-500", bg: "bg-amber-50", text: "text-amber-600" },
                      { icon: <Monitor size={28}/>, title: "Applied Sciences", courses: "B.Sc • M.Sc • Research", color: "from-violet-500 to-purple-500", bg: "bg-violet-50", text: "text-violet-600" }
                    ].map((faculty, idx) => (
                      <motion.div 
                        key={idx} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: idx * 0.15 }}
                        className="relative p-8 bg-white border border-slate-100 rounded-[2rem] shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group overflow-hidden"
                      >
                        <div className={`absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r ${faculty.color} opacity-80 group-hover:opacity-100 transition-opacity`}></div>
                        <div className={`w-14 h-14 ${faculty.bg} ${faculty.text} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                          {faculty.icon}
                        </div>
                        <h3 className="text-xl font-bold text-slate-800 mb-2">{faculty.title}</h3>
                        <p className="text-sm font-semibold text-slate-500 mb-4">{faculty.courses}</p>
                        <ul className="space-y-2 text-xs text-slate-400">
                          <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-slate-300"></div> Complete Lecture Notes</li>
                          <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-slate-300"></div> Previous Year Papers</li>
                          <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-slate-300"></div> Research Methodologies</li>
                        </ul>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </section>

              {/* WHY CHOOSE US */}
              <section className="py-16 md:py-24 bg-slate-50 border-y border-slate-200">
                <div className="max-w-7xl mx-auto px-6 md:px-8">
                  <div className="text-center max-w-2xl mx-auto mb-12 md:mb-16">
                    <h2 className="text-2xl md:text-3xl font-black text-slate-900 mb-3 md:mb-4">Uncompromising Academic Integrity</h2>
                    <p className="text-slate-500 text-sm md:text-base">Our repository is built on strict peer-reviewed standards, ensuring your research is backed by verified, unalterable data.</p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-10">
                    {[
                      { icon: <Award size={28}/>, title: "Peer-Reviewed Excellence", desc: "Every journal and dataset passes through a rigorous double-blind peer review process by our academic council." },
                      { icon: <Shield size={28}/>, title: "Encrypted Archives", desc: "Historical data and sensitive geopolitical policy frameworks are stored using AES-256 encryption standards." },
                      { icon: <Zap size={28}/>, title: "Real-Time Policy Index", desc: "Access the latest shifts in macro-environmental dynamics and global trade agreements the moment they are ratified." }
                    ].map((feature, idx) => (
                      <motion.div key={idx} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: idx * 0.2 }} className="bg-white p-6 md:p-8 rounded-3xl border border-slate-100 shadow-sm text-center hover:shadow-md transition-shadow">
                        <div className="w-14 h-14 md:w-16 md:h-16 mx-auto bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mb-5 md:mb-6">{feature.icon}</div>
                        <h3 className="text-lg md:text-xl font-bold text-slate-800 mb-3">{feature.title}</h3>
                        <p className="text-slate-500 text-xs md:text-sm leading-relaxed">{feature.desc}</p>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </section>
            </motion.div>
          )}

          {/* VIEW 2: OTHER TABS */}
          {activeTab !== "home" && (
            <motion.div key="other-tabs" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-7xl mx-auto px-6 md:px-8 py-10 md:py-16 min-h-[60vh]">
              <div className="mb-10 md:mb-12 border-b border-slate-200 pb-6 md:pb-8">
                <h1 className="text-3xl md:text-4xl font-black text-slate-900 capitalize flex items-center gap-3">
                  {activeTab === "research" && <Beaker className="text-indigo-600" size={32}/>}
                  {activeTab === "courses" && <BookOpen className="text-violet-600" size={32}/>}
                  {activeTab === "library" && <Library className="text-blue-600" size={32}/>}
                  Global {activeTab}
                </h1>
                <p className="text-slate-500 mt-2 text-base md:text-lg font-medium">
                  {activeTab === "research" && "Exploring geopolitical data and peer-reviewed journals."}
                  {activeTab === "courses" && "Interactive academic modules, B.Tech, MBA notes and certification tracks."}
                  {activeTab === "library" && "Archived documents, historical records, and policy frameworks."}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
                <AnimatePresence>
                  {filteredData.length > 0 ? (
                    filteredData.map((item, i) => (
                      <motion.div 
                        layout key={item._id} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} transition={{ delay: i * 0.05 }}
                        onClick={() => openReport(item)} 
                        className="group relative p-6 md:p-8 bg-white border border-slate-200/75 rounded-3xl md:rounded-[2rem] hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer flex flex-col h-full"
                      >
                        <div className="w-12 h-12 bg-slate-50 text-slate-400 border border-slate-100 rounded-2xl flex items-center justify-center mb-5 md:mb-6 group-hover:bg-indigo-600 group-hover:text-white transition-all z-10"><FileText size={20} /></div>
                        <h3 className="text-lg md:text-xl font-bold mb-3 text-slate-800 leading-tight z-10">{item.title}</h3>
                        <p className="text-slate-500 text-xs md:text-sm leading-relaxed mb-6 md:mb-8 line-clamp-3 flex-grow z-10">{item.description}</p>
                        {activeTab === "courses" && <div className="w-full bg-slate-100 h-1.5 rounded-full mb-5 md:mb-6 overflow-hidden"><div className="bg-violet-500 h-full rounded-full" style={{ width: `${Math.floor(Math.random() * 60) + 10}%` }}></div></div>}
                        <div className="flex items-center justify-between pt-4 border-t border-slate-100 z-10">
                          <span className="text-[9px] md:text-[10px] font-bold uppercase tracking-widest text-indigo-600 bg-indigo-50 px-2.5 py-1.5 rounded-md">{item.category || "General"}</span>
                          <span className="text-slate-400 group-hover:text-indigo-600 transition-all"><ChevronRight size={18}/></span>
                        </div>
                      </motion.div>
                    ))
                  ) : (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="col-span-full py-16 md:py-20 text-center border border-dashed border-slate-200 rounded-3xl md:rounded-[2rem] bg-slate-50">
                      <div className="inline-flex items-center justify-center w-16 h-16 md:w-20 md:h-20 bg-white rounded-full mb-4 text-slate-400 shadow-sm"><Search size={28} className="md:w-8 md:h-8" /></div>
                      <h3 className="text-lg md:text-xl font-bold text-slate-700">No records found</h3>
                      <p className="text-slate-500 mt-2 text-sm md:text-base">No documents have been classified under this sector yet.</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* FOOTER & CONTACT FORM */}
      <footer className="bg-[#0a0f1c] text-slate-400 py-12 md:py-16 border-t border-slate-800 relative z-10 pb-24 md:pb-12">
        <div className="max-w-7xl mx-auto px-6 md:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-16 mb-12">
            <div>
              <div className="flex items-center gap-2 mb-5"><GraduationCap size={28} className="text-indigo-500" /><span className="font-bold tracking-tight text-white text-xl">Global Studies Archive</span></div>
              <p className="text-sm leading-relaxed mb-6 md:pr-10 text-slate-400">Dedicated to the preservation, peer-review, and global distribution of socio-economic and geopolitical research. Empowering academics worldwide.</p>
              
            </div>
            
            <div className="bg-[#121827] border border-slate-800 p-6 rounded-2xl">
              <h4 className="text-white font-bold mb-5 flex items-center gap-2">Contact Registry <Send size={16} className="text-indigo-500"/></h4>
              <form className="space-y-4" onSubmit={handleContactSubmit}>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <input required type="text" placeholder="Full Name" value={contactForm.name} onChange={e => setContactForm({...contactForm, name: e.target.value})} className="w-full bg-[#0a0f1c] border border-slate-800 rounded-lg px-4 py-2.5 text-sm text-slate-200 outline-none focus:border-indigo-500 transition-colors" />
                  <input required type="email" placeholder="Email Address" value={contactForm.email} onChange={e => setContactForm({...contactForm, email: e.target.value})} className="w-full bg-[#0a0f1c] border border-slate-800 rounded-lg px-4 py-2.5 text-sm text-slate-200 outline-none focus:border-indigo-500 transition-colors" />
                </div>
                <textarea required placeholder="Research Inquiry / Message" rows="3" value={contactForm.message} onChange={e => setContactForm({...contactForm, message: e.target.value})} className="w-full bg-[#0a0f1c] border border-slate-800 rounded-lg px-4 py-3 text-sm text-slate-200 outline-none focus:border-indigo-500 transition-colors resize-none"></textarea>
                <button disabled={isSending} type="submit" className="w-full bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold py-3 rounded-lg transition-colors shadow-lg shadow-indigo-500/20 disabled:opacity-50">
                  {isSending ? "Sending..." : "Submit Enquiry"}
                </button>
              </form>
            </div>
          </div>
          <div className="pt-8 border-t border-slate-800/50 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-center md:text-left">
            <p>© 2026 Global Studies Archive. Department of Advanced Academic Research.</p>
            <p className="flex items-center gap-2 justify-center"><Shield size={14} className="text-emerald-500"/> System Ver 4.2.1-stable. End-to-End Encrypted.</p>
          </div>
        </div>
      </footer>

      {/* MODAL */}
      <AnimatePresence>
        {selectedReport && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[80] flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-md" onClick={() => setSelectedReport(null)}>
            <motion.div initial={{ y: 50, opacity: 0, scale: 0.95 }} animate={{ y: 0, opacity: 1, scale: 1 }} exit={{ y: 20, opacity: 0, scale: 0.95 }} onClick={(e) => e.stopPropagation()} className="bg-white w-full max-w-4xl max-h-[90vh] rounded-3xl md:rounded-[2rem] shadow-2xl flex flex-col overflow-hidden border border-slate-100">
              <div className="flex justify-between items-start p-6 md:p-10 border-b border-slate-100 bg-slate-50/50">
                <div className="pr-4 md:pr-8">
                  <span className="text-[9px] md:text-[10px] font-bold uppercase tracking-widest text-indigo-600 bg-indigo-100 px-3 py-1.5 rounded-md mb-3 md:mb-4 inline-block">{selectedReport.category || "Classified Document"}</span>
                  <h2 className="text-xl md:text-4xl font-black text-slate-900 leading-tight">{selectedReport.title}</h2>
                </div>
                <button onClick={() => setSelectedReport(null)} className="p-2 md:p-2.5 bg-white rounded-full text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition-all shadow-sm border border-slate-200 flex-shrink-0"><X size={20} className="md:w-6 md:h-6" /></button>
              </div>
              <div className="p-6 md:p-10 overflow-y-auto bg-white flex-1 text-slate-600 leading-relaxed whitespace-pre-wrap text-sm md:text-base selection:bg-indigo-100 custom-scrollbar">{selectedReport.fullContent}</div>
              <div className="p-6 md:px-10 md:py-6 border-t border-slate-100 bg-slate-50 flex flex-col md:flex-row justify-between items-center gap-4">
                <p className="text-xs text-slate-400 font-mono flex items-center gap-2"><Database size={14}/> Doc ID: {selectedReport._id?.substring(0, 10) || "N/A"}</p>
                <button onClick={() => setSelectedReport(null)} className="w-full md:w-auto px-8 py-3 bg-slate-900 hover:bg-indigo-600 text-white rounded-xl text-sm font-bold transition-all shadow-lg shadow-slate-900/20 hover:shadow-indigo-600/30">Close Archive</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}