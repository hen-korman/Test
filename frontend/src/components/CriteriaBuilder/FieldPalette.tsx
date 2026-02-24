import { useDraggable } from '@dnd-kit/core';
import { GripVertical, Search, Briefcase, User, Mail, MapPin, Users, Hash } from 'lucide-react';
import { HiBobField } from '../../types';
import { useState, useMemo } from 'react';

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  Work: <Briefcase className="w-3.5 h-3.5" />,
  'Basic Info': <User className="w-3.5 h-3.5" />,
  Personal: <Mail className="w-3.5 h-3.5" />,
  About: <Hash className="w-3.5 h-3.5" />,
};

function DraggableField({ field }: { field: HiBobField }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `field-${field.id}`,
    data: { type: 'field', field },
  });

  const style = transform
    ? { transform: `translate(${transform.x}px, ${transform.y}px)` }
    : undefined;

  const typeIcon = field.type === 'list' ? (
    <MapPin className="w-3 h-3 text-indigo-400" />
  ) : (
    <Users className="w-3 h-3 text-slate-400" />
  );

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-200 bg-white
        hover:border-indigo-300 hover:shadow-sm cursor-grab active:cursor-grabbing transition-all
        ${isDragging ? 'opacity-50 shadow-lg scale-105 z-50' : ''}`}
      {...listeners}
      {...attributes}
    >
      <GripVertical className="w-3.5 h-3.5 text-slate-300 group-hover:text-indigo-400 shrink-0" />
      {typeIcon}
      <span className="text-sm font-medium text-slate-700 truncate">{field.name}</span>
      {field.type === 'list' && field.values && (
        <span className="ml-auto text-[10px] text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
          {field.values.length}
        </span>
      )}
    </div>
  );
}

interface FieldPaletteProps {
  fields: HiBobField[];
}

export function FieldPalette({ fields }: FieldPaletteProps) {
  const [search, setSearch] = useState('');

  const grouped = useMemo(() => {
    const filtered = fields.filter(
      (f) =>
        f.name.toLowerCase().includes(search.toLowerCase()) ||
        f.category.toLowerCase().includes(search.toLowerCase())
    );

    const groups: Record<string, HiBobField[]> = {};
    for (const field of filtered) {
      const cat = field.category || 'Other';
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(field);
    }
    return groups;
  }, [fields, search]);

  return (
    <div className="h-full flex flex-col">
      <div className="px-4 pt-4 pb-3">
        <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-3">
          Available Fields
        </h2>
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search fields..."
            className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg bg-slate-50
              focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-all"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-4">
        {Object.entries(grouped).map(([category, catFields]) => (
          <div key={category}>
            <div className="flex items-center gap-1.5 mb-2">
              <span className="text-indigo-500">
                {CATEGORY_ICONS[category] || <Hash className="w-3.5 h-3.5" />}
              </span>
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                {category}
              </span>
            </div>
            <div className="space-y-1.5">
              {catFields.map((field) => (
                <DraggableField key={field.id} field={field} />
              ))}
            </div>
          </div>
        ))}

        {Object.keys(grouped).length === 0 && (
          <p className="text-sm text-slate-400 text-center py-8">No fields found</p>
        )}
      </div>

      <div className="px-4 py-3 border-t border-slate-100 bg-slate-50/50">
        <p className="text-xs text-slate-400 text-center">
          Drag fields to the builder area
        </p>
      </div>
    </div>
  );
}
