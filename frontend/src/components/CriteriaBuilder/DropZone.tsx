import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Plus, Layers } from 'lucide-react';
import { CriteriaGroup, Criterion, HiBobField, LogicOperator } from '../../types';
import { CriterionCard } from './CriterionCard';
import { EmptyState } from '../common/EmptyState';

interface DropZoneProps {
  criteriaGroup: CriteriaGroup;
  fields: HiBobField[];
  onUpdateCriterion: (id: string, updates: Partial<Criterion>) => void;
  onRemoveCriterion: (id: string) => void;
  onToggleLogic: () => void;
}

export function DropZone({
  criteriaGroup,
  fields,
  onUpdateCriterion,
  onRemoveCriterion,
  onToggleLogic,
}: DropZoneProps) {
  const { setNodeRef, isOver } = useDroppable({ id: 'criteria-drop-zone' });

  const fieldMap = new Map(fields.map((f) => [f.id, f]));

  return (
    <div className="h-full flex flex-col">
      <div className="px-6 pt-5 pb-4 flex items-center justify-between">
        <div>
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
            Criteria Builder
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {criteriaGroup.criteria.length} rule{criteriaGroup.criteria.length !== 1 ? 's' : ''} defined
          </p>
        </div>
        {criteriaGroup.criteria.length > 1 && (
          <button
            onClick={onToggleLogic}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold transition-all
              border-2 hover:shadow-sm active:scale-95"
            style={{
              borderColor: criteriaGroup.logic === 'AND' ? '#6366f1' : '#06b6d4',
              color: criteriaGroup.logic === 'AND' ? '#6366f1' : '#06b6d4',
              backgroundColor: criteriaGroup.logic === 'AND' ? '#eef2ff' : '#ecfeff',
            }}
          >
            {criteriaGroup.logic === 'AND' ? 'Match ALL' : 'Match ANY'}
            <span className="text-[10px] opacity-60">(click to toggle)</span>
          </button>
        )}
      </div>

      <div
        ref={setNodeRef}
        className={`flex-1 mx-4 mb-4 rounded-2xl border-2 border-dashed transition-all duration-200 overflow-y-auto
          ${isOver
            ? 'border-indigo-400 bg-indigo-50/50 shadow-inner'
            : criteriaGroup.criteria.length === 0
              ? 'border-slate-200 bg-white/50'
              : 'border-transparent bg-transparent'
          }`}
      >
        {criteriaGroup.criteria.length === 0 ? (
          <EmptyState
            icon={<Plus className="w-7 h-7" />}
            title="Drop fields here"
            description="Drag employee fields from the left panel to build your group criteria"
          />
        ) : (
          <SortableContext
            items={criteriaGroup.criteria.map((c) => c.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="p-4 space-y-1">
              {criteriaGroup.criteria.map((criterion, index) => (
                <CriterionCard
                  key={criterion.id}
                  criterion={criterion}
                  field={fieldMap.get(criterion.fieldId)}
                  onUpdate={onUpdateCriterion}
                  onRemove={onRemoveCriterion}
                  isFirst={index === 0}
                  logicLabel={criteriaGroup.logic}
                />
              ))}
            </div>
          </SortableContext>
        )}
      </div>
    </div>
  );
}
