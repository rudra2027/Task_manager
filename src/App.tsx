import React, { useState, useEffect } from "react";
import { 
  AlertOctagon, 
  Loader2, 
  CheckCircle, 
  Clock, 
  ListTodo, 
  ShieldAlert, 
  Sparkles, 
  RotateCcw, 
  Trash2, 
  Copy, 
  Search, 
  User, 
  ExternalLink, 
  Lock, 
  Unlock, 
  Users, 
  ArrowRight,
  RefreshCw,
  FileText,
  AlertTriangle,
  History,
  CheckCircle2,
  Calendar,
  Plus,
  Upload,
  X
} from "lucide-react";
import { RawMessage, TeamMember, Ticket, SegregatedResult } from "./types";

export default function App() {
  // Authentication State (Bypassed by default for direct leadership control)
  const [session, setSession] = useState<any>(null);
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authSuccessMsg, setAuthSuccessMsg] = useState<string | null>(null);
  const [isDemoMode, setIsDemoMode] = useState(true);

  // App Dashboard State
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [totalPending, setTotalPending] = useState(0);
  const [history, setHistory] = useState<Ticket[]>([]);
  const [selectedUser, setSelectedUser] = useState<TeamMember | null>(null);
  const [selectedUserMessages, setSelectedUserMessages] = useState<RawMessage[]>([]);
  
  // Active processed state for currently selected user
  const [activeTicket, setActiveTicket] = useState<Ticket | null>(null);
  const [processingUser, setProcessingUser] = useState(false);
  const [processingError, setProcessingError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [copiedText, setCopiedText] = useState(false);

  // Modal / Historical View State
  const [viewingHistoryTicket, setViewingHistoryTicket] = useState<Ticket | null>(null);

  // Upload and Custom feed states
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [uploadSender, setUploadSender] = useState("");
  const [isNewMember, setIsNewMember] = useState(false);
  const [newMemberAvatar, setNewMemberAvatar] = useState("👨‍💻");
  const [rawText, setRawText] = useState("");
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [parsedPreview, setParsedPreview] = useState<{ text: string; keyword: string }[]>([]);

  // Parse standup items on rawText change
  useEffect(() => {
    if (!rawText.trim()) {
      setParsedPreview([]);
      return;
    }
    const lines = rawText.split("\n").map(l => l.trim()).filter(Boolean);
    const result = lines.map(line => {
      const match = line.match(/^(completed|in progress|blocker|to be done|todo|to work on|in_progress|done)[:\-\s]+/i);
      let keyword = "IN PROGRESS";
      let text = line;
      if (match) {
        const prefix = match[0];
        const norm = match[1].toLowerCase();
        text = line.substring(prefix.length).trim();
        if (norm.includes("completed") || norm === "done") {
          keyword = "Completed";
        } else if (norm.includes("progress")) {
          keyword = "IN PROGRESS";
        } else if (norm.includes("blocker")) {
          keyword = "BLOCKER";
        } else if (norm.includes("done") || norm.includes("todo") || norm.includes("work") || norm.includes("be done")) {
          keyword = "TO BE DONE";
        }
      } else {
        if (line.toLowerCase().includes("completed") || line.toLowerCase().includes("finished") || line.toLowerCase().includes("solved") || line.toLowerCase().includes("fixed")) {
          keyword = "Completed";
        } else if (line.toLowerCase().includes("block") || line.toLowerCase().includes("error") || line.toLowerCase().includes("stuck")) {
          keyword = "BLOCKER";
        } else if (line.toLowerCase().includes("will") || line.toLowerCase().includes("next") || line.toLowerCase().includes("plan") || line.toLowerCase().includes("todo")) {
          keyword = "TO BE DONE";
        }
      }
      return { text, keyword };
    });
    setParsedPreview(result);
  }, [rawText]);

  // Handle local text file or json file parsing outputs
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Prefill name in dropdown search if file matches coordinator name (e.g., "jamuna_standup.txt")
    const cleanedFileName = file.name.split(/[._-]/)[0];
    if (cleanedFileName && cleanedFileName.length > 2) {
      const allNames = ["kunal", "jamuna", "pushpak", "vaibhali", "adarsh", "usha", "naga"];
      const matchName = allNames.find(n => cleanedFileName.toLowerCase().startsWith(n));
      if (matchName) {
        const properName = matchName.charAt(0).toUpperCase() + matchName.slice(1);
        setUploadSender(properName);
        setIsNewMember(false);
      } else {
        // Assume custom name
        const properName = cleanedFileName.charAt(0).toUpperCase() + cleanedFileName.slice(1);
        setUploadSender(properName);
        setIsNewMember(true);
      }
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (file.name.endsWith(".json")) {
        try {
          const parsed = JSON.parse(text);
          if (Array.isArray(parsed)) {
            const list = parsed.map((item: any) => ({
              text: item.text || item.message || String(item),
              keyword: item.keyword || item.status || "IN PROGRESS"
            }));
            const formattedRawText = list.map(item => `${item.keyword.toUpperCase()}: ${item.text}`).join("\n");
            setRawText(formattedRawText);
          } else if (typeof parsed === "object") {
            const items = parsed.messages || parsed.standup || [];
            if (Array.isArray(items)) {
              const list = items.map((item: any) => ({
                text: item.text || item.message || String(item),
                keyword: item.keyword || item.status || "IN PROGRESS"
              }));
              const formattedRawText = list.map(item => `${item.keyword.toUpperCase()}: ${item.text}`).join("\n");
              setRawText(formattedRawText);
            } else {
              setRawText(JSON.stringify(parsed, null, 2));
            }
          }
        } catch (err) {
          setUploadError("Loading raw text since JSON parses failed.");
          setRawText(text);
        }
      } else {
        setRawText(text);
      }
    };
    reader.readAsText(file);
  };

  const submitUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadSender.trim()) {
      setUploadError("Please select or enter a sender name");
      return;
    }
    if (parsedPreview.length === 0) {
      setUploadError("Please write or drag-and-drop a standup file to parse.");
      return;
    }

    setUploadLoading(true);
    setUploadError(null);
    setUploadSuccess(null);

    try {
      const res = await fetch("/api/dashboard/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sender: uploadSender,
          avatar: isNewMember ? newMemberAvatar : undefined,
          messages: parsedPreview
        })
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Failed to commit upload pool");
      }

      const data = await res.json();
      setUploadSuccess(`Successfully uploaded and fed ${data.addedCount} messages to ${data.sender}'s active pool!`);
      
      // Force refresh status counts and layout selections
      const resStatus = await fetch("/api/dashboard/status");
      const statusData = await resStatus.json();
      if (statusData && statusData.team) {
        setTeam(statusData.team);
        setTotalPending(statusData.totalPendingCount);
        
        const matchingMember = statusData.team.find((u: any) => u.id === data.memberId);
        if (matchingMember) {
          setSelectedUser(matchingMember);
        }
      }

      // Automatically exit modal overlay on success state
      setTimeout(() => {
        setRawText("");
        setUploadSender("");
        setIsUploadModalOpen(false);
        setUploadSuccess(null);
        setUploadError(null);
      }, 1500);

    } catch (err: any) {
      setUploadError(err.message || "An unexpected error occurred during insertion");
    } finally {
      setUploadLoading(false);
    }
  };

  // Fetch Dashboard State
  const fetchDashboardStatus = async () => {
    try {
      const res = await fetch("/api/dashboard/status");
      const data = await res.json();
      if (data && data.team) {
        setTeam(data.team);
        setTotalPending(data.totalPendingCount);
      }
    } catch (err) {
      console.error("Error fetching dashboard status", err);
    }
  };

  // Fetch History Logs
  const fetchHistory = async () => {
    try {
      const res = await fetch("/api/dashboard/history");
      const data = await res.json();
      if (Array.isArray(data)) {
        setHistory(data);
      }
    } catch (err) {
      console.error("Error fetching tickets history", err);
    }
  };

  // Synchronize on active login or demo activation
  useEffect(() => {
    if (session || isDemoMode) {
      fetchDashboardStatus();
      fetchHistory();
    }
  }, [session, isDemoMode]);

  // Fetch individual user messages when selected
  useEffect(() => {
    if (selectedUser) {
      fetch(`/api/dashboard/messages/${selectedUser.id}`)
        .then((res) => res.json())
        .then((data) => {
          if (data && data.messages) {
            setSelectedUserMessages(data.messages);
            // Clear current active preview to not show stale data
            setActiveTicket(null);
            setProcessingError(null);
          }
        })
        .catch((err) => console.error("Error loading user messages", err));
    }
  }, [selectedUser]);

  // Handle Logins (Bypassed)
  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError(null);
    setAuthSuccessMsg(null);

    try {
      setIsDemoMode(true);
    } catch (error: any) {
      setAuthError(error.message || "An authentication error occurred.");
    } finally {
      setAuthLoading(false);
    }
  };

  // Log Out handler
  const handleLogout = async () => {
    setIsDemoMode(false);
    setSession(null);
    setSelectedUser(null);
    setActiveTicket(null);
  };

  // Trigger Gemini Segregation
  const triggerSegregator = async () => {
    if (!selectedUser) return;
    setProcessingUser(true);
    setProcessingError(null);
    setActiveTicket(null);

    try {
      const res = await fetch("/api/dashboard/segregate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId: selectedUser.id }),
      });

      if (!res.ok) {
        const errDetail = await res.json();
        throw new Error(errDetail.error || "Gemini could not segregate user messages");
      }

      const generatedTicket = await res.json();
      setActiveTicket(generatedTicket);
      
      // Update our team list counts and historical ticket views
      fetchDashboardStatus();
      fetchHistory();
    } catch (err: any) {
      console.error(err);
      setProcessingError(err.message || "Something went wrong during Gemini processing");
    } finally {
      setProcessingUser(false);
    }
  };

  // Reset entire state pool to defaults
  const resetStatePool = async () => {
    if (!window.confirm("Are you sure you want to reset the message pool back to initial state? This will clear processed stats.")) {
      return;
    }
    try {
      await fetch("/api/dashboard/reset", { method: "POST" });
      setSelectedUser(null);
      setActiveTicket(null);
      fetchDashboardStatus();
      fetchHistory();
    } catch (err) {
      console.error("Error resetting data", err);
    }
  };

  // Delete specific ticket from history log
  const deleteTicket = async (ticketId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm(`Are you sure you want to delete ticket ${ticketId} from the history log?`)) {
      return;
    }
    try {
      const res = await fetch(`/api/dashboard/history/${ticketId}`, { method: "DELETE" });
      if (res.ok) {
        if (viewingHistoryTicket?.id === ticketId) {
          setViewingHistoryTicket(null);
        }
        fetchHistory();
      }
    } catch (err) {
      console.error("Error removing ticket", err);
    }
  };

  // Helper copy function
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2000);
  };

  // Filter historical tickets
  const filteredHistory = history.filter((ticket) => {
    const term = searchTerm.toLowerCase();
    return (
      ticket.sender.toLowerCase().includes(term) ||
      ticket.id.toLowerCase().includes(term) ||
      ticket.segregated.summary.toLowerCase().includes(term)
    );
  });

  // Render Login Layout if not authenticated
  if (!session && !isDemoMode) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 selection:bg-teal-500 selection:text-white font-sans">
        <div className="absolute top-0 right-0 p-4 text-xs text-slate-500 font-mono">
          System Time: 2026-06-20
        </div>

        <div className="w-full max-w-md bg-slate-800 rounded-2xl border border-slate-700 shadow-2xl p-8 space-y-6">
          <div className="text-center space-y-2">
            <div className="inline-flex p-3 bg-teal-500/10 border border-teal-500/25 rounded-2xl text-teal-400 mb-2">
              <Sparkles className="w-8 h-8 animate-pulse" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-white font-sans">Standup Segregator</h1>
            <p className="text-sm text-slate-400">
              Vikram&apos;s AI dashboard to centrally collect, parse, and segregate team daily standup threads.
            </p>
          </div>



          {authError && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/25 rounded-lg text-rose-400 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{authError}</span>
            </div>
          )}

          {authSuccessMsg && (
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/25 rounded-lg text-emerald-400 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{authSuccessMsg}</span>
            </div>
          )}

          <form onSubmit={handleAuth} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                Manager Email Address
              </label>
              <input
                type="email"
                required
                className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 placeholder-slate-500"
                placeholder="vikram@company.com"
                value={authEmail}
                onChange={(e) => setAuthEmail(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                Password
              </label>
              <input
                type="password"
                required
                className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 placeholder-slate-500"
                placeholder="••••••••"
                value={authPassword}
                onChange={(e) => setAuthPassword(e.target.value)}
              />
            </div>

            <button
              type="submit"
              disabled={authLoading}
              className="w-full py-2.5 px-4 bg-teal-500 hover:bg-teal-400 active:bg-teal-600 disabled:opacity-50 text-slate-950 font-semibold rounded-xl text-sm transition-all duration-150 flex items-center justify-center gap-2 shadow-lg shadow-teal-500/10 cursor-pointer"
            >
              {authLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  {isSignUp ? "Create Admin Account" : "Secure Leader Sign In"}
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-slate-700"></span>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-slate-800 px-3 text-slate-400">Or Experience Instantly</span>
            </div>
          </div>

          <button
            onClick={() => setIsDemoMode(true)}
            className="w-full py-2.5 px-4 bg-slate-900/80 hover:bg-slate-700 text-teal-300 hover:text-white border border-teal-500/35 hover:border-teal-400/60 font-semibold rounded-xl text-sm transition-all duration-150 flex items-center justify-center gap-2 cursor-pointer"
          >
            <User className="w-4 h-4" />
            <span>Bypass Auth &amp; Enter Demo Admin Portal</span>
          </button>

          <div className="pt-2 text-center">
            <button
              type="button"
              className="text-xs text-slate-400 hover:text-teal-400 transition"
              onClick={() => setIsSignUp(!isSignUp)}
            >
              {isSignUp ? "Already have a manager profile? Sign In" : "Register a new admin profile"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Render Dashboard
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Top Banner Header */}
      <header className="bg-slate-900 border-b border-slate-800 py-4 px-6 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-tr from-teal-500 to-emerald-500 rounded-xl text-slate-950 font-bold">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold text-white tracking-tight">Standup Segregator</h1>
                <span className="text-[10px] bg-teal-500/10 border border-teal-500/20 text-teal-400 font-mono px-2 py-0.5 rounded-full uppercase">
                  Gemini v3.5
                </span>
              </div>
              <p className="text-xs text-slate-400">Vikram&apos;s team reporting central dashboard</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={resetStatePool}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-xs rounded-xl flex items-center gap-1.5 transition cursor-pointer font-medium"
              title="Reset pending pool back to original circled numbers"
            >
              <RotateCcw className="w-3.5 h-3.5 text-orange-400" />
              Reset Message Pool
            </button>

            <button
              onClick={fetchDashboardStatus}
              className="p-1.5 bg-slate-800 hover:bg-slate-755 border border-slate-700 text-slate-300 rounded-xl hover:text-white transition"
              title="Refresh Pool counts"
            >
              <RefreshCw className="w-4 h-4 text-emerald-400" />
            </button>

            <div className="h-6 w-px bg-slate-800 hidden sm:block"></div>

            <div className="flex items-center gap-3 bg-slate-950/40 border border-slate-800 p-2 rounded-xl">
              <div className="h-7 w-7 rounded-full bg-teal-500/10 border border-teal-500/30 flex items-center justify-center text-teal-400 font-bold text-xs">
                V
              </div>
              <div className="hidden sm:flex flex-col text-left">
                <span className="text-xs text-slate-200 font-bold font-sans">
                  Vikram
                </span>
                <span className="text-[10px] text-emerald-400 font-mono flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  Team Lead
                </span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Container Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 lg:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT COLUMN: TEAM MEMBERS POOL (Cols: 3) */}
        <div className="lg:col-span-3 lg:col-start-1 flex flex-col space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col space-y-3">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 shrink-0">
                <Users className="w-3.5 h-3.5 text-teal-400" />
                Team Standup Pools
              </h2>
              <button
                onClick={() => setIsUploadModalOpen(true)}
                className="text-[10px] bg-teal-500 hover:bg-teal-400 active:scale-95 text-slate-950 font-bold px-2.5 py-1 rounded-lg flex items-center gap-1 transition-all cursor-pointer font-sans shadow-sm shrink-0"
              >
                <Plus className="w-3 h-3" />
                Upload Standup
              </button>
            </div>

             <p className="text-xs text-slate-400">
              Each user card holds raw daily slack updates. Currently, there are <span className="text-teal-400 font-bold font-mono">{totalPending}</span> messages waiting for AI segregation.
            </p>

            <div className="space-y-2 mt-2">
              {team.map((member) => {
                const isSelected = selectedUser?.id === member.id;
                return (
                  <button
                    key={member.id}
                    onClick={() => {
                      setSelectedUser(member);
                    }}
                    className={`w-full text-left p-3.5 rounded-xl border transition-all duration-200 flex items-center justify-between cursor-pointer group ${
                      isSelected
                        ? "bg-gradient-to-r from-slate-800 to-slate-850 border-teal-500 shadow-lg shadow-teal-500/5 text-white"
                        : "bg-slate-950/40 hover:bg-slate-900/60 border-slate-800 text-slate-300"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl h-10 w-10 bg-slate-900 rounded-lg flex items-center justify-center border border-slate-800 group-hover:scale-110 transition">
                        {member.avatar}
                      </span>
                      <div>
                        <div className="text-sm font-bold group-hover:text-white transition">{member.name}</div>
                        <div className="text-[10px] text-slate-500 font-mono">ID: {member.id}</div>
                      </div>
                    </div>

                    {/* Circle notification representing raw count as in diagram */}
                    <div className={`h-8 w-8 rounded-full flex items-center justify-center border text-xs font-mono font-bold ${
                      member.pendingCount > 0 
                        ? isSelected 
                          ? "bg-teal-500 text-slate-950 border-teal-400 scale-110"
                          : "bg-teal-500/15 text-teal-400 border-teal-500/30 font-bold"
                        : "bg-slate-900 text-slate-600 border-slate-800 font-normal"
                    }`}>
                      {member.pendingCount}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Quick Metrics Panel */}
          <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4">
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-teal-400" />
              Reporting Coverage
            </h3>
            <div className="grid grid-cols-2 gap-3 pt-1">
              <div className="bg-slate-950/40 border border-slate-800/60 p-2.5 rounded-xl text-center">
                <div className="text-lg font-bold text-teal-400 font-mono">{team.filter(m => m.pendingCount === 0).length} / 7</div>
                <div className="text-[10px] text-slate-500">Processed Users</div>
              </div>
              <div className="bg-slate-950/40 border border-slate-800/60 p-2.5 rounded-xl text-center">
                <div className="text-lg font-bold text-indigo-400 font-mono">{history.length}</div>
                <div className="text-[10px] text-slate-500">Hist. Summaries</div>
              </div>
            </div>
          </div>
        </div>

        {/* MIDDLE COLUMNS: DETAIL & MINI-BLOCKS SEGREGATOR (Cols: 5) */}
        <div className="lg:col-span-5 flex flex-col space-y-6">
          {!selectedUser ? (
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 text-center flex-1 flex flex-col items-center justify-center space-y-4">
              <div className="inline-flex p-4 bg-teal-500/5 rounded-3xl border border-teal-500/10 text-teal-400/80 animate-bounce">
                <Sparkles className="w-10 h-10" />
              </div>
              <div className="max-w-sm space-y-2">
                <h2 className="text-lg font-sans font-bold text-white tracking-tight">Select Team Member to Auditing</h2>
                <p className="text-sm text-slate-400 leading-relaxed">
                  Vikram, select any team member card on the left panel to review their raw slack strings updates pool, run the <b>Gemini Segregator</b>, and look at the mini dashboards.
                </p>
              </div>

              {/* General Project Context Banner */}
              <div className="w-full bg-slate-950/50 p-4 rounded-xl border border-slate-800 text-left text-xs text-slate-400 space-y-2">
                <h4 className="font-bold text-slate-300">How the Segregator Works</h4>
                <ol className="list-decimal pl-4 space-y-1 text-slate-400">
                  <li>Choose a member (e.g., Kunal who has 10 pending slack updates).</li>
                  <li>Click <b>Segregate Standup with Gemini</b> at the core.</li>
                  <li>Gemini parses unstructured logs for four action cases: <b>Blockers</b>, <b>Plan (To Be Done)</b>, <b>Completed</b>, and <b>In Progress</b>.</li>
                  <li>Summary is compiled for leadership reporting, and the counts automatically clear down into Vikram&apos;s history registry!</li>
                </ol>
              </div>
            </div>
          ) : (
            <div className="space-y-6 flex-1 flex flex-col justify-between">
              
              {/* Selected User Header & Raw message preview */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl bg-slate-950 p-2 border border-slate-800 rounded-xl">{selectedUser.avatar}</span>
                    <div>
                      <h2 className="font-bold text-white tracking-tight text-base">{selectedUser.name}&apos;s Live Stream</h2>
                      <p className="text-xs text-slate-400">Viewing {selectedUserMessages.length} unsegregated slack posts</p>
                    </div>
                  </div>

                  <span className="text-xs bg-slate-950 border border-slate-800 font-mono px-3 py-1 rounded-xl text-slate-300">
                    {selectedUserMessages.length > 0 ? "⚠️ Pendings" : "✅ Clear"}
                  </span>
                </div>

                {/* Conditional show raw updates */}
                {selectedUserMessages.length > 0 ? (
                  <div className="space-y-2 bg-slate-950/50 p-3.5 rounded-xl border border-slate-800/80 max-h-48 overflow-y-auto">
                    {selectedUserMessages.map((msg, i) => (
                      <div key={msg.id || i} className="text-xs border-b border-slate-900 pb-2 last:border-0 last:pb-0 font-sans">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-slate-500 font-mono text-[9px]">{msg.timestamp}</span>
                          <span className={`text-[8px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md ${
                            msg.keyword.toUpperCase() === "BLOCKER" ? "bg-rose-500/10 text-rose-400 border border-rose-500/10" :
                            msg.keyword.toUpperCase() === "COMPLETED" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/10" :
                            msg.keyword.toUpperCase() === "IN PROGRESS" ? "bg-sky-500/10 text-sky-400 border border-sky-500/10" :
                            "bg-amber-500/10 text-amber-400 border border-amber-500/10"
                          }`}>
                            {msg.keyword}
                          </span>
                        </div>
                        <p className="text-slate-300 leading-relaxed font-sans">{msg.text}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 bg-slate-950/40 rounded-xl border border-dashed border-slate-800 text-center text-xs text-slate-500">
                    No active messages left in this user&apos;s data pool. Run reset to recreate sample.
                  </div>
                )}

                {/* Central Action CTA */}
                {selectedUserMessages.length > 0 && (
                  <button
                    onClick={triggerSegregator}
                    disabled={processingUser}
                    className="w-full py-3 px-4 bg-gradient-to-r from-teal-500 to-emerald-500 disabled:opacity-50 text-slate-950 text-sm font-bold rounded-xl shadow-lg hover:shadow-teal-500/10 transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer border-t border-white/10"
                  >
                    {processingUser ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Processing &amp; Segregating via Gemini AI...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 text-slate-950 animate-pulse" />
                        <span>Run Google Gemini Segregator</span>
                      </>
                    )}
                  </button>
                )}
              </div>

              {/* ERROR STATE VIEW’ */}
              {processingError && (
                <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl space-y-1">
                  <div className="flex items-center gap-2 text-rose-400 font-bold text-xs">
                    <AlertTriangle className="w-4 h-4" />
                    <span>Gemini Processing Failure</span>
                  </div>
                  <p className="text-[11px] text-rose-300/80 leading-relaxed">{processingError}</p>
                </div>
              )}

              {/* LOADER PLACEHOLDER VIEW’ */}
              {processingUser && (
                <div className="p-12 bg-slate-900 border border-slate-800 border-dashed rounded-2xl flex flex-col items-center justify-center space-y-3">
                  <Loader2 className="w-8 h-8 animate-spin text-teal-400" />
                  <div className="text-center">
                    <p className="text-xs font-bold text-white">Segregating unstructured updates...</p>
                    <p className="text-[10px] text-slate-400">Invoking gemini-3.5-flash with custom Schema Type constraints</p>
                  </div>
                </div>
              )}

              {/* FOUR MINI SUB-DASHBOARD BLOCKS OR LIVE RESULTS (Active results) */}
              {(activeTicket || viewingHistoryTicket) && (
                <div className="space-y-4">
                  {/* Executive summary banner card */}
                  <div className="bg-gradient-to-b from-indigo-950/30 to-slate-900 border border-indigo-500/25 rounded-2xl p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-xs text-indigo-300 font-semibold uppercase tracking-wider">
                        <Sparkles className="w-3.5 h-3.5 text-yellow-400 animate-pulse" />
                        Executive Summaries for Leadership
                      </div>
                      <button
                        onClick={() => copyToClipboard((activeTicket || viewingHistoryTicket)!.segregated.summary)}
                        className="text-[10px] bg-slate-950 hover:bg-slate-800 text-slate-300 hover:text-white px-2 py-1 rounded-lg border border-slate-800 flex items-center gap-1 transition"
                      >
                        <Copy className="w-3 h-3 text-teal-400" />
                        {copiedText ? "Copied!" : "Copy Summary"}
                      </button>
                    </div>
                    <p className="text-xs text-indigo-100 italic leading-relaxed font-sans">
                      &ldquo;{(activeTicket || viewingHistoryTicket)?.segregated.summary}&rdquo;
                    </p>
                  </div>

                  <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    {(activeTicket || viewingHistoryTicket)?.sender}&apos;s Segregated Mini Notebook Panels
                  </h3>

                  {/* 4 Mini cards block! */}
                  <div className="grid grid-cols-2 gap-3">
                    
                    {/* CASE 1: BLOCKER */}
                    <div className="bg-slate-900 p-3.5 rounded-xl border border-rose-500/15 flex flex-col space-y-2">
                      <div className="flex items-center gap-1.5 text-red-400 text-xs font-bold uppercase tracking-wider border-b border-slate-950 pb-1.5">
                        <ShieldAlert className="w-3.5 h-3.5 shrink-0 text-red-400" />
                        <span>Blockers</span>
                        <span className="ml-auto bg-red-400/10 text-red-400 text-[10px] font-bold px-1.5 py-0.2 rounded-full font-mono">
                          {(activeTicket || viewingHistoryTicket)!.segregated.blockers.length}
                        </span>
                      </div>

                      <div className="space-y-1.5 flex-1 overflow-y-auto max-h-28">
                        {(activeTicket || viewingHistoryTicket)!.segregated.blockers.length > 0 ? (
                          (activeTicket || viewingHistoryTicket)!.segregated.blockers.map((blk, idx) => (
                            <div key={idx} className="text-[11px] text-slate-300 flex items-start gap-1 font-sans">
                              <span className="text-red-500 select-none">•</span>
                              <span className="leading-tight">{blk}</span>
                            </div>
                          ))
                        ) : (
                          <div className="text-[10px] text-slate-500 italic mt-2">Zero reported blockers</div>
                        )}
                      </div>
                    </div>

                    {/* CASE 2: IN PROGRESS */}
                    <div className="bg-slate-900 p-3.5 rounded-xl border border-sky-500/15 flex flex-col space-y-2">
                      <div className="flex items-center gap-1.5 text-sky-400 text-xs font-bold uppercase tracking-wider border-b border-slate-950 pb-1.5">
                        <Clock className="w-3.5 h-3.5 shrink-0 text-sky-400 animate-spin" style={{ animationDuration: "8s" }} />
                        <span>In Progress</span>
                        <span className="ml-auto bg-sky-400/10 text-sky-400 text-[10px] font-bold px-1.5 py-0.2 rounded-full font-mono">
                          {(activeTicket || viewingHistoryTicket)!.segregated.inProgress.length}
                        </span>
                      </div>

                      <div className="space-y-1.5 flex-1 overflow-y-auto max-h-28">
                        {(activeTicket || viewingHistoryTicket)!.segregated.inProgress.length > 0 ? (
                          (activeTicket || viewingHistoryTicket)!.segregated.inProgress.map((prog, idx) => (
                            <div key={idx} className="text-[11px] text-slate-300 flex items-start gap-1 font-sans">
                              <span className="text-sky-400 select-none">•</span>
                              <span className="leading-tight">{prog}</span>
                            </div>
                          ))
                        ) : (
                          <div className="text-[10px] text-slate-500 italic mt-2 font-sans">No tasks currently tagged</div>
                        )}
                      </div>
                    </div>

                    {/* CASE 3: COMPLETED */}
                    <div className="bg-slate-900 p-3.5 rounded-xl border border-emerald-500/15 flex flex-col space-y-2">
                      <div className="flex items-center gap-1.5 text-emerald-400 text-xs font-bold uppercase tracking-wider border-b border-slate-950 pb-1.5">
                        <CheckCircle className="w-3.5 h-3.5 shrink-0 text-emerald-400" />
                        <span>Completed</span>
                        <span className="ml-auto bg-emerald-400/10 text-emerald-400 text-[10px] font-bold px-1.5 py-0.2 rounded-full font-mono">
                          {(activeTicket || viewingHistoryTicket)!.segregated.completed.length}
                        </span>
                      </div>

                      <div className="space-y-1.5 flex-1 overflow-y-auto max-h-28">
                        {(activeTicket || viewingHistoryTicket)!.segregated.completed.length > 0 ? (
                          (activeTicket || viewingHistoryTicket)!.segregated.completed.map((comp, idx) => (
                            <div key={idx} className="text-[11px] text-slate-300 flex items-start gap-1 font-sans">
                              <span className="text-emerald-500 select-none">•</span>
                              <span className="leading-tight">{comp}</span>
                            </div>
                          ))
                        ) : (
                          <div className="text-[10px] text-slate-500 italic mt-2 font-sans">Zero completions found</div>
                        )}
                      </div>
                    </div>

                    {/* CASE 4: TO BE DONE */}
                    <div className="bg-slate-900 p-3.5 rounded-xl border border-amber-500/15 flex flex-col space-y-2">
                      <div className="flex items-center gap-1.5 text-amber-500 text-xs font-bold uppercase tracking-wider border-b border-slate-950 pb-1.5">
                        <ListTodo className="w-3.5 h-3.5 shrink-0 text-amber-500" />
                        <span>To Be Done</span>
                        <span className="ml-auto bg-amber-400/10 text-amber-400 text-[10px] font-bold px-1.5 py-0.2 rounded-full font-mono">
                          {(activeTicket || viewingHistoryTicket)!.segregated.toBeDone.length}
                        </span>
                      </div>

                      <div className="space-y-1.5 flex-1 overflow-y-auto max-h-28">
                        {(activeTicket || viewingHistoryTicket)!.segregated.toBeDone.length > 0 ? (
                          (activeTicket || viewingHistoryTicket)!.segregated.toBeDone.map((tbd, idx) => (
                            <div key={idx} className="text-[11px] text-slate-300 flex items-start gap-1 font-sans">
                              <span className="text-amber-500 select-none">•</span>
                              <span className="leading-tight">{tbd}</span>
                            </div>
                          ))
                        ) : (
                          <div className="text-[10px] text-slate-500 italic mt-2 font-sans">No futures identified</div>
                        )}
                      </div>
                    </div>

                  </div>

                  {viewingHistoryTicket && (
                    <button
                      onClick={() => setViewingHistoryTicket(null)}
                      className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl border border-slate-700 transition cursor-pointer"
                    >
                      Clear Hist. Log Overlay View
                    </button>
                  )}
                </div>
              )}

            </div>
          )}
        </div>

        {/* RIGHT COLUMN: HISTORY OF LAST 50 TICKETS (Cols: 4) */}
        <div className="lg:col-span-4 flex flex-col space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 flex flex-col space-y-4 flex-1">
            <div className="space-y-1">
              <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <History className="w-3.5 h-3.5 text-teal-400 font-bold" />
                History of Last 50 Tickets
              </h2>
              <p className="text-xs text-slate-400 leading-relaxed">
                Centralized logs showing Vikram&apos;s processed daily summaries. Search or click item for details.
              </p>
            </div>

            {/* Simple Search bar */}
            <div className="relative">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
              <input
                type="text"
                className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-[1px] focus:outline-teal-500"
                placeholder="Search history by name or keywords..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {/* List entries */}
            <div className="space-y-2 flex-1 overflow-y-auto max-h-[450px] pr-1">
              {filteredHistory.length > 0 ? (
                filteredHistory.map((tkt, index) => {
                  const isBeingViewed = viewingHistoryTicket?.id === tkt.id;
                  const dateStr = new Date(tkt.processedAt).toLocaleTimeString([], { 
                    hour: "2-digit", 
                    minute: "2-digit" 
                  }) + " " + new Date(tkt.processedAt).toLocaleDateString([], { month: "short", day: "numeric" });

                  return (
                    <div
                      key={tkt.id}
                      onClick={() => {
                        setViewingHistoryTicket(tkt);
                        // Also auto select their sidebar user if matched
                        const matchedUser = team.find((u) => u.name.toLowerCase() === tkt.sender.toLowerCase());
                        if (matchedUser) setSelectedUser(matchedUser);
                        setActiveTicket(null); // Close active active state in favor of history
                      }}
                      className={`p-3.5 rounded-xl border transition-all duration-150 text-left cursor-pointer flex flex-col space-y-1.5 group ${
                        isBeingViewed
                          ? "bg-teal-500/10 border-teal-500/60 text-white"
                          : "bg-slate-950/40 hover:bg-slate-900/40 border-slate-800 text-slate-350"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm font-bold block text-white group-hover:text-teal-300 transition">
                            {tkt.sender}
                          </span>
                          <span className="text-[9px] bg-slate-900 border border-slate-800 font-mono text-slate-400 px-1.5 py-0.2 rounded-md">
                            {tkt.id}
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-500 font-mono flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {dateStr}
                        </span>
                      </div>

                      <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                        {tkt.segregated.summary}
                      </p>

                      <div className="flex items-center gap-2 pt-1">
                        <div className="flex items-center gap-1 text-[9px] font-mono text-slate-500 bg-slate-900/80 px-2 py-0.5 rounded-md">
                          <span className="text-red-400 font-bold">•</span> Blockers: {tkt.segregated.blockers.length}
                        </div>
                        <div className="flex items-center gap-1 text-[9px] font-mono text-slate-500 bg-slate-900/80 px-2 py-0.5 rounded-md">
                          <span className="text-emerald-400 font-bold">•</span> Completed: {tkt.segregated.completed.length}
                        </div>

                        {/* Delete single historical card button */}
                        <button
                          onClick={(e) => deleteTicket(tkt.id, e)}
                          className="ml-auto p-1 text-slate-500 hover:text-rose-400 transition hover:bg-rose-500/5 rounded-md"
                          title="Delete summary ticket"
                        >
                          <Trash2 className="w-3 h-3 text-red-500" />
                        </button>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="p-8 text-center bg-slate-950/40 border border-dashed border-slate-800/80 rounded-2xl flex flex-col items-center justify-center space-y-1">
                  <FileText className="w-6 h-6 text-slate-600 mb-1" />
                  <p className="text-xs text-slate-500 font-bold">No tickets found</p>
                  <p className="text-[10px] text-slate-600">Enter a different keyword or process raw updates.</p>
                </div>
              )}
            </div>
          </div>
        </div>

      </main>

      {/* Footer Branding Area */}
      <footer className="bg-slate-900 border-t border-slate-800 py-3.5 px-6 mt-12">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-500 font-mono">
          <div>
            <span>Daily Standup Segregator Panel</span>
            <span className="mx-2">•</span>
            <span>Created for Vikram &amp; His Team of 8 Engineers</span>
          </div>
          <div>
            <span>Admin Control Panel • Active Cloud Node</span>
          </div>
        </div>
      </footer>

      {/* Dynamic Standup Upload Modal (Drag-and-Drop + Copy/Paste log parser) */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/50">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-gradient-to-tr from-teal-500 to-emerald-500 rounded-xl text-slate-950">
                  <Upload className="w-4 h-4 font-bold" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Upload Standup Log File</h3>
                  <p className="text-[10px] text-slate-400">Feed raw standup threads or files directly into Vikram&apos;s pool</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsUploadModalOpen(false)}
                className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-4 flex-1">
              {uploadError && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/25 rounded-xl text-rose-400 text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{uploadError}</span>
                </div>
              )}

              {uploadSuccess && (
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/25 rounded-xl text-emerald-400 text-xs flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 shrink-0 animate-bounce" />
                  <span>{uploadSuccess}</span>
                </div>
              )}

              {/* 1. Member Selector / Name input */}
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  1. Which engineer is posting this standup?
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] text-slate-500 block mb-1">Choose Coordinator Name</label>
                    <select
                      className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-[1px] focus:outline-teal-500 cursor-pointer"
                      value={isNewMember ? "new-member" : uploadSender}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val === "new-member") {
                          setIsNewMember(true);
                          setUploadSender("");
                        } else {
                          setIsNewMember(false);
                          setUploadSender(val);
                        }
                      }}
                    >
                      <option value="">-- Choose team member --</option>
                      {team.map((member) => (
                        <option key={member.id} value={member.name}>
                          {member.avatar} {member.name}
                        </option>
                      ))}
                      <option value="new-member">➕ Add Custom Coordinator</option>
                    </select>
                  </div>

                  {isNewMember && (
                    <div className="space-y-1.5">
                      <label className="text-[10px] text-slate-500 block">Custom Name & Emoji Avatar</label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          required
                          className="flex-1 px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-650 focus:outline-[1px] focus:outline-teal-500"
                          placeholder="e.g. Vikram"
                          value={uploadSender}
                          onChange={(e) => setUploadSender(e.target.value)}
                        />
                        <select
                          className="px-2 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-[1px] focus:outline-teal-500 cursor-pointer"
                          value={newMemberAvatar}
                          onChange={(e) => setNewMemberAvatar(e.target.value)}
                        >
                          <option value="👨‍💻">👨‍💻</option>
                          <option value="👩‍💻">👩‍💻</option>
                          <option value="🧔">🧔</option>
                          <option value="👩‍🎨">👩‍🎨</option>
                          <option value="👨‍💼">👨‍💼</option>
                          <option value="👩‍🔬">👩‍🔬</option>
                          <option value="🧓">🧓</option>
                          <option value="👤">👤</option>
                        </select>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* 2. Drag & Drop or Browse file */}
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  2. Upload Standup Log File
                </label>
                <div className="border border-dashed border-slate-800 hover:border-teal-500/40 rounded-2xl p-6 bg-slate-950/20 text-center space-y-2 relative transition group">
                  <input
                    type="file"
                    accept=".txt,.json,.log"
                    id="standup-file-input"
                    className="absolute inset-0 opacity-0 cursor-pointer"
                    onChange={handleFileUpload}
                  />
                  <div className="flex flex-col items-center justify-center space-y-1.5">
                    <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl text-slate-400 group-hover:text-teal-400 transition-all">
                      <FileText className="w-5 h-5" />
                    </div>
                    <p className="text-xs font-semibold text-slate-200">
                      Drag and drop your file here, or <span className="text-teal-400 group-hover:underline">browse</span>
                    </p>
                    <p className="text-[10px] text-slate-500 font-mono">
                      Accepts standup text formats (.txt, .json, .log)
                    </p>
                  </div>
                </div>
              </div>

              {/* 3. Text area input for backup copy paste */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                    3. Live Raw Messages Input
                  </label>
                  <span className="text-[9px] text-slate-500 font-mono">One update per line</span>
                </div>
                <textarea
                  className="w-full h-32 px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-350 p-2 placeholder-slate-650 focus:outline-[1px] focus:outline-teal-500 font-mono resize-none leading-relaxed"
                  placeholder="Paste standup or chat updates e.g.:&#10;COMPLETED: finished testing database migration.&#10;BLOCKER: database connection timeouts on Cloud Run.&#10;IN PROGRESS: debugging express controllers."
                  value={rawText}
                  onChange={(e) => setRawText(e.target.value)}
                />
              </div>

              {/* 4. Live Parser Preview */}
              {parsedPreview.length > 0 && (
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                    🔍 Live Extracted Standup Bullet Points Preview ({parsedPreview.length})
                  </label>
                  <div className="bg-slate-950 rounded-xl p-3 border border-slate-800 max-h-40 overflow-y-auto space-y-1.5 scrollbar-thin">
                    {parsedPreview.map((item, idx) => {
                      const kw = item.keyword;
                      let kwBadge = "text-slate-400 bg-slate-900";
                      if (kw === "Completed") kwBadge = "text-emerald-400 bg-emerald-500/10 border border-emerald-500/20";
                      else if (kw === "IN PROGRESS") kwBadge = "text-sky-400 bg-sky-500/10 border border-sky-500/20";
                      else if (kw === "BLOCKER") kwBadge = "text-rose-400 bg-rose-500/10 border border-rose-500/20";
                      else if (kw === "TO BE DONE") kwBadge = "text-amber-400 bg-amber-500/10 border border-amber-500/20";

                      return (
                        <div key={idx} className="flex items-start gap-2 text-[10px] py-1 border-b border-slate-900/65 last:border-0">
                          <span className={`${kwBadge} px-1.5 py-0.2 rounded font-bold font-mono shrink-0 uppercase text-[8px]`}>
                            {kw}
                          </span>
                          <span className="text-slate-300 leading-tight">
                            {item.text}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer Controls */}
            <div className="p-5 border-t border-slate-800 bg-slate-900/50 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setIsUploadModalOpen(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-755 text-slate-300 text-xs font-bold rounded-xl border border-slate-750 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={uploadLoading || parsedPreview.length === 0 || !uploadSender}
                onClick={submitUpload}
                className="px-5 py-2 bg-gradient-to-r from-teal-500 to-emerald-500 hover:scale-[1.02] text-slate-950 text-xs font-extrabold rounded-xl transition cursor-pointer flex items-center gap-2 disabled:opacity-40 disabled:pointer-events-none"
              >
                {uploadLoading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" /> Feeding...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-3.5 h-3.5 font-bold" /> Feed Standup Pool
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
