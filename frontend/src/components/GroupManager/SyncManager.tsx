import { useState, useEffect } from 'react';
import {
  X, RefreshCw, Clock, Play, Trash2, Loader2, Check, AlertCircle,
  Hash, Users, Power, PowerOff, Shield, ShieldOff, Search,
} from 'lucide-react';
import {
  ScheduledSync, CriteriaGroup, SlackChannel, SlackUserGroup, TargetType, SyncRunResult,
} from '../../types';
import {
  fetchSyncs, createSync, updateSync, deleteSync, runSyncNow,
  fetchChannels, fetchUserGroups,
} from '../../api/client';

interface SyncManagerProps {
  isOpen: boolean;
  onClose: () => void;
  criteriaGroup: CriteriaGroup;
  matchedCount: number;
}

export function SyncManager({ isOpen, onClose, criteriaGroup, matchedCount }: SyncManagerProps) {
  const [syncs, setSyncs] = useState<ScheduledSync[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [loading, setLoading] = useState(true);

  // Create form
  const [syncName, setSyncName] = useState('');
  const [targetType, setTargetType] = useState<TargetType>('channel');
  const [targetId, setTargetId] = useState('');
  const [targetName, setTargetName] = useState('');
  const [intervalMinutes, setIntervalMinutes] = useState(60);
  const [enforceExclusive, setEnforceExclusive] = useState(false);
  const [channels, setChannels] = useState<SlackChannel[]>([]);
  const [userGroups, setUserGroups] = useState<SlackUserGroup[]>([]);
  const [searchTarget, setSearchTarget] = useState('');
  const [saving, setSaving] = useState(false);
  const [runningId, setRunningId] = useState<string | null>(null);
  const [runResult, setRunResult] = useState<{ id: string; result: SyncRunResult } | null>(null);

  useEffect(() => {
    if (isOpen) loadData();
  }, [isOpen]);

  useEffect(() => {
    if (isCreating) loadTargets();
  }, [isCreating, targetType]);

  if (!isOpen) return null;

  async function loadData() {
    setLoading(true);
    try {
      setSyncs(await fetchSyncs());
    } catch { /* silent */ }
    setLoading(false);
  }

  async function loadTargets() {
    try {
      if (targetType === 'channel') {
        setChannels(await fetchChannels());
      } else {
        setUserGroups(await fetchUserGroups());
      }
    } catch { /* silent */ }
  }

  async function handleCreate() {
    if (!syncName.trim() || !targetId) return;
    setSaving(true);
    try {
      await createSync({
        name: syncName.trim(),
        targetType,
        targetId,
        targetName,
        criteriaGroup,
        intervalMinutes: Math.max(5, intervalMinutes),
        enforceExclusive,
      });
      setIsCreating(false);
      setSyncName('');
      setTargetId('');
      setTargetName('');
      loadData();
    } catch { /* silent */ }
    setSaving(false);
  }

  async function handleToggle(sync: ScheduledSync) {
    try {
      await updateSync(sync.id, { enabled: !sync.enabled });
      loadData();
    } catch { /* silent */ }
  }

  async function handleDelete(id: string) {
    try {
      await deleteSync(id);
      loadData();
    } catch { /* silent */ }
  }

  async function handleRunNow(id: string) {
    setRunningId(id);
    setRunResult(null);
    try {
      const result = await runSyncNow(id);
      setRunResult({ id, result });
      loadData();
    } catch { /* silent */ }
    setRunningId(null);
  }

  const filteredChannels = channels.filter((c) => c.name.toLowerCase().includes(searchTarget.toLowerCase()));
  const filteredGroups = userGroups.filter((g) =>
    g.name.toLowerCase().includes(searchTarget.toLowerCase()) || g.handle.toLowerCase().includes(searchTarget.toLowerCase())
  );

  const intervalOptions = [
    { value: 5, label: '5 minutes' },
    { value: 15, label: '15 minutes' },
    { value: 30, label: '30 minutes' },
    { value: 60, label: '1 hour' },
    { value: 360, label: '6 hours' },
    { value: 720, label: '12 hours' },
    { value: 1440, label: '24 hours' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-2xl mx-4 bg-white rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-emerald-500 to-teal-600 flex items-center justify-between">
          <div className="flex items-center gap-2 text-white">
            <RefreshCw className="w-5 h-5" />
            <h2 className="text-lg font-bold">Scheduled Sync</h2>
          </div>
          <button onClick={onClose} className="text-white/70 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
          {/* Info banner */}
          <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-100 text-sm text-emerald-700">
            <p className="font-medium mb-1">Automated Membership Enforcement</p>
            <p className="text-emerald-600 text-xs">
              Schedule periodic checks to ensure a channel or user group's members match your criteria.
              Optionally remove members who no longer match.
            </p>
          </div>

          {/* Existing syncs */}
          {loading ? (
            <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 text-emerald-500 animate-spin" /></div>
          ) : syncs.length === 0 && !isCreating ? (
            <div className="text-center py-8">
              <RefreshCw className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <p className="text-sm text-slate-500 mb-1">No scheduled syncs yet</p>
              <p className="text-xs text-slate-400">Create one to automatically enforce channel membership</p>
            </div>
          ) : (
            <div className="space-y-2">
              {syncs.map((sync) => (
                <div key={sync.id} className="p-3 rounded-xl border border-slate-200 bg-white hover:border-emerald-200 transition-all">
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${sync.enabled ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-slate-800">{sync.name}</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-500">
                          {sync.targetType === 'channel' ? '#' : '@'}{sync.targetName}
                        </span>
                        {sync.enforceExclusive && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-100 text-amber-700 font-medium">
                            Exclusive
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 mt-0.5">
                        <span className="text-xs text-slate-400 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          Every {intervalOptions.find((o) => o.value === sync.intervalMinutes)?.label || `${sync.intervalMinutes}m`}
                        </span>
                        {sync.lastRunAt && (
                          <span className="text-xs text-slate-400">
                            Last: {new Date(sync.lastRunAt).toLocaleString()}
                          </span>
                        )}
                        {sync.lastRunResult && (
                          <span className="text-xs text-slate-400">
                            +{sync.lastRunResult.added.length} / -{sync.lastRunResult.removed.length}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleRunNow(sync.id)}
                        disabled={runningId === sync.id}
                        className="p-1.5 rounded-lg text-emerald-500 hover:bg-emerald-50 transition-colors disabled:opacity-50"
                        title="Run now"
                      >
                        {runningId === sync.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                      </button>
                      <button
                        onClick={() => handleToggle(sync)}
                        className={`p-1.5 rounded-lg transition-colors ${sync.enabled ? 'text-emerald-500 hover:bg-emerald-50' : 'text-slate-400 hover:bg-slate-100'}`}
                        title={sync.enabled ? 'Disable' : 'Enable'}
                      >
                        {sync.enabled ? <Power className="w-4 h-4" /> : <PowerOff className="w-4 h-4" />}
                      </button>
                      <button
                        onClick={() => handleDelete(sync.id)}
                        className="p-1.5 rounded-lg text-slate-300 hover:text-red-500 hover:bg-red-50 transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {runResult?.id === sync.id && (
                    <div className="mt-2 p-2 rounded-lg bg-emerald-50 border border-emerald-100 text-xs text-emerald-700">
                      <span className="font-medium">Sync complete: </span>
                      +{runResult.result.added.length} added, -{runResult.result.removed.length} removed, {runResult.result.unchanged} unchanged
                      {runResult.result.errors.length > 0 && (
                        <span className="text-red-600 ml-2">({runResult.result.errors.length} errors)</span>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Create new sync form */}
          {isCreating && (
            <div className="p-4 rounded-xl border-2 border-dashed border-emerald-300 bg-emerald-50/30 space-y-3">
              <h3 className="text-sm font-bold text-emerald-800">New Scheduled Sync</h3>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Sync Name *</label>
                <input
                  type="text"
                  value={syncName}
                  onChange={(e) => setSyncName(e.target.value)}
                  placeholder="e.g. Engineering Channel Sync"
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400"
                />
              </div>

              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="block text-xs font-medium text-slate-600 mb-1">Target Type</label>
                  <div className="flex bg-slate-100 rounded-lg p-0.5">
                    <button
                      onClick={() => { setTargetType('channel'); setTargetId(''); }}
                      className={`flex-1 flex items-center justify-center gap-1 py-1.5 text-xs font-medium rounded-md transition-all
                        ${targetType === 'channel' ? 'bg-white text-cyan-700 shadow-sm' : 'text-slate-500'}`}
                    >
                      <Hash className="w-3 h-3" /> Channel
                    </button>
                    <button
                      onClick={() => { setTargetType('usergroup'); setTargetId(''); }}
                      className={`flex-1 flex items-center justify-center gap-1 py-1.5 text-xs font-medium rounded-md transition-all
                        ${targetType === 'usergroup' ? 'bg-white text-purple-700 shadow-sm' : 'text-slate-500'}`}
                    >
                      <Users className="w-3 h-3" /> Group
                    </button>
                  </div>
                </div>
                <div className="flex-1">
                  <label className="block text-xs font-medium text-slate-600 mb-1">Check Interval</label>
                  <select
                    value={intervalMinutes}
                    onChange={(e) => setIntervalMinutes(Number(e.target.value))}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400"
                  >
                    {intervalOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Select Target *</label>
                <div className="relative mb-2">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={searchTarget}
                    onChange={(e) => setSearchTarget(e.target.value)}
                    placeholder="Search..."
                    className="w-full pl-8 pr-3 py-1.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400"
                  />
                </div>
                <div className="max-h-[150px] overflow-y-auto space-y-1">
                  {targetType === 'channel' && filteredChannels.map((ch) => (
                    <button
                      key={ch.id}
                      onClick={() => { setTargetId(ch.id); setTargetName(ch.name); }}
                      className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left text-sm transition-all
                        ${targetId === ch.id ? 'bg-emerald-100 border border-emerald-300' : 'hover:bg-slate-50 border border-transparent'}`}
                    >
                      <Hash className="w-3.5 h-3.5 text-slate-400" />
                      <span className="text-slate-700">{ch.name}</span>
                      <span className="ml-auto text-xs text-slate-400">{ch.memberCount}</span>
                    </button>
                  ))}
                  {targetType === 'usergroup' && filteredGroups.map((ug) => (
                    <button
                      key={ug.id}
                      onClick={() => { setTargetId(ug.id); setTargetName(ug.handle || ug.name); }}
                      className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left text-sm transition-all
                        ${targetId === ug.id ? 'bg-emerald-100 border border-emerald-300' : 'hover:bg-slate-50 border border-transparent'}`}
                    >
                      <Users className="w-3.5 h-3.5 text-slate-400" />
                      <span className="text-slate-700">{ug.name}</span>
                      <span className="text-xs text-slate-400">@{ug.handle}</span>
                      <span className="ml-auto text-xs text-slate-400">{ug.userCount}</span>
                    </button>
                  ))}
                </div>
              </div>

              <label className="flex items-center gap-3 cursor-pointer p-3 rounded-xl border border-slate-200 hover:border-amber-200 transition-colors">
                <div className="relative">
                  <input
                    type="checkbox"
                    checked={enforceExclusive}
                    onChange={(e) => setEnforceExclusive(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-10 h-6 bg-slate-200 rounded-full peer-checked:bg-amber-500 transition-colors" />
                  <div className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform peer-checked:translate-x-4" />
                </div>
                <div className="flex items-center gap-2">
                  {enforceExclusive ? <Shield className="w-4 h-4 text-amber-500" /> : <ShieldOff className="w-4 h-4 text-slate-400" />}
                  <div>
                    <span className="text-sm font-medium text-slate-700">Enforce exclusive membership</span>
                    <p className="text-xs text-slate-400">Remove members who don't match the criteria</p>
                  </div>
                </div>
              </label>

              <div className="flex gap-2 pt-1">
                <button
                  onClick={handleCreate}
                  disabled={!syncName.trim() || !targetId || saving}
                  className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-sm font-medium text-white bg-emerald-500 rounded-lg hover:bg-emerald-600 disabled:opacity-50 transition-colors"
                >
                  {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                  Create Sync
                </button>
                <button
                  onClick={() => setIsCreating(false)}
                  className="px-4 py-2 text-sm text-slate-500 hover:text-slate-700 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
          <span className="text-xs text-slate-400">
            Current query matches {matchedCount} employees
          </span>
          <div className="flex gap-3">
            <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 transition-colors">
              Close
            </button>
            {!isCreating && (
              <button
                onClick={() => setIsCreating(true)}
                disabled={criteriaGroup.criteria.length === 0}
                className="flex items-center gap-1.5 px-4 py-2 bg-emerald-500 text-white text-sm font-semibold rounded-lg hover:bg-emerald-600 disabled:opacity-50 transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                New Sync Schedule
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
