
import React, { useState } from 'react';
import { CharacterDataV2 } from '../types';
import { X, Save, Image as ImageIcon, Plus, Trash2, Database, Download, MessageSquare, BookOpen, Quote, Copy, Check, FileJson } from 'lucide-react';
import { createCharacterPNG } from '../services/pngUtils';

interface DossierViewProps {
  initialData: CharacterDataV2;
  initialImage: string | null;
  availableTags?: string[];
  onClose: () => void;
  onSave: (data: CharacterDataV2, imageFile: File | null) => void;
}

const CopyButton: React.FC<{ text: string }> = ({ text }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  return (
    <button 
      onClick={handleCopy}
      className={`p-1.5 rounded transition-all flex items-center gap-1.5 font-mono text-[9px] uppercase font-bold ${copied ? 'text-green-400 bg-green-400/10' : 'text-slate-500 hover:text-cyan-400 hover:bg-cyan-400/10'}`}
      title="Copy to Clipboard"
    >
      {copied ? <Check size={12} /> : <Copy size={12} />}
      <span>{copied ? 'Copied' : 'Copy'}</span>
    </button>
  );
};

export const DossierView: React.FC<DossierViewProps> = ({ initialData, initialImage, availableTags = [], onClose, onSave }) => {
  const [data, setData] = useState<CharacterDataV2>(initialData);
  const [imagePreview, setImagePreview] = useState<string | null>(initialImage);
  const [newImageFile, setNewImageFile] = useState<File | null>(null);
  const [activeTab, setActiveTab] = useState<'profile' | 'dialogue' | 'world'>('profile');
  const [newTag, setNewTag] = useState('');

  const updateField = (field: keyof CharacterDataV2, value: any) => setData(prev => ({ ...prev, [field]: value }));

  const handleExportPNG = async () => {
    if (!imagePreview) return;
    try {
      const response = await fetch(imagePreview);
      const blob = await response.blob();
      const pngBlob = await createCharacterPNG(blob, data);
      const url = URL.createObjectURL(pngBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${data.name.replace(/\s+/g, '_')}_card.png`;
      a.click();
      URL.revokeObjectURL(url);
    } catch(err) { console.error(err); }
  };

  const handleExportJSON = () => {
    // 按照 SillyTavern 标准包装
    const exportData = {
      name: data.name,
      description: data.description,
      personality: data.personality,
      scenario: data.scenario,
      first_mes: data.first_mes,
      mes_example: data.mes_example,
      creatorcomment: data.creator_notes,
      spec: "chara_card_v2",
      spec_version: "2.0",
      data: {
        ...data,
        tags: [] // 移除本地标签
      }
    };
    const blob = new Blob([JSON.stringify(exportWrapper(exportData), null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${data.name.replace(/\s+/g, '_')}_data.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // 包装函数辅助
  const exportWrapper = (d: any) => {
    // 某些版本需要 root level 也有基础信息
    return d;
  };

  // Tag Helpers
  const addTag = (tag: string) => {
    const trimmed = tag.trim();
    if (trimmed && !data.tags.includes(trimmed)) {
      updateField('tags', [...data.tags, trimmed]);
      setNewTag('');
    }
  };

  // Alternate Greetings Helpers
  const addGreeting = () => {
    updateField('alternate_greetings', [...(data.alternate_greetings || []), '']);
  };
  const updateGreeting = (index: number, val: string) => {
    const copy = [...(data.alternate_greetings || [])];
    copy[index] = val;
    updateField('alternate_greetings', copy);
  };
  const removeGreeting = (index: number) => {
    updateField('alternate_greetings', (data.alternate_greetings || []).filter((_, i) => i !== index));
  };

  // World Book Helpers
  const updateWorldName = (val: string) => {
    updateField('character_book', { ...(data.character_book || { entries: [] }), name: val });
  };
  const addWorldEntry = () => {
    const entries = [...(data.character_book?.entries || [])];
    entries.push({ comment: 'NEW ENTRY', content: '', keys: [], enabled: true });
    updateField('character_book', { ...(data.character_book || { name: 'World Book' }), entries });
  };
  const updateWorldEntry = (index: number, field: string, val: any) => {
    const entries = [...(data.character_book?.entries || [])];
    entries[index] = { ...entries[index], [field]: val };
    updateField('character_book', { ...(data.character_book || { name: 'World Book' }), entries });
  };
  const removeWorldEntry = (index: number) => {
    const entries = (data.character_book?.entries || []).filter((_, i) => i !== index);
    updateField('character_book', { ...(data.character_book || { name: 'World Book' }), entries });
  };

  const unselectedTags = availableTags.filter(t => !data.tags.includes(t));

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-0 md:p-8 bg-slate-950/95 backdrop-blur-md">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-6xl h-full md:h-auto md:max-h-[92vh] flex flex-col overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.5)] relative font-sans">
        
        {/* Header */}
        <div className="bg-slate-950 px-4 md:px-6 py-4 border-b border-slate-800 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-4 flex-1 min-w-0">
            <div className="hidden sm:flex w-8 h-8 items-center justify-center bg-cyan-500/10 border border-cyan-500/20 rounded text-cyan-500 shrink-0">
              <Database size={16} />
            </div>
            <input 
              value={data.name} 
              onChange={e => updateField('name', e.target.value)} 
              className="bg-transparent text-xl font-black font-mono text-white focus:outline-none border-b border-transparent focus:border-cyan-500/50 uppercase truncate w-full" 
              placeholder="ENTITY_NAME"
            />
          </div>
          <div className="flex gap-2 shrink-0 ml-4">
            <button onClick={handleExportPNG} title="Export Character Card (PNG)" className="bg-slate-800 hover:bg-slate-700 text-cyan-400 p-2.5 rounded transition-colors flex items-center gap-2">
              <Download size={18}/>
              <span className="hidden lg:inline text-[10px] font-mono">PNG</span>
            </button>
            <button onClick={handleExportJSON} title="Export Data Only (JSON)" className="bg-slate-800 hover:bg-slate-700 text-amber-400 p-2.5 rounded transition-colors flex items-center gap-2">
              <FileJson size={18}/>
              <span className="hidden lg:inline text-[10px] font-mono">JSON</span>
            </button>
            <button onClick={() => onSave(data, newImageFile)} className="bg-cyan-600 hover:bg-cyan-500 text-white px-5 py-2 rounded font-mono text-xs font-bold tracking-widest flex items-center gap-2 transition-all active:scale-95 shadow-lg shadow-cyan-900/20"><Save size={16}/> SAVE</button>
            <button onClick={onClose} className="p-2 text-slate-500 hover:text-white transition-colors"><X size={24}/></button>
          </div>
        </div>

        <div className="flex flex-col md:flex-row flex-1 overflow-hidden">
          {/* Left Sidebar: Image & Tags */}
          <div className="w-full md:w-72 bg-slate-950 border-b md:border-r border-slate-800 p-6 flex flex-row md:flex-col gap-6 overflow-x-auto md:overflow-y-auto shrink-0 scrollbar-hide">
            <div className="w-28 md:w-full shrink-0">
              <div className="aspect-[3/4] rounded border border-slate-800 overflow-hidden relative group bg-slate-900 shadow-inner">
                {imagePreview ? (
                  <img src={imagePreview} className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-slate-700 gap-2">
                    <ImageIcon size={32}/>
                    <span className="text-[8px] font-mono">NO_IMAGE</span>
                  </div>
                )}
                <label className="absolute inset-0 bg-cyan-950/60 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center cursor-pointer transition-all duration-300 backdrop-blur-[2px]">
                  <input type="file" className="hidden" accept="image/png" onChange={e => { const f = e.target.files?.[0]; if (f) { setNewImageFile(f); setImagePreview(URL.createObjectURL(f)); } }} />
                  <Plus size={24} className="text-cyan-400 mb-1" />
                  <span className="text-cyan-400 font-mono text-[9px] uppercase font-bold tracking-[0.2em]">Replace Image</span>
                </label>
              </div>
            </div>
            
            <div className="flex-1 md:w-full space-y-6 min-w-[200px]">
              <div>
                <h4 className="text-[10px] font-mono text-slate-500 uppercase font-bold tracking-widest mb-3 border-l-2 border-slate-800 pl-2">Filter Tags</h4>
                <div className="flex flex-wrap gap-1.5 mb-4">
                  {data.tags.map(tag => (
                    <div key={tag} className="flex items-center gap-1.5 bg-slate-900 text-cyan-100/70 px-2 py-1 rounded text-[9px] border border-slate-800 uppercase font-mono group">
                      {tag}
                      <button onClick={() => updateField('tags', data.tags.filter(t => t !== tag))} className="text-slate-600 hover:text-red-500 transition-colors"><X size={10}/></button>
                    </div>
                  ))}
                  {data.tags.length === 0 && <div className="text-[9px] text-slate-700 italic font-mono">UNTAGGED</div>}
                </div>
                
                <div className="space-y-3">
                  <div className="flex gap-1">
                    <input 
                      value={newTag} 
                      onChange={e => setNewTag(e.target.value)} 
                      onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addTag(newTag))}
                      placeholder="NEW_TAG..." 
                      className="bg-slate-900 border border-slate-800 rounded px-2.5 py-1.5 text-[10px] flex-1 focus:outline-none focus:border-cyan-500/50 uppercase font-mono text-slate-300" 
                    />
                    <button onClick={() => addTag(newTag)} className="p-1.5 bg-slate-800 text-cyan-400 rounded border border-slate-700 hover:bg-slate-700"><Plus size={14}/></button>
                  </div>

                  {unselectedTags.length > 0 && (
                    <div>
                      <div className="text-[8px] font-mono text-slate-600 uppercase mb-2">Recent:</div>
                      <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto scrollbar-hide">
                        {unselectedTags.map(tag => (
                          <button 
                            key={tag} 
                            onClick={() => addTag(tag)}
                            className="bg-slate-900/50 hover:bg-cyan-500/10 hover:text-cyan-400 border border-slate-800 text-slate-500 px-1.5 py-0.5 rounded text-[8px] font-mono uppercase transition-colors"
                          >
                            {tag}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <div className="pt-4 border-t border-slate-900">
                <div className="text-[9px] font-mono text-slate-600 mb-1 uppercase">Rev: {data.character_version || '1'}</div>
                <div className="text-[9px] font-mono text-slate-600 uppercase">Auth: {data.creator || 'UNKNOWN'}</div>
              </div>
            </div>
          </div>

          {/* Right Content Area: Tabs & Fields */}
          <div className="flex-1 flex flex-col overflow-hidden bg-slate-900/30">
            <div className="flex border-b border-slate-800 overflow-x-auto shrink-0 bg-slate-950/50">
              {[
                { id: 'profile', icon: Database, label: 'CHARACTER' },
                { id: 'dialogue', icon: MessageSquare, label: 'GREETINGS' },
                { id: 'world', icon: BookOpen, label: 'WORLD_BOOK' }
              ].map(tab => (
                <button 
                  key={tab.id} 
                  onClick={() => setActiveTab(tab.id as any)} 
                  className={`px-6 py-4 font-mono text-[10px] font-bold uppercase tracking-[0.2em] border-b-2 transition-all flex items-center gap-2 shrink-0 ${activeTab === tab.id ? 'border-cyan-500 text-cyan-400 bg-cyan-500/5' : 'border-transparent text-slate-500 hover:text-slate-300 hover:bg-slate-800/30'}`}
                >
                  <tab.icon size={14} />
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>

            <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-8 scrollbar-thin">
              {activeTab === 'profile' && (
                <>
                  <section>
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-cyan-500 font-mono text-[10px] font-bold uppercase tracking-[0.3em]">Identity Synopsis</h3>
                      <CopyButton text={data.creator_notes} />
                    </div>
                    <textarea 
                      value={data.creator_notes} 
                      onChange={e => updateField('creator_notes', e.target.value)} 
                      placeholder="Internal metadata or back-story notes..."
                      className="w-full h-28 bg-slate-950 border border-slate-800 rounded-md p-4 text-sm text-slate-300 focus:outline-none focus:border-cyan-500/50 font-sans resize-none shadow-inner leading-relaxed" 
                    />
                  </section>
                  <section>
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-cyan-500 font-mono text-[10px] font-bold uppercase tracking-[0.3em]">Core Description</h3>
                      <CopyButton text={data.description} />
                    </div>
                    <textarea 
                      value={data.description} 
                      onChange={e => updateField('description', e.target.value)} 
                      placeholder="Physical and personality descriptions..."
                      className="w-full h-48 bg-slate-950 border border-slate-800 rounded-md p-4 text-sm text-slate-300 focus:outline-none focus:border-cyan-500/50 font-sans resize-none shadow-inner leading-relaxed" 
                    />
                  </section>
                </>
              )}

              {activeTab === 'dialogue' && (
                <div className="space-y-10">
                  <section>
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <Quote size={14} className="text-cyan-500 opacity-50" />
                        <h3 className="text-cyan-500 font-mono text-[10px] font-bold uppercase tracking-[0.3em]">Standard Opening</h3>
                      </div>
                      <CopyButton text={data.first_mes} />
                    </div>
                    <textarea 
                      value={data.first_mes} 
                      onChange={e => updateField('first_mes', e.target.value)} 
                      className="w-full h-40 bg-slate-950 border border-slate-800 rounded-md p-4 text-sm text-slate-100 focus:outline-none focus:border-cyan-500/50 font-sans italic shadow-inner leading-relaxed" 
                    />
                  </section>

                  <section>
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center gap-2">
                        <MessageSquare size={14} className="text-cyan-500 opacity-50" />
                        <h3 className="text-cyan-500 font-mono text-[10px] font-bold uppercase tracking-[0.3em]">Alternative Openings</h3>
                      </div>
                      <button 
                        onClick={addGreeting}
                        className="text-[9px] font-mono px-3 py-1.5 bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 rounded hover:bg-cyan-500/20 transition-colors uppercase font-bold"
                      >
                        + ADD_OPENING
                      </button>
                    </div>
                    
                    <div className="space-y-4">
                      {data.alternate_greetings?.map((msg, idx) => (
                        <div key={idx} className="relative group bg-slate-950 border border-slate-800 rounded-md overflow-hidden">
                          <div className="absolute top-2 right-2 flex gap-2">
                             <CopyButton text={msg} />
                             <button onClick={() => removeGreeting(idx)} className="p-1.5 text-slate-600 hover:text-red-500 bg-slate-900 rounded transition-colors opacity-0 group-hover:opacity-100">
                              <Trash2 size={12}/>
                            </button>
                          </div>
                          <div className="bg-slate-900 px-3 py-1.5 border-b border-slate-800 text-[8px] font-mono text-slate-600 uppercase">
                            VARIATION_{String(idx + 1).padStart(2, '0')}
                          </div>
                          <textarea 
                            value={msg} 
                            onChange={e => updateGreeting(idx, e.target.value)} 
                            className="w-full h-24 bg-transparent p-4 text-xs text-slate-400 focus:outline-none font-sans italic resize-none leading-relaxed"
                          />
                        </div>
                      ))}
                    </div>
                  </section>
                </div>
              )}

              {activeTab === 'world' && (
                <div className="space-y-6">
                  <section className="bg-slate-950 border border-slate-800 rounded-lg p-6 mb-8">
                    <div className="flex items-center gap-2 mb-4">
                      <Database size={14} className="text-cyan-500" />
                      <h3 className="text-cyan-500 font-mono text-[10px] font-bold uppercase tracking-[0.3em]">World Identity</h3>
                    </div>
                    <div className="flex flex-col gap-2">
                      <label className="text-[8px] font-mono text-slate-600 uppercase">World Book Name</label>
                      <input 
                        value={data.character_book?.name || ''} 
                        onChange={e => updateWorldName(e.target.value)} 
                        placeholder="WORLD_TITLE"
                        className="bg-slate-900 border border-slate-800 rounded px-4 py-2.5 text-sm text-cyan-400 focus:outline-none focus:border-cyan-500/50 uppercase font-mono shadow-inner" 
                      />
                    </div>
                  </section>

                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <BookOpen size={16} className="text-cyan-500 opacity-50" />
                      <h3 className="text-cyan-500 font-mono text-[10px] font-bold uppercase tracking-[0.3em]">Knowledge Entries</h3>
                    </div>
                    <button 
                      onClick={addWorldEntry}
                      className="text-[9px] font-mono px-3 py-1.5 bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 rounded hover:bg-cyan-500/20 transition-colors uppercase font-bold"
                    >
                      + ADD_LORE
                    </button>
                  </div>

                  <div className="space-y-6">
                    {(data.character_book?.entries || []).map((entry, idx) => (
                      <div key={idx} className="bg-slate-950 border border-slate-800 rounded-lg overflow-hidden shadow-lg group">
                        <div className="bg-slate-900/80 px-4 py-2 border-b border-slate-800 flex items-center justify-between">
                          <input 
                            value={entry.comment || ''} 
                            onChange={e => updateWorldEntry(idx, 'comment', e.target.value)}
                            placeholder="ENTRY_NAME"
                            className="bg-transparent text-[10px] font-mono font-bold text-cyan-400 focus:outline-none uppercase w-full"
                          />
                          <div className="flex items-center gap-2">
                            <CopyButton text={entry.content || ''} />
                            <button onClick={() => removeWorldEntry(idx)} className="text-slate-600 hover:text-red-500 p-1 transition-colors">
                              <Trash2 size={14}/>
                            </button>
                          </div>
                        </div>
                        <div className="p-4 bg-slate-950">
                          <textarea 
                            value={entry.content || ''} 
                            onChange={e => updateWorldEntry(idx, 'content', e.target.value)}
                            placeholder="Lore content, rules, or definitions..."
                            className="w-full h-32 bg-slate-900/50 border border-slate-800 rounded p-3 text-xs text-slate-300 focus:outline-none focus:border-cyan-500/30 font-sans resize-none leading-relaxed"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
