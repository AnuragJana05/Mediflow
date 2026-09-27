import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { AuditLog } from '../types';
import { DisclaimerBanner } from '../components/common/DisclaimerBanner';
import {
  ClipboardList,
  Search,
  Filter,
  RefreshCw,
  User,
  Shield,
  Clock,
  ArrowRight
} from 'lucide-react';

export const AuditLogsPage: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [entityFilter, setEntityFilter] = useState('ALL');
  const [roleFilter, setRoleFilter] = useState('ALL');

  const fetchLogs = async () => {
    setIsLoading(true);
    try {
      const data = await api.getAuditLogs({
        entity: entityFilter !== 'ALL' ? entityFilter : undefined,
        user_role: roleFilter !== 'ALL' ? roleFilter : undefined,
        search: searchTerm || undefined,
        limit: 100
      });
      setLogs(data);
    } catch (err) {
      console.error('Failed to load audit logs:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [entityFilter, roleFilter, searchTerm]);

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <DisclaimerBanner compact />

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-3">
            <ClipboardList className="w-6 h-6 text-cyan-400" />
            <span>Hospital Operations Immutable Audit Trail</span>
          </h1>
          <p className="text-slate-400 text-xs mt-1">
            Complete traceability of clinical priority overrides, recommendation approvals, bed status transitions, and admissions.
          </p>
        </div>

        <button
          onClick={fetchLogs}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-medium self-start md:self-auto"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh Trail</span>
        </button>
      </div>

      {/* Filter and Search Ribbon */}
      <div className="glass-panel p-4 rounded-2xl flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-3 flex-1 min-w-[280px]">
          {/* Search */}
          <div className="relative flex-1 min-w-[180px] max-w-xs">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by Action, Staff, Entity ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500 text-xs"
            />
          </div>

          {/* Entity Filter */}
          <select
            value={entityFilter}
            onChange={(e) => setEntityFilter(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-200 text-xs"
          >
            <option value="ALL">All Entities</option>
            <option value="Patient">Patient</option>
            <option value="Bed">Bed</option>
            <option value="Allocation">Allocation</option>
            <option value="Simulation">Simulation</option>
          </select>

          {/* Role Filter */}
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-200 text-xs"
          >
            <option value="ALL">All Staff Roles</option>
            <option value="admin">Administrator</option>
            <option value="doctor">Doctor</option>
            <option value="nurse">Nurse</option>
            <option value="system">System Core</option>
          </select>
        </div>

        <span className="text-slate-400 font-mono text-[11px]">
          {logs.length} Audit Events Logged
        </span>
      </div>

      {/* Audit Log Table */}
      <div className="glass-panel rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/90 text-slate-400 uppercase font-mono text-[10px] tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-3.5 px-4">Timestamp</th>
                <th className="py-3.5 px-4">Authorizing Staff</th>
                <th className="py-3.5 px-4">Action</th>
                <th className="py-3.5 px-4">Entity & Target</th>
                <th className="py-3.5 px-4">State Transition</th>
                <th className="py-3.5 px-4">Operational Details & Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-800/40 transition-colors">
                  {/* Timestamp */}
                  <td className="py-3 px-4 text-slate-400 text-[11px] whitespace-nowrap">
                    {new Date(log.timestamp).toLocaleString()}
                  </td>

                  {/* Staff & Role */}
                  <td className="py-3 px-4 font-sans">
                    <div className="font-semibold text-slate-200">{log.user_name}</div>
                    <span className="text-[10px] font-mono capitalize px-1.5 py-0.2 rounded bg-slate-800 text-cyan-400 border border-slate-700">
                      {log.user_role}
                    </span>
                  </td>

                  {/* Action */}
                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 rounded bg-cyan-950/80 text-cyan-300 border border-cyan-800/60 text-[11px] font-bold">
                      {log.action}
                    </span>
                  </td>

                  {/* Entity & ID */}
                  <td className="py-3 px-4 text-slate-300">
                    <span className="text-slate-400 font-sans">{log.entity}: </span>
                    <strong className="text-slate-100">{log.entity_id}</strong>
                  </td>

                  {/* State Transition */}
                  <td className="py-3 px-4">
                    {log.old_value || log.new_value ? (
                      <div className="flex items-center gap-1.5 text-[11px]">
                        <span className="text-slate-400 line-through">{log.old_value || 'None'}</span>
                        <ArrowRight className="w-3 h-3 text-slate-500" />
                        <span className="text-emerald-400 font-bold">{log.new_value || 'None'}</span>
                      </div>
                    ) : (
                      <span className="text-slate-500">—</span>
                    )}
                  </td>

                  {/* Operational Details */}
                  <td className="py-3 px-4 font-sans text-slate-300 text-[11px] max-w-sm">
                    {log.details || '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
