import { useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { ArrowUpRight, BookOpen, CalendarDays, Check, CheckCircle2, ChevronRight, Circle, Clock3, Filter, Flame, ListChecks, Loader2, Menu, Pencil, Plus, RefreshCw, Search, Sparkles, Target, Trash2, X } from 'lucide-react';
import { getGetDashboardSummaryQueryKey, getGetTaskQueryKey, getListTasksQueryKey, TaskCategory, TaskPriority, TaskStatus, type DashboardSummary, type ListTasksParams, type Task, useCreateTask, useDeleteTask, useGetDashboardSummary, useGetTask, useListTasks, useToggleTask, useUpdateTask } from '@workspace/api-client-react';
import { TaskDialog } from '@/components/task-dialog';

const categories: TaskCategory[] = ['DSA', 'Academics', 'Projects', 'Placement', 'Personal'];
const categoryMeta: Record<TaskCategory, { tone: string; soft: string; icon: string }> = {
  DSA: { tone: 'text-[#276f70]', soft: 'bg-[#dceeed]', icon: 'DS' },
  Academics: { tone: 'text-[#9a651d]', soft: 'bg-[#f8e9be]', icon: 'AC' },
  Projects: { tone: 'text-[#8b4d40]', soft: 'bg-[#f4dfd7]', icon: 'PR' },
  Placement: { tone: 'text-[#5c5794]', soft: 'bg-[#e5e2f4]', icon: 'PL' },
  Personal: { tone: 'text-[#3f6d56]', soft: 'bg-[#dcebdc]', icon: 'PE' },
};

function formatDue(date?: string | null) {
  if (!date) return 'No due date';
  const value = new Date(date);
  const today = new Date();
  const tomorrow = new Date();
  tomorrow.setDate(today.getDate() + 1);
  if (value.toDateString() === today.toDateString()) return 'Today';
  if (value.toDateString() === tomorrow.toDateString()) return 'Tomorrow';
  return value.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

function TaskRow({ task, onToggle, onEdit, onDelete, deleting }: { task: Task; onToggle: () => void; onEdit: () => void; onDelete: () => void; deleting: boolean }) {
  const meta = categoryMeta[task.category];
  return (
    <div className={`task-row group ${task.completed ? 'task-row-complete' : ''}`} data-testid={`row-task-${task.id}`}>
      <button type="button" onClick={onToggle} className={`check-control ${task.completed ? 'check-control-done' : ''}`} aria-label={task.completed ? `Mark ${task.title} active` : `Complete ${task.title}`} data-testid={`button-toggle-task-${task.id}`}>
        {task.completed && <Check size={15} strokeWidth={3} />}
      </button>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className={`task-title ${task.completed ? 'line-through text-muted-foreground' : ''}`} data-testid={`text-task-title-${task.id}`}>{task.title}</p>
          {task.priority === TaskPriority.high && !task.completed && <span className="priority-dot" title="High priority" />}
        </div>
        {task.description && <p className="mt-1 line-clamp-1 text-xs text-muted-foreground">{task.description}</p>}
        <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] font-semibold uppercase tracking-[.08em] text-muted-foreground">
          <span className={`category-pill ${meta.soft} ${meta.tone}`}>{task.category}</span>
          <span className="inline-flex items-center gap-1"><CalendarDays size={12} /> {formatDue(task.dueDate)}</span>
        </div>
      </div>
      <div className="task-actions">
        <button type="button" onClick={onEdit} className="icon-button icon-button-small" aria-label={`Edit ${task.title}`} data-testid={`button-edit-task-${task.id}`}><Pencil size={14} /></button>
        <button type="button" onClick={onDelete} disabled={deleting} className="icon-button icon-button-small danger-hover" aria-label={`Delete ${task.title}`} data-testid={`button-delete-task-${task.id}`}>{deleting ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}</button>
      </div>
    </div>
  );
}

function SkeletonRows() {
  return <div className="space-y-2" aria-label="Loading tasks">{[1, 2, 3, 4].map((item) => <div key={item} className="skeleton-row"><span className="skeleton-circle" /><span className="skeleton-line w-2/5" /><span className="skeleton-line ml-auto w-16" /></div>)}</div>;
}

export default function Dashboard() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<TaskCategory | undefined>();
  const [status, setStatus] = useState<TaskStatus>(TaskStatus.active);
  const [sort, setSort] = useState<ListTasksParams['sort']>('dueDate');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [mobileNav, setMobileNav] = useState(false);

  const params = useMemo<ListTasksParams>(() => ({ ...(search ? { search } : {}), ...(category ? { category } : {}), ...(status ? { status } : {}), sort }), [search, category, status, sort]);
  const listKey = useMemo(() => getListTasksQueryKey(params), [params]);
  const tasksQuery = useListTasks(params, { query: { queryKey: listKey, staleTime: 20_000 } });
  const summaryQuery = useGetDashboardSummary({ query: { queryKey: getGetDashboardSummaryQueryKey(), staleTime: 20_000 } });
  const detailQuery = useGetTask(editingId ?? 0, { query: { enabled: editingId !== null, queryKey: getGetTaskQueryKey(editingId ?? 0) } });
  const createTask = useCreateTask();
  const updateTask = useUpdateTask();
  const deleteTask = useDeleteTask();
  const toggleTask = useToggleTask();

  const summary = summaryQuery.data as DashboardSummary | undefined;
  const tasks = tasksQuery.data ?? [];
  const editingTask = detailQuery.data ?? tasks.find((task) => task.id === editingId) ?? null;
  const refresh = () => {
    void queryClient.invalidateQueries({ queryKey: getGetDashboardSummaryQueryKey() });
    void queryClient.invalidateQueries({ queryKey: getListTasksQueryKey() });
  };
  const openCreate = () => { setEditingId(null); setDialogOpen(true); };
  const openEdit = (id: number) => { setEditingId(id); setDialogOpen(true); };
  const closeDialog = () => { setDialogOpen(false); setEditingId(null); };
  const submitTask = (data: Parameters<typeof createTask.mutate>[0]['data']) => {
    if (editingId !== null) {
      updateTask.mutate({ id: editingId, data }, { onSuccess: () => { closeDialog(); refresh(); } });
    } else {
      createTask.mutate({ data }, { onSuccess: () => { closeDialog(); refresh(); } });
    }
  };
  const toggle = (id: number) => toggleTask.mutate({ id }, { onSuccess: refresh });
  const confirmDelete = (id: number) => {
    if (deleteId !== id) { setDeleteId(id); return; }
    deleteTask.mutate({ id }, { onSuccess: () => { setDeleteId(null); refresh(); } });
  };
  const activeCount = summary?.active ?? tasks.filter((task) => !task.completed).length;
  const completionRate = summary?.completionRate ?? 0;

  return (
    <div className="min-h-[100dvh] bg-background text-foreground">
      <aside className={`sidebar ${mobileNav ? 'sidebar-open' : ''}`}>
        <div className="sidebar-brand"><div className="brand-mark"><Sparkles size={17} /></div><span>Study<span className="text-[#f1c94b]">Flow</span></span><button type="button" className="ml-auto rounded-md p-1 text-sidebar-foreground/70 md:hidden" onClick={() => setMobileNav(false)} data-testid="button-close-mobile-nav"><X size={19} /></button></div>
        <div className="sidebar-profile"><div className="avatar">L</div><div><p className="text-sm font-bold">Lipika</p><p className="text-[11px] text-sidebar-foreground/55">Building a little every day</p></div></div>
        <nav className="mt-8 space-y-1">
          <p className="sidebar-label">Workspace</p>
          <button type="button" className="sidebar-link sidebar-link-active" data-testid="button-nav-today"><ListChecks size={17} /><span>Today</span><span className="sidebar-count">{activeCount}</span></button>
          <button type="button" className="sidebar-link" onClick={() => setStatus(TaskStatus.all)} data-testid="button-nav-all-tasks"><BookOpen size={17} /><span>All tasks</span></button>
          <button type="button" className="sidebar-link" onClick={() => setStatus(TaskStatus.completed)} data-testid="button-nav-completed"><CheckCircle2 size={17} /><span>Completed</span></button>
        </nav>
        <div className="mt-8">
          <p className="sidebar-label">Your areas</p>
          <div className="space-y-1">{categories.map((item) => <button type="button" key={item} onClick={() => setCategory(category === item ? undefined : item)} className={`sidebar-link ${category === item ? 'sidebar-link-area-active' : ''}`} data-testid={`button-sidebar-category-${item}`}><span className={`area-dot ${categoryMeta[item].soft}`} />{item}<span className="ml-auto text-[11px] text-sidebar-foreground/40">{summary?.categorySummaries?.find((entry) => entry.category === item)?.active ?? ''}</span></button>)}</div>
        </div>
        <div className="sidebar-bottom"><div className="focus-card"><div className="flex items-center justify-between"><span className="text-[11px] font-bold uppercase tracking-[.16em] text-sidebar-foreground/60">This week</span><Target size={17} className="text-[#f1c94b]" /></div><p className="mt-3 font-serif text-lg leading-tight">Small steps.<br /><em>Real momentum.</em></p><div className="mt-4 h-1.5 overflow-hidden rounded-full bg-sidebar-foreground/15"><div className="h-full rounded-full bg-[#f1c94b]" style={{ width: `${Math.min(completionRate, 100)}%` }} /></div><p className="mt-2 text-[11px] text-sidebar-foreground/55">{completionRate}% of tasks completed</p></div><button type="button" className="sidebar-link mt-3" data-testid="button-sidebar-settings"><span className="h-2 w-2 rounded-full bg-[#f1c94b]" />Focus mode <span className="ml-auto font-mono text-[10px] text-sidebar-foreground/40">⌘K</span></button></div>
      </aside>
      {mobileNav && <button type="button" aria-label="Close navigation" onClick={() => setMobileNav(false)} className="fixed inset-0 z-30 bg-[#162039]/40 md:hidden" data-testid="button-mobile-nav-overlay" />}
      <main className="main-content">
        <header className="topbar"><div className="flex items-center gap-3"><button type="button" onClick={() => setMobileNav(true)} className="icon-button md:hidden" data-testid="button-open-mobile-nav"><Menu size={20} /></button><div className="hidden h-8 w-px bg-border md:block" /><p className="eyebrow hidden sm:block">Tuesday · October 15, 2024</p></div><div className="flex items-center gap-2"><button type="button" onClick={refresh} className="icon-button" aria-label="Refresh dashboard" data-testid="button-refresh-dashboard"><RefreshCw size={16} className={summaryQuery.isFetching ? 'animate-spin' : ''} /></button><button type="button" onClick={openCreate} className="button button-primary button-small" data-testid="button-add-task-top"><Plus size={16} /> <span className="hidden sm:inline">New task</span></button></div></header>
        <div className="content-wrap">
          <section className="hero-row"><div><p className="eyebrow text-[#a87522]">{getGreeting()}, Lipika</p><h1 className="hero-title">Make today<br /><em>count.</em></h1><p className="hero-subtitle">A clear mind starts with a clear next step.</p></div><div className="hero-note"><div className="hero-note-line" /><p>“The secret of getting ahead is getting started.”</p><span>— Mark Twain</span></div></section>
          <section className="stats-grid" aria-label="Study progress">
            <div className="stat-card stat-card-dark"><div className="stat-icon"><ListChecks size={18} /></div><p className="stat-label">Total tasks</p><p className="stat-value" data-testid="text-total-tasks">{summary?.total ?? '—'}</p><p className="stat-foot">Across all areas</p></div>
            <div className="stat-card"><div className="stat-icon stat-icon-gold"><CheckCircle2 size={18} /></div><p className="stat-label">Completed</p><p className="stat-value" data-testid="text-completed-tasks">{summary?.completed ?? '—'}</p><p className="stat-foot">{completionRate}% completion rate</p></div>
            <div className="stat-card"><div className="stat-icon stat-icon-red"><Flame size={18} /></div><p className="stat-label">High priority</p><p className="stat-value" data-testid="text-high-priority">{summary?.highPriorityActive ?? '—'}</p><p className="stat-foot">Need your attention</p></div>
            <div className="progress-card"><div className="flex items-start justify-between"><div><p className="stat-label">Your rhythm</p><p className="mt-1 text-sm font-bold">Keep the streak alive</p></div><span className="font-mono text-xl font-medium text-[#a87522]" data-testid="text-completion-rate">{completionRate}%</span></div><div className="mt-6 h-2 rounded-full bg-[#efe5c9]"><div className="h-full rounded-full bg-[#e6bd42] transition-all duration-700" style={{ width: `${Math.min(completionRate, 100)}%` }} /></div><div className="mt-3 flex justify-between text-[11px] text-muted-foreground"><span>{summary?.completed ?? 0} done</span><span>{summary?.active ?? 0} left</span></div></div>
          </section>
          <section className="workspace-grid">
            <div className="tasks-panel">
              <div className="panel-heading"><div><div className="flex items-center gap-2"><h2 className="section-title">Your tasks</h2><span className="count-badge">{tasks.length}</span></div><p className="section-caption">The work that moves you forward.</p></div><button type="button" onClick={openCreate} className="button button-outline button-small" data-testid="button-add-task-panel"><Plus size={15} /> Add task</button></div>
              <div className="filter-bar"><div className="search-wrap"><Search size={16} /><input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search your tasks..." data-testid="input-search-tasks" />{search && <button type="button" onClick={() => setSearch('')} aria-label="Clear search" data-testid="button-clear-search"><X size={14} /></button>}</div><div className="filter-scroll"><div className="segmented-control">{[TaskStatus.active, TaskStatus.all, TaskStatus.completed].map((item) => <button type="button" key={item} onClick={() => setStatus(item)} className={status === item ? 'segment-active' : ''} data-testid={`button-filter-status-${item}`}>{item[0].toUpperCase() + item.slice(1)}</button>)}</div><span className="filter-divider" /><button type="button" onClick={() => setCategory(undefined)} className={`filter-chip ${!category ? 'filter-chip-active' : ''}`} data-testid="button-filter-all-categories"><Filter size={13} /> {category ?? 'All areas'}</button>{category && <button type="button" onClick={() => setCategory(undefined)} className="icon-button icon-button-small" aria-label="Clear category filter" data-testid="button-clear-category"><X size={14} /></button>}<select value={sort} onChange={(event) => setSort(event.target.value as ListTasksParams['sort'])} className="sort-select" aria-label="Sort tasks" data-testid="select-sort-tasks"><option value="dueDate">Due date</option><option value="priority">Priority</option><option value="newest">Newest</option></select></div></div>
              {tasksQuery.isLoading ? <SkeletonRows /> : tasksQuery.isError ? <div className="empty-state"><div className="empty-icon"><RefreshCw size={20} /></div><h3>Couldn’t load your tasks</h3><p>Give it another try — your plan is still here.</p><button type="button" onClick={() => void tasksQuery.refetch()} className="button button-outline button-small" data-testid="button-retry-tasks">Try again</button></div> : tasks.length === 0 ? <div className="empty-state"><div className="empty-icon"><Circle size={20} /></div><h3>{search || category ? 'No matching tasks' : 'A clear desk, for now'}</h3><p>{search || category ? 'Try a different filter or make a new task.' : 'Add one small thing you can finish today.'}</p><button type="button" onClick={openCreate} className="button button-primary button-small" data-testid="button-empty-add-task"><Plus size={15} /> Add your first task</button></div> : <div className="task-list">{tasks.map((task) => <TaskRow key={task.id} task={task} onToggle={() => toggle(task.id)} onEdit={() => openEdit(task.id)} onDelete={() => confirmDelete(task.id)} deleting={deleteTask.isPending && deleteId === task.id} />)}</div>}
              {deleteId !== null && <div className="delete-confirm"><Trash2 size={16} /><span>Click the bin again to delete this task.</span><button type="button" onClick={() => setDeleteId(null)} data-testid="button-cancel-delete">Keep it</button></div>}
            </div>
            <aside className="right-rail">
              <div className="upcoming-card"><div className="panel-heading compact"><div><p className="eyebrow text-[#a87522]">Coming up</p><h2 className="section-title mt-1">Next on deck</h2></div><Clock3 size={18} className="text-muted-foreground" /></div>{summaryQuery.isLoading ? <div className="space-y-3 pt-4">{[1, 2, 3].map((item) => <div className="skeleton-line h-10 w-full" key={item} />)}</div> : summary?.upcoming?.length ? <div className="upcoming-list">{summary.upcoming.slice(0, 4).map((task) => <div className="upcoming-item" key={task.id}><div className={`upcoming-date ${task.priority === 'high' ? 'upcoming-date-hot' : ''}`}><span>{task.dueDate ? new Date(task.dueDate).toLocaleDateString('en-US', { month: 'short' }) : '—'}</span><strong>{task.dueDate ? new Date(task.dueDate).getDate() : '·'}</strong></div><div className="min-w-0 flex-1"><p className="line-clamp-1 text-sm font-bold">{task.title}</p><p className="mt-1 text-[11px] text-muted-foreground">{task.category} · {task.priority} priority</p></div><ChevronRight size={15} className="text-muted-foreground" /></div>)}</div> : <div className="empty-mini"><CalendarDays size={17} /><span>Your calendar is clear.</span></div>}<button type="button" onClick={() => setStatus(TaskStatus.all)} className="view-all-button" data-testid="button-view-all-upcoming">View all tasks <ArrowUpRight size={14} /></button></div>
              <div className="areas-card"><div className="panel-heading compact"><div><p className="eyebrow text-[#a87522]">Balance</p><h2 className="section-title mt-1">By area</h2></div><BookOpen size={18} className="text-muted-foreground" /></div><div className="area-progress-list">{summary?.categorySummaries?.map((item) => { const percent = item.total ? Math.round((item.completed / item.total) * 100) : 0; return <button type="button" className="area-progress" key={item.category} onClick={() => setCategory(item.category)} data-testid={`button-area-progress-${item.category}`}><span className={`area-dot ${categoryMeta[item.category].soft}`} /><span className="min-w-0 flex-1 text-left"><span className="flex justify-between text-xs font-bold"><span>{item.category}</span><span className="font-mono text-muted-foreground">{item.completed}/{item.total}</span></span><span className="mt-2 block h-1.5 rounded-full bg-muted"><span className={`block h-full rounded-full ${item.category === 'DSA' ? 'bg-[#4b9992]' : item.category === 'Academics' ? 'bg-[#e2b83c]' : item.category === 'Projects' ? 'bg-[#d48670]' : item.category === 'Placement' ? 'bg-[#8b84c5]' : 'bg-[#75a47d]'}`} style={{ width: `${percent}%` }} /></span></span></button>; }) ?? <div className="empty-mini">No area data yet.</div>}</div></div>
            </aside>
          </section>
          <footer className="bottom-note"><span className="inline-flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-[#4b9992]" />StudyFlow is your space to make progress visible.</span><span className="hidden sm:inline">Last synced just now</span></footer>
        </div>
      </main>
      <TaskDialog open={dialogOpen} task={editingTask} loading={createTask.isPending || updateTask.isPending || (editingId !== null && detailQuery.isLoading)} onClose={closeDialog} onSubmit={submitTask} />
    </div>
  );
}