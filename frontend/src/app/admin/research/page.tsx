"use client";

import { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Database, Search, Plus, Trash2, Edit3, X, Save, FileText, 
  BrainCircuit, LayoutTemplate, Activity, FileJson, Link as LinkIcon, 
  CheckCircle, ShieldAlert, Image as ImageIcon, Loader2, BookOpen, 
  Bold, Italic, Underline, List, AlignLeft, Compass, Server, Check, Tags,
  ChevronUp, ChevronDown, Heading1, Heading2, Strikethrough, Code, AlertTriangle, RefreshCw
} from 'lucide-react';
import { useRouter } from 'next/navigation';

// ==========================================
// DATA ARCHITECTURE INTERFACES
// ==========================================
interface Metric { label: string; value: string; trend: string; }
interface Figure { title: string; url: string; hue: string; }
interface DataSource { name: string; type: string; size: string; url: string; }
// 🔥 THE FIX: Added explorerRating and explorerViews to Metadata
interface Metadata { writer: string; contributors: string[]; startDate: string; endDate: string; topics: string[]; explorerRating?: string; explorerViews?: string; }
interface Routing { targetRecent: boolean; targetUpcoming: boolean; targetPrototypes: boolean; targetExplorer: boolean; }

interface ResearchFormState {
  id?: string;
  title: string;
  type: string;
  content: string; 
  heroImg: string;
  published: boolean;
  methodology: string;
  conclusion: string;
  metrics: Metric[];
  figures: Figure[];
  dataSources: DataSource[];
  metadata: Metadata;
  routing: Routing;
}

const DEFAULT_FORM: ResearchFormState = {
  title: '', type: 'Research', content: '', heroImg: 'from-slate-800 to-black', published: false,
  methodology: '', conclusion: '', metrics: [], figures: [], dataSources: [],
  metadata: { writer: 'SYS_ADMIN', contributors: [], startDate: '', endDate: '', topics: [], explorerRating: '4.8', explorerViews: '12.4k' },
  routing: { targetRecent: true, targetUpcoming: false, targetPrototypes: false, targetExplorer: true }
};

const THUMBNAIL_PRESETS = {
  Research: ['from-blue-900 to-black', 'from-indigo-950 to-slate-900', 'from-purple-900 to-black', 'from-slate-800 to-blue-950'],
  Project: ['from-[#00ff66]/20 to-black', 'from-teal-900 to-slate-900', 'from-cyan-950 to-black', 'from-emerald-900/50 to-black'],
  Documentation: ['from-orange-950 to-black', 'from-amber-900/50 to-black', 'from-slate-800 to-black', 'from-stone-800 to-orange-950']
};

const RichTextEditor = ({ label, value, onChange, placeholder }: { label: string, value: string, onChange: (val: string) => void, placeholder: string }) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const applyFormat = (prefix: string, suffix: string) => {
    if (!textareaRef.current) return;
    const start = textareaRef.current.selectionStart;
    const end = textareaRef.current.selectionEnd;
    const text = textareaRef.current.value;
    const before = text.substring(0, start);
    const selected = text.substring(start, end);
    const after = text.substring(end, text.length);
    onChange(`${before}${prefix}${selected || (prefix.includes('<') ? 'text' : '')}${suffix}${after}`);
    
    setTimeout(() => {
      textareaRef.current?.focus();
      textareaRef.current?.setSelectionRange(start + prefix.length, end + prefix.length + (selected ? 0 : 4));
    }, 0);
  };

  return (
    <div className="bg-black border border-[#00f0ff]/30 p-6 flex flex-col group focus-within:border-[#00ff66] transition-colors shadow-lg [clip-path:polygon(0_0,100%_0,100%_calc(100%-15px),calc(100%-15px)_100%,0_100%)]">
      <label className="text-[10px] text-[#00f0ff] uppercase tracking-[0.3em] mb-3 font-black">{label}</label>
      
      <div className="flex flex-wrap items-center gap-1 bg-[#02050A] border border-slate-800 p-2 mb-2">
        <button type="button" title="Heading 1" aria-label="Heading 1" onClick={() => applyFormat('# ', '')} className="p-2 text-slate-400 hover:text-[#00ff66] hover:bg-slate-800 transition-colors"><Heading1 size={14} /></button>
        <button type="button" title="Heading 2" aria-label="Heading 2" onClick={() => applyFormat('## ', '')} className="p-2 text-slate-400 hover:text-[#00ff66] hover:bg-slate-800 transition-colors"><Heading2 size={14} /></button>
        <div className="w-px h-4 bg-slate-700 mx-1" />
        <button type="button" title="Bold" aria-label="Bold" onClick={() => applyFormat('**', '**')} className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"><Bold size={14} /></button>
        <button type="button" title="Italic" aria-label="Italic" onClick={() => applyFormat('*', '*')} className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"><Italic size={14} /></button>
        <button type="button" title="Underline" aria-label="Underline" onClick={() => applyFormat('<u>', '</u>')} className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"><Underline size={14} /></button>
        <button type="button" title="Strikethrough" aria-label="Strikethrough" onClick={() => applyFormat('~~', '~~')} className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"><Strikethrough size={14} /></button>
        <div className="w-px h-4 bg-slate-700 mx-1" />
        <button type="button" title="Bullet List" aria-label="Bullet List" onClick={() => applyFormat('\n- ', '')} className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"><List size={14} /></button>
        <button type="button" title="Align Left" aria-label="Align Left" onClick={() => applyFormat('<p align="left">', '</p>')} className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"><AlignLeft size={14} /></button>
        <button type="button" title="Inline Code" aria-label="Inline Code" onClick={() => applyFormat('`', '`')} className="p-2 text-slate-400 hover:text-[#00f0ff] hover:bg-slate-800 transition-colors"><Code size={14} /></button>
      </div>

      <textarea 
        ref={textareaRef} value={value} onChange={e => onChange(e.target.value)} 
        className="w-full bg-[#02050A] border border-slate-800 text-slate-300 text-sm leading-relaxed p-4 outline-none focus:border-[#00ff66]/50 custom-scrollbar min-h-[250px] resize-y" 
        placeholder={placeholder} 
      />
    </div>
  );
};

export default function MasterResearchForge() {
  const router = useRouter();
  
  const [posts, setPosts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'PUBLISHED' | 'DRAFT'>('ALL');
  
  const [isForgeOpen, setIsForgeOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'ROUTING' | 'IDENTITY' | 'THESIS' | 'ARRAYS' | 'ATTACHMENTS' | 'METADATA'>('ROUTING');
  const [formData, setFormData] = useState<ResearchFormState>(DEFAULT_FORM);
  const [tagInput, setTagInput] = useState('');
  const [showJsonCompiler, setShowJsonCompiler] = useState(false);
  
  const [hasDraft, setHasDraft] = useState(false);

  const fetchPosts = async () => {
    try {
      const token = localStorage.getItem('matrix_token');
      if(!token) return router.push('/auth');

      const res = await fetch('https://myresearch-bclz.onrender.com/api/posts', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const json = await res.json();
        setPosts(json.data || []);
      }
    } catch (err) {
      console.error("Network Failure");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { 
    fetchPosts(); 
    const draft = localStorage.getItem('MATRIX_FORGE_AUTOSAVE');
    if (draft) setHasDraft(true);
  }, [router]);

  useEffect(() => {
    if (isForgeOpen) {
      const timer = setTimeout(() => {
        localStorage.setItem('MATRIX_FORGE_AUTOSAVE', JSON.stringify(formData));
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [formData, isForgeOpen]);

  const restoreDraft = () => {
    const draft = localStorage.getItem('MATRIX_FORGE_AUTOSAVE');
    if (draft) {
      setFormData(JSON.parse(draft));
      setActiveTab('IDENTITY');
      setIsForgeOpen(true);
    }
  };

  const clearDraft = () => {
    localStorage.removeItem('MATRIX_FORGE_AUTOSAVE');
    setHasDraft(false);
  };

  const openForge = (post?: any) => {
    if (post) {
      let advanced = {};
      try { if (post.advancedData) advanced = JSON.parse(post.advancedData); } catch (e) {}

      setFormData({
        id: post.id,
        title: post.title || '',
        type: post.type || 'Research',
        content: post.content || '',
        heroImg: post.heroImg || 'from-slate-800 to-black',
        published: post.published || false,
        methodology: post.methodology || (advanced as any).methodology || '',
        conclusion: post.conclusion || (advanced as any).conclusion || '',
        metrics: post.metrics || (advanced as any).metrics || [],
        figures: post.figures || (advanced as any).figures || [],
        dataSources: post.dataSources || (advanced as any).dataSources || [],
        metadata: post.metadata || (advanced as any).metadata || DEFAULT_FORM.metadata,
        routing: (advanced as any).routing || DEFAULT_FORM.routing
      });
    } else {
      setFormData(DEFAULT_FORM);
    }
    setActiveTab('ROUTING');
    setIsForgeOpen(true);
  };

  const closeForge = () => {
    setIsForgeOpen(false);
    clearDraft();
  };

  const saveToMatrix = async () => {
    if (!formData.title || !formData.content) {
      setActiveTab('IDENTITY'); 
      setTimeout(() => {
        alert("System Integrity Error: Research Title and Executive Abstract are required before compiling.");
      }, 150); 
      return;
    }
    setActionLoading(true);

    const payload = {
      title: formData.title,
      type: formData.type,
      content: formData.content,
      heroImg: formData.heroImg,
      published: formData.published,
      advancedData: JSON.stringify({
        methodology: formData.methodology,
        conclusion: formData.conclusion,
        metrics: formData.metrics,
        figures: formData.figures,
        dataSources: formData.dataSources,
        metadata: formData.metadata,
        routing: formData.routing
      })
    };

    try {
      const token = localStorage.getItem('matrix_token');
      const url = formData.id ? `https://myresearch-bclz.onrender.com/api/posts/${formData.id}` : 'https://myresearch-bclz.onrender.com/api/posts';
      const method = formData.id ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        await fetchPosts();
        clearDraft();
        setIsForgeOpen(false);
      } else {
        alert("Forge Engine Error: Execution denied by server.");
      }
    } catch (err) {
      alert("Network Failure.");
    } finally {
      setActionLoading(false);
    }
  };

  const deleteNode = async (id: string) => {
    if (!confirm("CRITICAL WARNING: Permanent Deletion of Research Node. Proceed?")) return;
    try {
      const token = localStorage.getItem('matrix_token');
      const res = await fetch(`https://myresearch-bclz.onrender.com/api/posts/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) setPosts(posts.filter(p => p.id !== id));
    } catch (err) { alert("Network Failure"); }
  };

  const addArrayItem = (field: 'metrics' | 'figures' | 'dataSources', defaultItem: any) => setFormData(prev => ({ ...prev, [field]: [...prev[field], defaultItem] }));
  const updateArrayItem = (field: 'metrics' | 'figures' | 'dataSources', index: number, key: string, value: string) => setFormData(prev => { const newArr = [...prev[field]]; newArr[index] = { ...newArr[index], [key]: value }; return { ...prev, [field]: newArr }; });
  const removeArrayItem = (field: 'metrics' | 'figures' | 'dataSources', index: number) => setFormData(prev => ({ ...prev, [field]: prev[field].filter((_, i) => i !== index) }));
  
  const moveArrayItem = (field: 'metrics' | 'figures' | 'dataSources', index: number, direction: 'up' | 'down') => {
    setFormData(prev => {
      const arr = [...prev[field]];
      if (direction === 'up' && index > 0) {
        [arr[index - 1], arr[index]] = [arr[index], arr[index - 1]];
      } else if (direction === 'down' && index < arr.length - 1) {
        [arr[index + 1], arr[index]] = [arr[index], arr[index + 1]];
      }
      return { ...prev, [field]: arr };
    });
  };

  const handleTagKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && tagInput.trim() !== '') {
      e.preventDefault();
      if (!formData.metadata.topics.includes(tagInput.trim())) {
        setFormData(prev => ({ ...prev, metadata: { ...prev.metadata, topics: [...prev.metadata.topics, tagInput.trim()] } }));
      }
      setTagInput('');
    }
  };
  const removeTag = (index: number) => setFormData(prev => ({ ...prev, metadata: { ...prev.metadata, topics: prev.metadata.topics.filter((_, i) => i !== index) } }));

  const filteredPosts = useMemo(() => posts.filter(post => {
    const matchesSearch = post.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'ALL' || (filterStatus === 'PUBLISHED' && post.published) || (filterStatus === 'DRAFT' && !post.published);
    return matchesSearch && matchesStatus;
  }), [posts, searchTerm, filterStatus]);

  if (isLoading) {
    return (
      <div className="h-[70vh] flex flex-col items-center justify-center text-[#00ff66] font-mono tracking-widest uppercase">
        <Loader2 className="animate-spin mb-4 text-[#00f0ff]" size={48} />
        <p className="animate-pulse">Loading Matrix Archives...</p>
      </div>
    );
  }

  return (
    <div className="font-sans relative min-h-screen bg-[#010205] text-white selection:bg-[#00ff66]/30">
      
      <AnimatePresence>
        {!isForgeOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, y: -20 }} className="p-6 lg:p-10 relative z-10 max-w-[1600px] mx-auto">
            
            <AnimatePresence>
              {hasDraft && (
                <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9 }} className="mb-6 bg-orange-950/30 border border-orange-900/50 p-4 flex items-center justify-between [clip-path:polygon(0_0,100%_0,100%_calc(100%-10px),calc(100%-10px)_100%,0_100%)]">
                  <div className="flex items-center text-orange-500">
                    <AlertTriangle size={16} className="mr-3 animate-pulse" />
                    <span className="text-[10px] font-mono tracking-widest uppercase">Unsaved Local Draft Detected in Cache.</span>
                  </div>
                  <div className="flex space-x-3">
                    <button title="Discard Draft" aria-label="Discard Draft" onClick={clearDraft} className="text-[9px] font-black uppercase tracking-widest text-slate-500 hover:text-red-500 px-3 py-1.5 transition-colors border border-transparent hover:border-red-900/50">Discard</button>
                    <button title="Recover Data" aria-label="Recover Data" onClick={restoreDraft} className="text-[9px] font-black uppercase tracking-widest bg-orange-600 hover:bg-orange-500 text-white px-4 py-1.5 transition-colors flex items-center shadow-[0_0_15px_rgba(249,115,22,0.3)]"><RefreshCw size={12} className="mr-2" /> Recover Data</button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-8 border-b border-[#00f0ff]/30 pb-6">
              <div>
                <div className="flex items-center space-x-4 mb-2">
                  <div className="relative flex items-center justify-center w-12 h-12 bg-[#010205] border border-[#00ff66]/50 shadow-[0_0_20px_rgba(0,255,102,0.2)] [clip-path:polygon(10px_0,100%_0,100%_calc(100%-10px),calc(100%-10px)_100%,0_100%,0_10px)]">
                    <BrainCircuit size={20} className="text-[#00ff66]" />
                  </div>
                  <h1 className="text-4xl font-black uppercase tracking-[0.2em] text-white">DATA<span className="text-[#00f0ff]">CORE</span> MANAGER</h1>
                </div>
                <p className="text-[10px] text-slate-500 tracking-[0.4em] uppercase ml-16 flex items-center">
                  <span className="w-2 h-2 bg-[#00ff66] animate-pulse mr-2" /> CMS Pipeline Architecture
                </p>
              </div>

              <button title="Initialize DataCore" aria-label="Initialize DataCore" onClick={() => openForge()} className="bg-gradient-to-r from-[#00ff66]/20 to-[#00f0ff]/20 border border-[#00ff66] text-[#00ff66] hover:bg-[#00ff66] hover:text-black px-8 py-4 uppercase tracking-widest font-black transition-all flex items-center shadow-[0_0_15px_rgba(0,255,102,0.3)] [clip-path:polygon(10px_0,100%_0,100%_calc(100%-10px),calc(100%-10px)_100%,0_100%,0_10px)]">
                <Plus size={16} className="mr-2" /> Initialize DataCore
              </button>
            </div>

            <div className="flex flex-col xl:flex-row gap-4 bg-[#050A14] border border-[#00f0ff]/40 p-2 shadow-[inset_0_0_30px_rgba(0,240,255,0.05)] mb-8 [clip-path:polygon(0_0,100%_0,100%_calc(100%-15px),calc(100%-15px)_100%,0_100%)]">
              <div className="relative flex-1">
                <Search size={16} className="absolute left-5 top-1/2 -translate-y-1/2 text-[#00f0ff]" />
                <input 
                  title="Search Query" aria-label="Search Query"
                  type="text" placeholder="QUERY RESEARCH MATRIX..." 
                  value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-black/50 border-none text-white text-[11px] font-mono tracking-[0.2em] uppercase py-4 pl-14 pr-4 focus:outline-none placeholder-slate-600"
                />
              </div>
              <div className="flex items-center space-x-2 px-2">
                <div className="flex bg-black/50 p-1 border border-slate-800">
                  {['ALL', 'PUBLISHED', 'DRAFT'].map(status => (
                    <button 
                      key={status} title={`Filter by ${status}`} aria-label={`Filter by ${status}`} onClick={() => setFilterStatus(status as any)}
                      className={`px-6 py-2.5 text-[9px] font-black uppercase tracking-widest transition-all ${filterStatus === status ? 'bg-[#00f0ff] text-black shadow-[0_0_15px_rgba(0,240,255,0.5)]' : 'text-slate-500 hover:text-white border border-transparent'}`}
                    >
                      {status}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="hidden lg:grid grid-cols-12 gap-4 px-6 py-3 mb-4 border-b border-[#00f0ff]/30 text-[9px] text-[#00f0ff] font-mono tracking-[0.3em] uppercase">
              <div className="col-span-2">NODE_ID</div>
              <div className="col-span-4">RESEARCH_IDENTIFIER</div>
              <div className="col-span-2">CLASSIFICATION</div>
              <div className="col-span-2">NETWORK_STATUS</div>
              <div className="col-span-2 text-right">SYSTEM_OVERRIDE</div>
            </div>

            <div className="space-y-3 pb-24">
              <AnimatePresence>
                {filteredPosts.map((post) => (
                  <motion.div layout initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, scale: 0.95 }} key={post.id} className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center p-4 bg-[#050A14]/90 backdrop-blur-md border border-[#00f0ff]/20 hover:border-[#00ff66]/50 hover:bg-[#0A1224] transition-all duration-300 group [clip-path:polygon(0_0,100%_0,100%_calc(100%-15px),calc(100%-15px)_100%,0_100%)]">
                    
                    <div className="col-span-2 flex items-center">
                      <Database size={12} className="text-slate-600 mr-2 opacity-50" />
                      <span className="text-[10px] font-mono text-slate-500 tracking-wider">#{post.id.substring(0, 8)}</span>
                    </div>

                    <div className="col-span-4 flex items-center space-x-4 cursor-pointer" onClick={() => openForge(post)}>
                      <div className="w-10 h-10 bg-black border border-slate-800 group-hover:border-[#00f0ff] flex items-center justify-center transition-colors [clip-path:polygon(0_0,100%_0,100%_calc(100%-10px),calc(100%-10px)_100%,0_100%)]">
                        <BookOpen size={16} className="text-slate-400 group-hover:text-[#00f0ff]" />
                      </div>
                      <div className="flex flex-col overflow-hidden pr-2">
                        <span className="text-sm font-bold text-white tracking-widest uppercase group-hover:text-[#00ff66] transition-colors truncate">{post.title}</span>
                        <span className="text-[9px] font-mono text-slate-500 tracking-widest mt-0.5">{new Date(post.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>

                    <div className="col-span-2">
                      <span className="inline-flex items-center px-3 py-1.5 bg-[#00f0ff]/10 border border-[#00f0ff]/30 text-[#00f0ff] text-[9px] tracking-[0.2em] font-black font-mono uppercase">{post.type || 'RESEARCH'}</span>
                    </div>

                    <div className="col-span-2">
                      <div className={`inline-flex items-center px-3 py-1.5 border text-[9px] font-black tracking-[0.2em] uppercase ${post.published ? 'bg-[#00ff66]/10 border-[#00ff66]/50 text-[#00ff66]' : 'bg-orange-950/20 border-orange-900/50 text-orange-500'}`}>
                        <span className={`w-1.5 h-1.5 mr-2 ${post.published ? 'bg-[#00ff66] shadow-[0_0_8px_#00ff66]' : 'bg-orange-500 animate-pulse'}`} />
                        {post.published ? 'PUBLISHED' : 'DRAFT_MODE'}
                      </div>
                    </div>

                    <div className="col-span-2 flex justify-end items-center space-x-2 pr-2">
                      <button title="Edit Node" aria-label="Edit Node" onClick={() => openForge(post)} className="p-2.5 text-slate-500 hover:text-[#00f0ff] hover:bg-[#00f0ff]/10 border border-transparent hover:border-[#00f0ff]/50 transition-all opacity-0 group-hover:opacity-100"><Edit3 size={16} /></button>
                      <button title="Delete Node" aria-label="Delete Node" onClick={() => deleteNode(post.id)} className="p-2.5 text-slate-500 hover:text-white hover:bg-red-600 border border-transparent hover:border-red-500 transition-all opacity-0 group-hover:opacity-100"><Trash2 size={16} /></button>
                    </div>

                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ========================================================= */}
      {/* 2. THE DUAL-PANE DEEP FORGE WORKSPACE */}
      {/* ========================================================= */}
      <AnimatePresence>
        {isForgeOpen && (
          <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }} transition={{ type: "spring", damping: 25, stiffness: 200 }} className="fixed inset-0 z-[200] bg-[#010205] flex overflow-hidden">
            
            <div className="w-80 border-r border-[#00f0ff]/20 bg-[#02050A] flex flex-col shadow-[20px_0_50px_rgba(0,0,0,0.5)] z-20 shrink-0">
              <div className="h-28 px-8 flex flex-col justify-center border-b border-[#00f0ff]/20 bg-black relative overflow-hidden">
                 <div className="absolute top-0 right-0 w-32 h-32 bg-[#00ff66]/10 blur-[40px] pointer-events-none" />
                 <h2 className="text-[#00ff66] font-black uppercase tracking-[0.2em] flex items-center relative z-10"><Database size={16} className="mr-3" /> DataCore Forge</h2>
                 <p className="text-[9px] font-mono text-slate-500 uppercase tracking-widest mt-1 relative z-10">ID: {formData.id ? formData.id.substring(0,8) : 'NEW_NODE_ACTIVE'}</p>
              </div>

              <div className="flex-1 overflow-y-auto py-6">
                 {[
                    { id: 'ROUTING', icon: Compass, label: 'Display Routing' }, 
                    { id: 'IDENTITY', icon: Activity, label: 'Core Identity' }, 
                    { id: 'THESIS', icon: FileText, label: 'Deep Thesis (Rich Text)' }, 
                    { id: 'ARRAYS', icon: Server, label: 'Metrics Array' },
                    { id: 'ATTACHMENTS', icon: LinkIcon, label: 'Media & Attachments' },
                    { id: 'METADATA', icon: Tags, label: 'Global Tagging' }
                 ].map(tab => (
                    <button 
                      key={tab.id} title={tab.label} aria-label={tab.label} onClick={() => setActiveTab(tab.id as any)} 
                      className={`w-full flex items-center py-4 px-8 text-[11px] font-black uppercase tracking-widest transition-all relative border-transparent ${activeTab === tab.id ? 'text-[#00f0ff] bg-[#00f0ff]/10 border-r-4 border-[#00f0ff]' : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'}`}
                    >
                      <tab.icon size={16} className="mr-4" /> {tab.label}
                    </button>
                 ))}
              </div>

              <div className="p-6 bg-black border-t border-[#00f0ff]/20 flex flex-col gap-3">
                 <button title="View JSON Payload" aria-label="View JSON Payload" onClick={() => setShowJsonCompiler(!showJsonCompiler)} className="w-full text-slate-400 hover:text-white text-[10px] font-mono tracking-widest border border-slate-800 hover:border-white/20 py-3 flex items-center justify-center transition-all"><FileJson size={14} className="mr-2" /> View JSON Payload</button>
                 <button title="Compile & Save" aria-label="Compile & Save" onClick={saveToMatrix} disabled={actionLoading} className="w-full bg-[#00ff66] text-black font-black text-xs tracking-[0.2em] py-4 uppercase hover:bg-[#00ff66]/80 flex items-center justify-center shadow-[0_0_20px_rgba(0,255,102,0.3)] disabled:opacity-50 [clip-path:polygon(0_0,100%_0,100%_calc(100%-10px),calc(100%-10px)_100%,0_100%)]">
                    {actionLoading ? <Loader2 size={16} className="animate-spin" /> : <><Save size={16} className="mr-2" /> Compile & Save</>}
                 </button>
                 <button title="Abort & Close" aria-label="Abort & Close" onClick={closeForge} className="w-full text-red-500 hover:bg-red-500/10 text-[10px] font-black uppercase tracking-widest py-3 border border-transparent hover:border-red-900/50 flex items-center justify-center transition-all mt-1">Abort & Close</button>
              </div>
            </div>

            <div className="flex-1 bg-[#050A14] overflow-y-auto custom-scrollbar relative">
               
               <AnimatePresence>
                  {showJsonCompiler && (
                    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="absolute top-0 right-0 h-full w-[500px] bg-black/95 z-50 p-8 border-l border-[#00f0ff]/50 backdrop-blur-xl shadow-2xl overflow-y-auto custom-scrollbar">
                      <div className="flex justify-between items-center border-b border-[#00f0ff]/30 pb-4 mb-6">
                        <p className="text-xs text-[#00f0ff] font-mono tracking-widest uppercase">Live Payload Array</p>
                        <button title="Close JSON Payload Preview" aria-label="Close JSON Payload Preview" onClick={() => setShowJsonCompiler(false)} className="text-slate-500 hover:text-white border border-transparent hover:border-slate-600 p-1"><X size={16} /></button>
                      </div>
                      <pre className="text-[10px] text-[#00ff66] font-mono leading-relaxed whitespace-pre-wrap">{JSON.stringify(formData, null, 2)}</pre>
                    </motion.div>
                  )}
               </AnimatePresence>

               <div className="max-w-5xl mx-auto p-10 lg:p-16">
                  <AnimatePresence mode="wait">
                    
                    {/* TAB 0: PLACEMENT ROUTING */}
                    {activeTab === 'ROUTING' && (
                      <motion.div key="routing" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-8">
                        <div>
                          <h2 className="text-2xl font-black uppercase tracking-widest text-[#00f0ff] mb-2">Display Routing Engine</h2>
                          <p className="text-xs font-mono text-slate-400 tracking-wider">Determine exactly which 3D frontend components this node interacts with.</p>
                        </div>

                        <div className="grid grid-cols-1 gap-4">
                          <label className={`flex items-center p-6 border cursor-pointer transition-all ${formData.routing.targetExplorer ? 'bg-indigo-500/10 border-indigo-500 shadow-[0_0_20px_rgba(99,102,241,0.15)]' : 'bg-black border-slate-800 hover:border-slate-600'} [clip-path:polygon(0_0,100%_0,100%_calc(100%-15px),calc(100%-15px)_100%,0_100%)]`}>
                             <input type="checkbox" title="Toggle Public Guest Explorer" aria-label="Toggle Public Guest Explorer" checked={formData.routing.targetExplorer} onChange={e => setFormData({ ...formData, routing: { ...formData.routing, targetExplorer: e.target.checked }})} className="hidden" />
                             <div className={`w-5 h-5 border flex items-center justify-center mr-6 ${formData.routing.targetExplorer ? 'border-indigo-500 bg-indigo-500' : 'border-slate-600'}`}>{formData.routing.targetExplorer && <Check size={14} className="text-black" />}</div>
                             <div>
                               <h3 className="text-sm font-black text-white uppercase tracking-widest">Public Guest Explorer</h3>
                               <p className="text-[10px] text-slate-500 font-mono mt-1">Pushes node to the public-facing 3D matrix interface (`explorar.tsx`).</p>
                             </div>
                          </label>

                          <div className="w-full h-px bg-slate-800 my-4" />

                          <label className={`flex items-center p-6 border cursor-pointer transition-all ${formData.routing.targetRecent ? 'bg-[#00ff66]/10 border-[#00ff66] shadow-[0_0_20px_rgba(0,255,102,0.15)]' : 'bg-black border-slate-800 hover:border-slate-600'} [clip-path:polygon(0_0,100%_0,100%_calc(100%-15px),calc(100%-15px)_100%,0_100%)]`}>
                             <input type="checkbox" title="Toggle Recent Insights" aria-label="Toggle Recent Insights" checked={formData.routing.targetRecent} onChange={e => setFormData({ ...formData, routing: { ...formData.routing, targetRecent: e.target.checked }})} className="hidden" />
                             <div className={`w-5 h-5 border flex items-center justify-center mr-6 ${formData.routing.targetRecent ? 'border-[#00ff66] bg-[#00ff66]' : 'border-slate-600'}`}>{formData.routing.targetRecent && <Check size={14} className="text-black" />}</div>
                             <div>
                               <h3 className="text-sm font-black text-white uppercase tracking-widest">Recent Insights (Vault Carousel)</h3>
                               <p className="text-[10px] text-slate-500 font-mono mt-1">Pushes node to the 3D rotating carousel on the secure Vault page.</p>
                             </div>
                          </label>

                          <label className={`flex items-center p-6 border cursor-pointer transition-all ${formData.routing.targetUpcoming ? 'bg-[#00f0ff]/10 border-[#00f0ff] shadow-[0_0_20px_rgba(0,240,255,0.15)]' : 'bg-black border-slate-800 hover:border-slate-600'} [clip-path:polygon(0_0,100%_0,100%_calc(100%-15px),calc(100%-15px)_100%,0_100%)]`}>
                             <input type="checkbox" title="Toggle Upcoming Topics" aria-label="Toggle Upcoming Topics" checked={formData.routing.targetUpcoming || !formData.published} onChange={e => setFormData({ ...formData, routing: { ...formData.routing, targetUpcoming: e.target.checked }})} disabled={!formData.published} className="hidden" />
                             <div className={`w-5 h-5 border flex items-center justify-center mr-6 ${formData.routing.targetUpcoming || !formData.published ? 'border-[#00f0ff] bg-[#00f0ff]' : 'border-slate-600'}`}>{ (formData.routing.targetUpcoming || !formData.published) && <Check size={14} className="text-black" />}</div>
                             <div>
                               <h3 className="text-sm font-black text-white uppercase tracking-widest">Upcoming Topics (VR Cylinder)</h3>
                               <p className="text-[10px] text-slate-500 font-mono mt-1">Pushes node to the spatial 3D cylinder canvas. <span className="text-[#00f0ff]">Automatically active if node is in DRAFT status.</span></p>
                             </div>
                          </label>

                          <label className={`flex items-center p-6 border cursor-pointer transition-all ${formData.routing.targetPrototypes ? 'bg-purple-500/10 border-purple-500 shadow-[0_0_20px_rgba(168,85,247,0.15)]' : 'bg-black border-slate-800 hover:border-slate-600'} [clip-path:polygon(0_0,100%_0,100%_calc(100%-15px),calc(100%-15px)_100%,0_100%)]`}>
                             <input type="checkbox" title="Toggle Interface Prototypes" aria-label="Toggle Interface Prototypes" checked={formData.routing.targetPrototypes} onChange={e => setFormData({ ...formData, routing: { ...formData.routing, targetPrototypes: e.target.checked }})} className="hidden" />
                             <div className={`w-5 h-5 border flex items-center justify-center mr-6 ${formData.routing.targetPrototypes ? 'border-purple-500 bg-purple-500' : 'border-slate-600'}`}>{formData.routing.targetPrototypes && <Check size={14} className="text-black" />}</div>
                             <div>
                               <h3 className="text-sm font-black text-white uppercase tracking-widest">Interface Prototypes (Radial Cards)</h3>
                               <p className="text-[10px] text-slate-500 font-mono mt-1">Pushes node to the spinning interactive UI cards on the Vault page.</p>
                             </div>
                          </label>
                        </div>

                        <div className="bg-slate-900/50 border-l-4 border-slate-600 p-6">
                           <p className="text-xs text-slate-400 font-mono leading-relaxed"><strong className="text-white">Research Directory Note:</strong> The main Research Directory grid ignores these routing rules. It automatically displays any node where the Network Status is set to <strong className="text-[#00ff66]">PUBLISHED</strong>.</p>
                        </div>
                      </motion.div>
                    )}

                    {/* TAB 1: CORE IDENTITY */}
                    {activeTab === 'IDENTITY' && (
                      <motion.div key="identity" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
                        <div className="bg-black border border-[#00f0ff]/30 p-6 shadow-lg focus-within:border-[#00ff66] transition-colors [clip-path:polygon(0_0,100%_0,100%_calc(100%-15px),calc(100%-15px)_100%,0_100%)]">
                          <label className="text-[10px] text-[#00f0ff] uppercase tracking-[0.3em] block mb-2 font-black">Research Title</label>
                          <input title="Research Title" aria-label="Research Title" type="text" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="w-full bg-transparent border-b border-slate-800 focus:border-[#00ff66] text-white text-2xl font-black tracking-widest p-2 outline-none transition-colors" placeholder="ENTER CLASSIFIED TITLE..." />
                        </div>
                        
                        <div className="grid grid-cols-2 gap-6">
                          <div className="bg-black border border-[#00f0ff]/30 p-6 shadow-lg focus-within:border-[#00ff66] transition-colors [clip-path:polygon(0_0,100%_0,100%_calc(100%-15px),calc(100%-15px)_100%,0_100%)]">
                            <label className="text-[10px] text-[#00f0ff] uppercase tracking-[0.3em] block mb-4 font-black">Classification Type</label>
                            <select title="Classification Type" aria-label="Classification Type" value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})} className="w-full bg-[#02050A] border border-slate-800 text-white p-4 text-xs font-bold tracking-widest uppercase outline-none focus:border-[#00ff66] cursor-pointer">
                              <option value="Research">Research Paper</option>
                              <option value="Project">System Project</option>
                              <option value="Documentation">Documentation</option>
                            </select>
                          </div>
                          <div className="bg-black border border-[#00f0ff]/30 p-6 shadow-lg flex flex-col justify-center [clip-path:polygon(0_0,100%_0,100%_calc(100%-15px),calc(100%-15px)_100%,0_100%)]">
                            <label className="text-[10px] text-[#00f0ff] uppercase tracking-[0.3em] block mb-4 font-black">Network Status</label>
                            <button title="Toggle Network Status" aria-label="Toggle Network Status" onClick={() => setFormData({...formData, published: !formData.published})} className={`w-full py-4 text-xs font-black tracking-widest uppercase border transition-all flex items-center justify-center ${formData.published ? 'bg-[#00ff66]/20 border-[#00ff66] text-[#00ff66] shadow-[inset_0_0_15px_rgba(0,255,102,0.2)]' : 'bg-orange-950/30 border-orange-900 text-orange-500'}`}>
                              {formData.published ? <><CheckCircle size={16} className="mr-2" /> PUBLISHED</> : <><Activity size={16} className="mr-2 animate-pulse" /> DRAFT MODE</>}
                            </button>
                          </div>
                        </div>

                        <div className="bg-black border border-[#00f0ff]/30 p-6 shadow-lg focus-within:border-[#00ff66] transition-colors [clip-path:polygon(0_0,100%_0,100%_calc(100%-15px),calc(100%-15px)_100%,0_100%)]">
                          <label className="text-[10px] text-[#00f0ff] uppercase tracking-[0.3em] mb-4 font-black flex items-center"><ImageIcon size={14} className="mr-2" /> Hero Banner (Image URL or Tailwind Gradient)</label>
                          <input title="Hero Banner" aria-label="Hero Banner" type="text" value={formData.heroImg} onChange={e => setFormData({...formData, heroImg: e.target.value})} className="w-full bg-[#02050A] border border-slate-800 text-slate-300 text-sm font-mono tracking-wider p-4 outline-none focus:border-[#00ff66]" placeholder="e.g. https://... OR 'from-slate-800 to-black'" />
                          
                          <div className="mt-6 pt-4 border-t border-slate-800">
                             <p className="text-[9px] text-slate-500 uppercase tracking-widest mb-3">Field-Specific Thumbnail Suggestions</p>
                             <div className="flex space-x-3">
                               {THUMBNAIL_PRESETS[formData.type as keyof typeof THUMBNAIL_PRESETS]?.map((preset, idx) => (
                                 <button
                                   key={idx}
                                   type="button"
                                   title={`Apply ${preset} preset`}
                                   aria-label={`Apply ${preset} preset`}
                                   onClick={() => setFormData({...formData, heroImg: preset})}
                                   className={`w-12 h-8 border transition-all [clip-path:polygon(0_0,100%_0,100%_calc(100%-5px),calc(100%-5px)_100%,0_100%)] bg-gradient-to-br ${preset} ${formData.heroImg === preset ? 'border-[#00ff66] shadow-[0_0_10px_rgba(0,255,102,0.5)]' : 'border-slate-700 hover:border-[#00f0ff]'}`}
                                 />
                               ))}
                               <button
                                  type="button"
                                  title="Clear Thumbnail"
                                  aria-label="Clear Thumbnail"
                                  onClick={() => setFormData({...formData, heroImg: ''})}
                                  className="w-12 h-8 border border-slate-700 bg-black hover:border-red-500 hover:text-red-500 transition-all flex items-center justify-center text-slate-600 [clip-path:polygon(0_0,100%_0,100%_calc(100%-5px),calc(100%-5px)_100%,0_100%)]"
                               >
                                 <X size={12} />
                               </button>
                             </div>
                          </div>
                        </div>

                        {/* 🔥 THE FIX: Bound the Rating and Views inputs directly to formData.metadata */}
                        {formData.routing.targetExplorer && (
                          <div className="bg-indigo-950/10 border border-indigo-500/30 p-6 shadow-lg [clip-path:polygon(0_0,100%_0,100%_calc(100%-15px),calc(100%-15px)_100%,0_100%)]">
                             <div className="flex items-center space-x-2 mb-4 border-b border-indigo-500/20 pb-2">
                               <Compass size={16} className="text-indigo-400" />
                               <h3 className="text-xs text-indigo-400 uppercase tracking-widest font-black">Guest Explorer Overrides</h3>
                             </div>
                             <div className="grid grid-cols-2 gap-4">
                               <div>
                                 <label className="text-[9px] text-slate-500 uppercase tracking-widest block mb-2">Simulated Rating (e.g. 4.8)</label>
                                 <input title="Simulated Rating" aria-label="Simulated Rating" type="text" value={formData.metadata.explorerRating || ''} onChange={e => setFormData({ ...formData, metadata: { ...formData.metadata, explorerRating: e.target.value }})} placeholder="4.8" className="w-full bg-[#02050A] border border-slate-800 text-indigo-400 font-mono text-sm p-3 outline-none focus:border-indigo-500" />
                               </div>
                               <div>
                                 <label className="text-[9px] text-slate-500 uppercase tracking-widest block mb-2">Simulated Views (e.g. 12.4k)</label>
                                 <input title="Simulated Views" aria-label="Simulated Views" type="text" value={formData.metadata.explorerViews || ''} onChange={e => setFormData({ ...formData, metadata: { ...formData.metadata, explorerViews: e.target.value }})} placeholder="12.4k" className="w-full bg-[#02050A] border border-slate-800 text-indigo-400 font-mono text-sm p-3 outline-none focus:border-indigo-500" />
                               </div>
                             </div>
                          </div>
                        )}

                        <RichTextEditor label="Executive Abstract / Summary" value={formData.content} onChange={(val) => setFormData({...formData, content: val})} placeholder="Provide a high-level overview..." />
                      </motion.div>
                    )}

                    {/* TAB 2: THESIS DATA (RICH TEXT) */}
                    {activeTab === 'THESIS' && (
                      <motion.div key="thesis" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-8">
                        <div>
                          <h2 className="text-2xl font-black uppercase tracking-widest text-[#00f0ff] mb-2">Deep Thesis Formatting</h2>
                          <p className="text-xs font-mono text-slate-400 tracking-wider">Use the command bar to inject Markdown/HTML styling directly into the dataset.</p>
                        </div>
                        
                        <RichTextEditor label="Methodology & Framework" value={formData.methodology} onChange={(val) => setFormData({...formData, methodology: val})} placeholder="Detail the algorithms, frameworks, and architecture used..." />
                        <RichTextEditor label="Research Conclusion" value={formData.conclusion} onChange={(val) => setFormData({...formData, conclusion: val})} placeholder="Summarize findings, metrics, and future implications..." />
                      </motion.div>
                    )}

                    {/* TAB 3: ARRAYS & METRICS */}
                    {activeTab === 'ARRAYS' && (
                      <motion.div key="arrays" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
                        <div className="flex items-center justify-between bg-[#00f0ff]/5 border border-[#00f0ff]/30 p-6 [clip-path:polygon(0_0,100%_0,100%_calc(100%-15px),calc(100%-15px)_100%,0_100%)]">
                          <div>
                             <h2 className="text-xl font-black uppercase tracking-widest text-[#00f0ff] mb-1">Key Performance Indicators</h2>
                             <p className="text-[10px] font-mono text-slate-400 uppercase tracking-widest">Inject and reorder dynamic metric cards.</p>
                          </div>
                          <button title="Add Metric" aria-label="Add Metric" onClick={() => addArrayItem('metrics', { label: '', value: '', trend: '' })} className="bg-[#00ff66]/20 text-[#00ff66] border border-[#00ff66] px-6 py-3 text-xs font-black uppercase tracking-widest hover:bg-[#00ff66] hover:text-black transition-colors flex items-center shadow-[0_0_15px_rgba(0,255,102,0.2)]"><Plus size={16} className="mr-2" /> Add Metric</button>
                        </div>

                        <div className="space-y-4">
                          <AnimatePresence>
                            {formData.metrics.map((metric, i) => (
                              <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, scale: 0.9 }} key={i} className="flex flex-col md:flex-row gap-4 items-center bg-black border border-slate-800 p-4 group hover:border-[#00f0ff]/50 transition-colors [clip-path:polygon(0_0,100%_0,100%_calc(100%-15px),calc(100%-15px)_100%,0_100%)]">
                                <div className="flex flex-col bg-[#02050a] border border-slate-800 p-1">
                                  <button title="Move Metric Up" aria-label="Move Metric Up" onClick={() => moveArrayItem('metrics', i, 'up')} disabled={i===0} className="p-1 text-slate-500 hover:text-white disabled:opacity-30 border border-transparent hover:border-slate-600"><ChevronUp size={14}/></button>
                                  <button title="Move Metric Down" aria-label="Move Metric Down" onClick={() => moveArrayItem('metrics', i, 'down')} disabled={i===formData.metrics.length-1} className="p-1 text-slate-500 hover:text-white disabled:opacity-30 border border-transparent hover:border-slate-600"><ChevronDown size={14}/></button>
                                </div>
                                <div className="flex-1 w-full"><input type="text" placeholder="LABEL (e.g. Clearance)" title="Metric Label" aria-label="Metric Label" value={metric.label} onChange={(e) => updateArrayItem('metrics', i, 'label', e.target.value)} className="w-full bg-[#02050A] border border-slate-800 text-white text-sm p-3 outline-none focus:border-[#00ff66]" /></div>
                                <div className="flex-1 w-full"><input type="text" placeholder="VALUE (e.g. Level 4)" title="Metric Value" aria-label="Metric Value" value={metric.value} onChange={(e) => updateArrayItem('metrics', i, 'value', e.target.value)} className="w-full bg-[#02050A] border border-slate-800 text-white text-sm p-3 outline-none focus:border-[#00ff66]" /></div>
                                <div className="w-full md:w-48"><input type="text" placeholder="TREND (e.g. Active)" title="Metric Trend" aria-label="Metric Trend" value={metric.trend} onChange={(e) => updateArrayItem('metrics', i, 'trend', e.target.value)} className="w-full bg-[#02050A] border border-slate-800 text-[#00ff66] font-mono text-xs font-bold uppercase p-3 outline-none focus:border-[#00ff66]" /></div>
                                <button title="Delete Metric" aria-label="Delete Metric" onClick={() => removeArrayItem('metrics', i)} className="text-slate-600 hover:text-red-500 p-3 bg-slate-900/50 hover:bg-red-950/30 border border-transparent hover:border-red-900/50 transition-colors"><Trash2 size={18} /></button>
                              </motion.div>
                            ))}
                          </AnimatePresence>
                          {formData.metrics.length === 0 && <div className="border border-dashed border-slate-800 p-16 flex justify-center"><p className="text-center text-slate-600 text-xs font-mono uppercase">NO METRICS INITIALIZED.</p></div>}
                        </div>
                      </motion.div>
                    )}

                    {/* TAB 4: ATTACHMENTS (FIGURES & SOURCES) */}
                    {activeTab === 'ATTACHMENTS' && (
                      <motion.div key="attachments" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-12">
                        
                        {/* Visual Figures */}
                        <div>
                          <div className="flex items-center justify-between border-b border-[#00f0ff]/30 pb-4 mb-6">
                            <p className="text-lg text-[#00f0ff] font-black uppercase tracking-widest">Visual Schematics (Figures)</p>
                            <button title="Inject Figure" aria-label="Inject Figure" onClick={() => addArrayItem('figures', { title: '', url: '', hue: 'from-slate-700 to-slate-900' })} className="text-[#00ff66] text-xs font-black uppercase tracking-widest hover:underline flex items-center bg-[#00ff66]/10 px-4 py-2 border border-[#00ff66]/30"><Plus size={14} className="mr-2" /> Inject Figure</button>
                          </div>
                          <div className="space-y-4">
                            <AnimatePresence>
                              {formData.figures.map((fig, i) => (
                                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} key={i} className="flex flex-col gap-4 bg-black border border-slate-800 p-6 [clip-path:polygon(0_0,100%_0,100%_calc(100%-15px),calc(100%-15px)_100%,0_100%)]">
                                  <div className="flex gap-4">
                                     <div className="flex flex-col bg-[#02050a] border border-slate-800 p-1 shrink-0">
                                       <button title="Move Figure Up" aria-label="Move Figure Up" onClick={() => moveArrayItem('figures', i, 'up')} disabled={i===0} className="p-1 text-slate-500 hover:text-white disabled:opacity-30 border border-transparent hover:border-slate-600"><ChevronUp size={14}/></button>
                                       <button title="Move Figure Down" aria-label="Move Figure Down" onClick={() => moveArrayItem('figures', i, 'down')} disabled={i===formData.figures.length-1} className="p-1 text-slate-500 hover:text-white disabled:opacity-30 border border-transparent hover:border-slate-600"><ChevronDown size={14}/></button>
                                     </div>
                                     <input type="text" placeholder="FIGURE TITLE" title="Figure Title" aria-label="Figure Title" value={fig.title} onChange={(e) => updateArrayItem('figures', i, 'title', e.target.value)} className="w-full bg-[#02050a] border border-slate-800 text-white text-sm font-bold tracking-widest p-4 outline-none focus:border-[#00ff66]" />
                                     <button title="Delete Figure" aria-label="Delete Figure" onClick={() => removeArrayItem('figures', i)} className="text-slate-600 hover:text-red-500 px-4 bg-slate-900/50 hover:bg-red-950/30 border border-transparent hover:border-red-900/50 transition-colors"><Trash2 size={18} /></button>
                                  </div>
                                  <div className="flex gap-4 pl-[42px]">
                                    <input type="text" placeholder="IMAGE URL (Cloudinary, AWS, etc.)" title="Figure URL" aria-label="Figure URL" value={fig.url} onChange={(e) => updateArrayItem('figures', i, 'url', e.target.value)} className="flex-1 bg-[#02050a] border border-slate-800 text-slate-300 font-mono text-xs p-4 outline-none focus:border-[#00ff66]" />
                                    <input type="text" placeholder="FALLBACK HUE (e.g. from-blue-900 to-black)" title="Figure Fallback Hue" aria-label="Figure Fallback Hue" value={fig.hue} onChange={(e) => updateArrayItem('figures', i, 'hue', e.target.value)} className="w-64 bg-[#02050a] border border-slate-800 text-slate-400 font-mono text-xs p-4 outline-none focus:border-[#00ff66]" />
                                  </div>
                                </motion.div>
                              ))}
                            </AnimatePresence>
                          </div>
                        </div>

                        {/* Data Sources */}
                        <div>
                          <div className="flex items-center justify-between border-b border-[#00f0ff]/30 pb-4 mb-6">
                            <p className="text-lg text-[#00f0ff] font-black uppercase tracking-widest">External Data Sources</p>
                            <button title="Link Asset" aria-label="Link Asset" onClick={() => addArrayItem('dataSources', { name: '', type: 'BIN', size: 'UNKNOWN', url: '' })} className="text-[#00ff66] text-xs font-black uppercase tracking-widest hover:underline flex items-center bg-[#00ff66]/10 px-4 py-2 border border-[#00ff66]/30"><Plus size={14} className="mr-2" /> Link Asset</button>
                          </div>
                          <div className="space-y-4">
                            <AnimatePresence>
                              {formData.dataSources.map((ds, i) => (
                                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} key={i} className="flex flex-col md:flex-row gap-4 items-center bg-black border border-slate-800 p-4 [clip-path:polygon(0_0,100%_0,100%_calc(100%-15px),calc(100%-15px)_100%,0_100%)]">
                                  <div className="flex flex-col bg-[#02050a] border border-slate-800 p-1 shrink-0">
                                     <button title="Move Asset Up" aria-label="Move Asset Up" onClick={() => moveArrayItem('dataSources', i, 'up')} disabled={i===0} className="p-1 text-slate-500 hover:text-white disabled:opacity-30 border border-transparent hover:border-slate-600"><ChevronUp size={14}/></button>
                                     <button title="Move Asset Down" aria-label="Move Asset Down" onClick={() => moveArrayItem('dataSources', i, 'down')} disabled={i===formData.dataSources.length-1} className="p-1 text-slate-500 hover:text-white disabled:opacity-30 border border-transparent hover:border-slate-600"><ChevronDown size={14}/></button>
                                  </div>
                                  <div className="flex-1 w-full"><input type="text" placeholder="ASSET NAME" title="Asset Name" aria-label="Asset Name" value={ds.name} onChange={(e) => updateArrayItem('dataSources', i, 'name', e.target.value)} className="w-full bg-[#02050a] border border-slate-800 text-white text-sm font-bold tracking-widest p-4 outline-none focus:border-[#00ff66]" /></div>
                                  <div className="w-32 shrink-0"><input type="text" placeholder="TYPE (PDF)" title="Asset Type" aria-label="Asset Type" value={ds.type} onChange={(e) => updateArrayItem('dataSources', i, 'type', e.target.value)} className="w-full bg-[#02050a] border border-slate-800 text-[#00ff66] font-mono text-xs font-bold uppercase tracking-widest p-4 outline-none focus:border-[#00ff66]" /></div>
                                  <div className="w-32 shrink-0"><input type="text" placeholder="SIZE (MB)" title="Asset Size" aria-label="Asset Size" value={ds.size} onChange={(e) => updateArrayItem('dataSources', i, 'size', e.target.value)} className="w-full bg-[#02050a] border border-slate-800 text-slate-400 font-mono text-xs uppercase tracking-widest p-4 outline-none focus:border-[#00ff66]" /></div>
                                  <div className="flex-1 w-full"><input type="text" placeholder="SECURE URL LINK" title="Asset URL" aria-label="Asset URL" value={ds.url} onChange={(e) => updateArrayItem('dataSources', i, 'url', e.target.value)} className="w-full bg-[#02050a] border border-slate-800 text-slate-300 font-mono text-xs p-4 outline-none focus:border-[#00ff66]" /></div>
                                  <button title="Delete Asset" aria-label="Delete Asset" onClick={() => removeArrayItem('dataSources', i)} className="text-slate-600 hover:text-red-500 px-4 py-4 md:py-0 h-full bg-slate-900/50 hover:bg-red-950/30 border border-transparent hover:border-red-900/50 transition-colors"><Trash2 size={18} /></button>
                                </motion.div>
                              ))}
                            </AnimatePresence>
                          </div>
                        </div>
                      </motion.div>
                    )}

                    {/* TAB 5: GLOBAL METADATA TAGGING */}
                    {activeTab === 'METADATA' && (
                      <motion.div key="metadata" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
                        
                        <div className="grid grid-cols-1 gap-6">
                           {/* Master Tag Builder */}
                           <div className="bg-black border border-[#00f0ff]/30 p-8 shadow-lg [clip-path:polygon(0_0,100%_0,100%_calc(100%-15px),calc(100%-15px)_100%,0_100%)]">
                             <h3 className="text-lg text-[#00f0ff] font-black uppercase tracking-widest mb-2">Global Tagging Engine</h3>
                             <p className="text-xs font-mono text-slate-400 tracking-wider mb-6">Type a topic and press ENTER to lock it into the Matrix filters.</p>
                             
                             <div className="w-full bg-[#02050A] border border-slate-800 p-4 focus-within:border-[#00ff66] transition-colors flex flex-wrap gap-2 items-center min-h-[80px]">
                               {formData.metadata.topics.map((t, i) => (
                                 <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} key={i} className="bg-[#00f0ff]/10 text-[#00f0ff] border border-[#00f0ff]/30 pl-3 pr-1 py-1.5 flex items-center text-[10px] font-black uppercase tracking-widest shadow-[0_0_10px_rgba(0,240,255,0.1)]">
                                    {t}
                                    <button title="Remove Tag" aria-label="Remove Tag" onClick={() => removeTag(i)} className="ml-2 hover:bg-[#00f0ff]/20 text-[#00f0ff] hover:text-white p-1 border border-transparent hover:border-white/20"><X size={12}/></button>
                                 </motion.span>
                               ))}
                               <input 
                                  title="Add Tag" aria-label="Add Tag"
                                  type="text" value={tagInput} onChange={e => setTagInput(e.target.value)} onKeyDown={handleTagKeyDown} 
                                  placeholder={formData.metadata.topics.length === 0 ? "Type tag & hit Enter..." : "Add another tag..."} 
                                  className="flex-1 bg-transparent border-none text-[#00ff66] font-mono text-sm tracking-widest outline-none min-w-[200px]" 
                               />
                             </div>
                           </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                          <div className="bg-black border border-[#00f0ff]/30 p-8 shadow-lg [clip-path:polygon(0_0,100%_0,100%_calc(100%-15px),calc(100%-15px)_100%,0_100%)]">
                            <label className="text-[10px] text-[#00f0ff] uppercase tracking-[0.3em] block mb-4 font-bold">Author / Lead Engineer</label>
                            <input title="Author" aria-label="Author" type="text" value={formData.metadata.writer} onChange={e => setFormData({ ...formData, metadata: { ...formData.metadata, writer: e.target.value }})} className="w-full bg-[#02050A] border border-slate-800 text-white text-sm font-bold tracking-widest uppercase p-4 outline-none focus:border-[#00ff66]" />
                          </div>
                          <div className="bg-black border border-[#00f0ff]/30 p-8 shadow-lg [clip-path:polygon(0_0,100%_0,100%_calc(100%-15px),calc(100%-15px)_100%,0_100%)]">
                            <label className="text-[10px] text-[#00f0ff] uppercase tracking-[0.3em] block mb-4 font-bold">Contributors (Comma Separated)</label>
                            <input title="Contributors" aria-label="Contributors" type="text" value={formData.metadata.contributors.join(', ')} onChange={e => setFormData(prev => ({ ...prev, metadata: { ...prev.metadata, contributors: e.target.value.split(',').map(s => s.trim()).filter(Boolean) } }))} className="w-full bg-[#02050A] border border-slate-800 text-[#00ff66] font-mono text-xs tracking-wider p-4 outline-none focus:border-[#00ff66]" placeholder="e.g. Dr. Matrix, Oracle" />
                          </div>
                          <div className="bg-black border border-[#00f0ff]/30 p-8 shadow-lg [clip-path:polygon(0_0,100%_0,100%_calc(100%-15px),calc(100%-15px)_100%,0_100%)]">
                            <label className="text-[10px] text-[#00f0ff] uppercase tracking-[0.3em] block mb-4 font-bold">Initiation Date</label>
                            <input title="Initiation Date" aria-label="Initiation Date" placeholder="YYYY-MM-DD" type="date" value={formData.metadata.startDate} onChange={e => setFormData({ ...formData, metadata: { ...formData.metadata, startDate: e.target.value }})} className="w-full bg-[#02050A] border border-slate-800 text-slate-300 font-mono text-sm p-4 outline-none focus:border-[#00ff66] cursor-pointer" />
                          </div>
                          <div className="bg-black border border-[#00f0ff]/30 p-8 shadow-lg [clip-path:polygon(0_0,100%_0,100%_calc(100%-15px),calc(100%-15px)_100%,0_100%)]">
                            <label className="text-[10px] text-[#00f0ff] uppercase tracking-[0.3em] block mb-4 font-bold">Completion Date</label>
                            <input title="Completion Date" aria-label="Completion Date" placeholder="YYYY-MM-DD" type="date" value={formData.metadata.endDate} onChange={e => setFormData({ ...formData, metadata: { ...formData.metadata, endDate: e.target.value }})} className="w-full bg-[#02050A] border border-slate-800 text-slate-300 font-mono text-sm p-4 outline-none focus:border-[#00ff66] cursor-pointer" />
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
               </div>
            </div>

          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}