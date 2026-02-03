
import React, { useState, useEffect } from 'react';
import { CharacterDataV2 } from '../types';
import { X, Save, Image as ImageIcon, Plus, Trash2, Database, Download, MessageSquare, BookOpen, Quote, Copy, Check, FileJson, Maximize2, Minimize2 } from 'lucide-react';
import { createCharacterPNG } from '../services/pngUtils';

interface DossierViewProps {
  initialData: CharacterDataV2;
  initialImage: string | null;
  availableTags?: string[];
  onClose: () => void;
  onSave: (data: CharacterDataV2, imageFile: File | null) => void;
}

interface ExpandedEditorProps {
  title: string;
  value: string;
  onChange: (val: string) => void;
  onClose: () => void;
}

const FullscreenEditor: React.FC<ExpandedEditorProps> = ({ title, value, onChange, onClose }) => {
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[200] bg-slate-950 flex flex-col font-sans">
      <div className="h-16 border-b border-slate-800 flex items-center justify-between px-6 shrink-0 bg-slate-900">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse" />
          <h2 className="text-cyan-400 font-mono text-xs font-bold uppercase tracking-[0.3em]">{title}</h2>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-[10px] font-mono text-slate-500">{value.length} CHARACTERS</span>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-white transition-colors bg-slate-800 rounded">
            <Minimize2 size={20} />
          </button>
        </div>
      </div>
      <div className="flex-1 p-6 md:p-12 overflow-hidden flex flex-col bg-slate-950 cyber-grid">
        <textarea
          autoFocus
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="TYPE_SYSTEM_INPUT..."
          className="flex-1 w-full bg-transparent text-slate-200 text-lg md:text-xl font-sans leading-relaxed focus:outline-none resize-none scrollbar-thin placeholder:text-slate-800"
        />
      </div>
      <div className="h-10 border-t border-slate-900 flex items-center px-6 justify-between bg-slate-900 shrink-0">
        <div className="text-[8px] font-mono text-slate-600 uppercase tracking-widest">Nexus Expanded Editor v1.0</div>
        <div className="text-[8px] font-mono text-slate-600 uppercase tracking-widest">Press ESC to return</div>
      </div>
    </div>
  );
};

const CopyButton: React.FC<{ text: string }> = ({ text }) => {
  const [copied, setCopied] = useState(false);
  const handleCopy = async () => {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) { console.error('Copy failed: ', err); }
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
  
  // Expanded Editor state
  const [expandedField, setExpandedField] = useState<{ title: string; field: string; index?: number } | null>(null);

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
    const exportWrapper = {
      name: data.name,
      description: data.description,
      personality: data.personality,
      scenario: data.scenario,
      first_mes: data.first_mes,
      mes_example: data.mes_example,
      creatorcomment: data.creator_notes,
      spec: "chara_card_v2",
      spec_version: "2.0",
      data: data
    };
    const blob = new Blob([JSON.stringify(exportWrapper, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${data.name.replace(/\s+/g, '_')}_data.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const addTag = (tag: string) => {
    const trimmed = tag.trim();
    if (trimmed && !data.tags.includes(trimmed)) {
      updateField('tags', [...data.tags, trimmed]);
      setNewTag('');
    }
  };

  const addGreeting = () => updateField('alternate_greetings', [...(data.alternate_greetings || []), '']);
  const updateGreeting = (index: number, val: string) => {
    const copy = [...(data.alternate_greetings || [])];
    copy[index] = val;
    updateField('alternate_greetings', copy);
  };
  const removeGreeting = (index: number) => updateField('alternate_greetings', (data.alternate_greetings || []).filter((_, i) => i !== index));

  const updateWorldName = (val: string) => updateField('character_book', { ...(data.character_book || { entries: [] }), name: val });
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

  const handleExpandedChange = (val: string) => {
    if (!expandedField) return;
    const { field, index } = expandedField;
    if (field === 'alternate_greetings' && index !== undefined) {
      updateGreeting(index, val);
    } else if (field === 'world_entry' && index !== undefined) {
      updateWorldEntry(index, 'content', val);
    } else {
      updateField(field as keyof CharacterDataV2, val);
    }
  };

  const getExpandedValue = () => {
    if (!expandedField) return '';
    const { field, index } = expandedField;
    if (field === 'alternate_greetings' && index !== undefined) return data.alternate_greetings[index];
    if (field === 'world_entry' && index !== undefined) return data.character_book?.entries[index].content;
    return (data as any)[field] || '';
  };

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
          {/* Left Sidebar */}
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
                <div className="flex gap-1">
                  <input value={newTag} onChange={e => setNewTag(e.target.value)} onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addTag(newTag))} placeholder="NEW_TAG..." className="bg-slate-900 border border-slate-800 rounded px-2.5 py-1.5 text-[10px] flex-1 focus:outline-none focus:border-cyan-500/50 uppercase font-mono text-slate-300" />
                  <button onClick={() => addTag(newTag)} className="p-1.5 bg-slate-800 text-cyan-400 rounded border border-slate-700 hover:bg-slate-700"><Plus size={14}/></button>
                </div>
              </div>
              <div className="pt-4 border-t border-slate-900 text-[9px] font-mono text-slate-600 uppercase">
                Rev: {data.character_version || '1'}<br/>Auth: {data.creator || 'UNKNOWN'}
              </div>
            </div>
          </div>

          {/* Right Content Area */}
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
                  <tab.icon size={14} /> <span>{tab.label}</span>
                </button>
              ))}
            </div>

            <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-8 scrollbar-thin">
              {activeTab === 'profile' && (
                <>
                  <section>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <h3 className="text-cyan-500 font-mono text-[10px] font-bold uppercase tracking-[0.3em]">Identity Synopsis</h3>
                        <button onClick={() => setExpandedField({ title: 'CREATOR NOTES', field: 'creator_notes' })} className="p-1 text-slate-600 hover:text-cyan-400 transition-colors"><Maximize2 size={12}/></button>
                      </div>
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
                      <div className="flex items-center gap-2">
                        <h3 className="text-cyan-500 font-mono text-[10px] font-bold uppercase tracking-[0.3em]">Core Description</h3>
                        <button onClick={() => setExpandedField({ title: 'CHARACTER DESCRIPTION', field: 'description' })} className="p-1 text-slate-600 hover:text-cyan-400 transition-colors"><Maximize2 size={12}/></button>
                      </div>
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
                        <button onClick={() => setExpandedField({ title: 'MAIN GREETING', field: 'first_mes' })} className="p-1 text-slate-600 hover:text-cyan-400 transition-colors"><Maximize2 size={12}/></button>
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
                      <button onClick={addGreeting} className="text-[9px] font-mono px-3 py-1.5 bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 rounded hover:bg-cyan-500/20 transition-colors uppercase font-bold">+ ADD_OPENING</button>
                    </div>
                    <div className="space-y-4">
                      {data.alternate_greetings?.map((msg, idx) => (
                        <div key={idx} className="relative group bg-slate-950 border border-slate-800 rounded-md overflow-hidden">
                          <div className="absolute top-2 right-2 flex gap-2">
                             <button onClick={() => setExpandedField({ title: `ALT GREETING #${idx+1}`, field: 'alternate_greetings', index: idx })} className="p-1.5 text-slate-600 hover:text-cyan-400 bg-slate-900 rounded opacity-0 group-hover:opacity-100 transition-opacity"><Maximize2 size={12}/></button>
                             <CopyButton text={msg} />
                             <button onClick={() => removeGreeting(idx)} className="p-1.5 text-slate-600 hover:text-red-500 bg-slate-900 rounded transition-colors opacity-0 group-hover:opacity-100"><Trash2 size={12}/></button>
                          </div>
                          <div className="bg-slate-900 px-3 py-1.5 border-b border-slate-800 text-[8px] font-mono text-slate-600 uppercase">VARIATION_{String(idx + 1).padStart(2, '0')}</div>
                          <textarea value={msg} onChange={e => updateGreeting(idx, e.target.value)} className="w-full h-24 bg-transparent p-4 text-xs text-slate-400 focus:outline-none font-sans italic resize-none leading-relaxed" />
                        </div>
                      ))}
                    </div>
                  </section>
                </div>
              )}

              {activeTab === 'world' && (
                <div className="space-y-6">
                  <section className="bg-slate-950 border border-slate-800 rounded-lg p-6 mb-8">
                    <div className="flex flex-col gap-2">
                      <label className="text-[8px] font-mono text-slate-600 uppercase">World Book Name</label>
                      <input value={data.character_book?.name || ''} onChange={e => updateWorldName(e.target.value)} placeholder="WORLD_TITLE" className="bg-slate-900 border border-slate-800 rounded px-4 py-2.5 text-sm text-cyan-400 focus:outline-none focus:border-cyan-500/50 uppercase font-mono shadow-inner" />
                    </div>
                  </section>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-cyan-500 font-mono text-[10px] font-bold uppercase tracking-[0.3em]">Knowledge Entries</h3>
                    <button onClick={addWorldEntry} className="text-[9px] font-mono px-3 py-1.5 bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 rounded hover:bg-cyan-500/20 transition-colors uppercase font-bold">+ ADD_LORE</button>
                  </div>
                  <div className="space-y-6">
                    {(data.character_book?.entries || []).map((entry, idx) => (
                      <div key={idx} className="bg-slate-950 border border-slate-800 rounded-lg overflow-hidden shadow-lg group">
                        <div className="bg-slate-900/80 px-4 py-2 border-b border-slate-800 flex items-center justify-between">
                          <input value={entry.comment || ''} onChange={e => updateWorldEntry(idx, 'comment', e.target.value)} placeholder="ENTRY_NAME" className="bg-transparent text-[10px] font-mono font-bold text-cyan-400 focus:outline-none uppercase w-full" />
                          <div className="flex items-center gap-2">
                            <button onClick={() => setExpandedField({ title: `LORE: ${entry.comment || 'Unnamed'}`, field: 'world_entry', index: idx })} className="p-1.5 text-slate-600 hover:text-cyan-400 transition-colors"><Maximize2 size={12}/></button>
                            <CopyButton text={entry.content || ''} />
                            <button onClick={() => removeWorldEntry(idx)} className="text-slate-600 hover:text-red-500 p-1 transition-colors"><Trash2 size={14}/></button>
                          </div>
                        </div>
                        <div className="p-4 bg-slate-950">
                          <textarea value={entry.content || ''} onChange={e => updateWorldEntry(idx, 'content', e.target.value)} placeholder="Lore content..." className="w-full h-32 bg-slate-900/50 border border-slate-800 rounded p-3 text-xs text-slate-300 focus:outline-none focus:border-cyan-500/30 font-sans resize-none leading-relaxed" />
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

      {expandedField && (
        <FullscreenEditor 
          title={expandedField.title}
          value={getExpandedValue()}
          onChange={handleExpandedChange}
          onClose={() => setExpandedField(null)}
        />
      )}
    </div>
  );
};
