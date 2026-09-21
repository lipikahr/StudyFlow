import { useEffect, useState, type FormEvent } from 'react';
import { CalendarDays, Check, ChevronDown, Loader2, X } from 'lucide-react';
import type { Task, TaskCategory, TaskInput, TaskPriority } from '@workspace/api-client-react';

type TaskDialogProps = {
  open: boolean;
  task?: Task | null;
  loading?: boolean;
  onClose: () => void;
  onSubmit: (data: TaskInput) => void;
};

const categories: TaskCategory[] = ['DSA', 'Academics', 'Projects', 'Placement', 'Personal'];
const priorities: TaskPriority[] = ['low', 'medium', 'high'];

export function TaskDialog({ open, task, loading, onClose, onSubmit }: TaskDialogProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<TaskCategory>('Academics');
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [dueDate, setDueDate] = useState('');

  useEffect(() => {
    if (!open) return;
    setTitle(task?.title ?? '');
    setDescription(task?.description ?? '');
    setCategory(task?.category ?? 'Academics');
    setPriority(task?.priority ?? 'medium');
    setDueDate(task?.dueDate ? task.dueDate.slice(0, 10) : '');
  }, [open, task]);

  if (!open) return null;
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!title.trim()) return;
    onSubmit({
      title: title.trim(),
      description: description.trim() || undefined,
      category,
      priority,
      dueDate: dueDate || undefined,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-[#162039]/35 p-0 backdrop-blur-[3px] sm:items-center sm:p-5" role="dialog" aria-modal="true">
      <div className="w-full max-w-xl animate-dialog rounded-t-[1.6rem] border border-border bg-card shadow-2xl sm:rounded-[1.6rem]">
        <div className="flex items-center justify-between border-b border-border px-5 py-4 sm:px-7">
          <div>
            <p className="eyebrow">{task ? 'Refine the plan' : 'Make room for progress'}</p>
            <h2 className="font-serif text-2xl font-semibold text-foreground">{task ? 'Edit task' : 'New task'}</h2>
          </div>
          <button type="button" onClick={onClose} className="icon-button" aria-label="Close task dialog" data-testid="button-close-task-dialog"><X size={18} /></button>
        </div>
        <form onSubmit={submit} className="space-y-5 p-5 sm:p-7">
          <label className="field-label">What needs your attention?
            <input autoFocus value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Solve two graph problems" className="field-input text-base" maxLength={160} data-testid="input-task-title" />
          </label>
          <label className="field-label">A little context <span className="font-normal normal-case tracking-normal text-muted-foreground">(optional)</span>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Add a useful note, link, or definition of done" className="field-input min-h-20 resize-none" maxLength={1000} data-testid="input-task-description" />
          </label>
          <div className="grid gap-4 sm:grid-cols-3">
            <label className="field-label">Area
              <span className="select-wrap"><select value={category} onChange={(e) => setCategory(e.target.value as TaskCategory)} className="field-input appearance-none pr-9" data-testid="select-task-category">{categories.map((item) => <option key={item} value={item}>{item}</option>)}</select><ChevronDown size={15} /></span>
            </label>
            <label className="field-label">Priority
              <span className="select-wrap"><select value={priority} onChange={(e) => setPriority(e.target.value as TaskPriority)} className="field-input appearance-none pr-9" data-testid="select-task-priority">{priorities.map((item) => <option key={item} value={item}>{item[0].toUpperCase() + item.slice(1)}</option>)}</select><ChevronDown size={15} /></span>
            </label>
            <label className="field-label">Due date
              <span className="input-with-icon"><CalendarDays size={15} /><input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="field-input pl-9" data-testid="input-task-due-date" /></span>
            </label>
          </div>
          <div className="flex flex-col-reverse gap-2 pt-1 sm:flex-row sm:justify-end">
            <button type="button" onClick={onClose} className="button button-quiet" data-testid="button-cancel-task">Cancel</button>
            <button type="submit" disabled={loading || !title.trim()} className="button button-primary min-w-32" data-testid="button-save-task">
              {loading ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
              {task ? 'Save changes' : 'Add task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}