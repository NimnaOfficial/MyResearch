"use client";

import { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Database, Search, Plus, Trash2, Edit3, X, Save, FileText, 
  Terminal, Activity, FileJson, Link as LinkIcon, 
  CheckCircle, Heading1, Heading2, Bold, Italic, Underline, Strikethrough, List, AlignLeft, Code,
  ChevronUp, ChevronDown, AlertTriangle, RefreshCw, GitCommit, Layers, Video, HelpCircle, 
  Compass, Code2, Server, Tags, PlayCircle, FolderGit2, Image as ImageIcon, Loader2, Check, GitPullRequest
} from 'lucide-react';
import { useRouter } from 'next/navigation';

// ==========================================
// DATA ARCHITECTURE INTERFACES
// ==========================================
interface Feature { title: string; desc: string; icon: string; }
interface Stat { label: string; value: string; }
interface TimelineEvent { date: string; event: string; desc: string; }
interface VersionNode { version: string; date: string; notes: string; }
interface CodeTrace { path: string; type: 'ADDED' | 'CHANGED' | 'FIXED'; }
interface Routing { targetExplorer: boolean; targetVault: boolean; targetUpcoming: boolean; targetPrototypes: boolean; }

interface ShowcaseMedia { id: string; title: string; videoUrl: string; thumbnailUrl: string; description: string; }
interface SystemQuery { id: string; query: string; response: string; }

interface ProjectFormState {
  id?: string;
  projectName: string;
  version: string;
  heroImg: string;
  published: boolean;
  
  architecture: string;
  addedFeatures: string;
  changedUpdates: string;
  fixedBugs: string;
  executiveSummary: string;
  breakingChanges: string;
  migrationLog: string;
  codeSnippet: string;
  
  codeTrace: CodeTrace[];
  versionTrack: VersionNode[];
  techStack: string[];
  features: Feature[];
  stats: Stat[];
  timeline: TimelineEvent[];
  
  githubUrl: string;
  liveUrl: string;
  downloadUrl: string;
  videoUrl: string;
  
  leadDev: string;
  license: string;
  explorerRating: string;
  explorerViews: string;
  publishedAt: string;
  routing: Routing;
}

const DEFAULT_PROJECT: ProjectFormState = {
  projectName: '', version: 'v1.0.0', heroImg: 'from-[#f97316]/20 to-black', published: false,
  architecture: '', addedFeatures: '', changedUpdates: '', fixedBugs: '', executiveSummary: '', breakingChanges: '', migrationLog: '',
  codeSnippet: '// Initialize core modules...\nconst init = () => {\n  console.log("System Online");\n};',
  codeTrace: [], versionTrack: [], techStack: [], features: [], stats: [], timeline: [],
  githubUrl: '', liveUrl: '', downloadUrl: '', videoUrl: '',
  leadDev: 'SYS_ADMIN', license: 'MIT', explorerRating: '4.9', explorerViews: '15.2k', publishedAt: new Date().toISOString().split('T')[0],
  routing: { targetExplorer: true, targetVault: true, targetUpcoming: false, targetPrototypes: true }
};

const DEFAULT_MEDIA: ShowcaseMedia = { id: '', title: '', videoUrl: '', thumbnailUrl: '', description: '' };
const DEFAULT_FAQ: SystemQuery = { id: '', query: '', response: '' };

const THUMBNAIL_PRESETS = [
  'from-[#f97316]/30 to-black', 'from-amber-500/30 to-[#0c0604]', 
  'from-red-600/30 to-black', 'from-orange-800/40 to-[#0c0604]'
];

// ==========================================
// CUSTOM RICH TEXT EDITOR COMPONENT
// ==========================================
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
    <div className="bg-[#0c0604] border border-[#f97316]/30 p-6 flex flex-col group focus-within:border-[#f97316] transition-colors shadow-[0_0_15px_rgba(249,115,22,0.05)] [clip-path:polygon(0_0,100%_0,100%_calc(100%-15px),calc(100%-15px)_100%,0_100%)]">
      <label className="text-[10px] text-[#fb923c] uppercase tracking-[0.3em] mb-3 font-black">{label}</label>
      
      <div className="flex flex-wrap items-center gap-1 bg-[#180d08] border border-[#f97316]/20 p-2 mb-2 [clip-path:polygon(0_0,100%_0,100%_calc(100%-5px),calc(100%-5px)_100%,0_100%)]">
        <button type="button" title="Heading 1" aria-label="Heading 1" onClick={() => applyFormat('# ', '')} className="p-2 text-[#fb923c]/60 hover:text-[#f97316] hover:bg-[#f97316]/10 transition-colors"><Heading1 size={14} /></button>
        <button type="button" title="Heading 2" aria-label="Heading 2" onClick={() => applyFormat('## ', '')} className="p-2 text-[#fb923c]/60 hover:text-[#f97316] hover:bg-[#f97316]/10 transition-colors"><Heading2 size={14} /></button>
        <div className="w-px h-4 bg-[#f97316]/30 mx-1" />
        <button type="button" title="Bold" aria-label="Bold" onClick={() => applyFormat('**', '**')} className="p-2 text-[#fb923c]/60 hover:text-white hover:bg-[#f97316]/10 transition-colors"><Bold size={14} /></button>
        <button type="button" title="Italic" aria-label="Italic" onClick={() => applyFormat('*', '*')} className="p-2 text-[#fb923c]/60 hover:text-white hover:bg-[#f97316]/10 transition-colors"><Italic size={14} /></button>
        <button type="button" title="Underline" aria-label="Underline" onClick={() => applyFormat('<u>', '</u>')} className="p-2 text-[#fb923c]/60 hover:text-white hover:bg-[#f97316]/10 transition-colors"><Underline size={14} /></button>
        <button type="button" title="Strikethrough" aria-label="Strikethrough" onClick={() => applyFormat('~~', '~~')} className="p-2 text-[#fb923c]/60 hover:text-white hover:bg-[#f97316]/10 transition-colors"><Strikethrough size={14} /></button>
        <div className="w-px h-4 bg-[#f97316]/30 mx-1" />
        <button type="button" title="Bullet List" aria-label="Bullet List" onClick={() => applyFormat('\n- ', '')} className="p-2 text-[#fb923c]/60 hover:text-white hover:bg-[#f97316]/10 transition-colors"><List size={14} /></button>
        <button type="button" title="Align Left" aria-label="Align Left" onClick={() => applyFormat('<p align="left">', '</p>')} className="p-2 text-[#fb923c]/60 hover:text-white hover:bg-[#f97316]/10 transition-colors"><AlignLeft size={14} /></button>
        <button type="button" title="Inline Code" aria-label="Inline Code" onClick={() => applyFormat('`', '`')} className="p-2 text-[#fb923c]/60 hover:text-[#f97316] hover:bg-[#f97316]/10 transition-colors"><Code size={14} /></button>
      </div>

      <textarea 
        ref={textareaRef} value={value} onChange={e => onChange(e.target.value)} 
        className="w-full bg-[#180d08] border border-[#f97316]/20 text-slate-300 text-sm leading-relaxed p-4 outline-none focus:border-[#f97316] custom-scrollbar min-h-[200px] resize-y [clip-path:polygon(0_0,100%_0,100%_calc(100%-10px),calc(100%-10px)_100%,0_100%)]" 
        placeholder={placeholder} title={label} aria-label={label}
      />
    </div>
  );
};

// ==========================================
// MASTER PAGE COMPONENT
// ==========================================
export default function MasterProjectForge() {
  const router = useRouter();
  
  // MASTER SWITCHBOARD STATE
  const [activeMasterModule, setActiveMasterModule] = useState<'PROJECTS' | 'MEDIA' | 'FAQS'>('PROJECTS');
  
  // DATA STATES
  const [projects, setProjects] = useState<any[]>([]);
  const [mediaList, setMediaList] = useState<any[]>([]);
  const [faqList, setFaqList] = useState<any[]>([]);
  
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'PUBLISHED' | 'DRAFT'>('ALL');
  
  // FORGE STATES
  const [isForgeOpen, setIsForgeOpen] = useState(false);
  const [activeProjectTab, setActiveProjectTab] = useState<'ROUTING' | 'IDENTITY' | 'DOCUMENTATION' | 'CHANGELOG' | 'ARCHITECTURE' | 'MEDIA' | 'ARRAYS' | 'METADATA'>('ROUTING');
  
  const [projectForm, setProjectForm] = useState<ProjectFormState>(DEFAULT_PROJECT);
  const [mediaForm, setMediaForm] = useState<ShowcaseMedia>(DEFAULT_MEDIA);
  const [faqForm, setFaqForm] = useState<SystemQuery>(DEFAULT_FAQ);
  
  const [tagInput, setTagInput] = useState('');
  const [showJsonCompiler, setShowJsonCompiler] = useState(false);
  const [hasDraft, setHasDraft] = useState(false);

  // ==========================================
  // HYDRATION: FETCH ALL DATA
  // ==========================================
  const fetchAllData = async () => {
    try {
      const token = localStorage.getItem('matrix_token');
      if(!token) return router.push('/auth');

      const resProj = await fetch('http://localhost:5000/api/releases', { headers: { 'Authorization': `Bearer ${token}` } });
      if (resProj.ok) setProjects((await resProj.json()).data || []);

      const resMedia = await fetch('http://localhost:5000/api/showcase', { headers: { 'Authorization': `Bearer ${token}` } });
      if (resMedia.ok) setMediaList((await resMedia.json()).data || []);
      
      const resFaq = await fetch('http://localhost:5000/api/faqs', { headers: { 'Authorization': `Bearer ${token}` } });
      if (resFaq.ok) setFaqList((await resFaq.json()).data || []);

    } catch (err) {
      console.error("Network Failure");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { 
    fetchAllData(); 
    const draft = localStorage.getItem('MATRIX_PROJECT_AUTOSAVE');
    if (draft) setHasDraft(true);
  }, [router]);

  useEffect(() => {
    if (isForgeOpen && activeMasterModule === 'PROJECTS') {
      const timer = setTimeout(() => localStorage.setItem('MATRIX_PROJECT_AUTOSAVE', JSON.stringify(projectForm)), 1000);
      return () => clearTimeout(timer);
    }
  }, [projectForm, isForgeOpen, activeMasterModule]);

  const restoreDraft = () => {
    const draft = localStorage.getItem('MATRIX_PROJECT_AUTOSAVE');
    if (draft) { setProjectForm(JSON.parse(draft)); setActiveProjectTab('IDENTITY'); setIsForgeOpen(true); }
  };

  const clearDraft = () => { localStorage.removeItem('MATRIX_PROJECT_AUTOSAVE'); setHasDraft(false); };

  const openProjectForge = (release?: any) => {
    if (release) {
      let advanced = {};
      try { if (release.advancedData) advanced = JSON.parse(release.advancedData); } catch (e) {}

      setProjectForm({
        id: release.id,
        projectName: release.projectName || '',
        version: release.version || '',
        heroImg: release.heroImg || (advanced as any).heroImg || 'from-[#f97316]/20 to-black',
        published: release.published ?? (advanced as any).published ?? false,
        
        architecture: (advanced as any).architecture || '',
        addedFeatures: (advanced as any).addedFeatures || '',
        changedUpdates: (advanced as any).changedUpdates || '',
        fixedBugs: (advanced as any).fixedBugs || '',
        executiveSummary: (advanced as any).executiveSummary || release.releaseNotes || '',
        breakingChanges: (advanced as any).breakingChanges || '',
        migrationLog: (advanced as any).migrationLog || '',
        codeSnippet: (advanced as any).codeSnippet || '',
        
        codeTrace: (advanced as any).codeTrace || [],
        versionTrack: (advanced as any).versionTrack || [],
        techStack: (advanced as any).techStack || [],
        features: (advanced as any).features || [],
        stats: (advanced as any).stats || [],
        timeline: (advanced as any).timeline || [],
        
        githubUrl: (advanced as any).githubUrl || '',
        liveUrl: (advanced as any).liveUrl || '',
        downloadUrl: release.downloadUrl || '',
        videoUrl: (advanced as any).videoUrl || '',
        
        leadDev: (advanced as any).leadDev || 'SYS_ADMIN',
        license: (advanced as any).license || 'MIT',
        explorerRating: (advanced as any).explorerRating || '4.9',
        explorerViews: (advanced as any).explorerViews || '15.2k',
        publishedAt: release.publishedAt ? new Date(release.publishedAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        routing: (advanced as any).routing || DEFAULT_PROJECT.routing
      });
    } else {
      setProjectForm(DEFAULT_PROJECT);
    }
    setActiveProjectTab('ROUTING');
    setIsForgeOpen(true);
  };

  const openMediaForge = (media?: any) => { setMediaForm(media ? { ...media } : { title: '', videoUrl: '', thumbnailUrl: '', description: '' } as any); setIsForgeOpen(true); };
  const openFaqForge = (faq?: any) => { setFaqForm(faq ? { ...faq } : { query: '', response: '' } as any); setIsForgeOpen(true); };
  const closeForge = () => setIsForgeOpen(false);

  // ==========================================
  // API EXECUTIONS (SAVE/DELETE)
  // ==========================================
  const saveProject = async () => {
    if (!projectForm.projectName || !projectForm.version) {
      setActiveProjectTab('IDENTITY'); 
      setTimeout(() => alert("System Integrity Error: Project Name and Version are required."), 150); 
      return;
    }
    setActionLoading(true);

    const payload = {
      projectName: projectForm.projectName,
      version: projectForm.version,
      releaseNotes: projectForm.executiveSummary, // Mapped automatically
      downloadUrl: projectForm.downloadUrl,
      heroImg: projectForm.heroImg,
      published: projectForm.published,
      publishedAt: projectForm.publishedAt ? new Date(projectForm.publishedAt).toISOString() : new Date().toISOString(),
      advancedData: JSON.stringify({
        architecture: projectForm.architecture,
        addedFeatures: projectForm.addedFeatures,
        changedUpdates: projectForm.changedUpdates,
        fixedBugs: projectForm.fixedBugs,
        executiveSummary: projectForm.executiveSummary,
        breakingChanges: projectForm.breakingChanges,
        migrationLog: projectForm.migrationLog,
        codeSnippet: projectForm.codeSnippet,
        codeTrace: projectForm.codeTrace,
        versionTrack: projectForm.versionTrack,
        techStack: projectForm.techStack,
        features: projectForm.features,
        stats: projectForm.stats,
        timeline: projectForm.timeline,
        githubUrl: projectForm.githubUrl,
        liveUrl: projectForm.liveUrl,
        videoUrl: projectForm.videoUrl,
        leadDev: projectForm.leadDev,
        license: projectForm.license,
        explorerRating: projectForm.explorerRating,
        explorerViews: projectForm.explorerViews,
        routing: projectForm.routing
      })
    };

    try {
      const token = localStorage.getItem('matrix_token');
      const url = projectForm.id ? `http://localhost:5000/api/releases/${projectForm.id}` : 'http://localhost:5000/api/releases';
      const method = projectForm.id ? 'PUT' : 'POST';

      const res = await fetch(url, { method, headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });

      if (res.ok) {
        await fetchAllData();
        clearDraft();
        setIsForgeOpen(false);
      } else { alert("Forge Engine Error: Execution denied by server."); }
    } catch (err) { alert("Network Failure."); } finally { setActionLoading(false); }
  };

  const deleteProject = async (id: string) => {
    if (!confirm("CRITICAL WARNING: Permanent Deletion of Project Node. Proceed?")) return;
    try {
      const token = localStorage.getItem('matrix_token');
      const res = await fetch(`http://localhost:5000/api/releases/${id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } });
      if (res.ok) setProjects(projects.filter(r => r.id !== id));
    } catch (err) { alert("Network Failure"); }
  };

  const saveMedia = async () => {
    setActionLoading(true);
    try {
      const token = localStorage.getItem('matrix_token');
      const url = mediaForm.id ? `http://localhost:5000/api/showcase/${mediaForm.id}` : 'http://localhost:5000/api/showcase';
      const method = mediaForm.id ? 'PUT' : 'POST';
      const payload = { title: mediaForm.title, videoUrl: mediaForm.videoUrl, thumbnailUrl: mediaForm.thumbnailUrl, description: mediaForm.description };
      const res = await fetch(url, { method, headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      if (res.ok) { await fetchAllData(); setIsForgeOpen(false); } else { alert("Media Sync Failed."); }
    } catch (err) { alert("Network Error."); } finally { setActionLoading(false); }
  };

  const deleteMedia = async (id: string) => {
    if (!confirm("Delete Showcase Media?")) return;
    try {
      const token = localStorage.getItem('matrix_token');
      const res = await fetch(`http://localhost:5000/api/showcase/${id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } });
      if (res.ok) setMediaList(prev => prev.filter(m => m.id !== id));
    } catch (err) { alert("Network Error."); }
  };
  
  const saveFaq = async () => {
    setActionLoading(true);
    try {
      const token = localStorage.getItem('matrix_token');
      const url = faqForm.id ? `http://localhost:5000/api/faqs/${faqForm.id}` : 'http://localhost:5000/api/faqs';
      const method = faqForm.id ? 'PUT' : 'POST';
      const payload = { query: faqForm.query, response: faqForm.response };
      const res = await fetch(url, { method, headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      if (res.ok) { await fetchAllData(); setIsForgeOpen(false); } else { alert("FAQ Sync Failed."); }
    } catch (err) { alert("Network Error."); } finally { setActionLoading(false); }
  };

  const deleteFaq = async (id: string) => {
    if (!confirm("Delete System Query?")) return;
    try {
      const token = localStorage.getItem('matrix_token');
      const res = await fetch(`http://localhost:5000/api/faqs/${id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } });
      if (res.ok) setFaqList(prev => prev.filter(f => f.id !== id));
    } catch (err) { alert("Network Error."); }
  };

  // ==========================================
  // DYNAMIC MUTATORS
  // ==========================================
  const addArrayItem = (field: 'features' | 'stats' | 'timeline' | 'versionTrack' | 'codeTrace', defaultItem: any) => setProjectForm(prev => ({ ...prev, [field]: [...prev[field], defaultItem] }));
  const updateArrayItem = (field: 'features' | 'stats' | 'timeline' | 'versionTrack' | 'codeTrace', index: number, key: string, value: string) => setProjectForm(prev => { const newArr = [...prev[field]]; (newArr[index] as any)[key] = value; return { ...prev, [field]: newArr }; });
  const removeArrayItem = (field: 'features' | 'stats' | 'timeline' | 'versionTrack' | 'codeTrace', index: number) => setProjectForm(prev => ({ ...prev, [field]: prev[field].filter((_, i) => i !== index) }));
  
  const moveArrayItem = (field: 'features' | 'stats' | 'timeline' | 'versionTrack' | 'codeTrace', index: number, direction: 'up' | 'down') => {
    setProjectForm(prev => {
      const arr = [...prev[field]];
      if (direction === 'up' && index > 0) { [arr[index - 1], arr[index]] = [arr[index], arr[index - 1]]; } 
      else if (direction === 'down' && index < arr.length - 1) { [arr[index + 1], arr[index]] = [arr[index], arr[index + 1]]; }
      return { ...prev, [field]: arr };
    });
  };

  const handleTagKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && tagInput.trim() !== '') {
      e.preventDefault();
      if (!projectForm.techStack.includes(tagInput.trim())) setProjectForm(prev => ({ ...prev, techStack: [...prev.techStack, tagInput.trim()] }));
      setTagInput('');
    }
  };
  const removeTag = (index: number) => setProjectForm(prev => ({ ...prev, techStack: prev.techStack.filter((_, i) => i !== index) }));

  // ==========================================
  // RENDER LOGIC
  // ==========================================
  const filteredProjects = useMemo(() => projects.filter(p => {
    const matchesSearch = p.projectName.toLowerCase().includes(searchTerm.toLowerCase()) || p.version.toLowerCase().includes(searchTerm.toLowerCase());
    const pubStatus = p.published;
    const matchesStatus = filterStatus === 'ALL' || (filterStatus === 'PUBLISHED' && pubStatus) || (filterStatus === 'DRAFT' && !pubStatus);
    return matchesSearch && matchesStatus;
  }), [projects, searchTerm, filterStatus]);

  const filteredMedia = useMemo(() => mediaList.filter(m => m.title.toLowerCase().includes(searchTerm.toLowerCase())), [mediaList, searchTerm]);
  const filteredFaqs = useMemo(() => faqList.filter(f => f.query.toLowerCase().includes(searchTerm.toLowerCase())), [faqList, searchTerm]);

  if (isLoading) {
    return (
      <div className="h-[70vh] flex flex-col items-center justify-center text-[#f97316] font-mono tracking-widest uppercase bg-[#0c0604]">
        <Loader2 className="animate-spin mb-4 text-[#fb923c]" size={48} />
        <p className="animate-pulse">Booting Central Command...</p>
      </div>
    );
  }

  return (
    <div className="font-sans relative min-h-screen bg-[#0c0604] text-white selection:bg-[#f97316]/30">
      
      <AnimatePresence>
        {!isForgeOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, y: -20 }} className="p-6 lg:p-10 relative z-10 max-w-[1600px] mx-auto">
            
            <AnimatePresence>
              {hasDraft && (
                <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9 }} className="mb-6 bg-orange-950/30 border border-orange-900/50 p-4 flex items-center justify-between [clip-path:polygon(0_0,100%_0,100%_calc(100%-10px),calc(100%-10px)_100%,0_100%)]">
                  <div className="flex items-center text-[#fb923c]">
                    <AlertTriangle size={16} className="mr-3 animate-pulse" />
                    <span className="text-[10px] font-mono tracking-widest uppercase">Unsaved Project Draft Detected.</span>
                  </div>
                  <div className="flex space-x-3">
                    <button title="Discard Draft" aria-label="Discard Draft" onClick={clearDraft} className="text-[9px] font-black uppercase tracking-widest text-slate-500 hover:text-red-500 px-3 py-1.5 transition-colors border border-transparent hover:border-red-900/50">Discard</button>
                    <button title="Recover Data" aria-label="Recover Data" onClick={restoreDraft} className="text-[9px] font-black uppercase tracking-widest bg-[#f97316] hover:bg-[#fb923c] text-black px-4 py-1.5 transition-colors flex items-center shadow-[0_0_15px_rgba(249,115,22,0.3)] [clip-path:polygon(0_0,100%_0,100%_calc(100%-5px),calc(100%-5px)_100%,0_100%)]"><RefreshCw size={12} className="mr-2" /> Recover</button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-12 border-b border-[#f97316]/30 pb-6">
              <div>
                <div className="flex items-center space-x-4 mb-2">
                  <div className="relative flex items-center justify-center w-12 h-12 bg-[#180d08] border border-[#f97316]/50 shadow-[0_0_20px_rgba(249,115,22,0.2)] [clip-path:polygon(30%_0%,_70%_0%,_100%_30%,_100%_70%,_70%_100%,_30%_100%,_0%_70%,_0%_30%)]">
                    <Layers size={20} className="text-[#f97316]" />
                  </div>
                  <h1 className="text-4xl font-black uppercase tracking-[0.2em] text-white">SYSTEM<span className="text-[#f97316]">COMMAND</span></h1>
                </div>
                <p className="text-[10px] text-slate-500 tracking-[0.4em] uppercase ml-16 flex items-center">
                  <span className="w-2 h-2 bg-[#fb923c] animate-pulse mr-2 [clip-path:polygon(50%_0%,_100%_50%,_50%_100%,_0%_50%)]" /> Multi-Module Architecture
                </p>
              </div>

              {/* Master Switchboard */}
              <div className="flex bg-[#180d08] p-1 border border-[#f97316]/30 [clip-path:polygon(0_0,100%_0,100%_calc(100%-10px),calc(100%-10px)_100%,0_100%)]">
                {[
                  { id: 'PROJECTS', label: 'Data Cores', icon: Database },
                  { id: 'MEDIA', label: 'Showcase Media', icon: Video },
                  { id: 'FAQS', label: 'System Queries', icon: HelpCircle }
                ].map(mod => (
                  <button 
                    key={mod.id} title={mod.label} aria-label={mod.label} onClick={() => setActiveMasterModule(mod.id as any)}
                    className={`flex items-center px-6 py-3 text-[10px] font-black uppercase tracking-widest transition-all ${activeMasterModule === mod.id ? 'bg-[#f97316] text-black shadow-[0_0_15px_rgba(249,115,22,0.5)] [clip-path:polygon(0_0,100%_0,100%_calc(100%-5px),calc(100%-5px)_100%,0_100%)]' : 'text-[#fb923c]/70 hover:text-white border border-transparent'}`}
                  >
                    <mod.icon size={14} className="mr-2" /> {mod.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Tactical Search & Action Bar */}
            <div className="flex flex-col xl:flex-row gap-4 mb-8">
              <div className="flex-1 bg-[#180d08] border border-[#f97316]/40 p-2 shadow-[inset_0_0_30px_rgba(249,115,22,0.05)] [clip-path:polygon(0_0,100%_0,100%_calc(100%-15px),calc(100%-15px)_100%,0_100%)]">
                <div className="relative flex items-center h-full">
                  <Search size={16} className="absolute left-5 text-[#f97316]" />
                  <input 
                    title="Search Query" aria-label="Search Query" type="text" placeholder={`QUERY ${activeMasterModule} MATRIX...`}
                    value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-black/50 border-none text-white text-[11px] font-mono tracking-[0.2em] uppercase py-4 pl-14 pr-4 focus:outline-none placeholder-slate-600 h-full"
                  />
                </div>
              </div>
              <button 
                title={`Add ${activeMasterModule}`} aria-label={`Add ${activeMasterModule}`}
                onClick={() => {
                  if (activeMasterModule === 'PROJECTS') openProjectForge();
                  if (activeMasterModule === 'MEDIA') openMediaForge();
                  if (activeMasterModule === 'FAQS') openFaqForge();
                }} 
                className="bg-[#f97316]/10 border border-[#f97316] text-[#f97316] hover:bg-[#f97316] hover:text-black px-8 py-4 uppercase tracking-widest font-black transition-all flex items-center shadow-[0_0_15px_rgba(249,115,22,0.2)] [clip-path:polygon(10px_0,100%_0,100%_calc(100%-10px),calc(100%-10px)_100%,0_100%,0_10px)]"
              >
                <Plus size={16} className="mr-2" /> Inject Node
              </button>
            </div>

            {/* ======================================= */}
            {/* MODULE 1: PROJECTS GRID */}
            {/* ======================================= */}
            {activeMasterModule === 'PROJECTS' && (
              <>
                <div className="flex items-center space-x-2 px-2 mb-6">
                  <div className="flex bg-[#180d08] p-1 border border-slate-800">
                    {['ALL', 'PUBLISHED', 'DRAFT'].map(status => (
                      <button 
                        key={status} title={`Filter by ${status}`} aria-label={`Filter by ${status}`} onClick={() => setFilterStatus(status as any)}
                        className={`px-6 py-2.5 text-[9px] font-black uppercase tracking-widest transition-all ${filterStatus === status ? 'bg-[#f97316] text-black shadow-[0_0_15px_rgba(249,115,22,0.5)] [clip-path:polygon(0_0,100%_0,100%_calc(100%-5px),calc(100%-5px)_100%,0_100%)]' : 'text-slate-500 hover:text-white border border-transparent'}`}
                      >
                        {status}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="hidden lg:grid grid-cols-12 gap-4 px-6 py-3 mb-4 border-b border-[#f97316]/30 text-[9px] text-[#fb923c] font-mono tracking-[0.3em] uppercase">
                  <div className="col-span-2">NODE_ID</div>
                  <div className="col-span-4">PROJECT_IDENTIFIER</div>
                  <div className="col-span-2">VERSION</div>
                  <div className="col-span-2">NETWORK_STATUS</div>
                  <div className="col-span-2 text-right">SYSTEM_OVERRIDE</div>
                </div>

                <div className="space-y-3 pb-24">
                  <AnimatePresence>
                    {filteredProjects.map((p) => {
                      const pubStatus = p.published;

                      return (
                        <motion.div layout initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, scale: 0.95 }} key={p.id} className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center p-4 bg-[#180d08]/90 backdrop-blur-md border border-[#f97316]/20 hover:border-[#f97316]/70 transition-all duration-300 group [clip-path:polygon(0_0,100%_0,100%_calc(100%-15px),calc(100%-15px)_100%,0_100%)]">
                          <div className="col-span-2 flex items-center">
                            <GitCommit size={12} className="text-slate-600 mr-2 opacity-50" />
                            <span className="text-[10px] font-mono text-slate-500 tracking-wider">#{p.id.substring(0, 8)}</span>
                          </div>
                          <div className="col-span-4 flex items-center space-x-4 cursor-pointer" onClick={() => openProjectForge(p)}>
                            <div className="w-10 h-10 bg-black border border-[#f97316]/30 group-hover:border-[#f97316] flex items-center justify-center transition-colors [clip-path:polygon(0_0,100%_0,100%_calc(100%-10px),calc(100%-10px)_100%,0_100%)]">
                              <Terminal size={16} className="text-[#fb923c] group-hover:text-[#f97316]" />
                            </div>
                            <div className="flex flex-col overflow-hidden pr-2">
                              <span className="text-sm font-bold text-white tracking-widest uppercase group-hover:text-[#f97316] transition-colors truncate">{p.projectName}</span>
                            </div>
                          </div>
                          <div className="col-span-2">
                            <span className="inline-flex items-center px-3 py-1.5 bg-[#f97316]/10 border border-[#f97316]/30 text-[#fb923c] text-[9px] tracking-[0.2em] font-black font-mono uppercase">{p.version}</span>
                          </div>
                          <div className="col-span-2">
                            <div className={`inline-flex items-center px-3 py-1.5 border text-[9px] font-black tracking-[0.2em] uppercase ${pubStatus ? 'bg-[#f97316]/20 border-[#f97316] text-[#f97316]' : 'bg-slate-900/50 border-slate-700 text-slate-500'}`}>
                              <span className={`w-2 h-2 mr-2 [clip-path:polygon(0_0,100%_0,100%_100%,0_100%)] ${pubStatus ? 'bg-[#f97316] shadow-[0_0_8px_#f97316]' : 'bg-slate-500'}`} />
                              {pubStatus ? 'DEPLOYED' : 'DRAFT'}
                            </div>
                          </div>
                          <div className="col-span-2 flex justify-end items-center space-x-2 pr-2">
                            <button title="Edit Node" aria-label="Edit Node" onClick={() => openProjectForge(p)} className="p-2.5 text-slate-500 hover:text-[#fb923c] hover:bg-[#f97316]/10 border border-transparent hover:border-[#f97316]/50 transition-all opacity-0 group-hover:opacity-100 [clip-path:polygon(0_0,100%_0,100%_calc(100%-5px),calc(100%-5px)_100%,0_100%)]"><Edit3 size={16} /></button>
                            <button title="Delete Node" aria-label="Delete Node" onClick={() => deleteProject(p.id)} className="p-2.5 text-slate-500 hover:text-white hover:bg-red-600 border border-transparent hover:border-red-500 transition-all opacity-0 group-hover:opacity-100 [clip-path:polygon(0_0,100%_0,100%_calc(100%-5px),calc(100%-5px)_100%,0_100%)]"><Trash2 size={16} /></button>
                          </div>
                        </motion.div>
                      )
                    })}
                  </AnimatePresence>
                  {filteredProjects.length === 0 && <div className="py-16 text-center border border-dashed border-[#f97316]/30"><p className="text-slate-500 font-mono text-sm tracking-widest uppercase">NO DATA CORES DETECTED.</p></div>}
                </div>
              </>
            )}

            {/* ======================================= */}
            {/* MODULE 2: SHOWCASE MEDIA GRID */}
            {/* ======================================= */}
            {activeMasterModule === 'MEDIA' && (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 pb-24">
                <AnimatePresence>
                  {filteredMedia.map(m => (
                    <motion.div layout initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} key={m.id} className="bg-[#180d08] border border-[#f97316]/30 p-6 flex flex-col group [clip-path:polygon(0_0,100%_0,100%_calc(100%-20px),calc(100%-20px)_100%,0_100%)] shadow-lg hover:border-[#f97316] transition-colors">
                       <div className="w-full h-40 bg-black border border-slate-800 mb-4 overflow-hidden relative flex items-center justify-center [clip-path:polygon(0_0,100%_0,100%_calc(100%-10px),calc(100%-10px)_100%,0_100%)]">
                         {m.thumbnailUrl ? <img src={m.thumbnailUrl} alt={m.title} className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity" /> : <Video className="text-slate-800" size={32} />}
                       </div>
                       <h3 className="text-lg font-black uppercase tracking-widest text-white truncate mb-2">{m.title}</h3>
                       <p className="text-[10px] font-mono text-slate-500 truncate mb-6">{m.videoUrl || 'NO VIDEO ATTACHED'}</p>
                       <div className="mt-auto flex space-x-2">
                         <button onClick={() => openMediaForge(m)} className="flex-1 bg-[#f97316]/10 border border-[#f97316]/30 text-[#fb923c] py-2 text-[10px] font-black uppercase tracking-widest hover:bg-[#f97316] hover:text-black transition-colors [clip-path:polygon(0_0,100%_0,100%_calc(100%-5px),calc(100%-5px)_100%,0_100%)]" title="Edit Media" aria-label="Edit Media">Edit Configuration</button>
                         <button onClick={() => deleteMedia(m.id)} className="px-4 bg-red-950/30 border border-red-900/50 text-red-500 hover:bg-red-600 hover:text-white transition-colors [clip-path:polygon(0_0,100%_0,100%_calc(100%-5px),calc(100%-5px)_100%,0_100%)]" title="Delete Media" aria-label="Delete Media"><Trash2 size={14}/></button>
                       </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
                {filteredMedia.length === 0 && <div className="col-span-full py-16 text-center border border-dashed border-[#f97316]/30"><p className="text-slate-500 font-mono text-sm tracking-widest uppercase">NO MEDIA NODES DETECTED.</p></div>}
              </div>
            )}

            {/* ======================================= */}
            {/* MODULE 3: SYSTEM QUERIES (FAQs) */}
            {/* ======================================= */}
            {activeMasterModule === 'FAQS' && (
              <div className="space-y-4 pb-24">
                <AnimatePresence>
                  {filteredFaqs.map(f => (
                    <motion.div layout initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} key={f.id} className="bg-[#180d08] border border-[#f97316]/30 p-6 flex flex-col md:flex-row md:items-center gap-6 group [clip-path:polygon(0_0,100%_0,100%_calc(100%-15px),calc(100%-15px)_100%,0_100%)] shadow-lg hover:border-[#f97316] transition-colors">
                       <div className="flex-1">
                         <h3 className="text-sm font-black uppercase tracking-widest text-[#fb923c] mb-2 flex items-start"><HelpCircle size={16} className="mr-3 shrink-0 mt-0.5" /> {f.query}</h3>
                         <p className="text-xs font-mono text-slate-400 pl-7 line-clamp-2">{f.response}</p>
                       </div>
                       <div className="flex space-x-2 shrink-0">
                         <button onClick={() => openFaqForge(f)} className="p-3 bg-[#f97316]/10 border border-[#f97316]/30 text-[#fb923c] hover:bg-[#f97316] hover:text-black transition-colors [clip-path:polygon(0_0,100%_0,100%_calc(100%-5px),calc(100%-5px)_100%,0_100%)]" title="Edit Query" aria-label="Edit Query"><Edit3 size={16}/></button>
                         <button onClick={() => deleteFaq(f.id)} className="p-3 bg-red-950/30 border border-red-900/50 text-red-500 hover:bg-red-600 hover:text-white transition-colors [clip-path:polygon(0_0,100%_0,100%_calc(100%-5px),calc(100%-5px)_100%,0_100%)]" title="Delete Query" aria-label="Delete Query"><Trash2 size={16}/></button>
                       </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
                {filteredFaqs.length === 0 && <div className="py-16 text-center border border-dashed border-[#f97316]/30"><p className="text-slate-500 font-mono text-sm tracking-widest uppercase">NO QUERY NODES DETECTED.</p></div>}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ========================================================= */}
      {/* DEEP FORGE WORKSPACE (DUAL-PANE EDITOR) */}
      {/* ========================================================= */}
      <AnimatePresence>
        {isForgeOpen && (
          <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }} transition={{ type: "spring", damping: 25, stiffness: 200 }} className="fixed inset-0 z-[200] bg-[#0c0604] flex overflow-hidden">
            
            {/* LEFT PANE: NAVIGATION RAIL */}
            <div className="w-80 border-r border-[#f97316]/30 bg-[#180d08] flex flex-col shadow-[20px_0_50px_rgba(0,0,0,0.8)] z-20 shrink-0">
              <div className="h-28 px-8 flex flex-col justify-center border-b border-[#f97316]/30 bg-black relative overflow-hidden">
                 <div className="absolute top-0 right-0 w-32 h-32 bg-[#f97316]/10 blur-[40px] pointer-events-none" />
                 <h2 className="text-[#f97316] font-black uppercase tracking-[0.2em] flex items-center relative z-10">
                   {activeMasterModule === 'PROJECTS' && <><Terminal size={16} className="mr-3" /> Release Forge</>}
                   {activeMasterModule === 'MEDIA' && <><Video size={16} className="mr-3" /> Media Forge</>}
                   {activeMasterModule === 'FAQS' && <><HelpCircle size={16} className="mr-3" /> Query Forge</>}
                 </h2>
                 <p className="text-[9px] font-mono text-[#fb923c]/50 uppercase tracking-widest mt-1 relative z-10">ID: {projectForm.id || mediaForm.id || faqForm.id ? 'ACTIVE_NODE' : 'NEW_NODE'}</p>
              </div>

              {/* TABS CONTEXTUAL TO ACTIVE MODULE */}
              <div className="flex-1 overflow-y-auto py-6">
                 {activeMasterModule === 'PROJECTS' && [
                    { id: 'ROUTING', icon: Compass, label: 'Display Routing' }, 
                    { id: 'IDENTITY', icon: Activity, label: 'Core Identity' }, 
                    { id: 'DOCUMENTATION', icon: FileText, label: 'Documentation' }, 
                    { id: 'CHANGELOG', icon: GitPullRequest, label: 'Changelog Details' },
                    { id: 'ARCHITECTURE', icon: Code2, label: 'System Architecture' },
                    { id: 'MEDIA', icon: PlayCircle, label: 'Media & Repos' }, 
                    { id: 'ARRAYS', icon: Server, label: 'Dynamic Arrays' },
                    { id: 'METADATA', icon: Tags, label: 'Global Metadata' }
                 ].map(tab => (
                    <button 
                      key={tab.id} title={tab.label} aria-label={tab.label} onClick={() => setActiveProjectTab(tab.id as any)} 
                      className={`w-full flex items-center py-4 px-8 text-[11px] font-black uppercase tracking-widest transition-all relative border-transparent ${activeProjectTab === tab.id ? 'text-[#f97316] bg-[#f97316]/10 border-r-4 border-[#f97316]' : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'}`}
                    >
                      <tab.icon size={16} className="mr-4" /> {tab.label}
                    </button>
                 ))}

                 {activeMasterModule === 'MEDIA' && (
                    <div className="w-full flex items-center py-4 px-8 text-[11px] font-black uppercase tracking-widest text-[#f97316] bg-[#f97316]/10 border-r-4 border-[#f97316]">
                      <Video size={16} className="mr-4" /> Media Core parameters
                    </div>
                 )}

                 {activeMasterModule === 'FAQS' && (
                    <div className="w-full flex items-center py-4 px-8 text-[11px] font-black uppercase tracking-widest text-[#f97316] bg-[#f97316]/10 border-r-4 border-[#f97316]">
                      <HelpCircle size={16} className="mr-4" /> System Query logic
                    </div>
                 )}
              </div>

              <div className="p-6 bg-black border-t border-[#f97316]/30 flex flex-col gap-3">
                 {activeMasterModule === 'PROJECTS' && <button title="View JSON Payload" aria-label="View JSON Payload" onClick={() => setShowJsonCompiler(!showJsonCompiler)} className="w-full text-[#fb923c]/70 hover:text-white text-[10px] font-mono tracking-widest border border-slate-800 hover:border-white/20 py-3 flex items-center justify-center transition-all [clip-path:polygon(0_0,100%_0,100%_calc(100%-10px),calc(100%-10px)_100%,0_100%)]"><FileJson size={14} className="mr-2" /> View JSON Payload</button>}
                 
                 <button 
                   title="Compile Node" aria-label="Compile Node" disabled={actionLoading} 
                   onClick={() => {
                     if (activeMasterModule === 'PROJECTS') saveProject();
                     if (activeMasterModule === 'MEDIA') saveMedia();
                     if (activeMasterModule === 'FAQS') saveFaq();
                   }}
                   className="w-full bg-[#f97316] text-black font-black text-xs tracking-[0.2em] py-4 uppercase hover:bg-white flex items-center justify-center shadow-[0_0_20px_rgba(249,115,22,0.4)] disabled:opacity-50 [clip-path:polygon(0_0,100%_0,100%_calc(100%-10px),calc(100%-10px)_100%,0_100%)]"
                 >
                    {actionLoading ? <Loader2 size={16} className="animate-spin" /> : <><Save size={16} className="mr-2" /> Compile Node</>}
                 </button>
                 <button title="Abort" aria-label="Abort" onClick={closeForge} className="w-full text-red-500 hover:bg-red-500/10 text-[10px] font-black uppercase tracking-widest py-3 border border-transparent hover:border-red-900/50 flex items-center justify-center transition-all mt-1 [clip-path:polygon(0_0,100%_0,100%_calc(100%-10px),calc(100%-10px)_100%,0_100%)]">Abort & Close</button>
              </div>
            </div>

            {/* RIGHT PANE: EDITOR WORKSPACE */}
            <div className="flex-1 bg-[#0c0604] overflow-y-auto custom-scrollbar relative">
               
               {/* JSON Preview */}
               <AnimatePresence>
                  {showJsonCompiler && activeMasterModule === 'PROJECTS' && (
                    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="absolute top-0 right-0 h-full w-[500px] bg-black/95 z-50 p-8 border-l border-[#f97316]/50 backdrop-blur-xl shadow-2xl overflow-y-auto custom-scrollbar">
                      <div className="flex justify-between items-center border-b border-[#f97316]/30 pb-4 mb-6">
                        <p className="text-xs text-[#f97316] font-mono tracking-widest uppercase">Live Payload Array</p>
                        <button title="Close JSON" aria-label="Close JSON" onClick={() => setShowJsonCompiler(false)} className="text-slate-500 hover:text-white"><X size={16} /></button>
                      </div>
                      <pre className="text-[10px] text-[#fb923c] font-mono leading-relaxed whitespace-pre-wrap">{JSON.stringify(projectForm, null, 2)}</pre>
                    </motion.div>
                  )}
               </AnimatePresence>

               <div className="max-w-5xl mx-auto p-10 lg:p-16">
                  
                  {/* ================================================= */}
                  {/* PROJECT FORGE TABS */}
                  {/* ================================================= */}
                  {activeMasterModule === 'PROJECTS' && (
                    <AnimatePresence mode="wait">
                      
                      {/* ROUTING TAB */}
                      {activeProjectTab === 'ROUTING' && (
                        <motion.div key="routing" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-8">
                          <div>
                            <h2 className="text-2xl font-black uppercase tracking-widest text-[#f97316] mb-2">Display Routing Engine</h2>
                            <p className="text-xs font-mono text-slate-400 tracking-wider">Determine exactly which 3D frontend components this project interacts with.</p>
                          </div>

                          <div className="grid grid-cols-1 gap-4">
                            <label className={`flex items-center p-6 border cursor-pointer transition-all ${projectForm.routing.targetExplorer ? 'bg-indigo-500/10 border-indigo-500 shadow-[0_0_20px_rgba(99,102,241,0.15)]' : 'bg-black border-slate-800 hover:border-slate-600'} [clip-path:polygon(0_0,100%_0,100%_calc(100%-15px),calc(100%-15px)_100%,0_100%)]`}>
                               <input type="checkbox" title="Toggle Public Guest Explorer" aria-label="Toggle Public Guest Explorer" checked={projectForm.routing.targetExplorer} onChange={e => setProjectForm({ ...projectForm, routing: { ...projectForm.routing, targetExplorer: e.target.checked }})} className="hidden" />
                               <div className={`w-5 h-5 border flex items-center justify-center mr-6 [clip-path:polygon(0_0,100%_0,100%_100%,0_100%)] ${projectForm.routing.targetExplorer ? 'border-indigo-500 bg-indigo-500' : 'border-slate-600'}`}>{projectForm.routing.targetExplorer && <Check size={14} className="text-black" />}</div>
                               <div>
                                 <h3 className="text-sm font-black text-white uppercase tracking-widest">Public Guest Explorer</h3>
                                 <p className="text-[10px] text-slate-500 font-mono mt-1">Pushes node to the public-facing 3D matrix interface (`explorar.tsx`).</p>
                               </div>
                            </label>

                            <div className="w-full h-px bg-slate-800 my-4" />

                            <label className={`flex items-center p-6 border cursor-pointer transition-all ${projectForm.routing.targetVault ? 'bg-[#f97316]/10 border-[#f97316] shadow-[0_0_20px_rgba(249,115,22,0.15)]' : 'bg-black border-slate-800 hover:border-slate-600'} [clip-path:polygon(0_0,100%_0,100%_calc(100%-15px),calc(100%-15px)_100%,0_100%)]`}>
                               <input type="checkbox" title="Toggle Project Vault" aria-label="Toggle Project Vault" checked={projectForm.routing.targetVault} onChange={e => setProjectForm({ ...projectForm, routing: { ...projectForm.routing, targetVault: e.target.checked }})} className="hidden" />
                               <div className={`w-5 h-5 border flex items-center justify-center mr-6 [clip-path:polygon(0_0,100%_0,100%_100%,0_100%)] ${projectForm.routing.targetVault ? 'border-[#f97316] bg-[#f97316]' : 'border-slate-600'}`}>{projectForm.routing.targetVault && <Check size={14} className="text-black" />}</div>
                               <div>
                                 <h3 className="text-sm font-black text-white uppercase tracking-widest">Project Directory Vault</h3>
                                 <p className="text-[10px] text-slate-500 font-mono mt-1">Displays project in the central list on `project.tsx`.</p>
                               </div>
                            </label>

                            <label className={`flex items-center p-6 border cursor-pointer transition-all ${projectForm.routing.targetUpcoming || !projectForm.published ? 'bg-[#fb923c]/10 border-[#fb923c] shadow-[0_0_20px_rgba(251,146,60,0.15)]' : 'bg-black border-slate-800 hover:border-slate-600'} [clip-path:polygon(0_0,100%_0,100%_calc(100%-15px),calc(100%-15px)_100%,0_100%)]`}>
                               <input type="checkbox" title="Toggle Future Architecture" aria-label="Toggle Future Architecture" checked={projectForm.routing.targetUpcoming || !projectForm.published} onChange={e => setProjectForm({ ...projectForm, routing: { ...projectForm.routing, targetUpcoming: e.target.checked }})} disabled={!projectForm.published} className="hidden" />
                               <div className={`w-5 h-5 border flex items-center justify-center mr-6 [clip-path:polygon(0_0,100%_0,100%_100%,0_100%)] ${projectForm.routing.targetUpcoming || !projectForm.published ? 'border-[#fb923c] bg-[#fb923c]' : 'border-slate-600'}`}>{ (projectForm.routing.targetUpcoming || !projectForm.published) && <Check size={14} className="text-black" />}</div>
                               <div>
                                 <h3 className="text-sm font-black text-white uppercase tracking-widest">Future Architecture (VR Cylinder)</h3>
                                 <p className="text-[10px] text-slate-500 font-mono mt-1">Pushes node to the spatial 3D cylinder canvas. <span className="text-[#fb923c]">Automatically active if node is in DRAFT status.</span></p>
                               </div>
                            </label>

                            <label className={`flex items-center p-6 border cursor-pointer transition-all ${projectForm.routing.targetPrototypes ? 'bg-purple-500/10 border-purple-500 shadow-[0_0_20px_rgba(168,85,247,0.15)]' : 'bg-black border-slate-800 hover:border-slate-600'} [clip-path:polygon(0_0,100%_0,100%_calc(100%-15px),calc(100%-15px)_100%,0_100%)]`}>
                               <input type="checkbox" title="Toggle Interactive Node Graph" aria-label="Toggle Interactive Node Graph" checked={projectForm.routing.targetPrototypes} onChange={e => setProjectForm({ ...projectForm, routing: { ...projectForm.routing, targetPrototypes: e.target.checked }})} className="hidden" />
                               <div className={`w-5 h-5 border flex items-center justify-center mr-6 [clip-path:polygon(0_0,100%_0,100%_100%,0_100%)] ${projectForm.routing.targetPrototypes ? 'border-purple-500 bg-purple-500' : 'border-slate-600'}`}>{projectForm.routing.targetPrototypes && <Check size={14} className="text-black" />}</div>
                               <div>
                                 <h3 className="text-sm font-black text-white uppercase tracking-widest">Interactive Node Graph</h3>
                                 <p className="text-[10px] text-slate-500 font-mono mt-1">Spawns a floating node in the 3D map on the top of `project.tsx`.</p>
                               </div>
                            </label>
                          </div>
                        </motion.div>
                      )}

                      {/* IDENTITY TAB */}
                      {activeProjectTab === 'IDENTITY' && (
                        <motion.div key="identity" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="bg-[#180d08] border border-[#f97316]/30 p-6 shadow-lg focus-within:border-[#f97316] transition-colors [clip-path:polygon(0_0,100%_0,100%_calc(100%-15px),calc(100%-15px)_100%,0_100%)]">
                              <label className="text-[10px] text-[#fb923c] uppercase tracking-[0.3em] block mb-2 font-black">Project Name</label>
                              <input title="Project Name" aria-label="Project Name" type="text" value={projectForm.projectName} onChange={e => setProjectForm({...projectForm, projectName: e.target.value})} className="w-full bg-transparent border-b border-slate-800 focus:border-[#f97316] text-white text-2xl font-black tracking-widest p-2 outline-none transition-colors" placeholder="ENTER SYSTEM NAME..." />
                            </div>
                            <div className="bg-[#180d08] border border-[#f97316]/30 p-6 shadow-lg focus-within:border-[#f97316] transition-colors [clip-path:polygon(0_0,100%_0,100%_calc(100%-15px),calc(100%-15px)_100%,0_100%)]">
                              <label className="text-[10px] text-[#fb923c] uppercase tracking-[0.3em] block mb-2 font-black">Version Tag</label>
                              <input title="Version Tag" aria-label="Version Tag" type="text" value={projectForm.version} onChange={e => setProjectForm({...projectForm, version: e.target.value})} className="w-full bg-transparent border-b border-slate-800 focus:border-[#f97316] text-[#f97316] font-mono text-2xl font-black tracking-widest p-2 outline-none transition-colors" placeholder="v1.0.0" />
                            </div>
                          </div>
                          
                          <div className="bg-[#180d08] border border-[#f97316]/30 p-6 shadow-lg flex flex-col justify-center [clip-path:polygon(0_0,100%_0,100%_calc(100%-15px),calc(100%-15px)_100%,0_100%)]">
                            <label className="text-[10px] text-[#fb923c] uppercase tracking-[0.3em] block mb-4 font-black">Deployment Status</label>
                            <button title="Toggle Status" aria-label="Toggle Status" onClick={() => setProjectForm({...projectForm, published: !projectForm.published})} className={`w-full py-4 text-xs font-black tracking-widest uppercase border transition-all flex items-center justify-center [clip-path:polygon(0_0,100%_0,100%_calc(100%-10px),calc(100%-10px)_100%,0_100%)] ${projectForm.published ? 'bg-[#f97316]/20 border-[#f97316] text-[#f97316] shadow-[inset_0_0_15px_rgba(249,115,22,0.2)]' : 'bg-slate-900/50 border-slate-700 text-slate-500'}`}>
                              {projectForm.published ? <><CheckCircle size={16} className="mr-2" /> DEPLOYED TO PRODUCTION</> : <><Activity size={16} className="mr-2 animate-pulse" /> DRAFT / LOCAL BUILD</>}
                            </button>
                          </div>

                          <div className="bg-[#180d08] border border-[#f97316]/30 p-6 shadow-lg focus-within:border-[#f97316] transition-colors [clip-path:polygon(0_0,100%_0,100%_calc(100%-15px),calc(100%-15px)_100%,0_100%)]">
                            <label className="text-[10px] text-[#fb923c] uppercase tracking-[0.3em] mb-4 font-black flex items-center"><ImageIcon size={14} className="mr-2" /> Hero Banner Visualization</label>
                            <input title="Hero Banner" aria-label="Hero Banner" type="text" value={projectForm.heroImg} onChange={e => setProjectForm({...projectForm, heroImg: e.target.value})} className="w-full bg-[#0c0604] border border-[#f97316]/20 text-slate-300 text-sm font-mono tracking-wider p-4 outline-none focus:border-[#f97316] [clip-path:polygon(0_0,100%_0,100%_calc(100%-10px),calc(100%-10px)_100%,0_100%)]" placeholder="URL OR 'from-orange-600 to-black'" />
                            
                            <div className="mt-6 pt-4 border-t border-[#f97316]/20">
                               <div className="flex space-x-3">
                                 {THUMBNAIL_PRESETS.map((preset, idx) => (
                                   <button key={idx} type="button" title="Preset" aria-label="Preset" onClick={() => setProjectForm({...projectForm, heroImg: preset})} className={`w-12 h-8 border transition-all [clip-path:polygon(0_0,100%_0,100%_calc(100%-5px),calc(100%-5px)_100%,0_100%)] bg-gradient-to-br ${preset} ${projectForm.heroImg === preset ? 'border-[#f97316] shadow-[0_0_10px_rgba(249,115,22,0.5)]' : 'border-[#f97316]/20 hover:border-[#fb923c]'}`} />
                                 ))}
                               </div>
                            </div>
                          </div>
                        </motion.div>
                      )}

                      {/* DOCUMENTATION TAB */}
                      {activeProjectTab === 'DOCUMENTATION' && (
                        <motion.div key="documentation" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-8">
                          <RichTextEditor label="Executive Summary" value={projectForm.executiveSummary} onChange={(val) => setProjectForm({...projectForm, executiveSummary: val})} placeholder="Provide a high-level technical overview of this release..." />
                          <RichTextEditor label="Breaking Changes" value={projectForm.breakingChanges} onChange={(val) => setProjectForm({...projectForm, breakingChanges: val})} placeholder="Detail deprecated APIs and breaking changes..." />
                          <RichTextEditor label="Migration Manifest" value={projectForm.migrationLog} onChange={(val) => setProjectForm({...projectForm, migrationLog: val})} placeholder="Provide exact steps to migrate to this version..." />
                        </motion.div>
                      )}

                      {/* CHANGELOG TAB */}
                      {activeProjectTab === 'CHANGELOG' && (
                        <motion.div key="changelog" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-8">
                          <RichTextEditor label="[Added] New Features" value={projectForm.addedFeatures} onChange={(val) => setProjectForm({...projectForm, addedFeatures: val})} placeholder="List new features implemented in this version..." />
                          <RichTextEditor label="[Changed] Updates" value={projectForm.changedUpdates} onChange={(val) => setProjectForm({...projectForm, changedUpdates: val})} placeholder="List enhancements and modifications to existing systems..." />
                          <RichTextEditor label="[Fixed] Bug Patches" value={projectForm.fixedBugs} onChange={(val) => setProjectForm({...projectForm, fixedBugs: val})} placeholder="List critical bugs resolved and security patches applied..." />
                        </motion.div>
                      )}

                      {/* ARCHITECTURE TAB */}
                      {activeProjectTab === 'ARCHITECTURE' && (
                        <motion.div key="architecture" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-8">
                          <RichTextEditor label="System Architecture" value={projectForm.architecture} onChange={(val) => setProjectForm({...projectForm, architecture: val})} placeholder="Detail the system architecture, design patterns, and scaling strategies..." />
                          
                          <div className="bg-[#180d08] border border-[#f97316]/30 p-6 shadow-lg [clip-path:polygon(0_0,100%_0,100%_calc(100%-15px),calc(100%-15px)_100%,0_100%)]">
                             <label className="text-[10px] text-[#fb923c] uppercase tracking-[0.3em] mb-4 font-black flex items-center"><Code size={14} className="mr-2" /> Raw Code Snippet Block</label>
                             <p className="text-[10px] text-slate-500 font-mono mb-4">This drives the floating terminal on the project overview page.</p>
                             <textarea title="Code Snippet" aria-label="Code Snippet" value={projectForm.codeSnippet} onChange={e => setProjectForm({...projectForm, codeSnippet: e.target.value})} className="w-full bg-[#0c0604] border border-[#f97316]/20 text-[#fb923c] font-mono text-xs p-6 outline-none focus:border-[#f97316] min-h-[300px] resize-y [clip-path:polygon(0_0,100%_0,100%_calc(100%-10px),calc(100%-10px)_100%,0_100%)]" placeholder="// Paste raw code here..." />
                          </div>
                        </motion.div>
                      )}

                      {/* MEDIA & REPOS TAB */}
                      {activeProjectTab === 'MEDIA' && (
                        <motion.div key="media" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
                          <div className="bg-[#180d08] border border-[#f97316]/30 p-6 shadow-lg [clip-path:polygon(0_0,100%_0,100%_calc(100%-15px),calc(100%-15px)_100%,0_100%)]">
                             <label className="text-[10px] text-[#fb923c] uppercase tracking-[0.3em] mb-4 font-black flex items-center"><PlayCircle size={14} className="mr-2" /> Cinematic Video URL</label>
                             <p className="text-[10px] text-slate-500 font-mono mb-4">Required for the auto-playing pop-out video player on the project listing.</p>
                             <input title="Video URL" aria-label="Video URL" type="text" value={projectForm.videoUrl} onChange={e => setProjectForm({...projectForm, videoUrl: e.target.value})} className="w-full bg-[#0c0604] border border-[#f97316]/20 text-slate-300 text-sm font-mono p-4 outline-none focus:border-[#f97316] [clip-path:polygon(0_0,100%_0,100%_calc(100%-10px),calc(100%-10px)_100%,0_100%)]" placeholder="e.g. https://cdn.com/video.mp4" />
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="bg-[#180d08] border border-[#f97316]/30 p-6 shadow-lg [clip-path:polygon(0_0,100%_0,100%_calc(100%-15px),calc(100%-15px)_100%,0_100%)]">
                               <label className="text-[10px] text-[#fb923c] uppercase tracking-[0.3em] mb-4 font-black flex items-center"><Terminal size={14} className="mr-2" /> Source Code (GitHub)</label>
                               <input title="GitHub URL" aria-label="GitHub URL" type="text" value={projectForm.githubUrl} onChange={e => setProjectForm({...projectForm, githubUrl: e.target.value})} className="w-full bg-[#0c0604] border border-[#f97316]/20 text-slate-300 text-sm font-mono p-4 outline-none focus:border-[#f97316] [clip-path:polygon(0_0,100%_0,100%_calc(100%-8px),calc(100%-8px)_100%,0_100%)]" placeholder="https://github.com/..." />
                            </div>
                            <div className="bg-[#180d08] border border-[#f97316]/30 p-6 shadow-lg [clip-path:polygon(0_0,100%_0,100%_calc(100%-15px),calc(100%-15px)_100%,0_100%)]">
                               <label className="text-[10px] text-[#fb923c] uppercase tracking-[0.3em] mb-4 font-black flex items-center"><Activity size={14} className="mr-2" /> Live Deployment URL</label>
                               <input title="Live URL" aria-label="Live URL" type="text" value={projectForm.liveUrl} onChange={e => setProjectForm({...projectForm, liveUrl: e.target.value})} className="w-full bg-[#0c0604] border border-[#f97316]/20 text-slate-300 text-sm font-mono p-4 outline-none focus:border-[#f97316] [clip-path:polygon(0_0,100%_0,100%_calc(100%-8px),calc(100%-8px)_100%,0_100%)]" placeholder="https://my-app.com" />
                            </div>
                            <div className="bg-[#180d08] border border-[#f97316]/30 p-6 shadow-lg [clip-path:polygon(0_0,100%_0,100%_calc(100%-15px),calc(100%-15px)_100%,0_100%)] md:col-span-2">
                               <label className="text-[10px] text-[#fb923c] uppercase tracking-[0.3em] mb-4 font-black flex items-center"><LinkIcon size={14} className="mr-2" /> Download Asset URL (ZIP)</label>
                               <input title="Download URL" aria-label="Download URL" type="text" value={projectForm.downloadUrl} onChange={e => setProjectForm({...projectForm, downloadUrl: e.target.value})} className="w-full bg-[#0c0604] border border-[#f97316]/20 text-slate-300 text-sm font-mono p-4 outline-none focus:border-[#f97316] [clip-path:polygon(0_0,100%_0,100%_calc(100%-8px),calc(100%-8px)_100%,0_100%)]" placeholder="https://..." />
                            </div>
                          </div>
                        </motion.div>
                      )}

                      {/* ARRAYS TAB */}
                      {activeProjectTab === 'ARRAYS' && (
                        <motion.div key="arrays" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-12">
                          
                          {/* Code Trace Directory Builder */}
                          <div>
                            <div className="flex items-center justify-between border-b border-[#f97316]/30 pb-4 mb-6">
                              <p className="text-lg text-[#f97316] font-black uppercase tracking-widest">Code Trace Directory</p>
                              <button title="Add Trace" aria-label="Add Trace" onClick={() => addArrayItem('codeTrace', { path: '', type: 'ADDED' })} className="text-[#fb923c] text-xs font-black uppercase tracking-widest hover:text-white hover:bg-[#f97316]/20 flex items-center bg-[#f97316]/10 px-4 py-2 border border-[#f97316]/30 [clip-path:polygon(0_0,100%_0,100%_calc(100%-8px),calc(100%-8px)_100%,0_100%)]"><Plus size={14} className="mr-2" /> Inject Path</button>
                            </div>
                            <div className="space-y-4">
                              <AnimatePresence>
                                {projectForm.codeTrace.map((trace, i) => (
                                  <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} key={i} className="flex flex-col md:flex-row gap-4 items-center bg-[#180d08] border border-[#f97316]/30 p-4 [clip-path:polygon(0_0,100%_0,100%_calc(100%-15px),calc(100%-15px)_100%,0_100%)]">
                                    <div className="flex-1 w-full">
                                      <input type="text" placeholder="SOURCE PATH (e.g. src/api/engine.ts)" title="Path" aria-label="Path" value={trace.path} onChange={(e) => updateArrayItem('codeTrace', i, 'path', e.target.value)} className="w-full bg-[#0c0604] border border-[#f97316]/20 text-white font-mono text-sm tracking-widest p-4 outline-none focus:border-[#f97316] [clip-path:polygon(0_0,100%_0,100%_calc(100%-8px),calc(100%-8px)_100%,0_100%)]" />
                                    </div>
                                    <div className="w-48 shrink-0">
                                      <select title="Trace Type" aria-label="Trace Type" value={trace.type} onChange={(e) => updateArrayItem('codeTrace', i, 'type', e.target.value)} className="w-full bg-[#0c0604] border border-[#f97316]/20 text-[#fb923c] font-mono text-xs font-bold uppercase tracking-widest p-4 outline-none focus:border-[#f97316] cursor-pointer [clip-path:polygon(0_0,100%_0,100%_calc(100%-8px),calc(100%-8px)_100%,0_100%)]">
                                        <option value="ADDED">[+] ADDED</option>
                                        <option value="CHANGED">[*] CHANGED</option>
                                        <option value="FIXED">[-] FIXED</option>
                                      </select>
                                    </div>
                                    <button title="Delete Trace" aria-label="Delete Trace" onClick={() => removeArrayItem('codeTrace', i)} className="text-[#f97316]/50 hover:text-red-500 px-4 py-4 md:py-0 h-full bg-[#0c0604] border border-[#f97316]/20 hover:border-red-900/50 transition-colors [clip-path:polygon(0_0,100%_0,100%_calc(100%-8px),calc(100%-8px)_100%,0_100%)]"><Trash2 size={18} /></button>
                                  </motion.div>
                                ))}
                              </AnimatePresence>
                              {projectForm.codeTrace.length === 0 && <p className="text-slate-600 font-mono text-xs tracking-widest uppercase py-10 text-center">NO CODE TRACES INITIALIZED.</p>}
                            </div>
                          </div>
                          
                          {/* Tech Stack Tag Builder */}
                          <div>
                            <div className="bg-[#180d08] border border-[#f97316]/30 p-8 shadow-lg [clip-path:polygon(0_0,100%_0,100%_calc(100%-15px),calc(100%-15px)_100%,0_100%)]">
                               <h3 className="text-lg text-[#f97316] font-black uppercase tracking-widest mb-2">Technology Stack</h3>
                               <p className="text-xs font-mono text-slate-400 tracking-wider mb-6">Type a technology (e.g. Next.js, Prisma) and press ENTER to inject badge.</p>
                               
                               <div className="w-full bg-[#0c0604] border border-[#f97316]/20 p-4 focus-within:border-[#f97316] transition-colors flex flex-wrap gap-2 items-center min-h-[80px] [clip-path:polygon(0_0,100%_0,100%_calc(100%-10px),calc(100%-10px)_100%,0_100%)]">
                                 {projectForm.techStack.map((t, i) => (
                                   <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} key={i} className="bg-[#f97316]/10 text-[#fb923c] border border-[#f97316]/30 pl-3 pr-1 py-1.5 flex items-center text-[10px] font-black uppercase tracking-widest [clip-path:polygon(0_0,100%_0,100%_calc(100%-5px),calc(100%-5px)_100%,0_100%)]">
                                      {t}
                                      <button title="Remove Tech" aria-label="Remove Tech" onClick={() => removeTag(i)} className="ml-2 hover:bg-[#f97316]/20 hover:text-white p-1"><X size={12}/></button>
                                   </motion.span>
                                 ))}
                                 <input 
                                    title="Add Tech Stack Item" aria-label="Add Tech Stack Item"
                                    type="text" value={tagInput} onChange={e => setTagInput(e.target.value)} onKeyDown={handleTagKeyDown} 
                                    placeholder={projectForm.techStack.length === 0 ? "Type tech & hit Enter..." : "Add another technology..."} 
                                    className="flex-1 bg-transparent border-none text-white font-mono text-sm tracking-widest outline-none min-w-[200px]" 
                                 />
                               </div>
                             </div>
                          </div>

                          {/* Version Dictionary */}
                          <div>
                            <div className="flex items-center justify-between border-b border-[#f97316]/30 pb-4 mb-6">
                              <p className="text-lg text-[#f97316] font-black uppercase tracking-widest">Version Dictionary</p>
                              <button title="Add Version" aria-label="Add Version" onClick={() => addArrayItem('versionTrack', { version: '', date: '', notes: '' })} className="text-[#fb923c] text-xs font-black uppercase tracking-widest hover:text-white hover:bg-[#f97316]/20 flex items-center bg-[#f97316]/10 px-4 py-2 border border-[#f97316]/30 [clip-path:polygon(0_0,100%_0,100%_calc(100%-8px),calc(100%-8px)_100%,0_100%)]"><Plus size={14} className="mr-2" /> Add Release Log</button>
                            </div>
                            <div className="space-y-4">
                              <AnimatePresence>
                                {projectForm.versionTrack.map((v, i) => (
                                  <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} key={i} className="flex flex-col gap-4 bg-[#180d08] border border-[#f97316]/30 p-6 [clip-path:polygon(0_0,100%_0,100%_calc(100%-15px),calc(100%-15px)_100%,0_100%)]">
                                    <div className="flex gap-4">
                                       <div className="flex flex-col bg-[#0c0604] border border-[#f97316]/30 p-1 shrink-0">
                                         <button title="Move Up" aria-label="Move Up" onClick={() => moveArrayItem('versionTrack', i, 'up')} disabled={i===0} className="p-1 text-slate-500 hover:text-white disabled:opacity-30 border border-transparent hover:border-slate-600"><ChevronUp size={14}/></button>
                                         <button title="Move Down" aria-label="Move Down" onClick={() => moveArrayItem('versionTrack', i, 'down')} disabled={i===projectForm.versionTrack.length-1} className="p-1 text-slate-500 hover:text-white disabled:opacity-30 border border-transparent hover:border-slate-600"><ChevronDown size={14}/></button>
                                       </div>
                                       <input type="text" placeholder="VERSION (v1.0)" title="Version" aria-label="Version" value={v.version} onChange={(e) => updateArrayItem('versionTrack', i, 'version', e.target.value)} className="w-32 bg-[#0c0604] border border-[#f97316]/20 text-[#fb923c] font-mono text-sm font-bold uppercase tracking-widest p-4 outline-none focus:border-[#f97316] [clip-path:polygon(0_0,100%_0,100%_calc(100%-8px),calc(100%-8px)_100%,0_100%)]" />
                                       <input type="date" title="Date" aria-label="Date" value={v.date} onChange={(e) => updateArrayItem('versionTrack', i, 'date', e.target.value)} className="w-48 bg-[#0c0604] border border-[#f97316]/20 text-slate-300 font-mono text-sm uppercase p-4 outline-none focus:border-[#f97316] [clip-path:polygon(0_0,100%_0,100%_calc(100%-8px),calc(100%-8px)_100%,0_100%)] [color-scheme:dark]" />
                                       <button title="Delete Version" aria-label="Delete Version" onClick={() => removeArrayItem('versionTrack', i)} className="text-[#f97316]/50 hover:text-red-500 px-4 bg-[#0c0604] border border-[#f97316]/20 hover:border-red-900/50 transition-colors [clip-path:polygon(0_0,100%_0,100%_calc(100%-8px),calc(100%-8px)_100%,0_100%)]"><Trash2 size={18} /></button>
                                    </div>
                                    <textarea placeholder="Release notes for this version..." title="Notes" aria-label="Notes" value={v.notes} onChange={(e) => updateArrayItem('versionTrack', i, 'notes', e.target.value)} className="w-full bg-[#0c0604] border border-[#f97316]/20 text-slate-300 font-mono text-xs p-4 outline-none focus:border-[#f97316] min-h-[80px] [clip-path:polygon(0_0,100%_0,100%_calc(100%-8px),calc(100%-8px)_100%,0_100%)]" />
                                  </motion.div>
                                ))}
                              </AnimatePresence>
                              {projectForm.versionTrack.length === 0 && <p className="text-slate-600 font-mono text-xs tracking-widest uppercase py-10 text-center">NO VERSIONS INITIALIZED.</p>}
                            </div>
                          </div>

                          {/* Project Stats */}
                          <div>
                            <div className="flex items-center justify-between border-b border-[#f97316]/30 pb-4 mb-6">
                              <p className="text-lg text-[#f97316] font-black uppercase tracking-widest">Project Statistics</p>
                              <button title="Add Stat" aria-label="Add Stat" onClick={() => addArrayItem('stats', { label: '', value: '' })} className="text-[#fb923c] text-xs font-black uppercase tracking-widest hover:text-white hover:bg-[#f97316]/20 flex items-center bg-[#f97316]/10 px-4 py-2 border border-[#f97316]/30 [clip-path:polygon(0_0,100%_0,100%_calc(100%-8px),calc(100%-8px)_100%,0_100%)]"><Plus size={14} className="mr-2" /> Add Stat</button>
                            </div>
                            <div className="space-y-4">
                              <AnimatePresence>
                                {projectForm.stats.map((stat, i) => (
                                  <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, scale: 0.9 }} key={i} className="flex gap-4 items-center bg-[#180d08] border border-[#f97316]/30 p-4 group hover:border-[#f97316]/50 transition-colors [clip-path:polygon(0_0,100%_0,100%_calc(100%-15px),calc(100%-15px)_100%,0_100%)]">
                                    <div className="flex flex-col bg-[#0c0604] border border-[#f97316]/30 p-1 shrink-0">
                                      <button title="Move Up" aria-label="Move Up" onClick={() => moveArrayItem('stats', i, 'up')} disabled={i===0} className="p-1 text-slate-500 hover:text-white disabled:opacity-30 border border-transparent hover:border-slate-600"><ChevronUp size={14}/></button>
                                      <button title="Move Down" aria-label="Move Down" onClick={() => moveArrayItem('stats', i, 'down')} disabled={i===projectForm.stats.length-1} className="p-1 text-slate-500 hover:text-white disabled:opacity-30 border border-transparent hover:border-slate-600"><ChevronDown size={14}/></button>
                                    </div>
                                    <div className="flex-1 w-full"><input type="text" placeholder="LABEL (e.g. Uptime)" title="Stat Label" aria-label="Stat Label" value={stat.label} onChange={(e) => updateArrayItem('stats', i, 'label', e.target.value)} className="w-full bg-[#0c0604] border border-[#f97316]/20 text-white text-sm font-bold uppercase tracking-widest p-3 outline-none focus:border-[#f97316] [clip-path:polygon(0_0,100%_0,100%_calc(100%-8px),calc(100%-8px)_100%,0_100%)]" /></div>
                                    <div className="flex-1 w-full"><input type="text" placeholder="VALUE (e.g. 99.9%)" title="Stat Value" aria-label="Stat Value" value={stat.value} onChange={(e) => updateArrayItem('stats', i, 'value', e.target.value)} className="w-full bg-[#0c0604] border border-[#f97316]/20 text-[#fb923c] font-mono text-xl font-bold p-3 outline-none focus:border-[#f97316] [clip-path:polygon(0_0,100%_0,100%_calc(100%-8px),calc(100%-8px)_100%,0_100%)]" /></div>
                                    <button title="Delete Stat" aria-label="Delete Stat" onClick={() => removeArrayItem('stats', i)} className="text-[#f97316]/50 hover:text-red-500 p-3 bg-[#0c0604] border border-[#f97316]/20 hover:border-red-900/50 transition-colors [clip-path:polygon(0_0,100%_0,100%_calc(100%-8px),calc(100%-8px)_100%,0_100%)]"><Trash2 size={18} /></button>
                                  </motion.div>
                                ))}
                              </AnimatePresence>
                              {projectForm.stats.length === 0 && <p className="text-slate-600 font-mono text-xs tracking-widest uppercase py-10 text-center">NO STATS INITIALIZED.</p>}
                            </div>
                          </div>
                        </motion.div>
                      )}

                      {/* METADATA TAB */}
                      {activeProjectTab === 'METADATA' && (
                        <motion.div key="metadata" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                            <div className="bg-[#180d08] border border-[#f97316]/30 p-8 shadow-lg [clip-path:polygon(0_0,100%_0,100%_calc(100%-15px),calc(100%-15px)_100%,0_100%)]">
                              <label className="text-[10px] text-[#fb923c] uppercase tracking-[0.3em] block mb-4 font-bold">Lead Engineer</label>
                              <input title="Lead Engineer" aria-label="Lead Engineer" type="text" value={projectForm.leadDev} onChange={e => setProjectForm({ ...projectForm, leadDev: e.target.value })} className="w-full bg-[#0c0604] border border-[#f97316]/20 text-white text-sm font-bold tracking-widest uppercase p-4 outline-none focus:border-[#f97316] [clip-path:polygon(0_0,100%_0,100%_calc(100%-8px),calc(100%-8px)_100%,0_100%)]" />
                            </div>
                            <div className="bg-[#180d08] border border-[#f97316]/30 p-8 shadow-lg [clip-path:polygon(0_0,100%_0,100%_calc(100%-15px),calc(100%-15px)_100%,0_100%)]">
                              <label className="text-[10px] text-[#fb923c] uppercase tracking-[0.3em] block mb-4 font-bold">License Type</label>
                              <input title="License" aria-label="License" type="text" value={projectForm.license} onChange={e => setProjectForm({ ...projectForm, license: e.target.value })} className="w-full bg-[#0c0604] border border-[#f97316]/20 text-[#fb923c] font-mono text-xs tracking-wider p-4 outline-none focus:border-[#f97316] [clip-path:polygon(0_0,100%_0,100%_calc(100%-8px),calc(100%-8px)_100%,0_100%)]" placeholder="e.g. MIT, Proprietary" />
                            </div>
                            <div className="bg-[#180d08] border border-[#f97316]/30 p-8 shadow-lg [clip-path:polygon(0_0,100%_0,100%_calc(100%-15px),calc(100%-15px)_100%,0_100%)] md:col-span-2">
                              <label className="text-[10px] text-[#fb923c] uppercase tracking-[0.3em] block mb-4 font-bold">Deployment Date</label>
                              <input title="Deployment Date" aria-label="Deployment Date" placeholder="YYYY-MM-DD" type="date" value={projectForm.publishedAt} onChange={e => setProjectForm({ ...projectForm, publishedAt: e.target.value })} className="w-full bg-[#0c0604] border border-[#f97316]/20 text-slate-300 font-mono text-sm p-4 outline-none focus:border-[#f97316] cursor-pointer [color-scheme:dark] [clip-path:polygon(0_0,100%_0,100%_calc(100%-8px),calc(100%-8px)_100%,0_100%)]" />
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  )}

                  {/* ================================================= */}
                  {/* SHOWCASE MEDIA FORGE TABS */}
                  {/* ================================================= */}
                  {activeMasterModule === 'MEDIA' && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                       <div className="bg-[#180d08] border border-[#f97316]/30 p-6 shadow-lg focus-within:border-[#f97316] transition-colors [clip-path:polygon(0_0,100%_0,100%_calc(100%-15px),calc(100%-15px)_100%,0_100%)]">
                         <label className="text-[10px] text-[#fb923c] uppercase tracking-[0.3em] block mb-2 font-black">Video Title</label>
                         <input title="Title" aria-label="Title" type="text" value={mediaForm.title} onChange={e => setMediaForm({...mediaForm, title: e.target.value})} className="w-full bg-transparent border-b border-slate-800 focus:border-[#f97316] text-white text-2xl font-black tracking-widest p-2 outline-none transition-colors" placeholder="ENTER VIDEO TITLE..." />
                       </div>
                       <div className="bg-[#180d08] border border-[#f97316]/30 p-6 [clip-path:polygon(0_0,100%_0,100%_calc(100%-15px),calc(100%-15px)_100%,0_100%)]">
                         <label className="text-[10px] text-[#fb923c] uppercase tracking-[0.3em] block mb-4 font-bold">Video URL (MP4 / Cloudinary)</label>
                         <input title="Video URL" aria-label="Video URL" type="text" value={mediaForm.videoUrl} onChange={e => setMediaForm({ ...mediaForm, videoUrl: e.target.value })} className="w-full bg-[#0c0604] border border-[#f97316]/20 text-white font-mono text-sm p-4 outline-none focus:border-[#f97316] [clip-path:polygon(0_0,100%_0,100%_calc(100%-8px),calc(100%-8px)_100%,0_100%)]" placeholder="https://" />
                       </div>
                       <div className="bg-[#180d08] border border-[#f97316]/30 p-6 [clip-path:polygon(0_0,100%_0,100%_calc(100%-15px),calc(100%-15px)_100%,0_100%)]">
                         <label className="text-[10px] text-[#fb923c] uppercase tracking-[0.3em] block mb-4 font-bold">Thumbnail Cover URL</label>
                         <input title="Thumbnail URL" aria-label="Thumbnail URL" type="text" value={mediaForm.thumbnailUrl} onChange={e => setMediaForm({ ...mediaForm, thumbnailUrl: e.target.value })} className="w-full bg-[#0c0604] border border-[#f97316]/20 text-white font-mono text-sm p-4 outline-none focus:border-[#f97316] [clip-path:polygon(0_0,100%_0,100%_calc(100%-8px),calc(100%-8px)_100%,0_100%)]" placeholder="https://" />
                       </div>
                       <div className="bg-[#180d08] border border-[#f97316]/30 p-6 [clip-path:polygon(0_0,100%_0,100%_calc(100%-15px),calc(100%-15px)_100%,0_100%)]">
                         <label className="text-[10px] text-[#fb923c] uppercase tracking-[0.3em] block mb-4 font-bold">Brief Description</label>
                         <textarea title="Description" aria-label="Description" value={mediaForm.description} onChange={e => setMediaForm({ ...mediaForm, description: e.target.value })} className="w-full bg-[#0c0604] border border-[#f97316]/20 text-slate-300 font-mono text-sm p-4 outline-none focus:border-[#f97316] min-h-[120px] [clip-path:polygon(0_0,100%_0,100%_calc(100%-8px),calc(100%-8px)_100%,0_100%)] resize-y" placeholder="Describe the idea showcase..." />
                       </div>
                    </motion.div>
                  )}

                  {/* ================================================= */}
                  {/* SYSTEM QUERIES FORGE TABS */}
                  {/* ================================================= */}
                  {activeMasterModule === 'FAQS' && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                       <div className="bg-[#180d08] border border-[#f97316]/30 p-6 shadow-lg focus-within:border-[#f97316] transition-colors [clip-path:polygon(0_0,100%_0,100%_calc(100%-15px),calc(100%-15px)_100%,0_100%)]">
                         <label className="text-[10px] text-[#fb923c] uppercase tracking-[0.3em] block mb-2 font-black">Query (Question)</label>
                         <input title="Query" aria-label="Query" type="text" value={faqForm.query} onChange={e => setFaqForm({...faqForm, query: e.target.value})} className="w-full bg-transparent border-b border-slate-800 focus:border-[#f97316] text-white text-xl font-black tracking-widest p-2 outline-none transition-colors" placeholder="ENTER QUESTION..." />
                       </div>
                       <div className="bg-[#180d08] border border-[#f97316]/30 p-6 [clip-path:polygon(0_0,100%_0,100%_calc(100%-15px),calc(100%-15px)_100%,0_100%)]">
                         <label className="text-[10px] text-[#fb923c] uppercase tracking-[0.3em] block mb-4 font-bold">Response (Answer)</label>
                         <textarea title="Response" aria-label="Response" value={faqForm.response} onChange={e => setFaqForm({ ...faqForm, response: e.target.value })} className="w-full bg-[#0c0604] border border-[#f97316]/20 text-slate-300 font-mono text-sm p-4 outline-none focus:border-[#f97316] min-h-[200px] [clip-path:polygon(0_0,100%_0,100%_calc(100%-8px),calc(100%-8px)_100%,0_100%)] resize-y" placeholder="Type the system response..." />
                       </div>
                    </motion.div>
                  )}

               </div>
            </div>

          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}