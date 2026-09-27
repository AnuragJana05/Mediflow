import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { Bed, BedStatus, Patient } from '../types';
import { useAuth } from '../context/AuthContext';
import { StatusBadge } from '../components/common/StatusBadge';
import {
  BedDouble,
  Search,
  Filter,
  Plus,
  RefreshCw,
  CheckCircle2,
  Wrench,
  Sparkles,
  ArrowRightLeft,
  X,
  Wind,
  Activity,
  Shield,
  Layers,
  FileText
} from 'lucide-react';

interface BedManagementPageProps {
  onNavigate: (page: string, params?: any) => void;
}

export const BedManagementPage: React.FC<BedManagementPageProps> = ({ onNavigate }) => {
  const { user, canManageBeds, canChangeBedStatus } = useAuth();
  const [beds, setBeds] = useState<Bed[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDept, setSelectedDept] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [filterVentilator, setFilterVentilator] = useState(false);
  const [filterIsolation, setFilterIsolation] = useState(false);

  // Status Change Modal State
  const [statusModalBed, setStatusModalBed] = useState<Bed | null>(null);
  const [newStatus, setNewStatus] = useState<BedStatus>('Available');
  const [statusNotes, setStatusNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Add Bed Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [newBedId, setNewBedId] = useState('');
  const [newBedDept, setNewBedDept] = useState(1);
  const [newBedWard, setNewBedWard] = useState(1);
  const [newBedType, setNewBedType] = useState('Standard');
  const [newBedFloor, setNewBedFloor] = useState('1st Floor');
  const [newBedRoom, setNewBedRoom] = useState('Room 105');
  const [newBedOxygen, setNewBedOxygen] = useState(true);
  const [newBedVentilator, setNewBedVentilator] = useState(false);
  const [newBedMonitor, setNewBedMonitor] = useState(false);
  const [newBedIsolation, setNewBedIsolation] = useState(false);

  const fetchBeds = async () => {
    setIsLoading(true);
    try {
      const data = await api.getBeds({
        department: selectedDept !== 'ALL' ? selectedDept : undefined,
        status: selectedStatus !== 'ALL' ? selectedStatus : undefined,
        has_ventilator: filterVentilator ? true : undefined,
        has_isolation: filterIsolation ? true : undefined,
      });
      setBeds(data);
    } catch (err) {
      console.error('Failed to load beds:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBeds();
  }, [selectedDept, selectedStatus, filterVentilator, filterIsolation]);

  const handleStatusSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!statusModalBed) return;
    setIsSubmitting(true);
    try {
      await api.updateBedStatus(statusModalBed.id, newStatus, statusNotes);
      setStatusModalBed(null);
      setStatusNotes('');
      await fetchBeds();
    } catch (err: any) {
      alert(`Error updating bed status: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReleaseBed = async (bedId: string) => {
    if (!confirm(`Release Bed ${bedId} from its assigned patient and mark for cleaning?`)) return;
    try {
      await api.releaseBed(bedId, 'Cleaning');
      await fetchBeds();
    } catch (err: any) {
      alert(`Error releasing bed: ${err.message}`);
    }
  };

  const handleQuickStatusChange = async (bedId: string, status: BedStatus) => {
    try {
      await api.updateBedStatus(bedId, status, `Quick update by ${user?.name}`);
      await fetchBeds();
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    }
  };

  const handleAddBedSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await api.createBed({
        id: newBedId,
        department_id: Number(newBedDept),
        ward_id: Number(newBedWard),
        bed_type: newBedType as any,
        floor: newBedFloor,
        room: newBedRoom,
        has_oxygen: newBedOxygen,
        has_ventilator: newBedVentilator,
        has_cardiac_monitor: newBedMonitor,
        has_isolation: newBedIsolation,
        status: 'Available',
      });
      setShowAddModal(false);
      setNewBedId('');
      await fetchBeds();
    } catch (err: any) {
      alert(`Failed to add bed: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredBeds = beds.filter((b) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      b.id.toLowerCase().includes(term) ||
      b.room.toLowerCase().includes(term) ||
      (b.ward_name && b.ward_name.toLowerCase().includes(term)) ||
      (b.current_patient_name && b.current_patient_name.toLowerCase().includes(term))
    );
  });

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-3">
            <BedDouble className="w-6 h-6 text-cyan-400" />
            <span>Hospital Bed Inventory & Management</span>
          </h1>
          <p className="text-slate-400 text-xs mt-1">
            Real-time equipment capabilities, occupancy states, sanitization queue, and operational control.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {canManageBeds && (
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-medium text-xs shadow-lg shadow-cyan-600/20 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Add New Bed</span>
            </button>
          )}

          <button
            onClick={() => onNavigate('bed-map')}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-medium transition-all"
          >
            <Layers className="w-4 h-4 text-cyan-400" />
            <span>Visual Bed Map</span>
          </button>

          <button
            onClick={fetchBeds}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-all"
            title="Refresh Beds"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="glass-panel p-4 rounded-2xl flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-3 flex-1 min-w-[280px]">
          {/* Search */}
          <div className="relative flex-1 min-w-[180px] max-w-xs">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search Bed ID, Room, Patient..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-900 border border-slate-700/80 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500 text-xs"
            />
          </div>

          {/* Department Filter */}
          <select
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-700/80 text-slate-300 focus:outline-none focus:border-cyan-500"
          >
            <option value="ALL">All Departments</option>
            <option value="ICU">Intensive Care (ICU)</option>
            <option value="ED">Emergency Medicine (ED)</option>
            <option value="CCU">Coronary Care (CCU)</option>
            <option value="GW">General Ward (GW)</option>
            <option value="ISO">Isolation Suites (ISO)</option>
            <option value="SURG">Surgical Recovery (SURG)</option>
          </select>

          {/* Status Filter */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-700/80 text-slate-300 focus:outline-none focus:border-cyan-500"
          >
            <option value="ALL">All Statuses</option>
            <option value="Available">Available Only</option>
            <option value="Occupied">Occupied</option>
            <option value="Cleaning">Cleaning / Sanitizing</option>
            <option value="Reserved">Reserved</option>
            <option value="Maintenance">Maintenance</option>
          </select>
        </div>

        {/* Equipment Checkboxes */}
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-1.5 cursor-pointer text-slate-300 select-none">
            <input
              type="checkbox"
              checked={filterVentilator}
              onChange={(e) => setFilterVentilator(e.target.checked)}
              className="rounded bg-slate-900 border-slate-700 text-cyan-500 focus:ring-0"
            />
            <Wind className="w-3.5 h-3.5 text-cyan-400" />
            <span>Ventilator Equipped</span>
          </label>

          <label className="flex items-center gap-1.5 cursor-pointer text-slate-300 select-none">
            <input
              type="checkbox"
              checked={filterIsolation}
              onChange={(e) => setFilterIsolation(e.target.checked)}
              className="rounded bg-slate-900 border-slate-700 text-cyan-500 focus:ring-0"
            />
            <Shield className="w-3.5 h-3.5 text-purple-400" />
            <span>Isolation Compliant</span>
          </label>
        </div>
      </div>

      {/* Bed Count Summary Ribbon */}
      <div className="flex items-center justify-between text-xs text-slate-400 px-2 font-mono">
        <span>Showing {filteredBeds.length} of {beds.length} Total Hospital Beds</span>
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-400" /> Available: {beds.filter(b => b.status === 'Available').length}</span>
          <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-rose-400" /> Occupied: {beds.filter(b => b.status === 'Occupied').length}</span>
          <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-amber-400" /> Cleaning: {beds.filter(b => b.status === 'Cleaning').length}</span>
          <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-slate-400" /> Maintenance: {beds.filter(b => b.status === 'Maintenance').length}</span>
        </div>
      </div>

      {/* Bed Inventory Table */}
      <div className="glass-panel rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/90 text-slate-400 uppercase font-mono text-[10px] tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-3.5 px-4">Bed ID / Room</th>
                <th className="py-3.5 px-4">Department & Ward</th>
                <th className="py-3.5 px-4">Type</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Equipment & Capabilities</th>
                <th className="py-3.5 px-4">Current Patient</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredBeds.map((bed) => {
                return (
                  <tr key={bed.id} className="hover:bg-slate-800/40 transition-colors">
                    {/* ID & Room */}
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-100 font-mono text-sm">{bed.id}</div>
                      <div className="text-[11px] text-slate-400">{bed.room} • {bed.floor}</div>
                    </td>

                    {/* Department & Ward */}
                    <td className="py-3 px-4">
                      <div className="font-medium text-slate-200">{bed.department_name}</div>
                      <div className="text-[11px] text-slate-400">{bed.ward_name}</div>
                    </td>

                    {/* Bed Type */}
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono text-[11px] border border-slate-700">
                        {bed.bed_type}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="py-3 px-4">
                      <StatusBadge status={bed.status} size="sm" />
                    </td>

                    {/* Equipment Capabilities Icons */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {bed.has_oxygen && (
                          <span className="px-1.5 py-0.5 rounded bg-sky-950/80 text-sky-300 border border-sky-800/60 text-[10px] font-mono flex items-center gap-1" title="Oxygen Supply Port">
                            O₂
                          </span>
                        )}
                        {bed.has_ventilator && (
                          <span className="px-1.5 py-0.5 rounded bg-indigo-950/80 text-indigo-300 border border-indigo-800/60 text-[10px] font-mono flex items-center gap-1" title="Mechanical Ventilator">
                            <Wind className="w-3 h-3" /> Vent
                          </span>
                        )}
                        {bed.has_cardiac_monitor && (
                          <span className="px-1.5 py-0.5 rounded bg-rose-950/80 text-rose-300 border border-rose-800/60 text-[10px] font-mono flex items-center gap-1" title="Cardiac Telemetry Monitor">
                            <Activity className="w-3 h-3" /> ECG
                          </span>
                        )}
                        {bed.has_isolation && (
                          <span className="px-1.5 py-0.5 rounded bg-purple-950/80 text-purple-300 border border-purple-800/60 text-[10px] font-mono flex items-center gap-1" title="Negative Pressure Isolation Suite">
                            <Shield className="w-3 h-3" /> Iso
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Current Patient */}
                    <td className="py-3 px-4">
                      {bed.current_patient_id ? (
                        <div>
                          <div className="font-semibold text-slate-200 hover:text-cyan-400 cursor-pointer" onClick={() => onNavigate('patients')}>
                            {bed.current_patient_name || bed.current_patient_id}
                          </div>
                          <span className="text-[10px] font-mono text-slate-400">{bed.current_patient_id}</span>
                        </div>
                      ) : (
                        <span className="text-slate-500 italic text-[11px]">— Unassigned —</span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {bed.status === 'Occupied' && (
                          <button
                            onClick={() => handleReleaseBed(bed.id)}
                            className="px-2 py-1 rounded-lg bg-amber-950/70 border border-amber-600/50 text-amber-300 hover:bg-amber-900/50 transition-colors text-[11px] font-medium"
                            title="Discharge / Release Bed to Cleaning"
                          >
                            Release
                          </button>
                        )}

                        {bed.status === 'Cleaning' && (
                          <button
                            onClick={() => handleQuickStatusChange(bed.id, 'Available')}
                            className="px-2 py-1 rounded-lg bg-emerald-950/70 border border-emerald-600/50 text-emerald-300 hover:bg-emerald-900/50 transition-colors text-[11px] font-medium flex items-center gap-1"
                            title="Mark Cleaning Complete"
                          >
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Mark Ready</span>
                          </button>
                        )}

                        {bed.status === 'Available' && (
                          <button
                            onClick={() => handleQuickStatusChange(bed.id, 'Cleaning')}
                            className="px-2 py-1 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 hover:bg-slate-700 text-[11px]"
                            title="Mark for Sanitizing"
                          >
                            Clean
                          </button>
                        )}

                        {canChangeBedStatus && (
                          <button
                            onClick={() => {
                              setStatusModalBed(bed);
                              setNewStatus(bed.status);
                            }}
                            className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-[11px]"
                            title="Change Status & Notes"
                          >
                            Edit
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Change Status */}
      {statusModalBed && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
          <div className="glass-panel p-6 rounded-2xl max-w-md w-full border border-slate-700 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="font-bold text-slate-100 text-base">Update Status for {statusModalBed.id}</h3>
                <p className="text-xs text-slate-400">{statusModalBed.room} • {statusModalBed.department_name}</p>
              </div>
              <button onClick={() => setStatusModalBed(null)} className="text-slate-400 hover:text-slate-200">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleStatusSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1.5">Operational Status</label>
                <div className="grid grid-cols-2 gap-2">
                  {(['Available', 'Occupied', 'Cleaning', 'Reserved', 'Maintenance'] as BedStatus[]).map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setNewStatus(st)}
                      className={`p-2 rounded-xl border text-center transition-all ${
                        newStatus === st
                          ? 'border-cyan-500 bg-cyan-950/60 text-cyan-300 font-bold'
                          : 'border-slate-800 bg-slate-900 text-slate-400 hover:bg-slate-800'
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Clinical / Engineering Notes</label>
                <textarea
                  rows={3}
                  value={statusNotes}
                  onChange={(e) => setStatusNotes(e.target.value)}
                  placeholder="e.g. Completed ultraviolet disinfection, ventilator pressure sensors verified"
                  className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-200 text-xs focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setStatusModalBed(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-semibold shadow-md shadow-cyan-600/30"
                >
                  {isSubmitting ? 'Saving...' : 'Confirm Status Update'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Add Bed */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
          <div className="glass-panel p-6 rounded-2xl max-w-lg w-full border border-slate-700 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="font-bold text-slate-100 text-base">Register New Hospital Bed</h3>
                <p className="text-xs text-slate-400">Configure bed capabilities, floor assignment, and equipment</p>
              </div>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-200">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddBedSubmit} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Bed Identifier *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. ICU-13, GW-121"
                    value={newBedId}
                    onChange={(e) => setNewBedId(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-200 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Department</label>
                  <select
                    value={newBedDept}
                    onChange={(e) => setNewBedDept(Number(e.target.value))}
                    className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-200"
                  >
                    <option value={1}>Intensive Care Unit (ICU)</option>
                    <option value={2}>Emergency Medicine (ED)</option>
                    <option value={3}>Coronary Care Unit (CCU)</option>
                    <option value={4}>General Medical Ward (GW)</option>
                    <option value={5}>Isolation Suites (ISO)</option>
                    <option value={6}>Surgical Recovery (SURG)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Floor</label>
                  <input
                    type="text"
                    value={newBedFloor}
                    onChange={(e) => setNewBedFloor(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-200"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Room Designation</label>
                  <input
                    type="text"
                    value={newBedRoom}
                    onChange={(e) => setNewBedRoom(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-200"
                  />
                </div>
              </div>

              {/* Equipment checkboxes */}
              <div>
                <label className="block text-slate-300 font-medium mb-2">Equipped Medical Capabilities</label>
                <div className="grid grid-cols-2 gap-2 p-3 bg-slate-900 rounded-xl border border-slate-800">
                  <label className="flex items-center gap-2 cursor-pointer text-slate-200">
                    <input
                      type="checkbox"
                      checked={newBedOxygen}
                      onChange={(e) => setNewBedOxygen(e.target.checked)}
                      className="rounded bg-slate-800 border-slate-700 text-cyan-500"
                    />
                    <span>Oxygen Port Supply</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer text-slate-200">
                    <input
                      type="checkbox"
                      checked={newBedVentilator}
                      onChange={(e) => setNewBedVentilator(e.target.checked)}
                      className="rounded bg-slate-800 border-slate-700 text-cyan-500"
                    />
                    <span>Mechanical Ventilator</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer text-slate-200">
                    <input
                      type="checkbox"
                      checked={newBedMonitor}
                      onChange={(e) => setNewBedMonitor(e.target.checked)}
                      className="rounded bg-slate-800 border-slate-700 text-cyan-500"
                    />
                    <span>Cardiac Monitor / ECG</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer text-slate-200">
                    <input
                      type="checkbox"
                      checked={newBedIsolation}
                      onChange={(e) => setNewBedIsolation(e.target.checked)}
                      className="rounded bg-slate-800 border-slate-700 text-cyan-500"
                    />
                    <span>Negative Pressure Isolation</span>
                  </label>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-semibold"
                >
                  {isSubmitting ? 'Creating...' : 'Register Bed'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
