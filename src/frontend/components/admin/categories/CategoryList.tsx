
'use client';
import CategoryItem from './CategoryItem';

interface Category {
  id: string;
  name: string;
  color: string;
  order: number;
}

interface CategoryListProps {
  categories: Category[];
  onEdit: (cat: Category) => void;
  onDelete: (id: string) => void;
  onReorder: (id: string, currentOrder: number, direction: 'up' | 'down') => void;
}

export default function CategoryList({ categories, onEdit, onDelete, onReorder }: CategoryListProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-8 px-4">
        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em]">
          Registered Classifications ({categories.length})
        </h3>
        <div className="h-px flex-1 bg-white/5 mx-6" />
      </div>

      <div className="grid grid-cols-1 gap-4">
        {categories.map((cat, idx) => (
          <CategoryItem 
            key={cat.id} 
            cat={cat} 
            idx={idx} 
            onEdit={onEdit} 
            onDelete={onDelete} 
            onReorder={onReorder} 
          />
        ))}

        {categories.length === 0 && (
          <div className="bg-white/5 border-2 border-dashed border-white/5 rounded-[40px] py-32 flex flex-col items-center justify-center opacity-40 grayscale animate-pulse">
            <div className="text-5xl mb-6">🌪️</div>
            <p className="text-xs font-black uppercase tracking-[0.4em] text-white pr-2">Your menu taxonomy is empty</p>
            <p className="text-[10px] text-slate-500 uppercase tracking-widest mt-2 font-bold italic">Initialize registry via terminal hub</p>
          </div>
        )}
      </div>
    </div>
  );
}
