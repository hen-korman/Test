import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, X, ChevronDown } from 'lucide-react';
import { Criterion, CriterionOperator, HiBobField, OPERATOR_LABELS, OPERATORS_BY_TYPE } from '../../types';
import { useState } from 'react';

interface CriterionCardProps {
  criterion: Criterion;
  field?: HiBobField;
  onUpdate: (id: string, updates: Partial<Criterion>) => void;
  onRemove: (id: string) => void;
  isFirst: boolean;
  logicLabel: string;
}

export function CriterionCard({
  criterion,
  field,
  onUpdate,
  onRemove,
  isFirst,
  logicLabel,
}: CriterionCardProps) {
  const [isOperatorOpen, setIsOperatorOpen] = useState(false);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: criterion.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const fieldType = field?.type || 'text';
  const operators = OPERATORS_BY_TYPE[fieldType] || OPERATORS_BY_TYPE.text;
  const noValueOperators: CriterionOperator[] = ['is_empty', 'is_not_empty'];
  const showValueInput = !noValueOperators.includes(criterion.operator);
  const isMultiValueOperator = criterion.operator === 'in' || criterion.operator === 'not_in';

  const handleValueChange = (value: string) => {
    if (isMultiValueOperator) {
      onUpdate(criterion.id, { value: value.split(',').map((v) => v.trim()) });
    } else {
      onUpdate(criterion.id, { value });
    }
  };

  const renderValueInput = () => {
    if (!showValueInput) return null;

    if (field?.type === 'list' && field.values && !isMultiValueOperator) {
      return (
        <select
          value={criterion.value as string}
          onChange={(e) => onUpdate(criterion.id, { value: e.target.value })}
          className="flex-1 min-w-[140px] px-3 py-1.5 text-sm border border-slate-200 rounded-lg bg-white
            focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400"
        >
          <option value="">Select value...</option>
          {field.values.map((v) => (
            <option key={v.id} value={v.value}>
              {v.value}
            </option>
          ))}
        </select>
      );
    }

    if (field?.type === 'list' && field.values && isMultiValueOperator) {
      const selectedValues = Array.isArray(criterion.value) ? criterion.value : [];
      return (
        <div className="flex-1 min-w-[200px]">
          <div className="flex flex-wrap gap-1.5 p-2 border border-slate-200 rounded-lg bg-white min-h-[36px]">
            {selectedValues.map((val) => (
              <span
                key={val}
                className="inline-flex items-center gap-1 px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded-md text-xs font-medium"
              >
                {val}
                <button
                  onClick={() => {
                    const newVals = selectedValues.filter((v) => v !== val);
                    onUpdate(criterion.id, { value: newVals });
                  }}
                  className="hover:text-indigo-900"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
            <select
              value=""
              onChange={(e) => {
                if (e.target.value && !selectedValues.includes(e.target.value)) {
                  onUpdate(criterion.id, { value: [...selectedValues, e.target.value] });
                }
              }}
              className="text-sm border-0 bg-transparent focus:outline-none text-slate-400 min-w-[100px]"
            >
              <option value="">Add...</option>
              {field.values
                .filter((v) => !selectedValues.includes(v.value))
                .map((v) => (
                  <option key={v.id} value={v.value}>
                    {v.value}
                  </option>
                ))}
            </select>
          </div>
        </div>
      );
    }

    return (
      <input
        type="text"
        value={
          Array.isArray(criterion.value) ? criterion.value.join(', ') : criterion.value
        }
        onChange={(e) => handleValueChange(e.target.value)}
        placeholder={isMultiValueOperator ? 'value1, value2, ...' : 'Enter value...'}
        className="flex-1 min-w-[140px] px-3 py-1.5 text-sm border border-slate-200 rounded-lg bg-white
          focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400"
      />
    );
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group relative ${isDragging ? 'opacity-50 z-50' : ''}`}
    >
      {!isFirst && (
        <div className="flex items-center justify-center py-1">
          <span className="px-3 py-0.5 text-[10px] font-bold uppercase tracking-widest text-indigo-500 bg-indigo-50 rounded-full">
            {logicLabel}
          </span>
        </div>
      )}

      <div className="flex items-center gap-2 p-3 rounded-xl border border-slate-200 bg-white hover:border-indigo-200 hover:shadow-sm transition-all">
        <button
          className="shrink-0 cursor-grab active:cursor-grabbing text-slate-300 hover:text-indigo-400 transition-colors"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="w-4 h-4" />
        </button>

        <div className="shrink-0 px-3 py-1.5 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg">
          <span className="text-xs font-semibold text-indigo-700">{criterion.fieldName}</span>
        </div>

        <div className="relative shrink-0">
          <button
            onClick={() => setIsOperatorOpen(!isOperatorOpen)}
            className="flex items-center gap-1 px-3 py-1.5 text-sm border border-slate-200 rounded-lg bg-white hover:bg-slate-50 transition-colors"
          >
            <span className="text-slate-600">{OPERATOR_LABELS[criterion.operator]}</span>
            <ChevronDown className="w-3 h-3 text-slate-400" />
          </button>
          {isOperatorOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setIsOperatorOpen(false)} />
              <div className="absolute top-full mt-1 left-0 z-20 w-48 py-1 bg-white border border-slate-200 rounded-xl shadow-lg">
                {operators.map((op) => (
                  <button
                    key={op}
                    onClick={() => {
                      onUpdate(criterion.id, { operator: op });
                      setIsOperatorOpen(false);
                    }}
                    className={`w-full px-3 py-1.5 text-left text-sm hover:bg-indigo-50 transition-colors
                      ${criterion.operator === op ? 'text-indigo-600 font-medium bg-indigo-50/50' : 'text-slate-600'}`}
                  >
                    {OPERATOR_LABELS[op]}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        {renderValueInput()}

        <button
          onClick={() => onRemove(criterion.id)}
          className="shrink-0 p-1.5 rounded-lg text-slate-300 hover:text-red-500 hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
