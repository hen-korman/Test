import { useState } from 'react';
import { X, Hash, MessageSquare, Users, Loader2, Check, AlertCircle } from 'lucide-react';
import { CriteriaGroup, MatchedEmployee, GroupCreationRequest } from '../../types';
import { createGroup } from '../../api/client';

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
  const [name, setName] = useState('');
  const [handle, setHandle] = useState('');
  const [description, setDescription] = useState('');
  const [createChannel, setCreateChannel] = useState(false);
  const [channelName, setChannelName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  if (!isOpen) return null;

  const slackUsers = matchedEmployees.filter((e) => e.slackId);
  const noSlackUsers = matchedEmployees.filter((e) => !e.slackId);

  const handleSubmit = async () => {
    if (!name.trim() || !handle.trim()) return;

    setIsSubmitting(true);
    setResult(null);

    try {
      const request: GroupCreationRequest = {
        name: name.trim(),
        handle: handle.trim().toLowerCase().replace(/[^a-z0-9-_]/g, '-'),
        description: description.trim(),
        criteriaGroup,
        createChannel,
        channelName: createChannel ? channelName.trim().toLowerCase().replace(/[^a-z0-9-_]/g, '-') : undefined,
      };

      await createGroup(request);
      setResult({
        success: true,
        message: `Group @${request.handle} created with ${slackUsers.length} members!`,
      });
    } catch (error: any) {
      setResult({
        success: false,
        message: error.response?.data?.error || error.message || 'Failed to create group',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNameChange = (value: string) => {
    setName(value);
    if (!handle || handle === name.toLowerCase().replace(/[^a-z0-9]+/g, '-')) {
      setHandle(value.toLowerCase().replace(/[^a-z0-9]+/g, '-'));
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-lg mx-4 bg-white rounded-2xl shadow-2xl overflow-hidden">
        <div className="px-6 py-4 bg-gradient-to-r from-indigo-500 to-purple-600 flex items-center justify-between">
          <div className="flex items-center gap-2 text-white">
            <Users className="w-5 h-5" />
            <h2 className="text-lg font-bold">Create Slack Group</h2>
          </div>
          <button onClick={onClose} className="text-white/70 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-indigo-50 border border-indigo-100">
            <Users className="w-5 h-5 text-indigo-500" />
            <div>
              <span className="text-sm font-semibold text-indigo-700">{slackUsers.length}</span>
              <span className="text-sm text-indigo-600 ml-1">members with Slack</span>
              {noSlackUsers.length > 0 && (
                <span className="text-xs text-amber-600 ml-2">
                  ({noSlackUsers.length} without Slack ID)
                </span>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Group Name *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="e.g. Engineering Team"
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Handle * <span className="text-slate-400 font-normal">(@mention name)</span>
            </label>
            <div className="flex items-center gap-0">
              <span className="px-3 py-2 bg-slate-100 border border-r-0 border-slate-200 rounded-l-lg text-slate-500 text-sm">
                @
              </span>
              <input
                type="text"
                value={handle}
                onChange={(e) => setHandle(e.target.value.toLowerCase().replace(/[^a-z0-9-_]/g, ''))}
                placeholder="engineering-team"
                className="flex-1 px-3 py-2 border border-slate-200 rounded-r-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What is this group for?"
              rows={2}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 resize-none"
            />
          </div>

          <div className="border-t border-slate-100 pt-4">
            <label className="flex items-center gap-3 cursor-pointer group">
              <div className="relative">
                <input
                  type="checkbox"
                  checked={createChannel}
                  onChange={(e) => setCreateChannel(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-10 h-6 bg-slate-200 rounded-full peer-checked:bg-indigo-500 transition-colors" />
                <div className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform peer-checked:translate-x-4" />
              </div>
              <div>
                <span className="text-sm font-medium text-slate-700">Also create a channel</span>
                <p className="text-xs text-slate-400">Create a Slack channel and invite all members</p>
              </div>
            </label>

            {createChannel && (
              <div className="mt-3 ml-[52px]">
                <div className="flex items-center gap-0">
                  <span className="px-3 py-2 bg-slate-100 border border-r-0 border-slate-200 rounded-l-lg text-slate-500 text-sm">
                    #
                  </span>
                  <input
                    type="text"
                    value={channelName}
                    onChange={(e) => setChannelName(e.target.value.toLowerCase().replace(/[^a-z0-9-_]/g, ''))}
                    placeholder={handle || 'channel-name'}
                    className="flex-1 px-3 py-2 border border-slate-200 rounded-r-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400"
                  />
                </div>
              </div>
            )}
          </div>

          {result && (
            <div
              className={`flex items-center gap-2 p-3 rounded-xl text-sm ${
                result.success
                  ? 'bg-emerald-50 border border-emerald-200 text-emerald-700'
                  : 'bg-red-50 border border-red-200 text-red-700'
              }`}
            >
              {result.success ? (
                <Check className="w-4 h-4 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0" />
              )}
              {result.message}
            </div>
          )}
        </div>

        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!name.trim() || !handle.trim() || slackUsers.length === 0 || isSubmitting || result?.success}
            className="flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white
              text-sm font-semibold rounded-lg shadow-lg shadow-indigo-200 hover:shadow-xl hover:shadow-indigo-300
              disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none transition-all active:scale-95"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Creating...
              </>
            ) : result?.success ? (
              <>
                <Check className="w-4 h-4" />
                Created!
              </>
            ) : (
              <>
                <Hash className="w-4 h-4" />
                Create Group
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
