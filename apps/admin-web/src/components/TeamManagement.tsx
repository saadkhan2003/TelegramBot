'use client';

import React, { useEffect, useState } from 'react';
import {
  Users,
  UserPlus,
  Shield,
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Lock,
  Mail,
  User,
  Trash2,
  Edit2,
  X,
  Check,
  RefreshCw,
  KeyRound,
  Eye,
  EyeOff,
} from 'lucide-react';
import { fetchApi } from '../lib/api';
import { SearchableSelect } from './SearchableSelect';
import { Modal } from './Modal';
import { useAuth } from '../context/AuthContext';
import { useStore } from '../context/StoreContext';

export default function TeamManagement() {
  const { user: currentUser } = useAuth();
  const { activeStore } = useStore();
  const [members, setMembers] = useState<any[]>([]);
  const [roles, setRoles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Add Member Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRoleSlug, setNewRoleSlug] = useState('ADMIN');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [creating, setCreating] = useState(false);

  // Edit / Password Reset Modal State
  const [editingMember, setEditingMember] = useState<any | null>(null);
  const [editRoleSlug, setEditRoleSlug] = useState('');
  const [editStatus, setEditStatus] = useState<'ACTIVE' | 'SUSPENDED'>('ACTIVE');
  const [editPassword, setEditPassword] = useState('');
  const [updating, setUpdating] = useState(false);

  // Toast
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const [membersData, rolesData] = await Promise.all([
        fetchApi('/admin/team'),
        fetchApi('/admin/team/roles').catch(() => []),
      ]);
      setMembers(membersData || []);
      setRoles(rolesData || []);
    } catch (err: any) {
      showToast(err.message || 'Failed to load team members', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [activeStore?.id]);

  const handleCreateMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail.trim() || !newPassword) {
      showToast('Email and password are required', 'error');
      return;
    }
    setCreating(true);
    try {
      await fetchApi('/admin/team', {
        method: 'POST',
        body: JSON.stringify({
          name: newName.trim(),
          email: newEmail.trim(),
          password: newPassword,
          roleSlug: newRoleSlug,
        }),
      });
      showToast('✓ Team member created successfully!');
      setShowAddModal(false);
      setNewName('');
      setNewEmail('');
      setNewPassword('');
      setNewRoleSlug('ADMIN');
      loadData();
    } catch (err: any) {
      showToast(err.message || 'Failed to create member', 'error');
    } finally {
      setCreating(false);
    }
  };

  const handleUpdateMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMember) return;
    setUpdating(true);
    try {
      await fetchApi(`/admin/team/${editingMember.id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          roleSlug: editRoleSlug,
          status: editStatus,
          password: editPassword.trim() ? editPassword.trim() : undefined,
        }),
      });
      showToast('✓ Team member updated successfully!');
      setEditingMember(null);
      setEditPassword('');
      loadData();
    } catch (err: any) {
      showToast(err.message || 'Failed to update member', 'error');
    } finally {
      setUpdating(false);
    }
  };

  const handleDeleteMember = async (member: any) => {
    if (!confirm(`Are you sure you want to remove ${member.name} (${member.email}) from the team?`)) {
      return;
    }
    try {
      await fetchApi(`/admin/team/${member.id}`, {
        method: 'DELETE',
      });
      showToast(`✓ Removed ${member.name} from team`);
      loadData();
    } catch (err: any) {
      showToast(err.message || 'Failed to remove member', 'error');
    }
  };

  const getRoleBadge = (slug: string) => {
    switch (slug) {
      case 'OWNER':
        return 'bg-[#fdf3d6] text-[#8a3707] border-[#f2ca74]';
      case 'ADMIN':
        return 'bg-[#eff6fc] text-[#0078d4] border-[#c7e0f4]';
      case 'MANAGER':
        return 'bg-[#dff6dd] text-[#107c10] border-[#a8e5a3]';
      case 'SUPPORT_AGENT':
        return 'bg-[#f3f2f1] text-[#605e5c] border-[#edebe9]';
      default:
        return 'bg-[#eff6fc] text-[#0078d4] border-[#c7e0f4]';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white p-5 rounded-[4px] border border-[#edebe9] shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-[#201f1e]">Team Members & Access Control</h3>
            <span className="px-2 py-0.5 text-[10px] font-bold bg-[#eff6fc] text-[#0078d4] border border-[#c7e0f4] rounded-[2px]">
              {members.length} Active Staff
            </span>
          </div>
          <p className="text-xs text-[#605e5c] mt-1">
            Create logins for your friends and co-admins. Each staff member logs in with their own email, password, and permissions.
          </p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={loadData}
            disabled={loading}
            className="p-2 rounded-[4px] border border-[#d2d0ce] bg-white hover:bg-[#f3f2f1] text-[#605e5c] transition"
            title="Refresh list"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-[4px] bg-[#0078d4] hover:bg-[#106ebe] text-white font-medium text-xs shadow-xs transition"
          >
            <UserPlus className="h-4 w-4" />
            <span>Add Team Member</span>
          </button>
        </div>
      </div>

      {/* Team Members Table */}
      <div className="bg-white border border-[#edebe9] rounded-[4px] shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs min-w-[700px]">
          <thead className="bg-[#faf9f8] text-[#605e5c] uppercase tracking-wider border-b border-[#edebe9] text-[11px]">
            <tr>
              <th className="px-6 py-3 font-semibold">Staff Member</th>
              <th className="px-6 py-3 font-semibold">Assigned Role</th>
              <th className="px-6 py-3 font-semibold">Status</th>
              <th className="px-6 py-3 font-semibold">Active Sessions</th>
              <th className="px-6 py-3 font-semibold">Joined Date</th>
              <th className="px-6 py-3 font-semibold text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#edebe9] text-[#201f1e]">
            {loading ? (
              <tr>
                <td colSpan={6} className="px-6 py-10 text-center text-[#605e5c]">
                  <Loader2 className="h-5 w-5 animate-spin mx-auto text-[#0078d4] mb-2" />
                  <span>Loading team accounts...</span>
                </td>
              </tr>
            ) : members.length > 0 ? (
              members.map((member) => {
                const primaryRole = member.roles?.[0]?.slug || 'ADMIN';
                const roleName = member.roles?.[0]?.name || primaryRole;
                const isOwner = primaryRole === 'OWNER';
                const isSelf = currentUser?.id === member.id;

                return (
                  <tr key={member.id} className="hover:bg-[#faf9f8] transition">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-[4px] bg-[#051329] border border-[#0078d4]/30 flex items-center justify-center text-white font-bold text-xs shrink-0">
                          {member.name ? member.name.charAt(0).toUpperCase() : member.email.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-[#201f1e] text-xs flex items-center gap-1.5">
                            <span>{member.name}</span>
                            {isSelf && (
                              <span className="text-[9px] px-1.5 py-0.2 bg-[#f3f2f1] text-[#605e5c] border border-[#edebe9] rounded-[2px]">
                                You
                              </span>
                            )}
                          </p>
                          <p className="text-[11px] text-[#605e5c] font-mono mt-0.5">{member.email}</p>
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-[2px] text-[10px] font-bold border uppercase tracking-wider ${getRoleBadge(
                          primaryRole,
                        )}`}
                      >
                        <Shield className="h-3 w-3" />
                        {roleName}
                      </span>
                    </td>

                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex px-2 py-0.5 rounded-[2px] text-[10px] font-semibold border ${
                          member.status === 'ACTIVE'
                            ? 'bg-[#dff6dd] text-[#107c10] border-[#a8e5a3]'
                            : 'bg-[#fde7e9] text-[#d13438] border-[#f9a8ad]'
                        }`}
                      >
                        {member.status}
                      </span>
                    </td>

                    <td className="px-6 py-4 text-[#605e5c] font-mono text-[11px]">
                      {member.sessionCount || 0} device(s)
                    </td>

                    <td className="px-6 py-4 text-[#605e5c] text-[11px]">
                      {member.createdAt ? new Date(member.createdAt).toLocaleDateString() : '—'}
                    </td>

                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => {
                            setEditingMember(member);
                            setEditRoleSlug(primaryRole);
                            setEditStatus(member.status);
                            setEditPassword('');
                          }}
                          className="px-2 py-1 rounded-[4px] border border-[#d2d0ce] bg-white hover:bg-[#f3f2f1] text-[#0078d4] text-[11px] font-medium transition flex items-center gap-1 shadow-2xs"
                        >
                          <Edit2 className="h-3 w-3" />
                          <span>Edit</span>
                        </button>

                        {!isOwner && !isSelf && (
                          <button
                            onClick={() => handleDeleteMember(member)}
                            className="p-1 rounded-[4px] border border-[#d2d0ce] bg-white hover:bg-[#fde7e9] text-[#d13438] transition shadow-2xs"
                            title="Remove member"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-[#605e5c]">
                  No team members found. Click "Add Team Member" above to create an account.
                </td>
              </tr>
            )}
          </tbody>
        </table>
        </div>
      </div>

      {/* Add Team Member Modal */}
      <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)}>
        <div className="bg-white border border-[#edebe9] rounded-[6px] p-6 max-w-md w-full space-y-4 shadow-xl animate-in zoom-in-95">
            <div className="border-b border-[#edebe9] pb-3 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-[#201f1e]">Add New Team Member</h3>
                <p className="text-xs text-[#605e5c] mt-0.5">
                  Create an independent login for your friend or staff member.
                </p>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1 rounded-[4px] hover:bg-[#f3f2f1] text-[#605e5c]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleCreateMember} className="space-y-3.5 text-xs">
              <div>
                <label className="text-[#201f1e] block mb-1 font-semibold">Full Name</label>
                <div className="relative">
                  <User className="h-4 w-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-[#8a8886]" />
                  <input
                    type="text"
                    required
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="e.g. Ali Raza"
                    className="w-full bg-[#faf9f8] border border-[#d2d0ce] rounded-[4px] pl-8 pr-2.5 py-2 text-xs text-[#201f1e] focus:bg-white focus:outline-none focus:border-[#0078d4]"
                  />
                </div>
              </div>

              <div>
                <label className="text-[#201f1e] block mb-1 font-semibold">Email Address (Login ID)</label>
                <div className="relative">
                  <Mail className="h-4 w-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-[#8a8886]" />
                  <input
                    type="email"
                    required
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder="colleague@yourdomain.com"
                    className="w-full bg-[#faf9f8] border border-[#d2d0ce] rounded-[4px] pl-8 pr-2.5 py-2 text-xs text-[#201f1e] focus:bg-white focus:outline-none focus:border-[#0078d4]"
                  />
                </div>
              </div>

              <div>
                <label className="text-[#201f1e] block mb-1 font-semibold">Temporary Password</label>
                <div className="relative">
                  <Lock className="h-4 w-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-[#8a8886]" />
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="At least 6 characters"
                    className="w-full bg-[#faf9f8] border border-[#d2d0ce] rounded-[4px] pl-8 pr-9 py-2 text-xs text-[#201f1e] focus:bg-white focus:outline-none focus:border-[#0078d4] font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#8a8886] hover:text-[#201f1e]"
                  >
                    {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="text-[#201f1e] block mb-1 font-semibold">Assign Role & Permissions</label>
                <SearchableSelect
                  value={newRoleSlug}
                  onChange={setNewRoleSlug}
                  options={[
                    { value: 'ADMIN', label: 'Administrator', sublabel: 'Full control of products, orders, inventory, settings', badge: 'Admin' },
                    { value: 'MANAGER', label: 'Store Manager', sublabel: 'Manage catalog, inventory, and fulfillment', badge: 'Manager' },
                    { value: 'SUPPORT_AGENT', label: 'Support Agent', sublabel: 'View tickets, warranty claims, and orders', badge: 'Support' },
                  ]}
                  searchable={false}
                  className="w-full py-2"
                  menuClassName="w-full"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#edebe9]">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3 py-1.5 rounded-[4px] border border-[#d2d0ce] hover:bg-[#f3f2f1] text-[#605e5c] font-medium transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="px-4 py-1.5 rounded-[4px] bg-[#0078d4] hover:bg-[#106ebe] text-white font-semibold shadow-xs transition flex items-center gap-1.5"
                >
                  {creating && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  <span>Create Account</span>
                </button>
              </div>
            </form>
          </div>
      </Modal>

      {/* Edit Team Member Modal */}
      <Modal isOpen={!!editingMember} onClose={() => setEditingMember(null)}>
        {editingMember && (
          <div className="bg-white border border-[#edebe9] rounded-[6px] p-6 max-w-md w-full space-y-4 shadow-xl animate-in zoom-in-95">
            <div className="border-b border-[#edebe9] pb-3 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-[#201f1e]">Edit Staff Access</h3>
                <p className="text-xs text-[#605e5c] mt-0.5 truncate max-w-[280px]">
                  {editingMember.name} ({editingMember.email})
                </p>
              </div>
              <button
                onClick={() => setEditingMember(null)}
                className="p-1 rounded-[4px] hover:bg-[#f3f2f1] text-[#605e5c]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleUpdateMember} className="space-y-3.5 text-xs">
              <div>
                <label className="text-[#201f1e] block mb-1 font-semibold">Role</label>
                <SearchableSelect
                  value={editRoleSlug}
                  onChange={setEditRoleSlug}
                  options={[
                    { value: 'OWNER', label: 'Owner', sublabel: 'Highest access & system root', badge: 'Owner' },
                    { value: 'ADMIN', label: 'Administrator', sublabel: 'Full operational control', badge: 'Admin' },
                    { value: 'MANAGER', label: 'Store Manager', sublabel: 'Catalog & Fulfillment', badge: 'Manager' },
                    { value: 'SUPPORT_AGENT', label: 'Support Agent', sublabel: 'Tickets & Orders', badge: 'Support' },
                  ]}
                  searchable={false}
                  className="w-full py-2"
                  menuClassName="w-full"
                />
              </div>

              <div>
                <label className="text-[#201f1e] block mb-1 font-semibold">Account Status</label>
                <SearchableSelect
                  value={editStatus}
                  onChange={(val) => setEditStatus(val as any)}
                  options={[
                    { value: 'ACTIVE', label: 'ACTIVE (Authorized to log in)', badge: 'Active', badgeColor: 'bg-[#dff6dd] text-[#107c10] border-[#a8e5a3]' },
                    { value: 'SUSPENDED', label: 'SUSPENDED (Access revoked)', badge: 'Suspended', badgeColor: 'bg-[#fde7e9] text-[#a4262c] border-[#f8d2d4]' },
                  ]}
                  searchable={false}
                  className="w-full py-2"
                  menuClassName="w-full"
                />
              </div>

              <div>
                <label className="text-[#201f1e] block mb-1 font-semibold">
                  Reset Password (Leave blank to keep current)
                </label>
                <div className="relative">
                  <KeyRound className="h-4 w-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-[#8a8886]" />
                  <input
                    type="password"
                    value={editPassword}
                    onChange={(e) => setEditPassword(e.target.value)}
                    placeholder="Enter new password to reset"
                    className="w-full bg-[#faf9f8] border border-[#d2d0ce] rounded-[4px] pl-8 pr-2.5 py-2 text-xs text-[#201f1e] focus:bg-white focus:outline-none focus:border-[#0078d4] font-mono"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#edebe9]">
                <button
                  type="button"
                  onClick={() => setEditingMember(null)}
                  className="px-3 py-1.5 rounded-[4px] border border-[#d2d0ce] hover:bg-[#f3f2f1] text-[#605e5c] font-medium transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updating}
                  className="px-4 py-1.5 rounded-[4px] bg-[#0078d4] hover:bg-[#106ebe] text-white font-semibold shadow-xs transition flex items-center gap-1.5"
                >
                  {updating && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  <span>Save Changes</span>
                </button>
              </div>
            </form>
          </div>
        )}
      </Modal>

      {/* Floating Toast Notification */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-50 text-white text-xs font-semibold px-4 py-3 rounded-[4px] shadow-fluentModal flex items-center gap-2 animate-in slide-in-from-bottom-2 ${
            toast.type === 'error' ? 'bg-[#a4262c]' : 'bg-[#107c10]'
          }`}
        >
          {toast.type === 'error' ? (
            <AlertCircle className="h-4 w-4 text-white shrink-0" />
          ) : (
            <CheckCircle2 className="h-4 w-4 text-white shrink-0" />
          )}
          <span>{toast.message}</span>
        </div>
      )}
    </div>
  );
}
