
import React, { useState, useEffect, useCallback } from 'react';
import { Sidebar } from './components/Sidebar';
import { CharacterCard } from './components/CharacterCard';
import { DossierView } from './components/DossierView';
import { CharacterRecord, CharacterDataV2 } from './types';
import { db } from './services/db';
import { extractCharacterData, createCharacterPNG, compressImage } from './services/pngUtils';
import { Upload, Menu, Download, Archive as ArchiveIcon, ShieldCheck } from 'lucide-react';

const App: React.FC = () => {
  const [characters, setCharacters] = useState<CharacterRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCharacter, setSelectedCharacter] = useState<CharacterRecord | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [allTags, setAllTags] = useState<string[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState<'name' | 'date'>('date');

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const allChars = await db.characters.toArray();
      setCharacters(allChars);
      const tags = new Set<string>();
      allChars.forEach(c => (c.tags || []).forEach(t => tags.add(t)));
      setAllTags(Array.from(tags).sort());
    } catch (err) {
      console.error("DB Load Error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const handleFileUpload = async (files: FileList | null) => {
    if (!files) return;
    setLoading(true);
    for (let i = 0; i < files.length; i++) {
      try {
        const file = files[i];
        // 支持 PNG 和 JSON
        if (file.type !== 'image/png' && file.type !== 'application/json' && !file.name.endsWith('.json')) continue;
        
        const { data, imageBlob } = await extractCharacterData(file);
        
        await db.characters.add({ 
          name: data.name, 
          data, 
          imageBlob, 
          tags: data.tags || [], 
          lastModified: Date.now() 
        });
      } catch (err) { 
        console.error("Upload Error:", err);
        alert(`Failed to import ${files[i].name}. File might be corrupted or incompatible.`);
      }
    }
    await loadData();
    setLoading(false);
  };

  const handleSaveCharacter = async (data: CharacterDataV2, imageFile: File | null) => {
    let imageBlob = selectedCharacter?.imageBlob;
    if (imageFile) {
      imageBlob = await compressImage(imageFile);
    }
    
    if (!imageBlob && isCreating) return alert("Character requires an image card.");

    const record: CharacterRecord = {
      id: selectedCharacter?.id,
      name: data.name,
      data,
      imageBlob: imageBlob!,
      tags: data.tags || [],
      lastModified: Date.now()
    };

    try {
      isCreating ? await db.characters.add(record) : await db.characters.put(record);
    } catch (e) {
      console.error("Save Error:", e);
    }
    
    await loadData();
    setSelectedCharacter(null);
    setIsCreating(false);
  };

  const handleBatchExport = async () => {
    if (filteredCharacters.length === 0) return;
    setLoading(true);
    for (const char of filteredCharacters) {
      try {
        const pngBlob = await createCharacterPNG(char.imageBlob, char.data);
        const url = URL.createObjectURL(pngBlob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${char.name.replace(/\s+/g, '_')}.png`;
        a.click();
        URL.revokeObjectURL(url);
      } catch (err) { console.error(err); }
    }
    setLoading(false);
  };

  const filteredCharacters = characters
    .filter(c => {
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = c.name.toLowerCase().includes(searchLower) || (c.data.description || "").toLowerCase().includes(searchLower);
      const matchesTag = !selectedTag || (c.tags || []).includes(selectedTag);
      return matchesSearch && matchesTag;
    })
    .sort((a, b) => {
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      return b.lastModified - a.lastModified;
    });

  return (
    <div className="flex h-screen bg-slate-950 text-slate-300 overflow-hidden font-sans">
      <Sidebar 
        tags={allTags} 
        selectedTag={selectedTag} 
        onSelectTag={setSelectedTag} 
        onSearch={setSearchTerm} 
        onNew={() => setIsCreating(true)}
        isOpen={isSidebarOpen} 
        onClose={() => setIsSidebarOpen(false)} 
        viewMode={viewMode} 
        setViewMode={setViewMode} 
        sortBy={sortBy} 
        setSortBy={setSortBy}
      />

      <main 
        className={`flex-1 flex flex-col min-w-0 relative ${dragActive ? 'bg-cyan-900/10' : ''}`}
        onDragOver={e => { e.preventDefault(); setDragActive(true); }}
        onDragLeave={() => setDragActive(false)}
        onDrop={e => { e.preventDefault(); setDragActive(false); handleFileUpload(e.dataTransfer.files); }}
      >
        <header className="h-16 border-b border-slate-800 flex items-center justify-between px-4 md:px-8 bg-slate-950/80 backdrop-blur-md z-30 shrink-0">
          <div className="flex items-center gap-3">
            <button onClick={() => setIsSidebarOpen(true)} className="md:hidden p-2 -ml-2 text-slate-400 hover:text-cyan-400">
              <Menu size={24} />
            </button>
            <div className="flex items-center gap-2">
              <ShieldCheck size={18} className="text-cyan-500" />
              <span className="text-[10px] font-mono uppercase text-slate-500 tracking-widest hidden sm:block">Archive Node v1.2</span>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button 
              onClick={handleBatchExport}
              disabled={filteredCharacters.length === 0}
              className="bg-slate-900 hover:bg-slate-800 text-cyan-400 px-3 py-1.5 rounded text-[10px] font-mono border border-slate-700 flex items-center gap-2 disabled:opacity-30"
            >
              <Download size={14}/> <span className="hidden xs:block">BATCH EXPORT</span>
            </button>
            <label className="bg-cyan-600 hover:bg-cyan-500 text-white px-3 py-1.5 rounded text-[10px] font-mono uppercase cursor-pointer flex items-center gap-2 transition-all active:scale-95">
              <Upload size={14} /><span className="hidden sm:inline">IMPORT PNG/JSON</span>
              <input type="file" className="hidden" multiple accept="image/png,application/json" onChange={e => handleFileUpload(e.target.files)} />
            </label>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 md:p-8">
          <div className="mb-6 flex items-end justify-between">
            <div className="min-w-0">
              <h2 className="text-xl md:text-3xl font-bold font-mono text-cyan-400 uppercase tracking-tighter truncate leading-none mb-1">
                {selectedTag || 'Central Archives'}
              </h2>
              <div className="h-0.5 w-12 bg-cyan-500/50" />
            </div>
            <div className="text-[10px] font-mono text-slate-500 uppercase shrink-0 ml-4">
              {filteredCharacters.length} Records Indexed
            </div>
          </div>

          {loading && characters.length === 0 ? (
            <div className="h-64 flex items-center justify-center font-mono text-cyan-800 animate-pulse">
              SYNCING WITH DATABASE...
            </div>
          ) : filteredCharacters.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center border-2 border-dashed border-slate-900 rounded-lg text-slate-600 font-mono text-sm">
              <ArchiveIcon size={48} className="mb-4 opacity-20" />
              NO RECORDS FOUND
            </div>
          ) : (
            <div className={viewMode === 'grid' 
              ? "grid grid-cols-2 xs:grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3 md:gap-6" 
              : "flex flex-col gap-2"
            }>
              {filteredCharacters.map(char => (
                viewMode === 'grid' ? (
                  <CharacterCard 
                    key={char.id} 
                    character={char} 
                    onClick={() => setSelectedCharacter(char)} 
                    onDelete={e => { 
                      e.stopPropagation(); 
                      if (char.id && confirm(`Delete ${char.name}?`)) db.characters.delete(char.id).then(loadData); 
                    }} 
                  />
                ) : (
                  <div 
                    key={char.id} 
                    onClick={() => setSelectedCharacter(char)} 
                    className="bg-slate-900/50 border border-slate-800 p-3 flex items-center justify-between hover:border-cyan-500/50 hover:bg-slate-900 cursor-pointer group rounded transition-all"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-1.5 h-1.5 rounded-full bg-cyan-500/30 group-hover:bg-cyan-500 shrink-0" />
                      <span className="font-mono text-xs uppercase font-bold tracking-widest truncate text-slate-300 group-hover:text-cyan-400">
                        {char.name}
                      </span>
                    </div>
                    <div className="flex gap-1 shrink-0 ml-4">
                      {char.tags.slice(0, 2).map(t => (
                        <span key={t} className="hidden xs:block text-[8px] bg-slate-950 px-1.5 py-0.5 text-slate-500 border border-slate-800 rounded uppercase">
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>
                )
              ))}
            </div>
          )}
        </div>
      </main>

      {(selectedCharacter || isCreating) && (
        <DossierView 
          initialData={selectedCharacter?.data || { 
            name: 'NEW ENTITY', 
            description: '', 
            personality: '', 
            scenario: '', 
            first_mes: '', 
            mes_example: '', 
            creator_notes: '', 
            system_prompt: '', 
            post_history_instructions: '', 
            alternate_greetings: [], 
            tags: [], 
            creator: '', 
            character_version: '1', 
            extensions: {} 
          }}
          initialImage={selectedCharacter ? URL.createObjectURL(selectedCharacter.imageBlob) : null}
          availableTags={allTags}
          onClose={() => { setSelectedCharacter(null); setIsCreating(false); }}
          onSave={handleSaveCharacter}
        />
      )}
    </div>
  );
};
export default App;
