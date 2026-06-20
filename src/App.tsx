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
import { getSupabase } from "./lib/supabaseClient";

export default function App() {
  // Authentication State for Vikram (Team Lead)
  const [isVikramLoggedIn, setIsVikramLoggedIn] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [passcode, setPasscode] = useState("");
  const [passcodeError, setPasscodeError] = useState<string | null>(null);

  // Supabase Custom auth credentials & states
  const [supabaseUser, setSupabaseUser] = useState<any>(null);
  const [authTab, setAuthTab] = useState<"signin" | "signup" | "magic">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authLoading, setAuthLoading] = useState(false);
  const [authSuccessMsg, setAuthSuccessMsg] = useState<string | null>(null);


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

  // Synchronize on mount to fetch dashboard state
  useEffect(() => {
    fetchDashboardStatus();
    fetchHistory();
  }, []);

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

  // Check active Supabase session on load and handle URL redirects
  useEffect(() => {
    const supabase = getSupabase();
    if (!supabase) {
      // If Supabase keys are not set, local mock auth can be used as fallback
      setIsVikramLoggedIn(false);
      return;
    }

    // Get current session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsVikramLoggedIn(!!session);
      if (session?.user) {
        setSupabaseUser(session.user);
      }
    }).catch(err => {
      console.warn("Error getting Supabase session:", err);
    });

    // Listen for auth events
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setIsVikramLoggedIn(!!session);
      if (session?.user) {
        setSupabaseUser(session.user);
      } else {
        setSupabaseUser(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Handle local passcode bypass if Supabase is not configured
  const handleLocalBypassLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setPasscodeError(null);
    const trimmed = passcode.trim();
    if (trimmed === "" || trimmed.toLowerCase() === "vikram" || trimmed.toLowerCase() === "admin") {
      setIsVikramLoggedIn(true);
      setShowLoginModal(false);
      setPasscode("");
    } else {
      setPasscodeError("Incorrect passcode. Try 'vikram' or leave blank to instantly bypass.");
    }
  };

  // Perform Supabase email-password Sign In
  const handleSupabaseSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasscodeError(null);
    setAuthSuccessMsg(null);
    
    const supabase = getSupabase();
    if (!supabase) {
      setPasscodeError("Supabase credentials are not configured. Use local passcode to sign in.");
      return;
    }

    setAuthLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        throw error;
      }

      if (data?.session) {
        setIsVikramLoggedIn(true);
        setSupabaseUser(data.user);
        setAuthSuccessMsg(`Logged in successfully as ${data.user?.email || "Vikram"}`);
        setTimeout(() => {
          setShowLoginModal(false);
          setAuthSuccessMsg(null);
          // clear forms
          setEmail("");
          setPassword("");
        }, 1000);
      }
    } catch (err: any) {
      console.error(err);
      setPasscodeError(err.message || "Failed to sign in via Supabase.");
    } finally {
      setAuthLoading(false);
    }
  };

  // Perform Supabase email-password Sign Up
  const handleSupabaseSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasscodeError(null);
    setAuthSuccessMsg(null);

    const supabase = getSupabase();
    if (!supabase) {
      setPasscodeError("Supabase credentials are not configured.");
      return;
    }

    setAuthLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: window.location.origin
        }
      });

      if (error) {
        throw error;
      }

      if (data?.user) {
        // Checking if confirmation is needed or already logged in
        if (data.session) {
          setIsVikramLoggedIn(true);
          setSupabaseUser(data.user);
          setAuthSuccessMsg("Account created and signed in successfully!");
          setTimeout(() => {
            setShowLoginModal(false);
            setAuthSuccessMsg(null);
          }, 1000);
        } else {
          setAuthSuccessMsg("Sign up successful! Please check your email inbox for confirmation link.");
        }
      }
    } catch (err: any) {
      console.error(err);
      setPasscodeError(err.message || "Failed to register new account in Supabase.");
    } finally {
      setAuthLoading(false);
    }
  };

  // Perform Supabase Magic Link Sign In
  const handleSupabaseMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasscodeError(null);
    setAuthSuccessMsg(null);

    const supabase = getSupabase();
    if (!supabase) {
      setPasscodeError("Supabase credentials are not configured.");
      return;
    }

    setAuthLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: window.location.origin
        }
      });

      if (error) {
        throw error;
      }

      setAuthSuccessMsg("Magic Link sent successfully! Please check your email inbox to sign in.");
    } catch (err: any) {
      console.error(err);
      setPasscodeError(err.message || "Failed to dispatch Magic Link email.");
    } finally {
      setAuthLoading(false);
    }
  };

  // Perform Google OAuth sign-in with matching redirect URL
  const handleSupabaseGoogleLogin = async () => {
    setPasscodeError(null);
    setAuthSuccessMsg(null);

    const supabase = getSupabase();
    if (!supabase) {
      setPasscodeError("Supabase credentials are not configured. Set URL and Anon Key first.");
      return;
    }

    setAuthLoading(true);
    try {
      // Direct redirect with options
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: window.location.origin
        }
      });

      if (error) {
        throw error;
      }
    } catch (err: any) {
      console.error(err);
      setPasscodeError(err.message || "Google OAuth redirection failed.");
      setAuthLoading(false);
    }
  };

  // Log Vikram / User out
  const handleVikramLogout = async () => {
    const supabase = getSupabase();
    if (supabase) {
      await supabase.auth.signOut();
    }
    setIsVikramLoggedIn(false);
    setSupabaseUser(null);
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



  // Render Dashboard
  return (
    <div className="min-h-screen bg-[#1d2125] text-[#dfe1e6] flex flex-col font-sans selection:bg-[#0c66e4] selection:text-white">
      {/* Top Professional Corporate Header */}
      <header className="bg-[#1d2125] border-b border-[#2c333a] py-3 px-6 sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            {/* Iconic Blue Logo */}
            <div className="h-9 w-9 bg-[#0c66e4] rounded-lg flex items-center justify-center text-white font-extrabold shadow-md shadow-[#0c66e4]/20 shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-extrabold text-[#ffffff] tracking-tight uppercase">Standup Segregator</h1>
                <span className="text-[10px] bg-[#0c66e4]/25 border border-[#388bff]/30 text-[#579dff] font-bold font-mono px-2 py-0.5 rounded-full uppercase">
                  Enterprise Edition
                </span>
              </div>
              <p className="text-[11px] text-[#9fabb6]">Corporate standup tracker for Vikram &amp; Team of 8 Engineers</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {isVikramLoggedIn ? (
              <button
                onClick={resetStatePool}
                className="px-3 py-1.5 bg-[#2c333a] hover:bg-[#38414a] border border-[#454f59] text-amber-300 hover:text-amber-200 text-xs rounded-xl flex items-center gap-1.5 transition cursor-pointer font-medium"
                title="Reset pending pool back to original circled numbers"
              >
                <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
                Reset Message Pool
              </button>
            ) : (
              <button
                disabled
                className="px-3 py-1.5 bg-[#1d2125] border border-[#2c333a] text-slate-500 text-xs rounded-xl flex items-center gap-1.5 transition cursor-not-allowed opacity-40"
                title="Only Vikram (Manager) can reset the standup data pool"
              >
                <Lock className="w-3.5 h-3.5 text-slate-500" />
                Pool Locked
              </button>
            )}

            <button
              onClick={fetchDashboardStatus}
              className="p-1.5 bg-[#2c333a] hover:bg-[#38414a] border border-[#454f59] text-slate-300 rounded-xl hover:text-white transition"
              title="Refresh standup logs sync representation"
            >
              <RefreshCw className="w-4 h-4 text-[#579dff]" />
            </button>

            <div className="h-6 w-px bg-[#2c333a] hidden sm:block"></div>

            {isVikramLoggedIn ? (
              <div className="flex items-center gap-3 bg-[#22272b] border border-[#2c333a] p-1.5 rounded-xl">
                <div className="h-7 w-7 rounded-full bg-[#1d3c63] border border-[#579dff]/40 flex items-center justify-center text-[#579dff] font-extrabold text-xs" title={`${supabaseUser?.email || "Vikram"} is logged in`}>
                  {(supabaseUser?.email?.[0] || 'V').toUpperCase()}
                </div>
                <div className="hidden sm:flex flex-col text-left max-w-[150px]">
                  <span className="text-xs text-[#ffffff] font-bold truncate">
                    {supabaseUser?.email ? supabaseUser.email.split('@')[0] : "Vikram (Lead)"}
                  </span>
                  <span className="text-[9px] text-[#4ffe93] font-mono flex items-center gap-0.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#4ffe93] animate-pulse mr-1"></span>
                    Lead Active
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleVikramLogout}
                  className="px-2 py-0.5 text-[9px] uppercase font-bold tracking-wider bg-[#3e2323] hover:bg-[#5a2e2e] text-red-350 rounded border border-[#602b2b] transition cursor-pointer"
                >
                  Logout
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-3 bg-[#22272b] border border-[#2c333a] p-1.5 rounded-xl">
                <div className="h-7 w-7 rounded-full bg-[#2c333a] border border-[#454f59] flex items-center justify-center text-[#9fabb6] font-bold text-xs" title="Read-only mode active">
                  👤
                </div>
                <div className="hidden sm:flex flex-col text-left">
                  <span className="text-xs text-[#9fabb6] font-bold">
                    Engineer View
                  </span>
                  <span className="text-[9px] text-amber-500 font-mono">
                    Read-only
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowLoginModal(true)}
                  className="px-2.5 py-1 text-[10px] uppercase font-extrabold tracking-wider bg-[#0c66e4] hover:bg-[#0052cc] text-white rounded transition cursor-pointer flex items-center gap-1"
                >
                  <Lock className="w-2.5 h-2.5" />
                  Sign In
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Container Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 lg:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT COLUMN: TEAM MEMBERS POOL (Cols: 3) */}
        <div className="lg:col-span-3 lg:col-start-1 flex flex-col space-y-4">
          <div className="bg-[#22272b] border border-[#2c333a] rounded-2xl p-4 flex flex-col space-y-3">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <h2 className="text-xs font-bold text-[#9fabb6] uppercase tracking-wider flex items-center gap-1.5 shrink-0">
                <Users className="w-3.5 h-3.5 text-[#579dff]" />
                Team Standup Pools
              </h2>
              <button
                onClick={() => setIsUploadModalOpen(true)}
                className="text-[10px] bg-[#0c66e4] hover:bg-[#0052cc] text-white font-extrabold px-3 py-1 rounded transition-all cursor-pointer flex items-center gap-1 shadow-sm shrink-0 uppercase tracking-wider"
              >
                <Plus className="w-3 h-3" />
                Upload Daily log
              </button>
            </div>

             <p className="text-xs text-[#9fabb6]">
              Each user card holds raw daily slack updates. Currently, there are <span className="text-[#579dff] font-bold font-mono">{totalPending}</span> messages waiting for AI segregation.
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
                    className={`w-full text-left p-3 border transition-all duration-150 flex items-center justify-between cursor-pointer group rounded-lg ${
                      isSelected
                        ? "bg-[#2c333a] border-[#388bff] text-white shadow-md shadow-[#388bff]/5"
                        : "bg-[#1d2125]/80 hover:bg-[#2c333a]/50 border-[#2c333a] text-[#dfe1e6]"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl h-9 w-9 bg-[#22272b] rounded-md flex items-center justify-center border border-[#2c333a] group-hover:scale-105 transition">
                        {member.avatar}
                      </span>
                      <div>
                        <div className="text-xs font-bold group-hover:text-white transition">{member.name}</div>
                        <div className="text-[10px] text-[#8c9bab] font-mono">ID: {member.id}</div>
                      </div>
                    </div>

                    {/* Circle notification representing raw count as in diagram */}
                    <div className={`h-7 w-7 rounded-full flex items-center justify-center border text-[11px] font-mono font-bold transition-all ${
                      member.pendingCount > 0 
                        ? isSelected 
                          ? "bg-[#0c66e4] text-white border-[#388bff] scale-105"
                          : "bg-[#1d3c63] text-[#85b8ff] border-[#2b4c7e] font-extrabold"
                        : "bg-[#1d2125] text-[#556575] border-[#2c333a] font-normal"
                    }`}>
                      {member.pendingCount}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Quick Metrics Panel */}
          <div className="bg-[#22272b] border border-[#2c333a] rounded-2xl p-4">
            <h3 className="text-xs font-bold text-[#9fabb6] uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-[#579dff]" />
              Reporting Coverage
            </h3>
            <div className="grid grid-cols-2 gap-3 pt-1">
              <div className="bg-[#1d2125] border border-[#2c333a] p-2.5 rounded-xl text-center">
                <div className="text-base font-bold text-[#579dff] font-mono">{team.filter(m => m.pendingCount === 0).length} / {team.length}</div>
                <div className="text-[10px] text-[#8c9bab]">Processed Users</div>
              </div>
              <div className="bg-[#1d2125] border border-[#2c333a] p-2.5 rounded-xl text-center">
                <div className="text-base font-bold text-[#4ffe93] font-mono">{history.length}</div>
                <div className="text-[10px] text-[#8c9bab]">Hist. Summaries</div>
              </div>
            </div>
          </div>
        </div>

        {/* MIDDLE COLUMNS: DETAIL & MINI-BLOCKS SEGREGATOR (Cols: 5) */}
        <div className="lg:col-span-5 flex flex-col space-y-6">
          {!selectedUser ? (
            <div className="bg-[#22272b] border border-[#2c333a] rounded-3xl p-8 text-center flex-1 flex flex-col items-center justify-center space-y-4">
              <div className="inline-flex p-4 bg-[#0c66e4]/10 rounded-3xl border border-[#388bff]/30 text-[#579dff] animate-bounce">
                <Sparkles className="w-10 h-10" />
              </div>
              <div className="max-w-sm space-y-2">
                <h2 className="text-lg font-sans font-bold text-white tracking-tight">Select Team Member to Audit</h2>
                <p className="text-sm text-[#9fabb6] leading-relaxed">
                  Select any engineer card on the left panel to review their raw slack strings updates pool, run the <b>Gemini Segregator</b>, and look at the mini dashboards.
                </p>
              </div>

              {/* General Project Context Banner */}
              <div className="w-full bg-[#1d2125] p-4 rounded-xl border border-[#2c333a] text-left text-xs text-[#9fabb6] space-y-2">
                <h4 className="font-bold text-[#ffffff] flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#579dff]"></span>How the Daily Segregator Works
                </h4>
                <ol className="list-decimal pl-4 space-y-1 text-[#9fabb6]">
                  <li>Choose an engineer (e.g., Kunal who has waiting slack log updates).</li>
                  <li>Click <b>Run Google Gemini Segregator</b>.</li>
                  <li>Gemini parses logs into four cases: <b>Blockers</b>, <b>Plan (To Be Done)</b>, <b>Completed</b>, and <b>In Progress</b>.</li>
                  <li>A formal summary is compiled for leadership reporting, and clear-down counts populate Vikram&apos;s history log book automatically!</li>
                </ol>
              </div>
            </div>
          ) : (
            <div className="space-y-6 flex-1 flex flex-col justify-between">
              
              {/* Selected User Header & Raw message preview */}
              <div className="bg-[#22272b] border border-[#2c333a] rounded-2xl p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl bg-[#1d2125] p-2 border border-[#2c333a] rounded-xl">{selectedUser.avatar}</span>
                    <div>
                      <h2 className="font-bold text-white tracking-tight text-base">{selectedUser.name}&apos;s Live Stream</h2>
                      <p className="text-xs text-[#9fabb6]">Viewing {selectedUserMessages.length} unsegregated slack posts</p>
                    </div>
                  </div>

                  <span className="text-xs bg-[#1d2125] border border-[#2c333a] font-mono px-3 py-1 rounded-xl text-[#dfe1e6]">
                    {selectedUserMessages.length > 0 ? "⚠️ Pendings" : "✅ Clear"}
                  </span>
                </div>

                {/* Conditional show raw updates */}
                {selectedUserMessages.length > 0 ? (
                  <div className="space-y-2 bg-[#1d2125] p-3.5 rounded-xl border border-[#2c333a] max-h-48 overflow-y-auto">
                    {selectedUserMessages.map((msg, i) => (
                      <div key={msg.id || i} className="text-xs border-b border-[#2c333a] pb-2 last:border-0 last:pb-0 font-sans">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[#8c9bab] font-mono text-[9px]">{msg.timestamp}</span>
                          <span className={`text-[8px] font-extrabold uppercase tracking-wider px-1.5 py-0.5 rounded ${
                            msg.keyword.toUpperCase() === "BLOCKER" ? "bg-[#441d1d] text-[#ff8585] border border-[#602b2b]" :
                            msg.keyword.toUpperCase() === "COMPLETED" ? "bg-[#1a3627] text-[#4ffe93] border border-[#234c34]" :
                            msg.keyword.toUpperCase() === "IN PROGRESS" ? "bg-[#1d3c63] text-[#85b8ff] border border-[#2b4c7e]" :
                            "bg-[#2b211a] text-[#ffb266] border border-[#4c3923]"
                          }`}>
                            {msg.keyword}
                          </span>
                        </div>
                        <p className="text-[#dfe1e6] leading-relaxed font-sans">{msg.text}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 bg-[#1d2125]/80 rounded-xl border border-dashed border-[#2c333a] text-center text-xs text-[#8c9bab]">
                    No active messages left in this user&apos;s data pool. Wait for daily logs or click Reset Pool above to load sample updates.
                  </div>
                )}

                {/* Central Action CTA */}
                {selectedUserMessages.length > 0 && (
                  isVikramLoggedIn ? (
                    <button
                      onClick={triggerSegregator}
                      disabled={processingUser}
                      className="w-full py-3 px-4 bg-[#0c66e4] hover:bg-[#0052cc] text-white disabled:opacity-50 text-sm font-bold rounded-xl shadow-lg hover:shadow-[#0c66e4]/20 transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer border-t border-white/10"
                    >
                      {processingUser ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Processing &amp; Segregating via Gemini AI...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4 text-white animate-pulse" />
                          <span>Run Google Gemini Segregator</span>
                        </>
                      )}
                    </button>
                  ) : (
                    <button
                      onClick={() => setShowLoginModal(true)}
                      className="w-full py-3 px-4 bg-[#2c333a] hover:bg-[#38414a] text-amber-300 border border-[#454f59] text-sm font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Lock className="w-4 h-4 text-amber-400" />
                      <span>🔒 Run Segregator (Sign In as Vikram Required)</span>
                    </button>
                  )
                )}
              </div>

              {/* ERROR STATE VIEW’ */}
              {processingError && (
                <div className="p-4 bg-[#3e2323] border border-[#602b2b] rounded-xl space-y-1">
                  <div className="flex items-center gap-2 text-red-400 font-bold text-xs">
                    <AlertTriangle className="w-4 h-4" />
                    <span>Gemini Processing Failure</span>
                  </div>
                  <p className="text-[11px] text-red-300/80 leading-relaxed">{processingError}</p>
                </div>
              )}

              {/* LOADER PLACEHOLDER VIEW’ */}
              {processingUser && (
                <div className="p-12 bg-[#22272b] border border-[#2c333a] border-dashed rounded-2xl flex flex-col items-center justify-center space-y-3">
                  <Loader2 className="w-8 h-8 animate-spin text-[#579dff]" />
                  <div className="text-center">
                    <p className="text-xs font-bold text-white">Segregating unstructured updates...</p>
                    <p className="text-[10px] text-[#8c9bab]">Invoking gemini-3.5-flash with custom Schema Type constraints</p>
                  </div>
                </div>
              )}

              {/* FOUR MINI SUB-DASHBOARD BLOCKS OR LIVE RESULTS (Active results) */}
              {(activeTicket || viewingHistoryTicket) && (
                <div className="space-y-4">
                  {/* Executive summary banner card */}
                  <div className="bg-[#1d3c63]/15 border border-[#388bff]/30 rounded-2xl p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-xs text-[#579dff] font-bold uppercase tracking-wider">
                        <Sparkles className="w-3.5 h-3.5 text-yellow-400 animate-pulse" />
                        Executive Summaries for Leadership
                      </div>
                      <button
                        onClick={() => copyToClipboard((activeTicket || viewingHistoryTicket)!.segregated.summary)}
                        className="text-[10px] bg-[#2c333a] hover:bg-[#38414a] text-[#dfe1e6] hover:text-white px-2.5 py-1 rounded border border-[#454f59] flex items-center gap-1 transition"
                      >
                        <Copy className="w-3 h-3 text-[#579dff]" />
                        {copiedText ? "Copied!" : "Copy Summary"}
                      </button>
                    </div>
                    <p className="text-xs text-[#dfe1e6] italic leading-relaxed font-sans">
                      &ldquo;{(activeTicket || viewingHistoryTicket)?.segregated.summary}&rdquo;
                    </p>
                  </div>

                  <h3 className="text-xs font-bold text-[#9fabb6] uppercase tracking-wider">
                    {(activeTicket || viewingHistoryTicket)?.sender}&apos;s Segregated Mini Notebook Panels
                  </h3>

                  {/* 4 Mini cards block! */}
                  <div className="grid grid-cols-2 gap-3">
                    
                    {/* CASE 1: BLOCKER */}
                    <div className="bg-[#2d1f21] p-3.5 rounded-xl border border-[#52292c] flex flex-col space-y-2">
                      <div className="flex items-center gap-1.5 text-[#ff8585] text-xs font-bold uppercase tracking-wider border-b border-[#52292c] pb-1.5">
                        <ShieldAlert className="w-3.5 h-3.5 shrink-0 text-[#ff8585]" />
                        <span>Blockers</span>
                        <span className="ml-auto bg-[#441d1d] text-[#ff8585] text-[10px] font-bold px-1.5 py-0.2 rounded font-mono">
                          {(activeTicket || viewingHistoryTicket)!.segregated.blockers.length}
                        </span>
                      </div>

                      <div className="space-y-1.5 flex-1 overflow-y-auto max-h-28">
                        {(activeTicket || viewingHistoryTicket)!.segregated.blockers.length > 0 ? (
                          (activeTicket || viewingHistoryTicket)!.segregated.blockers.map((blk, idx) => (
                            <div key={idx} className="text-[11px] text-[#dfe1e6] flex items-start gap-1 font-sans">
                              <span className="text-[#ff8585] select-none">•</span>
                              <span className="leading-tight">{blk}</span>
                            </div>
                          ))
                        ) : (
                          <div className="text-[10px] text-[#8c9bab] italic mt-2">Zero reported blockers</div>
                        )}
                      </div>
                    </div>

                    {/* CASE 2: IN PROGRESS */}
                    <div className="bg-[#192535] p-3.5 rounded-xl border border-[#22446a] flex flex-col space-y-2">
                      <div className="flex items-center gap-1.5 text-[#85b8ff] text-xs font-bold uppercase tracking-wider border-b border-[#22446a] pb-1.5">
                        <Clock className="w-3.5 h-3.5 shrink-0 text-[#85b8ff] animate-spin" style={{ animationDuration: "8s" }} />
                        <span>In Progress</span>
                        <span className="ml-auto bg-[#1d3c63] text-[#85b8ff] text-[10px] font-bold px-1.5 py-0.2 rounded font-mono">
                          {(activeTicket || viewingHistoryTicket)!.segregated.inProgress.length}
                        </span>
                      </div>

                      <div className="space-y-1.5 flex-1 overflow-y-auto max-h-28">
                        {(activeTicket || viewingHistoryTicket)!.segregated.inProgress.length > 0 ? (
                          (activeTicket || viewingHistoryTicket)!.segregated.inProgress.map((prog, idx) => (
                            <div key={idx} className="text-[11px] text-[#dfe1e6] flex items-start gap-1 font-sans">
                              <span className="text-[#85b8ff] select-none">•</span>
                              <span className="leading-tight">{prog}</span>
                            </div>
                          ))
                        ) : (
                          <div className="text-[10px] text-[#8c9bab] italic mt-2 font-sans">No tasks currently tagged</div>
                        )}
                      </div>
                    </div>

                    {/* CASE 3: COMPLETED */}
                    <div className="bg-[#162a22] p-3.5 rounded-xl border border-[#234c34] flex flex-col space-y-2">
                      <div className="flex items-center gap-1.5 text-[#4ffe93] text-xs font-bold uppercase tracking-wider border-b border-[#234c34] pb-1.5">
                        <CheckCircle className="w-3.5 h-3.5 shrink-0 text-[#4ffe93]" />
                        <span>Completed</span>
                        <span className="ml-auto bg-[#1a3627] text-[#4ffe93] text-[10px] font-bold px-1.5 py-0.2 rounded font-mono">
                          {(activeTicket || viewingHistoryTicket)!.segregated.completed.length}
                        </span>
                      </div>

                      <div className="space-y-1.5 flex-1 overflow-y-auto max-h-28">
                        {(activeTicket || viewingHistoryTicket)!.segregated.completed.length > 0 ? (
                          (activeTicket || viewingHistoryTicket)!.segregated.completed.map((comp, idx) => (
                            <div key={idx} className="text-[11px] text-[#dfe1e6] flex items-start gap-1 font-sans">
                              <span className="text-[#4ffe93] select-none">•</span>
                              <span className="leading-tight">{comp}</span>
                            </div>
                          ))
                        ) : (
                          <div className="text-[10px] text-[#8c9bab] italic mt-2 font-sans">Zero completions found</div>
                        )}
                      </div>
                    </div>

                    {/* CASE 4: TO BE DONE */}
                    <div className="bg-[#2a2142] p-3.5 rounded-xl border border-[#403265] flex flex-col space-y-2">
                      <div className="flex items-center gap-1.5 text-[#d3c1ff] text-xs font-bold uppercase tracking-wider border-b border-[#403265] pb-1.5">
                        <ListTodo className="w-3.5 h-3.5 shrink-0 text-[#d3c1ff]" />
                        <span>To Be Done</span>
                        <span className="ml-auto bg-[#211638] text-[#d3c1ff] text-[10px] font-bold px-1.5 py-0.2 rounded font-mono">
                          {(activeTicket || viewingHistoryTicket)!.segregated.toBeDone.length}
                        </span>
                      </div>

                      <div className="space-y-1.5 flex-1 overflow-y-auto max-h-28">
                        {(activeTicket || viewingHistoryTicket)!.segregated.toBeDone.length > 0 ? (
                          (activeTicket || viewingHistoryTicket)!.segregated.toBeDone.map((tbd, idx) => (
                            <div key={idx} className="text-[11px] text-[#dfe1e6] flex items-start gap-1 font-sans">
                              <span className="text-[#d3c1ff] select-none">•</span>
                              <span className="leading-tight">{tbd}</span>
                            </div>
                          ))
                        ) : (
                          <div className="text-[10px] text-[#8c9bab] italic mt-2 font-sans">No futures identified</div>
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
          <div className="bg-[#22272b] border border-[#2c333a] rounded-3xl p-5 flex flex-col space-y-4 flex-1">
            <div className="space-y-1">
              <h2 className="text-xs font-bold text-[#9fabb6] uppercase tracking-wider flex items-center gap-1.5">
                <History className="w-3.5 h-3.5 text-[#579dff] font-bold" />
                History of Last 50 Tickets
              </h2>
              <p className="text-xs text-[#9fabb6] leading-relaxed">
                Centralized logs showing Vikram&apos;s processed daily summaries. Search or click item for details.
              </p>
            </div>

            {/* Simple Search bar */}
            <div className="relative">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-[#8c9bab]" />
              <input
                type="text"
                className="w-full pl-9 pr-4 py-2 bg-[#1d2125] border border-[#2c333a] rounded text-xs text-slate-200 placeholder-[#5e6c84] focus:outline-none focus:ring-1 focus:ring-[#388bff]"
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
                      className={`p-3.5 rounded-lg border transition-all duration-150 text-left cursor-pointer flex flex-col space-y-1.5 group ${
                        isBeingViewed
                          ? "bg-[#2c333a] border-[#388bff] text-white shadow-md"
                          : "bg-[#1d2125]/80 hover:bg-[#2c333a]/40 border-[#2c333a] text-[#dfe1e6]"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold block text-white group-hover:text-[#579dff] transition">
                            {tkt.sender}
                          </span>
                          <span className="text-[9px] bg-[#22272b] border border-[#2c333a] font-mono text-[#8c9bab] px-1.5 py-0.2 rounded">
                            {tkt.id}
                          </span>
                        </div>
                        <span className="text-[10px] text-[#8c9bab] font-mono flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {dateStr}
                        </span>
                      </div>

                      <p className="text-[11px] text-[#9fabb6] line-clamp-2 leading-relaxed">
                        {tkt.segregated.summary}
                      </p>

                      <div className="flex items-center gap-2 pt-1">
                        <div className="flex items-center gap-1 text-[9px] font-mono text-[#8c9bab] bg-[#1d2125] border border-[#2c333a] px-2 py-0.5 rounded">
                          <span className="text-[#ff8585] font-bold">•</span> Blockers: {tkt.segregated.blockers.length}
                        </div>
                        <div className="flex items-center gap-1 text-[9px] font-mono text-[#8c9bab] bg-[#1d2125] border border-[#2c333a] px-2 py-0.5 rounded">
                          <span className="text-[#4ffe93] font-bold">•</span> Completed: {tkt.segregated.completed.length}
                        </div>

                        {/* Delete single historical card button */}
                        <button
                          onClick={(e) => deleteTicket(tkt.id, e)}
                          className="ml-auto p-1 text-[#8c9bab] hover:text-red-400 hover:bg-red-500/10 rounded transition"
                          title="Delete summary ticket"
                        >
                          <Trash2 className="w-3 h-3 text-red-500" />
                        </button>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="p-8 text-center bg-[#1d2125] border border-dashed border-[#2c333a] rounded-xl flex flex-col items-center justify-center space-y-1">
                  <FileText className="w-6 h-6 text-[#556575] mb-1" />
                  <p className="text-xs text-[#9fabb6] font-bold">No tickets found</p>
                  <p className="text-[10px] text-[#8c9bab]">Enter a different keyword or process raw updates.</p>
                </div>
              )}
            </div>
          </div>
        </div>

      </main>

      {/* Footer Branding Area */}
      <footer className="bg-[#1d2125] border-t border-[#2c333a] py-3.5 px-6 mt-12">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-[#8c9bab] font-mono">
          <div>
            <span>Daily Standup Segregator Panel</span>
            <span className="mx-2">•</span>
            <span>Created for Lead Vikram &amp; His Team of 8 Engineers</span>
          </div>
          <div>
            <span>Enterprise Admin Portal • Active Cloud Node</span>
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

      {/* Vikram Auth Modal */}
      {showLoginModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-[#22272b] border border-[#2c333a] rounded-3xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col my-8">
            {/* Modal Header */}
            <div className="p-5 border-b border-[#2c333a] flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-[#0c66e4]/10 rounded-xl text-[#579dff] border border-[#388bff]/20">
                  <Lock className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Lead Access Authorization</h3>
                  <p className="text-[10px] text-[#9fabb6]">Secure cloud-synced team leader controls</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowLoginModal(false);
                  setPasscodeError(null);
                  setAuthSuccessMsg(null);
                  setPasscode("");
                }}
                className="p-1.5 hover:bg-[#2c333a] rounded-lg text-[#8c9bab] hover:text-white transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* If Supabase is NOT configured */}
            {!getSupabase() ? (
              <form onSubmit={handleLocalBypassLogin}>
                <div className="p-6 space-y-4">
                  <div className="p-3.5 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-200 text-xs space-y-1.5">
                    <p className="font-bold flex items-center gap-1.5">
                      <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                      Supabase Credentials Missing
                    </p>
                    <p className="text-[11px] text-amber-300 leading-normal">
                      Vercel sign-in via Supabase is not active because <code className="bg-amber-950/40 px-1 py-0.5 rounded text-amber-400">VITE_SUPABASE_URL</code> is not defined.
                    </p>
                    <p className="text-[11px] text-[#9fabb6] leading-normal pt-1 border-t border-amber-500/10">
                      Configure environment key-value pairs in your Vercel project or AI Studio secrets, set the redirect URL to <code className="bg-slate-950/30 px-1 text-slate-300 font-mono">https://ai.studio/apps/c61df05e-b7b0-41d9-ad85-04b1783c314c/**</code>, then refresh!
                    </p>
                  </div>

                  <div className="p-3 bg-[#0c66e4]/10 border border-[#388bff]/20 rounded-xl text-[11px] text-blue-200 leading-normal">
                    💡 <strong>Offline Sandbox mode:</strong> You can bypass this check and login as lead Vikram instantly using the local passcode field below.
                  </div>

                  {passcodeError && (
                    <div className="p-3 bg-[#3e2323] border border-[#602b2b] rounded-xl text-red-350 text-xs flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 shrink-0 text-red-450" />
                      <span>{passcodeError}</span>
                    </div>
                  )}

                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-[#9fabb6] uppercase tracking-wider block">
                      Local Bypass Passcode
                    </label>
                    <input
                      type="password"
                      className="w-full px-3.5 py-2.5 bg-[#1d2125] border border-[#2c333a] rounded text-sm text-[#dfe1e6] placeholder-[#5e6c84] focus:outline-none focus:ring-1 focus:ring-[#388bff]"
                      placeholder="Enter 'vikram' or leave blank"
                      value={passcode}
                      onChange={(e) => setPasscode(e.target.value)}
                      autoFocus
                    />
                    <p className="text-[10px] text-[#8c9bab]">
                      Tip: Input <span className="font-mono text-blue-400 font-bold">vikram</span> or press authorize with empty value to bypass.
                    </p>
                  </div>
                </div>

                <div className="p-5 border-t border-[#2c333a] bg-[#1d2125]/45 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => {
                      setShowLoginModal(false);
                      setPasscodeError(null);
                      setPasscode("");
                    }}
                    className="px-4 py-2 bg-[#2c333a] hover:bg-[#38414a] text-[#dfe1e6] text-xs font-bold rounded-lg border border-[#454f59] transition cursor-pointer"
                  >
                    Close
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-[#0c66e4] hover:bg-[#0052cc] text-white text-xs font-bold rounded-lg transition cursor-pointer flex items-center gap-1.5"
                  >
                    <CheckCircle className="w-4 h-4" />
                    <span>Bypass & Authorize</span>
                  </button>
                </div>
              </form>
            ) : (
              /* If Supabase IS configured */
              <div>
                {/* Tabs */}
                <div className="flex border-b border-[#2c333a] bg-[#1d2125]/50">
                  <button
                    type="button"
                    onClick={() => {
                      setAuthTab("signin");
                      setPasscodeError(null);
                      setAuthSuccessMsg(null);
                    }}
                    className={`flex-1 py-3 text-xs font-bold border-b-2 text-center transition ${
                      authTab === "signin"
                        ? "border-[#388bff] text-white bg-[#22272b]"
                        : "border-transparent text-[#9fabb6] hover:text-white"
                    }`}
                  >
                    Sign In
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setAuthTab("signup");
                      setPasscodeError(null);
                      setAuthSuccessMsg(null);
                    }}
                    className={`flex-1 py-3 text-xs font-bold border-b-2 text-center transition ${
                      authTab === "signup"
                        ? "border-[#388bff] text-white bg-[#22272b]"
                        : "border-transparent text-[#9fabb6] hover:text-white"
                    }`}
                  >
                    Sign Up
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setAuthTab("magic");
                      setPasscodeError(null);
                      setAuthSuccessMsg(null);
                    }}
                    className={`flex-1 py-3 text-xs font-bold border-b-2 text-center transition ${
                      authTab === "magic"
                        ? "border-[#388bff] text-white bg-[#22272b]"
                        : "border-transparent text-[#9fabb6] hover:text-white"
                    }`}
                  >
                    Magic Link
                  </button>
                </div>

                <form
                  onSubmit={
                    authTab === "signin"
                      ? handleSupabaseSignIn
                      : authTab === "signup"
                      ? handleSupabaseSignUp
                      : handleSupabaseMagicLink
                  }
                >
                  <div className="p-6 space-y-4">
                    {/* Status Alerts */}
                    {passcodeError && (
                      <div className="p-3 bg-[#3e2323] border border-[#602b2b] rounded-xl text-red-300 text-xs flex items-center gap-2 leading-relaxed">
                        <AlertTriangle className="w-4 h-4 shrink-0 text-red-400" />
                        <span>{passcodeError}</span>
                      </div>
                    )}
                    {authSuccessMsg && (
                      <div className="p-3 bg-emerald-950 border border-emerald-500/30 rounded-xl text-emerald-300 text-xs flex items-center gap-2 leading-relaxed">
                        <CheckCircle className="w-4 h-4 shrink-0 text-emerald-400" />
                        <span>{authSuccessMsg}</span>
                      </div>
                    )}

                    {/* Email Field */}
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-[#9fabb6] uppercase tracking-wider block">
                        Email Address
                      </label>
                      <input
                        type="email"
                        required
                        className="w-full px-3.5 py-2.5 bg-[#1d2125] border border-[#2c333a] rounded text-sm text-[#dfe1e6] placeholder-[#5e6c84] focus:outline-none focus:ring-1 focus:ring-[#388bff]"
                        placeholder="vikram@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        autoFocus
                      />
                    </div>

                    {/* Password Field (only for Password Sign In & Sign Up) */}
                    {authTab !== "magic" && (
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-bold text-[#9fabb6] uppercase tracking-wider block">
                          Password
                        </label>
                        <input
                          type="password"
                          required
                          minLength={6}
                          className="w-full px-3.5 py-2.5 bg-[#1d2125] border border-[#2c333a] rounded text-sm text-[#dfe1e6] placeholder-[#5e6c84] focus:outline-none focus:ring-1 focus:ring-[#388bff]"
                          placeholder="Password (min 6 characters)"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                        />
                      </div>
                    )}

                    {/* OAuth Divider */}
                    {authTab !== "magic" && (
                      <div className="relative my-4 flex py-1 items-center">
                        <div className="flex-grow border-t border-[#2c333a]"></div>
                        <span className="flex-shrink mx-3 text-[10px] text-[#8c9bab] uppercase font-bold tracking-wider">Or</span>
                        <div className="flex-grow border-t border-[#2c333a]"></div>
                      </div>
                    )}

                    {/* Google OAuth trigger */}
                    {authTab !== "magic" && (
                      <button
                        type="button"
                        onClick={handleSupabaseGoogleLogin}
                        className="w-full py-2.5 px-4 bg-slate-900 hover:bg-[#2c333a] text-slate-200 hover:text-white rounded-lg border border-[#38414a] transition font-bold text-xs flex items-center justify-center gap-2 cursor-pointer shadow-sm"
                      >
                        <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
                          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
                        </svg>
                        <span>Sign In with Google</span>
                      </button>
                    )}
                  </div>

                  {/* Modal Footer Controls */}
                  <div className="p-5 border-t border-[#2c333a] bg-[#1d2125]/45 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => {
                        setShowLoginModal(false);
                        setPasscodeError(null);
                        setAuthSuccessMsg(null);
                        setEmail("");
                        setPassword("");
                      }}
                      className="px-4 py-2 bg-[#2c333a] hover:bg-[#38414a] text-[#dfe1e6] text-xs font-bold rounded-lg border border-[#454f59] transition cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={authLoading}
                      className="px-5 py-2 bg-[#0c66e4] hover:bg-[#0052cc] text-white text-xs font-bold rounded-lg transition cursor-pointer flex items-center gap-1.5 disabled:opacity-40"
                    >
                      {authLoading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Verifying...</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle className="w-4 h-4" />
                          <span>
                            {authTab === "signin"
                              ? "Sign In"
                              : authTab === "signup"
                              ? "Register Account"
                              : "Send Magic Link"}
                          </span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
