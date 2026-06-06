"use client";
import { useState, useEffect } from "react";
import { ShieldCheck, Server, Plus, Key, Edit, Trash2, Save, Lock, UserX, BarChart, BookOpen, LayoutDashboard, Users, FileText, Settings, Activity, MessageSquare, Clock } from "lucide-react";

export default function AdminVault() {
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [loginId, setLoginId] = useState("");
  const [loginPass, setLoginPass] = useState("");
  const [loginError, setLoginError] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);

  const [activeTab, setActiveTab] = useState("home"); 

  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(false);
  const [triggerWord, setTriggerWord] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [vaultCreds, setVaultCreds] = useState({ username: "", password: "" });
  const [formData, setFormData] = useState({ channelName: "", userA_uid: "", userA_pin: "", userB_uid: "", userB_pin: "" });

  const [materials, setMaterials] = useState([]);
  const [editingContentId, setEditingContentId] = useState(null);
  const [contentForm, setContentForm] = useState({ title: "", description: "", fullContent: "", category: "General Research" });

  // --- NEW STATES FOR MESSAGES & ANALYTICS ---
  const [inquiries, setInquiries] = useState([]);
  const [analytics, setAnalytics] = useState({ tabViews: 0, reportsViewed: 0, searches: 0 });

  useEffect(() => {
    if (isUnlocked) {
      fetchMaterials();
      fetchRooms();
      fetchSettings();
      fetchInquiries();
      fetchAnalytics();
    }
  }, [isUnlocked]);

  // --- VAULT LOGIN LOGIC ---
  const handleVaultLogin = async (e) => {
    e.preventDefault();
    setIsVerifying(true);
    setLoginError("");
    try {
      const res = await fetch("/api/admin/verify", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ adminId: loginId, adminPass: loginPass }) });
      const data = await res.json();
      if (data.success) setIsUnlocked(true);
      else setLoginError("Unauthorized Access. Invalid Credentials.");
    } catch (err) { setLoginError("Connection Error. Try again."); }
    setIsVerifying(false);
  };

  // --- FETCH API LOGIC ---
  const fetchRooms = async () => {
    try {
      const res = await fetch("/api/admin/rooms");
      const text = await res.text();
      if (!text) return;
      const data = JSON.parse(text);
      if (data.success) setRooms(data.rooms);
    } catch (error) { console.error("Failed to fetch rooms"); }
  };

  const fetchSettings = async () => {
    try {
      const res = await fetch("/api/settings");
      const data = await res.json();
      if (data.success) {
        setTriggerWord(data.triggerWord || "");
        if (data.adminUser) setVaultCreds({ username: data.adminUser, password: "" });
      }
    } catch (error) { console.error("Settings fetch failed"); }
  };

  const fetchMaterials = async () => {
    try {
      const res = await fetch("/api/admin/content");
      const data = await res.json();
      if (data.success) setMaterials(data.items);
    } catch (error) { console.error("Materials fetch failed"); }
  };

  // FETCH INQUIRIES & ANALYTICS
  const fetchInquiries = async () => {
    try {
      const res = await fetch("/api/contact");
      const data = await res.json();
      if (data.success) setInquiries(data.messages);
    } catch(e) {}
  };

  const fetchAnalytics = async () => {
    try {
      const res = await fetch("/api/analytics");
      const data = await res.json();
      if (data.success) setAnalytics(data.stats);
    } catch(e) {}
  };

  const handleDeleteInquiry = async (id) => {
    if(confirm("Permanently delete this inquiry?")) {
      await fetch(`/api/contact?id=${id}`, { method: "DELETE" });
      fetchInquiries();
    }
  };

  // --- SETTINGS LOGIC ---
  const handleUpdateTrigger = async () => {
    if (!triggerWord.trim()) return;
    await fetch("/api/settings", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ triggerWord: triggerWord.trim() }) });
    alert("Trigger Protocol Updated Successfully!");
  };

  const handleUpdateVaultCreds = async () => {
    if (!vaultCreds.username.trim() || !vaultCreds.password.trim()) return alert("Please enter both Admin ID and Password.");
    await fetch("/api/settings", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ adminUser: vaultCreds.username.trim(), adminPass: vaultCreds.password.trim() }) });
    alert("Vault Admin Credentials Secured!");
    setVaultCreds({ ...vaultCreds, password: "" });
  };

  // --- NODE LOGIC ---
  const handleSubmitRoom = async (e) => {
    e.preventDefault();
    setLoading(true);
    const url = "/api/admin/rooms";
    const method = editingId ? "PUT" : "POST";
    const body = editingId ? { ...formData, _id: editingId } : formData;

    const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const data = await res.json();
    if (data.success) {
      setFormData({ channelName: "", userA_uid: "", userA_pin: "", userB_uid: "", userB_pin: "" });
      setEditingId(null);
      fetchRooms();
      setActiveTab("nodes");
    } else { alert("Error: " + data.error); }
    setLoading(false);
  };

  const handleEditClick = (room) => {
    setEditingId(room._id);
    setFormData({ channelName: room.channelName || "", userA_uid: room.userA?.uid || "", userA_pin: room.userA?.pin || "", userB_uid: room.userB?.uid || "", userB_pin: room.userB?.pin || "" });
    setActiveTab("add_node");
  };

  const handleDeleteClick = async (id) => {
    if(confirm("Permanently delete this secure comm node?")) {
      await fetch(`/api/admin/rooms?id=${id}`, { method: "DELETE" });
      fetchRooms();
    }
  };

  // --- CONTENT LOGIC ---
  const handleSaveContent = async () => {
    if (!contentForm.title || !contentForm.fullContent) return alert("Title and Content required.");
    const method = editingContentId ? "PUT" : "POST";
    const bodyPayload = editingContentId ? { ...contentForm, _id: editingContentId } : contentForm;

    try {
      const res = await fetch("/api/admin/content", { method: method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(bodyPayload) });
      const data = await res.json();
      if (data.success) {
        alert(editingContentId ? "Report Updated!" : "Deployed to Decoy Portal!");
        setContentForm({ title: "", description: "", fullContent: "", category: "General Research" });
        setEditingContentId(null);
        fetchMaterials();
        setActiveTab("resources");
      } else { alert("Error deploying content."); }
    } catch (err) { alert("Network Error"); }
  };

  const handleEditContent = (item) => {
    setEditingContentId(item._id);
    setContentForm({ title: item.title, description: item.description, fullContent: item.fullContent, category: item.category });
    setActiveTab("add_resource");
  };

  const handleDeleteContent = async (id) => {
    if(confirm("Delete this research report?")) {
      await fetch(`/api/admin/content?id=${id}`, { method: "DELETE" });
      fetchMaterials();
    }
  };

  if (!isUnlocked) {
    return (
      <div className="min-h-screen bg-[#f4f6f8] flex items-center justify-center p-4 font-sans selection:bg-blue-100">
        <div className="bg-white p-10 rounded-xl border border-gray-200 w-full max-w-sm shadow-sm relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gray-600"></div>
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-gray-800 tracking-tight">Admin Gateway</h1>
            <p className="text-sm text-gray-500 mt-1">Please sign in to continue</p>
          </div>
          <form onSubmit={handleVaultLogin} className="space-y-5">
            {loginError && <p className="text-sm text-center text-red-600 bg-red-50 py-2 rounded border border-red-100">{loginError}</p>}
            <div><label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Administrator ID</label><input type="text" required className="w-full bg-white border border-gray-300 text-gray-800 px-4 py-2.5 rounded-md text-sm outline-none focus:border-gray-500 focus:ring-1 focus:ring-gray-500" value={loginId} onChange={e => setLoginId(e.target.value)} /></div>
            <div><label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Passphrase</label><input type="password" required className="w-full bg-white border border-gray-300 text-gray-800 px-4 py-2.5 rounded-md text-sm outline-none focus:border-gray-500 focus:ring-1 focus:ring-gray-500" value={loginPass} onChange={e => setLoginPass(e.target.value)} /></div>
            <button disabled={isVerifying} type="submit" className="w-full font-semibold py-3 mt-4 rounded-md text-sm transition-all bg-gray-700 hover:bg-gray-800 text-white disabled:opacity-50">{isVerifying ? "Verifying..." : "Login"}</button>
          </form>
        </div>
      </div>
    );
  }

  const NavButton = ({ id, icon: Icon, label }) => (
    <button onClick={() => setActiveTab(id)} className={`w-full flex items-center gap-3 px-6 py-2.5 font-medium text-sm transition-colors ${activeTab === id ? 'bg-[#fdf3ce] border-l-4 border-amber-500 text-gray-900 font-semibold' : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700 border-l-4 border-transparent'}`}>
      <Icon size={18} className={activeTab === id ? "text-amber-600" : ""} /> {label}
    </button>
  );

  return (
    <div className="min-h-screen bg-[#f4f6f8] text-gray-800 font-sans flex flex-col md:flex-row selection:bg-amber-100">
      
      {/* SIDEBAR */}
      <aside className="w-64 bg-[#fbfaf8] border-r border-gray-200 flex-shrink-0 hidden md:flex flex-col h-screen sticky top-0">
        <div className="h-16 flex items-center px-6 border-b border-gray-200 bg-white"><ShieldCheck size={24} className="text-gray-700 mr-2" /><span className="font-bold text-lg text-gray-800 tracking-tight">Admin Vault</span></div>
        <div className="px-6 py-4 border-b border-gray-200"><h2 className="text-sm font-bold text-gray-800">System Dashboard</h2><p className="text-[10px] text-amber-600 font-semibold tracking-widest uppercase mt-0.5">Admin Panel</p></div>
        <div className="flex-1 overflow-y-auto py-4">
          <div className="px-6 mb-2 text-xs font-bold text-gray-400 uppercase tracking-wider">Dashboard</div>
          <NavButton id="home" icon={LayoutDashboard} label="Home" />
          <NavButton id="analytics" icon={BarChart} label="Analytics" />
          <NavButton id="settings" icon={Settings} label="System Settings" />
          
          <div className="px-6 mt-6 mb-2 text-xs font-bold text-gray-400 uppercase tracking-wider">Communications</div>
          <NavButton id="inquiries" icon={MessageSquare} label="Inquiries Registry" />

          <div className="px-6 mt-6 mb-2 text-xs font-bold text-gray-400 uppercase tracking-wider">Quick Menu</div>
          <NavButton id="nodes" icon={Server} label="Active Comm Nodes" />
          <NavButton id="resources" icon={FileText} label="Resources & Courses" />

          <div className="px-6 mt-6 mb-2 text-xs font-bold text-gray-400 uppercase tracking-wider">Data Add Operations</div>
          <NavButton id="add_node" icon={Plus} label={editingId ? "Update Node" : "Provision Node"} />
          <NavButton id="add_resource" icon={BookOpen} label={editingContentId ? "Update Resource" : "Add Resource"} />
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <div className="flex-1 flex flex-col min-h-screen overflow-hidden">
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 shrink-0 sticky top-0 z-40">
          <div className="md:hidden flex items-center gap-2"><ShieldCheck size={24} className="text-gray-700" /><span className="font-bold text-lg text-gray-800">Admin Vault</span></div>
          <h2 className="text-xl text-gray-800 hidden md:block capitalize">{activeTab.replace('_', ' ')} Configuration</h2>
          <div className="flex items-center gap-4">
            <div className="hidden md:flex flex-col items-end"><span className="text-sm font-bold text-gray-800">Admin User</span><span className="text-xs text-green-600 flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-green-500"></span> Online</span></div>
            <button onClick={() => setIsUnlocked(false)} className="bg-gray-600 hover:bg-gray-700 text-white px-5 py-2 rounded shadow-sm text-sm font-medium transition-colors">Logout</button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          <div className="max-w-6xl mx-auto space-y-6">

            {/* TAB: HOME */}
            {activeTab === "home" && (
              <div className="space-y-6">
                <div className="text-center mb-8"><h1 className="text-2xl font-normal text-gray-800">System Overview</h1></div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-white border border-gray-200 rounded-lg p-8 shadow-sm flex flex-col items-center justify-center text-center"><Server size={32} className="text-amber-500 mb-3" /><h3 className="text-sm font-semibold text-gray-500 uppercase tracking-widest">Total Nodes Deployed</h3><p className="text-4xl font-bold text-gray-800 mt-2">{rooms.length}</p></div>
                  <div className="bg-white border border-gray-200 rounded-lg p-8 shadow-sm flex flex-col items-center justify-center text-center"><FileText size={32} className="text-blue-500 mb-3" /><h3 className="text-sm font-semibold text-gray-500 uppercase tracking-widest">Active Resources</h3><p className="text-4xl font-bold text-gray-800 mt-2">{materials.length}</p></div>
                  <div className="bg-white border border-gray-200 rounded-lg p-8 shadow-sm flex flex-col items-center justify-center text-center"><MessageSquare size={32} className="text-green-500 mb-3" /><h3 className="text-sm font-semibold text-gray-500 uppercase tracking-widest">Pending Inquiries</h3><p className="text-4xl font-bold text-gray-800 mt-2">{inquiries.length}</p></div>
                </div>
              </div>
            )}

            {/* TAB: ANALYTICS (REAL DATA) */}
            {activeTab === "analytics" && (
              <div className="space-y-6">
                <div className="text-center mb-8"><h1 className="text-2xl font-normal text-gray-800">User Analytics Dashboard</h1><button onClick={fetchAnalytics} className="text-xs text-blue-600 hover:underline mt-2 flex items-center gap-1 justify-center mx-auto"><Activity size={12}/> Refresh Metrics</button></div>
                <div className="flex flex-wrap gap-6 justify-center mb-8">
                  <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm w-48 text-center"><h3 className="text-sm text-gray-600 font-medium mb-4">Total Page Views</h3><p className="text-gray-800 text-3xl font-bold">{analytics.tabViews}</p></div>
                  <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm w-48 text-center"><h3 className="text-sm text-gray-600 font-medium mb-4">Reports Opened</h3><p className="text-gray-800 text-3xl font-bold">{analytics.reportsViewed}</p></div>
                  <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm w-48 text-center"><h3 className="text-sm text-gray-600 font-medium mb-4">Global Searches</h3><p className="text-gray-800 text-3xl font-bold">{analytics.searches}</p></div>
                </div>
              </div>
            )}

            {/* TAB: INQUIRIES (CONTACT FORM SUBMISSIONS) */}
            {activeTab === "inquiries" && (
              <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
                <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-100"><h2 className="text-base font-semibold text-gray-800">Contact Registry Messages</h2><button onClick={fetchInquiries} className="text-sm text-blue-600 hover:underline">Refresh List</button></div>
                <div className="space-y-4">
                  {inquiries.length === 0 ? (
                    <div className="text-center py-10 bg-gray-50 border border-dashed border-gray-300 rounded"><MessageSquare size={28} className="mx-auto text-gray-400 mb-2" /><p className="text-sm text-gray-500">No new inquiries.</p></div>
                  ) : (
                    inquiries.map((msg) => (
                      <div key={msg._id} className="bg-white border border-gray-200 p-5 rounded-lg shadow-sm">
                        <div className="flex justify-between items-start mb-3 border-b border-gray-100 pb-3">
                          <div>
                            <h3 className="text-gray-800 font-bold text-sm">{msg.name}</h3>
                            <p className="text-blue-600 text-xs font-medium">{msg.email}</p>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-xs text-gray-400 flex items-center gap-1"><Clock size={12}/> {new Date(msg.createdAt).toLocaleDateString()}</span>
                            <button onClick={() => handleDeleteInquiry(msg._id)} className="text-red-500 hover:bg-red-50 p-1.5 rounded transition-colors"><Trash2 size={16}/></button>
                          </div>
                        </div>
                        <p className="text-gray-600 text-sm whitespace-pre-wrap">{msg.message}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* TAB: SYSTEM SETTINGS */}
            {activeTab === "settings" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm"><h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4">Decoy Protocol Trigger</h2><div className="flex flex-col gap-3"><input type="text" value={triggerWord} onChange={(e) => setTriggerWord(e.target.value)} placeholder="e.g., TOUR-404-LIVE" className="w-full bg-white border border-gray-300 text-gray-800 px-4 py-2.5 rounded outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" /><button onClick={handleUpdateTrigger} className="bg-gray-800 hover:bg-gray-900 text-white px-4 py-2.5 rounded font-medium transition-colors">Save Trigger</button></div></div>
                <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm"><h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4">Update Vault Credentials</h2><div className="flex flex-col gap-3"><input type="text" value={vaultCreds.username} onChange={(e) => setVaultCreds({...vaultCreds, username: e.target.value})} placeholder="Admin ID" className="w-full bg-white border border-gray-300 text-gray-800 px-4 py-2.5 rounded outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" /><input type="password" value={vaultCreds.password} onChange={(e) => setVaultCreds({...vaultCreds, password: e.target.value})} placeholder="New Password" className="w-full bg-white border border-gray-300 text-gray-800 px-4 py-2.5 rounded outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" /><button onClick={handleUpdateVaultCreds} className="bg-gray-800 hover:bg-gray-900 text-white px-4 py-2.5 rounded font-medium transition-colors">Update Credentials</button></div></div>
              </div>
            )}

            {/* TAB: ACTIVE COMM NODES */}
            {activeTab === "nodes" && (
              <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm"><div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-100"><h2 className="text-base font-semibold text-gray-800">Active Communication Nodes</h2><button onClick={() => setActiveTab("add_node")} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm font-medium flex items-center gap-2"><Plus size={16}/> New Node</button></div>
                {rooms.length === 0 ? <div className="text-center py-10 bg-gray-50 border border-dashed border-gray-300 rounded"><UserX size={28} className="mx-auto text-gray-400 mb-2" /><p className="text-sm text-gray-500">No active nodes.</p></div> : 
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {rooms.map(room => (
                      <div key={room._id} className="bg-white border border-gray-200 hover:border-gray-300 p-4 rounded-md shadow-sm transition-all"><div className="flex justify-between items-start mb-4 border-b border-gray-100 pb-3"><h3 className="text-gray-800 font-bold text-sm bg-gray-100 px-2.5 py-1 rounded">#{room.channelName}</h3><div className="flex gap-2"><button onClick={() => handleEditClick(room)} className="text-blue-600 hover:bg-blue-50 p-1.5 rounded transition-colors"><Edit size={14} /></button><button onClick={() => handleDeleteClick(room._id)} className="text-red-600 hover:bg-red-50 p-1.5 rounded transition-colors"><Trash2 size={14} /></button></div></div><div className="flex justify-between"><div className="text-xs"><span className="text-gray-400 block mb-0.5 uppercase tracking-wider font-semibold">User A</span><span className="text-gray-700 font-medium">{room.userA.uid}</span></div><div className="text-xs text-right"><span className="text-gray-400 block mb-0.5 uppercase tracking-wider font-semibold">User B</span><span className="text-gray-700 font-medium">{room.userB.uid}</span></div></div></div>
                    ))}
                  </div>
                }
              </div>
            )}

            {/* TAB: ACTIVE RESOURCES */}
            {activeTab === "resources" && (
              <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm"><div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-100"><h2 className="text-base font-semibold text-gray-800">Academic & Research Resources</h2><button onClick={() => setActiveTab("add_resource")} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm font-medium flex items-center gap-2"><Plus size={16}/> New Resource</button></div>
                <div className="border border-gray-200 rounded overflow-hidden">
                  <table className="w-full text-left border-collapse">
                    <thead><tr className="bg-gray-50 border-b border-gray-200 text-xs text-gray-500 uppercase tracking-wider"><th className="p-3 font-semibold">Title</th><th className="p-3 font-semibold hidden md:table-cell">Description</th><th className="p-3 font-semibold">Category</th><th className="p-3 font-semibold text-right">Actions</th></tr></thead>
                    <tbody className="divide-y divide-gray-200">
                      {materials.length === 0 && <tr><td colSpan="4" className="p-6 text-center text-sm text-gray-500 border border-dashed border-gray-300">No resources found.</td></tr>}
                      {materials.map(item => (
                        <tr key={item._id} className="hover:bg-gray-50"><td className="p-3 text-sm text-gray-800 font-medium max-w-[200px] truncate">{item.title}</td><td className="p-3 text-sm text-gray-500 max-w-[300px] truncate hidden md:table-cell">{item.description}</td><td className="p-3 text-xs text-gray-500"><span className="bg-gray-100 px-2 py-1 rounded">{item.category}</span></td><td className="p-3 text-right"><button onClick={() => handleEditContent(item)} className="text-blue-600 hover:text-blue-800 p-1 mr-2"><Edit size={16}/></button><button onClick={() => handleDeleteContent(item._id)} className="text-red-600 hover:text-red-800 p-1"><Trash2 size={16}/></button></td></tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* TAB: ADD / UPDATE NODE */}
            {activeTab === "add_node" && (
              <div className="bg-white border border-gray-200 rounded-lg p-6 md:p-8 shadow-sm max-w-2xl mx-auto">
                <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-100"><h2 className="text-lg font-semibold text-gray-800">{editingId ? "Modify Configuration for Node" : "Provision New Communication Node"}</h2>{editingId && <button onClick={() => {setEditingId(null); setFormData({channelName: "", userA_uid: "", userA_pin: "", userB_uid: "", userB_pin: ""}); setActiveTab("nodes");}} className="text-xs text-blue-600 hover:underline">Cancel Update</button>}</div>
                <form onSubmit={handleSubmitRoom} className="space-y-6">
                  <div><label className="block text-sm font-semibold text-gray-700 mb-1">Encrypted Channel ID</label><input required type="text" placeholder="e.g. stealth_comms_1" className="w-full bg-white border border-gray-300 p-3 rounded-md text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" value={formData.channelName} onChange={e => setFormData({...formData, channelName: e.target.value})} /></div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="p-5 bg-gray-50 border border-gray-200 rounded-lg"><p className="text-xs font-bold text-gray-600 uppercase tracking-wider mb-4 border-b border-gray-200 pb-2">Operative A Setup</p><label className="block text-xs font-medium text-gray-500 mb-1">User ID</label><input required type="text" className="w-full bg-white border border-gray-300 p-2.5 rounded text-sm outline-none focus:border-blue-500 mb-3" value={formData.userA_uid} onChange={e => setFormData({...formData, userA_uid: e.target.value})} /><label className="block text-xs font-medium text-gray-500 mb-1">Access PIN</label><input required type="password" className="w-full bg-white border border-gray-300 p-2.5 rounded text-sm outline-none focus:border-blue-500" value={formData.userA_pin} onChange={e => setFormData({...formData, userA_pin: e.target.value})} /></div>
                    <div className="p-5 bg-gray-50 border border-gray-200 rounded-lg"><p className="text-xs font-bold text-gray-600 uppercase tracking-wider mb-4 border-b border-gray-200 pb-2">Operative B Setup</p><label className="block text-xs font-medium text-gray-500 mb-1">User ID</label><input required type="text" className="w-full bg-white border border-gray-300 p-2.5 rounded text-sm outline-none focus:border-blue-500 mb-3" value={formData.userB_uid} onChange={e => setFormData({...formData, userB_uid: e.target.value})} /><label className="block text-xs font-medium text-gray-500 mb-1">Access PIN</label><input required type="password" className="w-full bg-white border border-gray-300 p-2.5 rounded text-sm outline-none focus:border-blue-500" value={formData.userB_pin} onChange={e => setFormData({...formData, userB_pin: e.target.value})} /></div>
                  </div>
                  <button disabled={loading} type="submit" className={`w-full font-semibold py-3.5 rounded-md shadow-sm text-sm transition-all mt-4 ${editingId ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-gray-800 hover:bg-gray-900 text-white'}`}>{loading ? "Processing Encryption..." : (editingId ? "Save Node Modifications" : "Deploy Secure Node")}</button>
                </form>
              </div>
            )}

            {/* TAB: ADD / UPDATE RESOURCE */}
            {activeTab === "add_resource" && (
              <div className="bg-white border border-gray-200 rounded-lg p-6 md:p-8 shadow-sm">
                <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-100"><h2 className="text-lg font-semibold text-gray-800">{editingContentId ? "Modify Resource Material" : "Publish New Resource Material"}</h2>{editingContentId && <button onClick={() => {setEditingContentId(null); setContentForm({title:"", description:"", fullContent:"", category:"General Research"}); setActiveTab("resources");}} className="text-xs text-blue-600 hover:underline">Cancel Edit</button>}</div>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  <div className="lg:col-span-1 space-y-5">
                    <div><label className="block text-sm font-semibold text-gray-700 mb-1">Document Title</label><input value={contentForm.title} onChange={e => setContentForm({...contentForm, title: e.target.value})} className="w-full bg-white border border-gray-300 p-3 rounded-md text-sm text-gray-800 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" /></div>
                    <div><label className="block text-sm font-semibold text-gray-700 mb-1">Category</label><select value={contentForm.category} onChange={e => setContentForm({...contentForm, category: e.target.value})} className="w-full bg-white border border-gray-300 p-3 rounded-md text-sm text-gray-800 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"><option value="Research">Research</option><option value="Course">Course</option><option value="Library">Library</option><option value="General Research">General Research</option></select></div>
                    <div><label className="block text-sm font-semibold text-gray-700 mb-1">Short Preview Description</label><textarea value={contentForm.description} onChange={e => setContentForm({...contentForm, description: e.target.value})} className="w-full bg-white border border-gray-300 p-3 rounded-md text-sm h-32 text-gray-800 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 resize-none" /></div>
                    <button onClick={handleSaveContent} className={`w-full font-semibold py-3.5 rounded-md transition-all text-white shadow-sm mt-4 ${editingContentId ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-800 hover:bg-gray-900'}`}>{editingContentId ? "Update Record" : "Publish to Portal"}</button>
                  </div>
                  <div className="lg:col-span-2 flex flex-col"><label className="block text-sm font-semibold text-gray-700 mb-1">Full Academic Content Body</label><textarea value={contentForm.fullContent} onChange={e => setContentForm({...contentForm, fullContent: e.target.value})} className="w-full flex-1 min-h-[400px] bg-white border border-gray-300 p-5 rounded-md text-sm text-gray-800 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 resize-none leading-relaxed" /></div>
                </div>
              </div>
            )}

          </div>
        </main>
      </div>
    </div>
  );
}