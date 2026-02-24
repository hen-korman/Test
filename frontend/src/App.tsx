import { useState, useEffect, useCallback, useRef } from 'react';
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';
import { Hash, RotateCcw, Sparkles, RefreshCw } from 'lucide-react';

import { Header } from './components/Layout/Header';
import { FieldPalette } from './components/CriteriaBuilder/FieldPalette';
import { DropZone } from './components/CriteriaBuilder/DropZone';
import { EmployeeList } from './components/EmployeePreview/EmployeeList';
import { CreateGroupModal } from './components/GroupManager/CreateGroupModal';
import { SyncManager } from './components/GroupManager/SyncManager';
import { TemplatePanel } from './components/GroupManager/TemplatePanel';

import { fetchFields, matchEmployees, fetchTemplates, fetchHealth } from './api/client';
import {
  HiBobField,
  Criterion,
  CriteriaGroup,
  MatchedEmployee,
  SavedTemplate,
} from './types';

function generateId() {
  return `c-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

export default function App() {
  const [fields, setFields] = useState<HiBobField[]>([]);
  const [criteriaGroup, setCriteriaGroup] = useState<CriteriaGroup>({
    id: 'main',
    name: 'Group Criteria',
    logic: 'AND',
    criteria: [],
  });
  const [matchedEmployees, setMatchedEmployees] = useState<MatchedEmployee[]>([]);
  const [totalEmployees, setTotalEmployees] = useState(0);
  const [isMatching, setIsMatching] = useState(false);
  const [matchError, setMatchError] = useState<string>();
  const [templates, setTemplates] = useState<SavedTemplate[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'mock' | 'error'>('mock');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showSyncManager, setShowSyncManager] = useState(false);
  const [activeDragId, setActiveDragId] = useState<string | null>(null);

  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  useEffect(() => {
    async function init() {
      try {
        const health = await fetchHealth();
        setConnectionStatus(
          health.mockMode?.hibob && health.mockMode?.slack ? 'mock' : 'connected'
        );
      } catch {
        setConnectionStatus('error');
      }

      try {
        setFields(await fetchFields());
      } catch {
        setFields([]);
      }

      try {
        setTemplates(await fetchTemplates());
      } catch {
        setTemplates([]);
      }
    }
    init();
  }, []);

  const runMatch = useCallback(async (group: CriteriaGroup) => {
    if (group.criteria.length === 0) {
      setMatchedEmployees([]);
      setTotalEmployees(0);
      return;
    }

    const hasValues = group.criteria.every((c) => {
      if (c.operator === 'is_empty' || c.operator === 'is_not_empty') return true;
      if (Array.isArray(c.value)) return c.value.length > 0;
      return c.value !== '';
    });
    if (!hasValues) return;

    setIsMatching(true);
    setMatchError(undefined);
    try {
      const result = await matchEmployees(group);
      setMatchedEmployees(result.matched);
      setTotalEmployees(result.totalEmployees);
    } catch (err: any) {
      setMatchError(err.message || 'Failed to match employees');
    } finally {
      setIsMatching(false);
    }
  }, []);

  const debouncedMatch = useCallback(
    (group: CriteriaGroup) => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => runMatch(group), 400);
    },
    [runMatch]
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveDragId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveDragId(null);
    const { active, over } = event;
    if (!over) return;

    if (active.data.current?.type === 'field') {
      const field = active.data.current.field as HiBobField;
      const newCriterion: Criterion = {
        id: generateId(),
        fieldId: field.id,
        fieldName: field.name,
        operator: field.type === 'list' ? 'equals' : 'contains',
        value: '',
      };

      const newGroup = {
        ...criteriaGroup,
        criteria: [...criteriaGroup.criteria, newCriterion],
      };
      setCriteriaGroup(newGroup);
      debouncedMatch(newGroup);
      return;
    }

    if (active.id !== over.id) {
      const oldIndex = criteriaGroup.criteria.findIndex((c) => c.id === active.id);
      const newIndex = criteriaGroup.criteria.findIndex((c) => c.id === over.id);

      if (oldIndex !== -1 && newIndex !== -1) {
        const newGroup = {
          ...criteriaGroup,
          criteria: arrayMove(criteriaGroup.criteria, oldIndex, newIndex),
        };
        setCriteriaGroup(newGroup);
      }
    }
  };

  const handleUpdateCriterion = (id: string, updates: Partial<Criterion>) => {
    const newGroup = {
      ...criteriaGroup,
      criteria: criteriaGroup.criteria.map((c) => (c.id === id ? { ...c, ...updates } : c)),
    };
    setCriteriaGroup(newGroup);
    debouncedMatch(newGroup);
  };

  const handleRemoveCriterion = (id: string) => {
    const newGroup = {
      ...criteriaGroup,
      criteria: criteriaGroup.criteria.filter((c) => c.id !== id),
    };
    setCriteriaGroup(newGroup);
    debouncedMatch(newGroup);
  };

  const handleToggleLogic = () => {
    const newGroup = {
      ...criteriaGroup,
      logic: criteriaGroup.logic === 'AND' ? 'OR' as const : 'AND' as const,
    };
    setCriteriaGroup(newGroup);
    debouncedMatch(newGroup);
  };

  const handleClearAll = () => {
    setCriteriaGroup({ ...criteriaGroup, criteria: [] });
    setMatchedEmployees([]);
    setTotalEmployees(0);
  };

  const handleLoadTemplate = (templateCriteriaGroup: CriteriaGroup) => {
    setCriteriaGroup({ ...templateCriteriaGroup, id: 'main' });
    runMatch(templateCriteriaGroup);
  };

  const handleRefreshTemplates = async () => {
    try {
      setTemplates(await fetchTemplates());
    } catch { /* silent */ }
  };

  const activeField = activeDragId?.startsWith('field-')
    ? fields.find((f) => `field-${f.id}` === activeDragId)
    : null;

  const slackMemberCount = matchedEmployees.filter((e) => e.slackId).length;

  return (
    <div className="h-screen flex flex-col bg-slate-50">
      <Header connectionStatus={connectionStatus} />

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="flex-1 flex overflow-hidden">
          {/* Left: Field Palette */}
          <aside className="w-72 border-r border-slate-200 bg-white shrink-0 flex flex-col overflow-hidden">
            <div className="flex-1 overflow-hidden">
              <FieldPalette fields={fields} />
            </div>
            <TemplatePanel
              templates={templates}
              currentCriteriaGroup={criteriaGroup}
              onLoadTemplate={handleLoadTemplate}
              onRefreshTemplates={handleRefreshTemplates}
            />
          </aside>

          {/* Center: Criteria Builder */}
          <main className="flex-1 flex flex-col overflow-hidden">
            <DropZone
              criteriaGroup={criteriaGroup}
              fields={fields}
              onUpdateCriterion={handleUpdateCriterion}
              onRemoveCriterion={handleRemoveCriterion}
              onToggleLogic={handleToggleLogic}
            />

            {/* Bottom Action Bar */}
            <div className="px-6 py-3 border-t border-slate-200 bg-white flex items-center justify-between">
              <button
                onClick={handleClearAll}
                disabled={criteriaGroup.criteria.length === 0}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Clear All
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowSyncManager(true)}
                  className="flex items-center gap-1.5 px-4 py-2 border border-emerald-300 text-emerald-600 text-sm font-medium rounded-xl hover:bg-emerald-50 transition-all active:scale-95"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Sync Schedule
                </button>

                <button
                  onClick={() => setShowCreateModal(true)}
                  disabled={matchedEmployees.length === 0}
                  className="flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white
                    text-sm font-semibold rounded-xl shadow-lg shadow-indigo-200 hover:shadow-xl hover:shadow-indigo-300
                    disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none transition-all active:scale-95"
                >
                  <Sparkles className="w-4 h-4" />
                  Add to Slack ({slackMemberCount})
                </button>
              </div>
            </div>
          </main>

          {/* Right: Employee Preview */}
          <aside className="w-80 border-l border-slate-200 bg-white shrink-0 overflow-hidden">
            <EmployeeList
              employees={matchedEmployees}
              totalEmployees={totalEmployees}
              isLoading={isMatching}
              error={matchError}
            />
          </aside>
        </div>

        <DragOverlay>
          {activeField && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg border-2 border-indigo-400 bg-white shadow-2xl">
              <Hash className="w-3.5 h-3.5 text-indigo-500" />
              <span className="text-sm font-medium text-indigo-700">{activeField.name}</span>
            </div>
          )}
        </DragOverlay>
      </DndContext>

      <CreateGroupModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        criteriaGroup={criteriaGroup}
        matchedEmployees={matchedEmployees}
      />

      <SyncManager
        isOpen={showSyncManager}
        onClose={() => setShowSyncManager(false)}
        criteriaGroup={criteriaGroup}
        matchedCount={slackMemberCount}
      />
    </div>
  );
}
