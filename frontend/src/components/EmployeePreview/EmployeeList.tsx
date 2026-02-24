import { User, MapPin, Briefcase, Hash, AlertCircle, Loader2, Users } from 'lucide-react';
import { MatchedEmployee } from '../../types';
import { Badge } from '../common/Badge';

interface EmployeeListProps {
  employees: MatchedEmployee[];
  totalEmployees: number;
  isLoading: boolean;
  error?: string;
}

export function EmployeeList({ employees, totalEmployees, isLoading, error }: EmployeeListProps) {
  return (
    <div className="h-full flex flex-col">
      <div className="px-4 pt-4 pb-3 flex items-center justify-between">
        <div>
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
            Matching Employees
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {employees.length} of {totalEmployees} employees
          </p>
        </div>
        {employees.length > 0 && (
          <Badge variant="success">
            {Math.round((employees.length / Math.max(totalEmployees, 1)) * 100)}% match
          </Badge>
        )}
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-4">
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="w-8 h-8 text-indigo-500 animate-spin mb-3" />
            <p className="text-sm text-slate-500">Matching employees...</p>
          </div>
        )}

        {error && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {error}
          </div>
        )}

        {!isLoading && !error && employees.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mb-3">
              <Users className="w-6 h-6 text-slate-400" />
            </div>
            <p className="text-sm font-medium text-slate-600 mb-1">No matches yet</p>
            <p className="text-xs text-slate-400 max-w-[200px]">
              Add criteria to the builder to find matching employees
            </p>
          </div>
        )}

        {!isLoading && !error && employees.length > 0 && (
          <div className="space-y-2">
            {employees.map((emp) => (
              <div
                key={emp.id}
                className="flex items-center gap-3 p-3 rounded-xl border border-slate-100 bg-white hover:border-indigo-200 hover:shadow-sm transition-all"
              >
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center shrink-0">
                  <span className="text-white text-sm font-bold">
                    {emp.displayName.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                  </span>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-slate-800 truncate">
                      {emp.displayName}
                    </span>
                    {emp.slackId && (
                      <span className="text-[10px] text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded font-medium">
                        Slack
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-0.5">
                    {emp.title && (
                      <span className="flex items-center gap-1 text-xs text-slate-500">
                        <Briefcase className="w-3 h-3" />
                        {emp.title}
                      </span>
                    )}
                    {emp.department && (
                      <span className="flex items-center gap-1 text-xs text-slate-500">
                        <Hash className="w-3 h-3" />
                        {emp.department}
                      </span>
                    )}
                    {emp.site && (
                      <span className="flex items-center gap-1 text-xs text-slate-500">
                        <MapPin className="w-3 h-3" />
                        {emp.site}
                      </span>
                    )}
                  </div>
                </div>

                {!emp.slackId && (
                  <span className="text-[10px] text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded font-medium shrink-0">
                    No Slack
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
