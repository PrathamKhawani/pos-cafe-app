
'use client';
import { motion } from 'framer-motion';

interface Category {
  id: string;
  name: string;
  color: string;
  order: number;
}

interface CategoryItemProps {
  cat: Category;
  idx: number;
  onEdit: (cat: Category) => void;
  onDelete: (id: string) => void;
  onReorder: (id: string, currentOrder: number, direction: 'up' | 'down') => void;
}

export default function CategoryItem({ cat, idx, onEdit, onDelete, onReorder }: CategoryItemProps) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: idx * 0.05 }}
      className="group bg-white/5 backdrop-blur-xl rounded-[24px] p-6 border border-white/5 flex items-center justify-between hover:border-primary/30 hover:bg-white/10 transition-all shadow-xl"
    >
      <div className="flex items-center gap-6">
        <div className="flex flex-col gap-1 items-center justify-center pr-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={() => onReorder(cat.id, cat.order, 'up')} className="text-[10px] text-slate-400 hover:text-primary">▲</button>
          <div className="w-1 h-3 bg-white/10 rounded-full" />
          <button onClick={() => onReorder(cat.id, cat.order, 'down')} className="text-[10px] text-slate-400 hover:text-primary">▼</button>
        </div>
        
        <div className="w-14 h-14 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110 shadow-2xl relative overflow-hidden" style={{ background: cat.color }}>
          <div className="absolute inset-0 bg-black/10" />
          <span className="text-white text-[10px] font-black opacity-40 relative z-10">#{(idx + 1).toString().padStart(2, '0')}</span>
        </div>

        <div>
          <span className="text-lg font-black text-white tracking-tight uppercase group-hover:text-primary transition-colors leading-none">{cat.name}</span>
          <div className="flex items-center gap-3 mt-1.5 opacity-60">
            <div className="w-1.5 h-1.5 rounded-full" style={{ background: cat.color }} />
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">Sequence {cat.order} · Local Registry</span>
          </div>
        </div>
      </div>

      <div className="flex gap-3">
        <button 
          className="h-10 px-6 rounded-xl bg-white/5 text-white/60 text-[10px] font-black uppercase tracking-widest hover:bg-primary/20 hover:text-primary border border-white/5 transition-all"
          onClick={() => onEdit(cat)}
        >
          Modify
        </button>
        <button 
          className="h-10 px-4 rounded-xl bg-rose-500/10 text-rose-500 text-xs font-black uppercase tracking-widest hover:bg-rose-500 hover:text-white border border-rose-500/20 transition-all"
          onClick={() => onDelete(cat.id)}
        >
          🗑️
        </button>
      </div>
    </motion.div>
  );
}
