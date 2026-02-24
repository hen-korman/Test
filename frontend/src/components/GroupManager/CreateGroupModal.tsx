import { useState, useEffect } from 'react';
import {
  X, Hash, MessageSquare, Users, Loader2, Check, AlertCircle,
  Plus, ListPlus, Search, Lock, Globe,
} from 'lucide-react';
import {
  CriteriaGroup, MatchedEmployee, CreateTargetRequest, BulkAddRequest,
  SlackChannel, SlackUserGroup, TargetType,
} from '../../types';
import { createTarget, bulkAdd, fetchChannels, fetchUserGroups } from '../../api/client';

type ModalTab = 'create' | 'existing';

interface CreateGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  criteriaGroup: CriteriaGroup;
  matchedEmployees: MatchedEmployee[];
}

export function CreateGroupModal({
  isOpen,
  onClose,
  criteriaGroup,
  matchedEmployees,
}: CreateGroupModalProps) {
  const [tab, setTab] = useState<ModalTab>('create');
  const [targetType, setTargetType] = useState<TargetType>('channel');

  // Create new
  const [name, setName] = useState('');
  const [handle, setHandle] = useState('');
  const [description, setDescription] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);

  // Add to existing
  const [channels, setChannels] = useState<SlackChannel[]>([]);
  const [userGroups, setUserGroups] = useState<SlackUserGroup[]>([]);
  const [selectedTargetId, setSelectedTargetId] = useState('');
  const [selectedTargetName, setSelectedTargetName] = useState('');
  const [searchExisting, setSearchExisting] = useState('');
  const [loadingTargets, setLoadingTargets] = useState(false);

  // Shared
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setResult(null);
    setIsSubmitting(false);
  }, [isOpen, tab, targetType]);

  useEffect(() => {
    if (!isOpen || tab !== 'existing') return;
    loadExistingTargets();
  }, [isOpen, tab, targetType]);

  if (!isOpen) return null;

  const slackUsers = matchedEmployees.filter((e) => e.slackId);
  const noSlackUsers = matchedEmployees.filter((e) => !e.slackId);

  async function loadExistingTargets() {
    setLoadingTargets(true);
    try {
      if (targetType === 'channel') {
        setChannels(await fetchChannels());
      } else {
        setUserGroups(await fetchUserGroups());
      }
    } catch {
      /* silent */
    } finally {
      setLoadingTargets(false);
    }
  }

  const handleNameChange = (value: string) => {
    setName(value);
    if (targetType === 'usergroup') {
      if (!handle || handle === name.toLowerCase().replace(/[^a-z0-9]+/g, '-')) {
        setHandle(value.toLowerCase().replace(/[^a-z0-9]+/g, '-'));
      }
    }
  };

  const handleCreateNew = async () => {
    if (!name.trim()) return;
    if (targetType === 'usergroup' && !handle.trim()) return;

    setIsSubmitting(true);
    setResult(null);

    try {
      const request: CreateTargetRequest = {
        targetType,
        name: targetType === 'channel'
          ? name.trim().toLowerCase().replace(/[^a-z0-9-_]/g, '-')
          : name.trim(),
        handle: targetType === 'usergroup' ? handle.trim().toLowerCase().replace(/[^a-z0-9-_]/g, '-') : undefined,
        description: description.trim(),
        criteriaGroup,
        isPrivate,
      };

      const res = await createTarget(request);
      setResult({ success: true, message: res.message });
    } catch (error: any) {
      setResult({
        success: false,
        message: error.response?.data?.error || error.message || 'Failed to create',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBulkAdd = async () => {
    if (!selectedTargetId) return;

    setIsSubmitting(true);
    setResult(null);

    try {
      const request: BulkAddRequest = {
        targetType,
        targetId: selectedTargetId,
        targetName: selectedTargetName,
        criteriaGroup,
      };

      const res = await bulkAdd(request);
      setResult({ success: true, message: res.message });
    } catch (error: any) {
      setResult({
        success: false,
        message: error.response?.data?.error || error.message || 'Failed to add members',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredChannels = channels.filter((c) =>
    c.name.toLowerCase().includes(searchExisting.toLowerCase())
  );
  const filteredGroups = userGroups.filter((g) =>
    g.name.toLowerCase().includes(searchExisting.toLowerCase()) ||
    g.handle.toLowerCase().includes(searchExisting.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-xl mx-4 bg-white rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-indigo-500 to-purple-600 flex items-center justify-between">
          <div className="flex items-center gap-2 text-white">
            {targetType === 'channel' ? <MessageSquare className="w-5 h-5" /> : <Users className="w-5 h-5" />}
            <h2 className="text-lg font-bold">
              {tab === 'create' ? 'Create New' : 'Add to Existing'}
              {' '}{targetType === 'channel' ? 'Channel' : 'User Group'}
            </h2>
          </div>
          <button onClick={onClose} className="text-white/70 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs + Target type selector */}
        <div className="px-6 pt-4 flex items-center justify-between gap-4">
          <div className="flex bg-slate-100 rounded-lg p-0.5">
            <button
              onClick={() => { setTab('create'); setResult(null); }}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-md transition-all
                ${tab === 'create' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              <Plus className="w-3.5 h-3.5" /> Create New
            </button>
            <button
              onClick={() => { setTab('existing'); setResult(null); }}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-md transition-all
                ${tab === 'existing' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              <ListPlus className="w-3.5 h-3.5" /> Add to Existing
            </button>
          </div>

          <div className="flex bg-slate-100 rounded-lg p-0.5">
            <button
              onClick={() => { setTargetType('channel'); setSelectedTargetId(''); setResult(null); }}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-md transition-all
                ${targetType === 'channel' ? 'bg-white text-cyan-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              <Hash className="w-3.5 h-3.5" /> Channel
            </button>
            <button
              onClick={() => { setTargetType('usergroup'); setSelectedTargetId(''); setResult(null); }}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-md transition-all
                ${targetType === 'usergroup' ? 'bg-white text-purple-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              <Users className="w-3.5 h-3.5" /> User Group
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
          {/* Member count badge */}
          <div className="flex items-center gap-3 p-3 rounded-xl bg-indigo-50 border border-indigo-100">
            <Users className="w-5 h-5 text-indigo-500" />
            <div>
              <span className="text-sm font-semibold text-indigo-700">{slackUsers.length}</span>
              <span className="text-sm text-indigo-600 ml-1">members with Slack</span>
              {noSlackUsers.length > 0 && (
                <span className="text-xs text-amber-600 ml-2">({noSlackUsers.length} without Slack ID)</span>
              )}
            </div>
          </div>

          {/* ── Create New Tab ── */}
          {tab === 'create' && (
            <>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  {targetType === 'channel' ? 'Channel Name *' : 'Group Name *'}
                </label>
                <div className="flex items-center gap-0">
                  {targetType === 'channel' && (
                    <span className="px-3 py-2 bg-slate-100 border border-r-0 border-slate-200 rounded-l-lg text-slate-500 text-sm">#</span>
                  )}
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => handleNameChange(e.target.value)}
                    placeholder={targetType === 'channel' ? 'engineering-team' : 'Engineering Team'}
                    className={`flex-1 px-3 py-2 border border-slate-200 ${targetType === 'channel' ? 'rounded-r-lg' : 'rounded-lg'} focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400`}
                  />
                </div>
              </div>

              {targetType === 'usergroup' && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Handle * <span className="text-slate-400 font-normal">(@mention name)</span>
                  </label>
                  <div className="flex items-center gap-0">
                    <span className="px-3 py-2 bg-slate-100 border border-r-0 border-slate-200 rounded-l-lg text-slate-500 text-sm">@</span>
                    <input
                      type="text"
                      value={handle}
                      onChange={(e) => setHandle(e.target.value.toLowerCase().replace(/[^a-z0-9-_]/g, ''))}
                      placeholder="engineering-team"
                      className="flex-1 px-3 py-2 border border-slate-200 rounded-r-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder={`What is this ${targetType === 'channel' ? 'channel' : 'group'} for?`}
                  rows={2}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 resize-none"
                />
              </div>

              {targetType === 'channel' && (
                <label className="flex items-center gap-3 cursor-pointer p-3 rounded-xl border border-slate-200 hover:border-indigo-200 transition-colors">
                  <div className="relative">
                    <input
                      type="checkbox"
                      checked={isPrivate}
                      onChange={(e) => setIsPrivate(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-10 h-6 bg-slate-200 rounded-full peer-checked:bg-indigo-500 transition-colors" />
                    <div className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform peer-checked:translate-x-4" />
                  </div>
                  <div className="flex items-center gap-2">
                    {isPrivate ? <Lock className="w-4 h-4 text-indigo-500" /> : <Globe className="w-4 h-4 text-slate-400" />}
                    <div>
                      <span className="text-sm font-medium text-slate-700">Private channel</span>
                      <p className="text-xs text-slate-400">Only invited members can see this channel</p>
                    </div>
                  </div>
                </label>
              )}
            </>
          )}

          {/* ── Add to Existing Tab ── */}
          {tab === 'existing' && (
            <>
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchExisting}
                  onChange={(e) => setSearchExisting(e.target.value)}
                  placeholder={`Search ${targetType === 'channel' ? 'channels' : 'user groups'}...`}
                  className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400"
                />
              </div>

              {loadingTargets ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 text-indigo-500 animate-spin" />
                </div>
              ) : (
                <div className="space-y-1.5 max-h-[250px] overflow-y-auto">
                  {targetType === 'channel' && filteredChannels.map((ch) => (
                    <button
                      key={ch.id}
                      onClick={() => { setSelectedTargetId(ch.id); setSelectedTargetName(ch.name); }}
                      className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all text-left
                        ${selectedTargetId === ch.id
                          ? 'border-indigo-400 bg-indigo-50 ring-1 ring-indigo-400'
                          : 'border-slate-200 hover:border-indigo-200 hover:bg-slate-50'}`}
                    >
                      {ch.isPrivate ? <Lock className="w-4 h-4 text-slate-400 shrink-0" /> : <Hash className="w-4 h-4 text-slate-400 shrink-0" />}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-700 truncate">{ch.name}</p>
                        {ch.topic && <p className="text-xs text-slate-400 truncate">{ch.topic}</p>}
                      </div>
                      <span className="text-xs text-slate-400 shrink-0">{ch.memberCount} members</span>
                    </button>
                  ))}

                  {targetType === 'usergroup' && filteredGroups.map((ug) => (
                    <button
                      key={ug.id}
                      onClick={() => { setSelectedTargetId(ug.id); setSelectedTargetName(ug.handle || ug.name); }}
                      className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all text-left
                        ${selectedTargetId === ug.id
                          ? 'border-purple-400 bg-purple-50 ring-1 ring-purple-400'
                          : 'border-slate-200 hover:border-purple-200 hover:bg-slate-50'}`}
                    >
                      <Users className="w-4 h-4 text-slate-400 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-700 truncate">{ug.name}</p>
                        <p className="text-xs text-slate-400">@{ug.handle}</p>
                      </div>
                      <span className="text-xs text-slate-400 shrink-0">{ug.userCount} members</span>
                    </button>
                  ))}

                  {targetType === 'channel' && filteredChannels.length === 0 && !loadingTargets && (
                    <p className="text-sm text-slate-400 text-center py-4">No channels found</p>
                  )}
                  {targetType === 'usergroup' && filteredGroups.length === 0 && !loadingTargets && (
                    <p className="text-sm text-slate-400 text-center py-4">No user groups found</p>
                  )}
                </div>
              )}
            </>
          )}

          {/* Result message */}
          {result && (
            <div className={`flex items-center gap-2 p-3 rounded-xl text-sm
              ${result.success
                ? 'bg-emerald-50 border border-emerald-200 text-emerald-700'
                : 'bg-red-50 border border-red-200 text-red-700'}`}
            >
              {result.success ? <Check className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
              {result.message}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 transition-colors">
            Cancel
          </button>

          {tab === 'create' ? (
            <button
              onClick={handleCreateNew}
              disabled={
                !name.trim() ||
                (targetType === 'usergroup' && !handle.trim()) ||
                slackUsers.length === 0 ||
                isSubmitting ||
                result?.success === true
              }
              className="flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white
                text-sm font-semibold rounded-lg shadow-lg shadow-indigo-200 hover:shadow-xl
                disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none transition-all active:scale-95"
            >
              {isSubmitting ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Creating...</>
              ) : result?.success ? (
                <><Check className="w-4 h-4" /> Created!</>
              ) : (
                <><Plus className="w-4 h-4" /> Create {targetType === 'channel' ? 'Channel' : 'Group'}</>
              )}
            </button>
          ) : (
            <button
              onClick={handleBulkAdd}
              disabled={!selectedTargetId || slackUsers.length === 0 || isSubmitting || result?.success === true}
              className="flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 text-white
                text-sm font-semibold rounded-lg shadow-lg shadow-cyan-200 hover:shadow-xl
                disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none transition-all active:scale-95"
            >
              {isSubmitting ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Adding...</>
              ) : result?.success ? (
                <><Check className="w-4 h-4" /> Added!</>
              ) : (
                <><ListPlus className="w-4 h-4" /> Add {slackUsers.length} Members</>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
