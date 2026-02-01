
import React, { useEffect, useState } from 'react';
import { CharacterRecord } from '../types';
import { FileText, Calendar, Trash2 } from 'lucide-react';

interface CharacterCardProps {
  character: CharacterRecord;
  onClick: () => void;
  onDelete: (e: React.MouseEvent) => void;
}

export const CharacterCard: React.FC<CharacterCardProps> = ({ character, onClick, onDelete }) => {
  const [imageUrl, setImageUrl] = useState<string>('');

  useEffect(() => {
    const url = URL.createObjectURL(character.imageBlob);
    setImageUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [character.imageBlob]);

  return (
    <div 
      onClick={onClick}
      className="group relative bg-slate-900/60 border border-slate-800 hover:border-cyan-500/50 transition-all duration-300 cursor-pointer overflow-hidden rounded-md shadow-lg"
    >
      <div className="aspect-[2/3] relative overflow-hidden bg-slate-950">
        {imageUrl && (
          <img 
            src={imageUrl} 
            alt={character.name} 
            className="w-full h-full object-cover transition-all duration-500 scale-100 group-hover:scale-105"
            loading="lazy"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-60" />
        
        <div className="absolute top-1 right-1">
          <button 
            onClick={onDelete}
            className="p-1.5 bg-red-950/80 text-red-400 rounded-sm opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-800"
            aria-label="Delete entity"
          >
            <Trash2 size={12} />
          </button>
        </div>
      </div>

      <div className="p-2 md:p-3 relative">
        <h3 className="font-mono font-bold text-cyan-400 text-xs md:text-sm leading-tight uppercase truncate mb-1">
          {character.name}
        </h3>
        
        <div className="flex flex-wrap gap-1 min-h-[16px]">
          {character.tags?.slice(0, 2).map(tag => (
            <span key={tag} className="text-[8px] md:text-[9px] bg-slate-800 text-slate-400 px-1 py-0.5 rounded border border-slate-700 uppercase">
              {tag}
            </span>
          ))}
          {character.tags?.length > 2 && (
            <span className="text-[8px] text-slate-600">+{character.tags.length - 2}</span>
          )}
        </div>

        <div className="flex items-center gap-1 mt-2 text-slate-600 text-[8px] font-mono border-t border-slate-800 pt-2 uppercase">
          <Calendar size={8} />
          <span className="truncate">{new Date(character.lastModified).toLocaleDateString()}</span>
        </div>
      </div>

      <div className="absolute bottom-0 left-0 h-[1px] w-0 bg-cyan-500 group-hover:w-full transition-all duration-300" />
    </div>
  );
};
