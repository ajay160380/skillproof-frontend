import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Building2,
  Users,
  CheckCircle2,
  Clock,
  AlertTriangle,
  FolderTree,
  Plus,
  RefreshCw,
  Search,
  Check,
  X,
  FileCheck,
  Activity,
  Layers,
  ArrowRight,
  TrendingUp,
  SlidersHorizontal,
  Download,
  Calendar,
  Sparkles,
  Award
} from 'lucide-react';
import toast from 'react-hot-toast';
import { operationsApi } from '../services/operationsApi';
import type {
  DashboardStats,
  Organization,
  Department,
  OperationTask,
  AdminUser
} from '../services/operationsApi';
import { useAuthStore } from '../store/authStore';

export function AdminPortal() {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'overview' | 'organizations' | 'departments' | 'users' | 'tasks'>('overview');
  const [loading, setLoading] = useState(true);

  // Data states
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [tasks, setTasks] = useState<OperationTask[]>([]);
  const [usersList, setUsersList] = useState<AdminUser[]>([]);

  // Filters & Search
  const [taskFilter, setTaskFilter] = useState<string>('all');
  const [taskTypeFilter, setTaskTypeFilter] = useState<string>('all');
  const [userRoleFilter, setUserRoleFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [isOrgModalOpen, setIsOrgModalOpen] = useState(false);
  const [isDeptModalOpen, setIsDeptModalOpen] = useState(false);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [auditModalTask, setAuditModalTask] = useState<OperationTask | null>(null);
  const [auditNotes, setAuditNotes] = useState('');
  const [auditMisScore, setAuditMisScore] = useState(90);

  // Form states
  const [newOrg, setNewOrg] = useState({ name: '', code: '', description: '', contact_email: '', website: '' });
  const [newDept, setNewDept] = useState({ organization: 0, name: '', code: '', description: '' });
  const [newTask, setNewTask] = useState<{
    title: string;
    description: string;
    task_type: 'adhoc' | 'recurring' | 'checklist' | 'workflow';
    priority: 'low' | 'medium' | 'high' | 'urgent';
    organization?: number;
    department?: number;
    checklist_raw: string;
    stages_raw: string;
  }>({
    title: '',
    description: '',
    task_type: 'adhoc',
    priority: 'medium',
    checklist_raw: 'Run integrity scan\nVerify sandbox logs\nCheck verification signatures',
    stages_raw: 'Resume Audit,Code Evaluation,Auditor Review,Final Verification',
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [statsData, orgsData, deptsData, tasksData, usersData] = await Promise.all([
        operationsApi.getDashboardStats().catch(() => null),
        operationsApi.getOrganizations().catch(() => []),
        operationsApi.getDepartments().catch(() => []),
        operationsApi.getTasks().catch(() => []),
        operationsApi.getAdminUsers().catch(() => []),
      ]);
      setStats(statsData);
      setOrganizations(orgsData);
      setDepartments(deptsData);
      setTasks(tasksData);
      setUsersList(usersData);
    } catch {
      toast.error('Failed to load operations data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Handlers
  const handleCreateOrg = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newOrg.name || !newOrg.code) {
      toast.error('Organization Name and Code are required');
      return;
    }
    try {
      await operationsApi.createOrganization({
        name: newOrg.name,
        code: newOrg.code.toUpperCase(),
        description: newOrg.description,
        contact_email: newOrg.contact_email || undefined,
        website: newOrg.website || undefined,
      });
      toast.success('Organization created successfully');
      setIsOrgModalOpen(false);
      setNewOrg({ name: '', code: '', description: '', contact_email: '', website: '' });
      fetchData();
    } catch {
      toast.error('Failed to create organization');
    }
  };

  const handleCreateDept = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDept.organization || !newDept.name || !newDept.code) {
      toast.error('Please fill in Organization, Name, and Code');
      return;
    }
    try {
      await operationsApi.createDepartment({
        organization: newDept.organization,
        name: newDept.name,
        code: newDept.code.toUpperCase(),
        description: newDept.description,
      });
      toast.success('Department created successfully');
      setIsDeptModalOpen(false);
      setNewDept({ organization: 0, name: '', code: '', description: '' });
      fetchData();
    } catch {
      toast.error('Failed to create department');
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTask.title) {
      toast.error('Task title is required');
      return;
    }

    const checklistItems = newTask.task_type === 'checklist'
      ? newTask.checklist_raw.split('\n').filter(s => s.trim().length > 0).map(title => ({ title: title.trim(), completed: false }))
      : [];

    const workflowStages = newTask.task_type === 'workflow'
      ? newTask.stages_raw.split(',').filter(s => s.trim().length > 0).map((name, idx) => ({
          stage_number: idx + 1,
          name: name.trim(),
          status: idx === 0 ? 'in_progress' : 'pending',
          reviewer: 'Assigned Reviewer'
        }))
      : [];

    try {
      await operationsApi.createTask({
        title: newTask.title,
        description: newTask.description,
        task_type: newTask.task_type,
        priority: newTask.priority,
        organization: newTask.organization || undefined,
        department: newTask.department || undefined,
        checklist_data: checklistItems,
        workflow_stages: workflowStages,
        mis_score: 85.0,
      });
      toast.success('Task created successfully');
      setIsTaskModalOpen(false);
      setNewTask({
        title: '',
        description: '',
        task_type: 'adhoc',
        priority: 'medium',
        checklist_raw: 'Run integrity scan\nVerify sandbox logs\nCheck verification signatures',
        stages_raw: 'Resume Audit,Code Evaluation,Auditor Review,Final Verification',
      });
      fetchData();
    } catch {
      toast.error('Failed to create task');
    }
  };

  const handleAuditSubmit = async (action: 'approve' | 'reject') => {
    if (!auditModalTask) return;
    try {
      await operationsApi.auditTask(auditModalTask.id, {
        action,
        audit_notes: auditNotes,
        mis_score: auditMisScore,
      });
      toast.success(`Task ${action === 'approve' ? 'Approved & Audited' : 'Rejected back to In-Progress'}`);
      setAuditModalTask(null);
      setAuditNotes('');
      fetchData();
    } catch {
      toast.error('Failed to submit audit decision');
    }
  };

  const handleToggleVerified = async (targetUser: AdminUser) => {
    try {
      const res = await operationsApi.toggleUserVerified(targetUser.id);
      toast.success(`User ${targetUser.email} is now ${res.is_verified ? 'Verified' : 'Unverified'}`);
      setUsersList(prev => prev.map(u => u.id === targetUser.id ? { ...u, is_verified: res.is_verified } : u));
    } catch {
      toast.error('Failed to toggle verification status');
    }
  };

  const handleChangeRole = async (targetUser: AdminUser, newRole: string) => {
    try {
      await operationsApi.changeUserRole(targetUser.id, newRole);
      toast.success(`Role for ${targetUser.email} updated to ${newRole}`);
      setUsersList(prev => prev.map(u => u.id === targetUser.id ? { ...u, role: newRole } : u));
    } catch {
      toast.error('Failed to update role');
    }
  };

  const exportCSV = () => {
    if (!tasks.length) {
      toast.error('No tasks to export');
      return;
    }
    const headers = ['ID', 'Title', 'Type', 'Priority', 'Status', 'MIS Score', 'Organization', 'Created At'];
    const rows = tasks.map(t => [
      t.id,
      `"${t.title.replace(/"/g, '""')}"`,
      t.task_type,
      t.priority,
      t.status,
      `${t.mis_score}%`,
      `"${t.organization_name || 'N/A'}"`,
      t.created_at
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `operations_tasks_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Tasks report exported as CSV');
  };

  // Filtered views
  const filteredTasks = tasks.filter(t => {
    const matchesStatus = taskFilter === 'all' || t.status === taskFilter;
    const matchesType = taskTypeFilter === 'all' || t.task_type === taskTypeFilter;
    const matchesSearch = !searchQuery || t.title.toLowerCase().includes(searchQuery.toLowerCase()) || t.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesType && matchesSearch;
  });

  const filteredUsers = usersList.filter(u => {
    const matchesRole = userRoleFilter === 'all' || u.role === userRoleFilter;
    const matchesSearch = !searchQuery || u.email.toLowerCase().includes(searchQuery.toLowerCase()) || (u.full_name && u.full_name.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesRole && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-[#0A0A0B] text-white pt-20 pb-16 px-4 sm:px-6 lg:px-8">
      {/* Top Banner / Breadcrumb */}
      <div className="max-w-7xl mx-auto mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#1E1E21] pb-6">
          <div>
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-white/5 border border-white/10 rounded-xl text-white">
                <Layers className="w-6 h-6 text-emerald-400" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-bold tracking-tight text-white">Operations & Admin Suite</h1>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    XYZ OPS Integrated
                  </span>
                </div>
                <p className="text-sm text-[#A0A0A3] mt-0.5">
                  Multi-organization hierarchy, role-based governance, and proctored workflow tasks.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center flex-wrap gap-2.5">
            <button
              onClick={exportCSV}
              className="px-3.5 py-2 rounded-lg bg-[#141415] border border-[#1E1E21] hover:bg-[#1E1E21] text-xs font-medium text-white flex items-center gap-2 transition"
            >
              <Download className="w-3.5 h-3.5 text-zinc-400" />
              Export CSV
            </button>
            <button
              onClick={() => setIsOrgModalOpen(true)}
              className="px-3.5 py-2 rounded-lg bg-[#141415] border border-[#1E1E21] hover:bg-[#1E1E21] text-xs font-medium text-white flex items-center gap-1.5 transition"
            >
              <Plus className="w-3.5 h-3.5 text-emerald-400" />
              + Org
            </button>
            <button
              onClick={() => setIsDeptModalOpen(true)}
              className="px-3.5 py-2 rounded-lg bg-[#141415] border border-[#1E1E21] hover:bg-[#1E1E21] text-xs font-medium text-white flex items-center gap-1.5 transition"
            >
              <Plus className="w-3.5 h-3.5 text-blue-400" />
              + Dept
            </button>
            <button
              onClick={() => setIsTaskModalOpen(true)}
              className="px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-xs font-semibold text-black flex items-center gap-1.5 shadow-lg shadow-emerald-500/20 transition"
            >
              <Plus className="w-4 h-4" />
              New Task
            </button>
            <button
              onClick={fetchData}
              className="p-2 rounded-lg bg-[#141415] border border-[#1E1E21] hover:bg-[#1E1E21] text-[#A0A0A3] transition"
              title="Refresh Data"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 border-b border-[#1E1E21] mt-6 overflow-x-auto no-scrollbar">
          {[
            { id: 'overview', label: 'Overview Dashboard', icon: Activity },
            { id: 'organizations', label: `Organizations (${organizations.length})`, icon: Building2 },
            { id: 'departments', label: `Departments (${departments.length})`, icon: FolderTree },
            { id: 'users', label: `Users & Roles (${usersList.length})`, icon: Users },
            { id: 'tasks', label: `Tasks & Workflows (${tasks.length})`, icon: CheckCircle2 },
          ].map(tab => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition whitespace-nowrap ${
                  active
                    ? 'border-emerald-400 text-white'
                    : 'border-transparent text-[#A0A0A3] hover:text-white hover:border-zinc-700'
                }`}
              >
                <Icon className={`w-4 h-4 ${active ? 'text-emerald-400' : 'text-zinc-500'}`} />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto">
        {loading && !stats ? (
          <div className="py-24 flex flex-col items-center justify-center">
            <RefreshCw className="w-8 h-8 text-emerald-400 animate-spin mb-3" />
            <p className="text-sm text-[#A0A0A3]">Synchronizing Operations Suite...</p>
          </div>
        ) : (
          <>
            {/* TAB: OVERVIEW DASHBOARD */}
            {activeTab === 'overview' && (
              <div className="space-y-8">
                {/* Top Metrics Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                  <div className="bg-[#141415] border border-[#1E1E21] rounded-2xl p-5 relative overflow-hidden">
                    <div className="flex items-center justify-between text-zinc-400 mb-3">
                      <span className="text-xs font-semibold uppercase tracking-wider">Organizations</span>
                      <Building2 className="w-4 h-4 text-emerald-400" />
                    </div>
                    <div className="text-3xl font-bold text-white mb-1">
                      {stats?.overview.total_organizations || organizations.length}
                    </div>
                    <div className="text-xs text-emerald-400 flex items-center gap-1">
                      <span>{stats?.overview.active_organizations || 2} Active Enterprise Units</span>
                    </div>
                  </div>

                  <div className="bg-[#141415] border border-[#1E1E21] rounded-2xl p-5 relative overflow-hidden">
                    <div className="flex items-center justify-between text-zinc-400 mb-3">
                      <span className="text-xs font-semibold uppercase tracking-wider">Departments</span>
                      <FolderTree className="w-4 h-4 text-blue-400" />
                    </div>
                    <div className="text-3xl font-bold text-white mb-1">
                      {stats?.overview.total_departments || departments.length}
                    </div>
                    <div className="text-xs text-blue-400 flex items-center gap-1">
                      <span>Mapped to Organizations</span>
                    </div>
                  </div>

                  <div className="bg-[#141415] border border-[#1E1E21] rounded-2xl p-5 relative overflow-hidden">
                    <div className="flex items-center justify-between text-zinc-400 mb-3">
                      <span className="text-xs font-semibold uppercase tracking-wider">Total Users</span>
                      <Users className="w-4 h-4 text-purple-400" />
                    </div>
                    <div className="text-3xl font-bold text-white mb-1">
                      {stats?.overview.total_users || usersList.length}
                    </div>
                    <div className="text-xs text-purple-400 flex items-center gap-1">
                      <span>Candidates, Recruiters & Admins</span>
                    </div>
                  </div>

                  <div className="bg-[#141415] border border-[#1E1E21] rounded-2xl p-5 relative overflow-hidden">
                    <div className="flex items-center justify-between text-zinc-400 mb-3">
                      <span className="text-xs font-semibold uppercase tracking-wider">Tasks Pipeline</span>
                      <CheckCircle2 className="w-4 h-4 text-amber-400" />
                    </div>
                    <div className="text-3xl font-bold text-white mb-1">
                      {stats?.tasks_summary.total || tasks.length}
                    </div>
                    <div className="text-xs text-amber-400 flex items-center gap-1">
                      <span>{stats?.tasks_summary.pending || 0} Pending · {stats?.tasks_summary.completed || 0} Done</span>
                    </div>
                  </div>

                  <div className="bg-[#141415] border border-[#1E1E21] rounded-2xl p-5 relative overflow-hidden">
                    <div className="flex items-center justify-between text-zinc-400 mb-3">
                      <span className="text-xs font-semibold uppercase tracking-wider">MIS Score Index</span>
                      <TrendingUp className="w-4 h-4 text-emerald-400" />
                    </div>
                    <div className="text-3xl font-bold text-emerald-400 mb-1">
                      {stats?.overview.mis_score_avg || 88.5}%
                    </div>
                    <div className="text-xs text-zinc-400 flex items-center gap-1">
                      <span>Target: &gt;80% Compliance</span>
                    </div>
                  </div>
                </div>

                {/* Workflow Status Banner & Quick Analytics */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Task Status Breakdown */}
                  <div className="bg-[#141415] border border-[#1E1E21] rounded-2xl p-6 lg:col-span-2">
                    <div className="flex items-center justify-between mb-5">
                      <h2 className="text-base font-bold text-white flex items-center gap-2">
                        <SlidersHorizontal className="w-4 h-4 text-emerald-400" />
                        Operational Task Status Breakdown
                      </h2>
                      <span className="text-xs text-[#A0A0A3]">Real-time Status</span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                      <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800">
                        <div className="text-xs text-amber-400 font-semibold mb-1 flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5" /> Pending
                        </div>
                        <div className="text-2xl font-bold text-white">{stats?.tasks_summary.pending || 0}</div>
                        <div className="text-[11px] text-zinc-500 mt-1">Awaiting worker start</div>
                      </div>

                      <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800">
                        <div className="text-xs text-blue-400 font-semibold mb-1 flex items-center gap-1.5">
                          <Activity className="w-3.5 h-3.5" /> In Progress
                        </div>
                        <div className="text-2xl font-bold text-white">{stats?.tasks_summary.in_progress || 0}</div>
                        <div className="text-[11px] text-zinc-500 mt-1">Under active execution</div>
                      </div>

                      <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800">
                        <div className="text-xs text-emerald-400 font-semibold mb-1 flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Completed
                        </div>
                        <div className="text-2xl font-bold text-white">{stats?.tasks_summary.completed || 0}</div>
                        <div className="text-[11px] text-zinc-500 mt-1">Proof submitted</div>
                      </div>

                      <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800">
                        <div className="text-xs text-purple-400 font-semibold mb-1 flex items-center gap-1.5">
                          <Award className="w-3.5 h-3.5" /> Audited
                        </div>
                        <div className="text-2xl font-bold text-white">{stats?.tasks_summary.audited || 0}</div>
                        <div className="text-[11px] text-zinc-500 mt-1">Approved by Lead Auditor</div>
                      </div>
                    </div>

                    {/* SkillProof Assessment connection */}
                    <div className="mt-6 pt-5 border-t border-[#1E1E21] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
                          <Sparkles className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="text-xs font-semibold text-white">SkillProof AI Assessment Engine</div>
                          <div className="text-[11px] text-[#A0A0A3]">
                            {stats?.assessments_summary.total_attempts || 0} practical tests executed · {stats?.assessments_summary.verified_count || 0} verified credentials issued
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => setActiveTab('tasks')}
                        className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs font-medium text-white flex items-center gap-1 self-start transition"
                      >
                        Inspect Tasks <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Recent Activity Audit Log */}
                  <div className="bg-[#141415] border border-[#1E1E21] rounded-2xl p-6 flex flex-col">
                    <h2 className="text-base font-bold text-white mb-4 flex items-center gap-2">
                      <Activity className="w-4 h-4 text-purple-400" />
                      Live Audit Stream
                    </h2>

                    <div className="space-y-3 flex-1 overflow-y-auto max-h-[320px] pr-1">
                      {stats?.recent_activity && stats.recent_activity.length > 0 ? (
                        stats.recent_activity.map(log => (
                          <div key={log.id} className="p-3 rounded-xl bg-zinc-900/40 border border-zinc-800/80 text-xs">
                            <div className="flex items-center justify-between text-zinc-400 mb-1">
                              <span className="font-semibold text-white">{log.action}</span>
                              <span className="text-[10px] text-zinc-500">{new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                            <div className="text-zinc-400 text-[11px]">
                              {log.target_model}: <span className="text-zinc-300 font-mono">{log.target_id}</span>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-8 text-xs text-zinc-500">No recent activity logs</div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB: ORGANIZATIONS */}
            {activeTab === 'organizations' && (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-lg font-bold text-white">Enterprise Organizations</h2>
                    <p className="text-xs text-[#A0A0A3]">Manage company workspaces, domains, and department trees.</p>
                  </div>
                  <button
                    onClick={() => setIsOrgModalOpen(true)}
                    className="px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-xs font-semibold text-black flex items-center gap-1.5 self-start transition"
                  >
                    <Plus className="w-4 h-4" /> Add Organization
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {organizations.map(org => (
                    <div key={org.id} className="bg-[#141415] border border-[#1E1E21] hover:border-zinc-700 rounded-2xl p-6 transition flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-zinc-800 text-emerald-400 border border-zinc-700">
                            {org.code}
                          </span>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase ${
                            org.status === 'active' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-zinc-800 text-zinc-400'
                          }`}>
                            {org.status}
                          </span>
                        </div>
                        <h3 className="text-base font-bold text-white mb-1.5">{org.name}</h3>
                        <p className="text-xs text-zinc-400 line-clamp-2 mb-4">{org.description || 'Enterprise workspace'}</p>

                        <div className="space-y-2 border-t border-[#1E1E21] pt-3 text-xs text-zinc-400">
                          {org.contact_email && (
                            <div className="flex items-center justify-between">
                              <span>Contact:</span>
                              <span className="text-white">{org.contact_email}</span>
                            </div>
                          )}
                          {org.website && (
                            <div className="flex items-center justify-between">
                              <span>Website:</span>
                              <a href={org.website} target="_blank" rel="noreferrer" className="text-blue-400 hover:underline">
                                {org.website.replace('https://', '')}
                              </a>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="mt-5 pt-3 border-t border-[#1E1E21] flex items-center justify-between text-xs text-zinc-500">
                        <span>{org.departments_count || 0} Departments</span>
                        <span>{org.tasks_count || 0} Active Tasks</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB: DEPARTMENTS */}
            {activeTab === 'departments' && (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-lg font-bold text-white">Departments & Business Units</h2>
                    <p className="text-xs text-[#A0A0A3]">Teams and functional domains assigned under organizations.</p>
                  </div>
                  <button
                    onClick={() => setIsDeptModalOpen(true)}
                    className="px-4 py-2 rounded-lg bg-blue-500 hover:bg-blue-600 text-xs font-semibold text-white flex items-center gap-1.5 self-start transition"
                  >
                    <Plus className="w-4 h-4" /> Add Department
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {departments.map(dept => (
                    <div key={dept.id} className="bg-[#141415] border border-[#1E1E21] hover:border-zinc-700 rounded-2xl p-6 transition flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-zinc-800 text-blue-400 border border-zinc-700">
                            {dept.code}
                          </span>
                          <span className="text-xs text-zinc-400 font-medium">
                            {dept.organization_name}
                          </span>
                        </div>
                        <h3 className="text-base font-bold text-white mb-1.5">{dept.name}</h3>
                        <p className="text-xs text-zinc-400 line-clamp-2 mb-4">{dept.description || 'Department operations unit'}</p>

                        <div className="space-y-2 border-t border-[#1E1E21] pt-3 text-xs text-zinc-400">
                          <div className="flex items-center justify-between">
                            <span>Manager:</span>
                            <span className="text-white font-medium">{dept.manager_details?.full_name || dept.manager_details?.email || 'Admin'}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span>Status:</span>
                            <span className="text-emerald-400 uppercase text-[10px] font-bold">{dept.status}</span>
                          </div>
                        </div>
                      </div>

                      <div className="mt-5 pt-3 border-t border-[#1E1E21] flex items-center justify-between text-xs text-zinc-500">
                        <span>{dept.members_count || 0} Members</span>
                        <span>{dept.tasks_count || 0} Associated Tasks</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB: USERS & ROLES */}
            {activeTab === 'users' && (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-lg font-bold text-white">Users & Role-Based Access</h2>
                    <p className="text-xs text-[#A0A0A3]">Manage permissions, verification status, and organizational memberships.</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        placeholder="Search users..."
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        className="pl-9 pr-3 py-1.5 bg-[#141415] border border-[#1E1E21] rounded-lg text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                    <select
                      value={userRoleFilter}
                      onChange={e => setUserRoleFilter(e.target.value)}
                      className="px-3 py-1.5 bg-[#141415] border border-[#1E1E21] rounded-lg text-xs text-white focus:outline-none focus:border-emerald-500"
                    >
                      <option value="all">All Roles</option>
                      <option value="candidate">Candidate</option>
                      <option value="recruiter">Recruiter</option>
                      <option value="admin">Admin</option>
                      <option value="superadmin">Super Admin</option>
                      <option value="manager">Manager</option>
                      <option value="auditor">Auditor</option>
                    </select>
                  </div>
                </div>

                <div className="bg-[#141415] border border-[#1E1E21] rounded-2xl overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-zinc-900/60 border-b border-[#1E1E21] text-zinc-400 uppercase font-semibold">
                        <tr>
                          <th className="py-3 px-4">User</th>
                          <th className="py-3 px-4">Role</th>
                          <th className="py-3 px-4">Verification</th>
                          <th className="py-3 px-4">Joined Date</th>
                          <th className="py-3 px-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#1E1E21]">
                        {filteredUsers.map(u => (
                          <tr key={u.id} className="hover:bg-zinc-900/30 transition">
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center font-bold text-white text-xs border border-zinc-700">
                                  {u.full_name ? u.full_name[0].toUpperCase() : u.email[0].toUpperCase()}
                                </div>
                                <div>
                                  <div className="font-semibold text-white">{u.full_name || u.username}</div>
                                  <div className="text-[11px] text-zinc-400">{u.email}</div>
                                </div>
                              </div>
                            </td>
                            <td className="py-3 px-4">
                              <select
                                value={u.role}
                                onChange={e => handleChangeRole(u, e.target.value)}
                                className="px-2.5 py-1 bg-zinc-900 border border-zinc-800 rounded-md text-[11px] text-white focus:outline-none focus:border-emerald-500 capitalize"
                              >
                                <option value="candidate">Candidate</option>
                                <option value="recruiter">Recruiter</option>
                                <option value="admin">Admin</option>
                                <option value="superadmin">Super Admin</option>
                                <option value="manager">Manager</option>
                                <option value="auditor">Auditor</option>
                              </select>
                            </td>
                            <td className="py-3 px-4">
                              <button
                                onClick={() => handleToggleVerified(u)}
                                className={`px-2.5 py-1 rounded-full text-[10px] font-semibold flex items-center gap-1 transition ${
                                  u.is_verified
                                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                    : 'bg-zinc-800 text-zinc-400 border border-zinc-700'
                                }`}
                              >
                                {u.is_verified ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                                {u.is_verified ? 'Verified Pro' : 'Unverified'}
                              </button>
                            </td>
                            <td className="py-3 px-4 text-zinc-400">
                              {new Date(u.created_at).toLocaleDateString()}
                            </td>
                            <td className="py-3 px-4 text-right">
                              <span className="text-[11px] text-zinc-500 font-mono">ID: {u.id}</span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* TAB: TASKS & WORKFLOWS */}
            {activeTab === 'tasks' && (
              <div className="space-y-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-lg font-bold text-white">Operations Tasks & Multi-Stage Pipelines</h2>
                    <p className="text-xs text-[#A0A0A3]">Manage Ad-Hoc, Recurring, Checklist, and Multi-Stage Workflow evaluations.</p>
                  </div>
                  <div className="flex items-center flex-wrap gap-2.5">
                    {/* Status filter */}
                    <div className="flex bg-[#141415] border border-[#1E1E21] rounded-lg p-1 text-xs">
                      {['all', 'pending', 'in_progress', 'completed', 'audited'].map(s => (
                        <button
                          key={s}
                          onClick={() => setTaskFilter(s)}
                          className={`px-2.5 py-1 rounded-md font-medium capitalize transition ${
                            taskFilter === s ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:text-white'
                          }`}
                        >
                          {s.replace('_', ' ')}
                        </button>
                      ))}
                    </div>

                    {/* Task type filter */}
                    <select
                      value={taskTypeFilter}
                      onChange={e => setTaskTypeFilter(e.target.value)}
                      className="px-3 py-1.5 bg-[#141415] border border-[#1E1E21] rounded-lg text-xs text-white focus:outline-none focus:border-emerald-500"
                    >
                      <option value="all">All Types</option>
                      <option value="adhoc">Ad-Hoc</option>
                      <option value="recurring">Recurring</option>
                      <option value="checklist">Checklist</option>
                      <option value="workflow">Workflow</option>
                    </select>

                    <button
                      onClick={() => setIsTaskModalOpen(true)}
                      className="px-3.5 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-xs font-semibold text-black flex items-center gap-1.5 transition"
                    >
                      <Plus className="w-3.5 h-3.5" /> New Task
                    </button>
                  </div>
                </div>

                {/* Tasks Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {filteredTasks.map(task => {
                    const isChecklist = task.task_type === 'checklist';
                    const isWorkflow = task.task_type === 'workflow';

                    return (
                      <div
                        key={task.id}
                        className="bg-[#141415] border border-[#1E1E21] hover:border-zinc-700 rounded-2xl p-6 transition flex flex-col justify-between"
                      >
                        <div>
                          {/* Card Header badges */}
                          <div className="flex items-center justify-between gap-2 mb-3">
                            <div className="flex items-center gap-2">
                              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                task.task_type === 'adhoc' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
                                task.task_type === 'recurring' ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20' :
                                task.task_type === 'checklist' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                                'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              }`}>
                                {task.task_type}
                              </span>

                              <span className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${
                                task.priority === 'urgent' ? 'bg-red-500/20 text-red-400' :
                                task.priority === 'high' ? 'bg-amber-500/20 text-amber-300' :
                                'bg-zinc-800 text-zinc-400'
                              }`}>
                                {task.priority}
                              </span>
                            </div>

                            <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize ${
                              task.status === 'completed' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                              task.status === 'audited' ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20' :
                              task.status === 'overdue' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                              task.status === 'in_progress' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
                              'bg-zinc-800 text-zinc-400'
                            }`}>
                              {task.status.replace('_', ' ')}
                            </span>
                          </div>

                          <h3 className="text-base font-bold text-white mb-2">{task.title}</h3>
                          <p className="text-xs text-zinc-400 mb-4">{task.description}</p>

                          {/* Dynamic Checklist preview */}
                          {isChecklist && task.checklist_data && task.checklist_data.length > 0 && (
                            <div className="mb-4 p-3 rounded-xl bg-zinc-900/50 border border-zinc-800/80 space-y-1.5">
                              <div className="text-[11px] font-semibold text-zinc-300 mb-1 flex items-center justify-between">
                                <span>Checklist Items</span>
                                <span>{task.checklist_data.filter(c => c.completed).length} / {task.checklist_data.length} Done</span>
                              </div>
                              {task.checklist_data.map((item, i) => (
                                <div key={i} className="flex items-center gap-2 text-xs text-zinc-400">
                                  <div className={`w-3.5 h-3.5 rounded flex items-center justify-center border ${
                                    item.completed ? 'bg-emerald-500 border-emerald-500 text-black' : 'border-zinc-600'
                                  }`}>
                                    {item.completed && <Check className="w-2.5 h-2.5" />}
                                  </div>
                                  <span className={item.completed ? 'line-through text-zinc-500' : ''}>{item.title}</span>
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Dynamic Workflow stages preview */}
                          {isWorkflow && task.workflow_stages && task.workflow_stages.length > 0 && (
                            <div className="mb-4 p-3 rounded-xl bg-zinc-900/50 border border-zinc-800/80">
                              <div className="text-[11px] font-semibold text-zinc-300 mb-2">Workflow Stages Pipeline</div>
                              <div className="flex items-center gap-1.5 flex-wrap">
                                {task.workflow_stages.map((st, i) => (
                                  <div key={i} className="flex items-center gap-1.5">
                                    <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${
                                      st.status === 'completed' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                                      st.status === 'in_progress' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' :
                                      'bg-zinc-800 text-zinc-400'
                                    }`}>
                                      {st.stage_number}. {st.name}
                                    </span>
                                    {i < task.workflow_stages!.length - 1 && (
                                      <ArrowRight className="w-3 h-3 text-zinc-600" />
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Proof submission text if available */}
                          {task.proof_submission && (
                            <div className="p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/20 text-xs mb-4">
                              <div className="font-semibold text-emerald-400 mb-0.5 flex items-center gap-1">
                                <FileCheck className="w-3.5 h-3.5" /> Verification Proof Submitted
                              </div>
                              <p className="text-zinc-300 text-[11px]">{task.proof_submission}</p>
                            </div>
                          )}

                          {/* Audit Notes if available */}
                          {task.audit_notes && (
                            <div className="p-3 rounded-xl bg-purple-500/5 border border-purple-500/20 text-xs mb-4">
                              <div className="font-semibold text-purple-400 mb-0.5 flex items-center gap-1">
                                <Award className="w-3.5 h-3.5" /> Auditor Compliance Notes
                              </div>
                              <p className="text-zinc-300 text-[11px]">{task.audit_notes}</p>
                            </div>
                          )}
                        </div>

                        {/* Footer Details & Action button */}
                        <div className="pt-4 border-t border-[#1E1E21] flex items-center justify-between text-xs">
                          <div className="text-zinc-500">
                            MIS Score: <span className="text-emerald-400 font-semibold">{task.mis_score}%</span>
                            {task.organization_name && ` · ${task.organization_name}`}
                          </div>

                          <div className="flex items-center gap-2">
                            {task.status !== 'audited' && (
                              <button
                                onClick={() => {
                                  setAuditModalTask(task);
                                  setAuditNotes(task.audit_notes || '');
                                  setAuditMisScore(task.mis_score || 90);
                                }}
                                className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold text-white transition flex items-center gap-1"
                              >
                                <Award className="w-3 h-3 text-purple-400" /> Audit
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* MODAL: CREATE ORGANIZATION */}
      <AnimatePresence>
        {isOrgModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#141415] border border-[#1E1E21] rounded-2xl p-6 w-full max-w-md shadow-2xl"
            >
              <div className="flex items-center justify-between mb-4 border-b border-[#1E1E21] pb-3">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-emerald-400" /> Create Organization
                </h3>
                <button onClick={() => setIsOrgModalOpen(false)} className="text-zinc-400 hover:text-white">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleCreateOrg} className="space-y-4 text-xs">
                <div>
                  <label className="block text-zinc-300 font-medium mb-1">Organization Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Apex Global Solutions"
                    value={newOrg.name}
                    onChange={e => setNewOrg({ ...newOrg, name: e.target.value })}
                    className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-zinc-300 font-medium mb-1">Organization Code *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. APEX"
                    value={newOrg.code}
                    onChange={e => setNewOrg({ ...newOrg, code: e.target.value })}
                    className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500 uppercase font-mono"
                  />
                </div>

                <div>
                  <label className="block text-zinc-300 font-medium mb-1">Description</label>
                  <textarea
                    rows={2}
                    placeholder="Brief description of the organization..."
                    value={newOrg.description}
                    onChange={e => setNewOrg({ ...newOrg, description: e.target.value })}
                    className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-zinc-300 font-medium mb-1">Contact Email</label>
                    <input
                      type="email"
                      placeholder="ops@company.com"
                      value={newOrg.contact_email}
                      onChange={e => setNewOrg({ ...newOrg, contact_email: e.target.value })}
                      className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-zinc-300 font-medium mb-1">Website URL</label>
                    <input
                      type="url"
                      placeholder="https://..."
                      value={newOrg.website}
                      onChange={e => setNewOrg({ ...newOrg, website: e.target.value })}
                      className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#1E1E21]">
                  <button
                    type="button"
                    onClick={() => setIsOrgModalOpen(false)}
                    className="px-4 py-2 rounded-lg bg-zinc-800 text-zinc-300 hover:text-white font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-black font-semibold shadow-lg shadow-emerald-500/20"
                  >
                    Save Organization
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL: CREATE DEPARTMENT */}
      <AnimatePresence>
        {isDeptModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#141415] border border-[#1E1E21] rounded-2xl p-6 w-full max-w-md shadow-2xl"
            >
              <div className="flex items-center justify-between mb-4 border-b border-[#1E1E21] pb-3">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <FolderTree className="w-4 h-4 text-blue-400" /> Create Department
                </h3>
                <button onClick={() => setIsDeptModalOpen(false)} className="text-zinc-400 hover:text-white">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleCreateDept} className="space-y-4 text-xs">
                <div>
                  <label className="block text-zinc-300 font-medium mb-1">Parent Organization *</label>
                  <select
                    required
                    value={newDept.organization}
                    onChange={e => setNewDept({ ...newDept, organization: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value={0}>Select Organization</option>
                    {organizations.map(o => (
                      <option key={o.id} value={o.id}>{o.name} ({o.code})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-zinc-300 font-medium mb-1">Department Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Engineering & Cloud DevOps"
                    value={newDept.name}
                    onChange={e => setNewDept({ ...newDept, name: e.target.value })}
                    className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-zinc-300 font-medium mb-1">Department Code *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. ENG-01"
                    value={newDept.code}
                    onChange={e => setNewDept({ ...newDept, code: e.target.value })}
                    className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500 uppercase font-mono"
                  />
                </div>

                <div>
                  <label className="block text-zinc-300 font-medium mb-1">Description</label>
                  <textarea
                    rows={2}
                    placeholder="Functional scope of the department..."
                    value={newDept.description}
                    onChange={e => setNewDept({ ...newDept, description: e.target.value })}
                    className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#1E1E21]">
                  <button
                    type="button"
                    onClick={() => setIsDeptModalOpen(false)}
                    className="px-4 py-2 rounded-lg bg-zinc-800 text-zinc-300 hover:text-white font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-lg bg-blue-500 hover:bg-blue-600 text-white font-semibold"
                  >
                    Save Department
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL: CREATE TASK */}
      <AnimatePresence>
        {isTaskModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#141415] border border-[#1E1E21] rounded-2xl p-6 w-full max-w-lg shadow-2xl my-8"
            >
              <div className="flex items-center justify-between mb-4 border-b border-[#1E1E21] pb-3">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Create Operational Task
                </h3>
                <button onClick={() => setIsTaskModalOpen(false)} className="text-zinc-400 hover:text-white">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleCreateTask} className="space-y-4 text-xs">
                <div>
                  <label className="block text-zinc-300 font-medium mb-1">Task Title *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Audit Sandbox Execution Logs #103"
                    value={newTask.title}
                    onChange={e => setNewTask({ ...newTask, title: e.target.value })}
                    className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-zinc-300 font-medium mb-1">Task Type</label>
                    <select
                      value={newTask.task_type}
                      onChange={e => setNewTask({ ...newTask, task_type: e.target.value as any })}
                      className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-white focus:outline-none focus:border-emerald-500 capitalize"
                    >
                      <option value="adhoc">Ad-Hoc Task</option>
                      <option value="recurring">Recurring Task</option>
                      <option value="checklist">Checklist Task</option>
                      <option value="workflow">Multi-Stage Workflow</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-zinc-300 font-medium mb-1">Priority</label>
                    <select
                      value={newTask.priority}
                      onChange={e => setNewTask({ ...newTask, priority: e.target.value as any })}
                      className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-white focus:outline-none focus:border-emerald-500 capitalize"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="urgent">Urgent</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-zinc-300 font-medium mb-1">Assign to Organization</label>
                  <select
                    value={newTask.organization || 0}
                    onChange={e => setNewTask({ ...newTask, organization: Number(e.target.value) || undefined })}
                    className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value={0}>Select Organization (Optional)</option>
                    {organizations.map(o => (
                      <option key={o.id} value={o.id}>{o.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-zinc-300 font-medium mb-1">Description</label>
                  <textarea
                    rows={2}
                    placeholder="Instructions and verification standards..."
                    value={newTask.description}
                    onChange={e => setNewTask({ ...newTask, description: e.target.value })}
                    className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                {/* Conditional fields for Checklist */}
                {newTask.task_type === 'checklist' && (
                  <div>
                    <label className="block text-amber-400 font-medium mb-1">Checklist Items (one per line)</label>
                    <textarea
                      rows={3}
                      value={newTask.checklist_raw}
                      onChange={e => setNewTask({ ...newTask, checklist_raw: e.target.value })}
                      className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-white font-mono text-xs focus:outline-none focus:border-amber-500"
                    />
                  </div>
                )}

                {/* Conditional fields for Workflow */}
                {newTask.task_type === 'workflow' && (
                  <div>
                    <label className="block text-emerald-400 font-medium mb-1">Workflow Stages (comma separated)</label>
                    <input
                      type="text"
                      value={newTask.stages_raw}
                      onChange={e => setNewTask({ ...newTask, stages_raw: e.target.value })}
                      className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-white font-mono text-xs focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                )}

                <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#1E1E21]">
                  <button
                    type="button"
                    onClick={() => setIsTaskModalOpen(false)}
                    className="px-4 py-2 rounded-lg bg-zinc-800 text-zinc-300 hover:text-white font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-black font-semibold shadow-lg shadow-emerald-500/20"
                  >
                    Create Task
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL: AUDIT DECISION */}
      <AnimatePresence>
        {auditModalTask && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#141415] border border-[#1E1E21] rounded-2xl p-6 w-full max-w-md shadow-2xl"
            >
              <div className="flex items-center justify-between mb-4 border-b border-[#1E1E21] pb-3">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Award className="w-4 h-4 text-purple-400" /> Auditor Review & Decision
                </h3>
                <button onClick={() => setAuditModalTask(null)} className="text-zinc-400 hover:text-white">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-4 text-xs">
                <div>
                  <div className="text-zinc-400 mb-1">Target Task:</div>
                  <div className="font-bold text-white text-sm">{auditModalTask.title}</div>
                </div>

                {auditModalTask.proof_submission && (
                  <div className="p-3 rounded-xl bg-zinc-900 border border-zinc-800">
                    <div className="text-[11px] text-zinc-400 mb-1">Submitted Proof / Artifact:</div>
                    <div className="text-white text-xs">{auditModalTask.proof_submission}</div>
                  </div>
                )}

                <div>
                  <label className="block text-zinc-300 font-medium mb-1">MIS Compliance Score (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={auditMisScore}
                    onChange={e => setAuditMisScore(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-white focus:outline-none focus:border-purple-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-zinc-300 font-medium mb-1">Auditor Compliance Notes</label>
                  <textarea
                    rows={3}
                    placeholder="Verified test logs, compliance standards satisfied..."
                    value={auditNotes}
                    onChange={e => setAuditNotes(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#1E1E21]">
                  <button
                    type="button"
                    onClick={() => handleAuditSubmit('reject')}
                    className="px-3.5 py-2 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 font-medium border border-red-500/30"
                  >
                    Reject (Re-open)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAuditSubmit('approve')}
                    className="px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-black font-semibold shadow-lg shadow-emerald-500/20"
                  >
                    Approve & Signoff
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
