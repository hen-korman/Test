import { useState } from 'react';
import { Bookmark, Plus, Trash2, Clock, Loader2, Download } from 'lucide-react';
import { SavedTemplate, CriteriaGroup } from '../../types';
import { createTemplate, deleteTemplate as apiDeleteTemplate } from '../../api/client';

interface TemplatePanelProps {
  templates: SavedTemplate[];
  currentCriteriaGroup: CriteriaGroup;
  onLoadTemplate: (criteriaGroup: CriteriaGroup) => void;
  onRefreshTemplates: () => void;
}

export function TemplatePanel({
  templates,
  currentCriteriaGroup,
  onLoadTemplate,
  onRefreshTemplates,
}: TemplatePanelProps) {
  const [isCreating, setIsCreating] = useState(false);
  const [saveName, setSaveName] = useState('');
  const [saveDesc, setSaveDesc] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!saveName.trim()) return;
    setIsSaving(true);
    try {
      await createTemplate(saveName.trim(), saveDesc.trim(), currentCriteriaGroup);
      setSaveName('');
      setSaveDesc('');
      setIsCreating(false);
      onRefreshTemplates();
    } catch {
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await apiDeleteTemplate(id);
      onRefreshTemplates();
    } catch {
    }
  };

  return (
    <div className="border-t border-slate-200 bg-slate-50/50">
      <div className="px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bookmark className="w-4 h-4 text-indigo-500" />
          <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Templates</h3>
        </div>
        <button
          onClick={() => setIsCreating(!isCreating)}
          disabled={currentCriteriaGroup.criteria.length === 0}
          className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Plus className="w-3 h-3" />
          Save Current
        </button>
      </div>

      {isCreating && (
        <div className="px-4 pb-3 space-y-2">
          <input
            type="text"
            value={saveName}
            onChange={(e) => setSaveName(e.target.value)}
            placeholder="Template name..."
            className="w-full px-3 py-1.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400"
          />
          <input
            type="text"
            value={saveDesc}
            onChange={(e) => setSaveDesc(e.target.value)}
            placeholder="Description (optional)"
            className="w-full px-3 py-1.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400"
          />
          <div className="flex gap-2">
            <button
              onClick={handleSave}
              disabled={!saveName.trim() || isSaving}
              className="flex-1 flex items-center justify-center gap-1 px-3 py-1.5 text-sm font-medium text-white bg-indigo-500 rounded-lg hover:bg-indigo-600 disabled:opacity-50 transition-colors"
            >
              {isSaving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Bookmark className="w-3 h-3" />}
              Save
            </button>
            <button
              onClick={() => setIsCreating(false)}
              className="px-3 py-1.5 text-sm text-slate-500 hover:text-slate-700 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {templates.length > 0 && (
        <div className="px-4 pb-3 space-y-1.5 max-h-[200px] overflow-y-auto">
          {templates.map((template) => (
            <div
              key={template.id}
              className="group flex items-center gap-2 p-2 rounded-lg border border-slate-200 bg-white hover:border-indigo-200 transition-all"
            >
              <button
                onClick={() => onLoadTemplate(template.criteriaGroup)}
                className="flex-1 text-left min-w-0"
              >
                <p className="text-sm font-medium text-slate-700 truncate">{template.name}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-[10px] text-slate-400">
                    {template.criteriaGroup.criteria.length} rules
                  </span>
                  <span className="text-[10px] text-slate-300">
                    <Clock className="w-2.5 h-2.5 inline mr-0.5" />
                    {new Date(template.updatedAt).toLocaleDateString()}
                  </span>
                </div>
              </button>
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => onLoadTemplate(template.criteriaGroup)}
                  className="p-1 text-indigo-400 hover:text-indigo-600 transition-colors"
                  title="Load template"
                >
                  <Download className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => handleDelete(template.id)}
                  className="p-1 text-slate-300 hover:text-red-500 transition-colors"
                  title="Delete template"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {templates.length === 0 && !isCreating && (
        <p className="px-4 pb-3 text-xs text-slate-400 text-center">No saved templates</p>
      )}
    </div>
  );
}
