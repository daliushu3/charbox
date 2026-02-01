
import React from 'react';
import { Search, Tag, Archive, Database, Plus, X, LayoutGrid, List as ListIcon, SortAsc, Clock } from 'lucide-react';

interface SidebarProps {
  tags: string[];
  selectedTag: string | null;
  onSelectTag: (tag: string | null) => void;
  onSearch: (term: string) => void;
  onNew: () => void;
  isOpen: boolean;
  onClose: () => void;
  viewMode: 'grid' | 'list';
  setViewMode: (m: 'grid' | 'list') => void;
  sortBy: 'name' | 'date';
  setSortBy: (s: 'name' | 'date') => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  tags, 
  selectedTag, 
  onSelectTag, 
  onSearch,
  onNew,
  isOpen,
  onClose,
  viewMode,
  setViewMode,
  sortBy,
  setSortBy
}) => {
  const sidebarClasses = `
    fixed inset-y-0 left-0 z-[100] w-72 bg-slate-950 border-r border-slate-800 flex flex-col transition-transform duration-300 ease-in-out
    md:relative md:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'}
  `;

  return (
    <>
      {/* 移动端遮罩层 */}
      {isOpen && <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[90] md:hidden" onClick={onClose} />}
      
      <aside className={sidebarClasses}>
        <div className="p-6 border-b border-slate-900">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 bg-cyan-500 rounded-sm flex items-center justify-center text-slate-950 font-black shadow-[0_0_15px_rgba(6,182,212,0.4)]">NX</div>
              <div>
                <h1 className="text-xl font-black tracking-tighter text-white font-mono leading-none">NEXUS</h1>
                <span className="text-[10px] text-cyan-500 font-mono tracking-[0.2em] font-bold">ARCHIVE</span>
              </div>
            </div>
            <button onClick={onClose} className="md:hidden p-1.5 text-slate-500 hover:text-white bg-slate-900 rounded">
              <X size={18} />
            </button>
          </div>
          
          <button 
            onClick={() => { onNew(); onClose(); }} 
            className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-3 px-4 rounded-sm flex items-center justify-center gap-2 transition-all transform active:scale-95 mb-6 shadow-lg shadow-cyan-900/20"
          >
            <Plus size={20} /> <span className="text-xs font-mono uppercase tracking-widest">Register Entity</span>
          </button>

          <div className="relative mb-5">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600" size={14} />
            <input 
              type="text" 
              placeholder="QUERING DATA..." 
              className="w-full bg-slate-900 border border-slate-800 rounded-sm py-2.5 pl-10 pr-4 text-[10px] text-slate-300 focus:outline-none focus:border-cyan-500/50 transition-colors uppercase font-mono placeholder:text-slate-700"
              onChange={(e) => onSearch(e.target.value)} 
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="flex bg-slate-900 rounded-sm border border-slate-800 p-1">
              <button 
                onClick={() => setViewMode('grid')} 
                className={`flex-1 flex justify-center py-1.5 rounded-sm transition-colors ${viewMode === 'grid' ? 'bg-cyan-500/20 text-cyan-400' : 'text-slate-600 hover:text-slate-400'}`}
              >
                <LayoutGrid size={14}/>
              </button>
              <button 
                onClick={() => setViewMode('list')} 
                className={`flex-1 flex justify-center py-1.5 rounded-sm transition-colors ${viewMode === 'list' ? 'bg-cyan-500/20 text-cyan-400' : 'text-slate-600 hover:text-slate-400'}`}
              >
                <ListIcon size={14}/>
              </button>
            </div>
            <div className="flex bg-slate-900 rounded-sm border border-slate-800 p-1">
              <button 
                onClick={() => setSortBy('name')} 
                className={`flex-1 flex justify-center py-1.5 rounded-sm transition-colors ${sortBy === 'name' ? 'bg-cyan-500/20 text-cyan-400' : 'text-slate-600 hover:text-slate-400'}`}
              >
                <SortAsc size={14}/>
              </button>
              <button 
                onClick={() => setSortBy('date')} 
                className={`flex-1 flex justify-center py-1.5 rounded-sm transition-colors ${sortBy === 'date' ? 'bg-cyan-500/20 text-cyan-400' : 'text-slate-600 hover:text-slate-400'}`}
              >
                <Clock size={14}/>
              </button>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          <div>
            <div className="flex items-center gap-2 text-slate-600 text-[9px] font-bold uppercase tracking-[0.2em] mb-3 px-3">
              <Archive size={12} className="text-cyan-900" /> <span>Core Systems</span>
            </div>
            <button 
              onClick={() => { onSelectTag(null); onClose(); }} 
              className={`w-full text-left px-3 py-2.5 rounded text-[11px] font-mono flex items-center gap-3 transition-all ${!selectedTag ? 'bg-cyan-500/10 text-cyan-400 border-l-2 border-cyan-500' : 'text-slate-500 hover:bg-slate-900 hover:text-slate-300'}`}
            >
              <Database size={14} /> <span>ALL ENTITIES</span>
            </button>
          </div>

          <div>
            <div className="flex items-center gap-2 text-slate-600 text-[9px] font-bold uppercase tracking-[0.2em] mb-3 px-3">
              <Tag size={12} className="text-cyan-900" /> <span>Classifications</span>
            </div>
            <div className="space-y-1">
              {tags.length === 0 ? (
                <div className="px-3 text-[10px] text-slate-800 italic font-mono uppercase tracking-widest">No tags indexed</div>
              ) : (
                tags.map(tag => (
                  <button 
                    key={tag} 
                    onClick={() => { onSelectTag(tag); onClose(); }} 
                    className={`w-full text-left px-3 py-2.5 rounded text-[11px] font-mono flex items-center justify-between transition-all group ${selectedTag === tag ? 'bg-cyan-500/10 text-cyan-400 border-l-2 border-cyan-500' : 'text-slate-500 hover:bg-slate-900 hover:text-slate-300'}`}
                  >
                    <span className="truncate pr-2 uppercase">{tag}</span>
                    <span className="text-[8px] opacity-0 group-hover:opacity-40">{'>'}</span>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
        
        <div className="p-4 border-t border-slate-900 bg-slate-950">
          <div className="bg-slate-900/50 p-3 border border-slate-800 rounded-sm">
            <div className="flex items-center justify-between text-[8px] font-mono text-slate-700 uppercase mb-1">
              <span>Database Load</span>
              <span>Stable</span>
            </div>
            <div className="h-1 bg-slate-950 rounded-full overflow-hidden">
              <div className="h-full bg-cyan-500/40 w-1/3" />
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};
