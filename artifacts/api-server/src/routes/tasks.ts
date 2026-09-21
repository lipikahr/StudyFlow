import { and, asc, desc, eq, ilike, sql } from "drizzle-orm";
import { Router, type IRouter } from "express";
import { db, tasksTable } from "@workspace/db";
import {
  CreateTaskBody,
  CreateTaskResponse,
  DeleteTaskParams,
  GetDashboardSummaryResponse,
  GetTaskParams,
  GetTaskResponse,
  ListTasksQueryParams,
  ListTasksResponse,
  ToggleTaskParams,
  ToggleTaskResponse,
  UpdateTaskBody,
  UpdateTaskParams,
  UpdateTaskResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

function toDateOnly(value: Date | undefined | null): string | null {
  if (!value) return null;
  return value.toISOString().slice(0, 10);
}

function parseId(raw: string | string[]): number | null {
  const value = Number(Array.isArray(raw) ? raw[0] : raw);
  return Number.isInteger(value) && value > 0 ? value : null;
}

router.get("/tasks", async (req, res): Promise<void> => {
  const parsedQuery = ListTasksQueryParams.safeParse(req.query);
  if (!parsedQuery.success) {
    res.status(400).json({ error: parsedQuery.error.message });
    return;
  }

  const { category, status, search, sort } = parsedQuery.data;
  const filters = [];
  if (category) filters.push(eq(tasksTable.category, category));
  if (status === "active") filters.push(eq(tasksTable.completed, false));
  if (status === "completed") filters.push(eq(tasksTable.completed, true));
  if (search) filters.push(ilike(tasksTable.title, `%${search}%`));

  const priorityOrder = sql<number>`case ${tasksTable.priority} when 'high' then 1 when 'medium' then 2 else 3 end`;
  const orderBy =
    sort === "dueDate"
      ? [asc(tasksTable.dueDate), desc(tasksTable.createdAt)]
      : sort === "newest"
        ? [desc(tasksTable.createdAt)]
        : [asc(tasksTable.completed), asc(priorityOrder), asc(tasksTable.dueDate), desc(tasksTable.createdAt)];

  const tasks = await db
    .select()
    .from(tasksTable)
    .where(filters.length ? and(...filters) : undefined)
    .orderBy(...orderBy);

  res.json(ListTasksResponse.parse(tasks));
});

router.post("/tasks", async (req, res): Promise<void> => {
  const parsed = CreateTaskBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [task] = await db
    .insert(tasksTable)
    .values({
      title: parsed.data.title.trim(),
      description: parsed.data.description?.trim() || null,
      category: parsed.data.category,
      priority: parsed.data.priority,
      dueDate: toDateOnly(parsed.data.dueDate),
    })
    .returning();

  res.status(201).json(CreateTaskResponse.parse(task));
});

router.get("/tasks/:id", async (req, res): Promise<void> => {
  const parsed = GetTaskParams.safeParse({ id: parseId(req.params.id) });
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [task] = await db.select().from(tasksTable).where(eq(tasksTable.id, parsed.data.id));
  if (!task) {
    res.status(404).json({ error: "Task not found" });
    return;
  }

  res.json(GetTaskResponse.parse(task));
});

router.patch("/tasks/:id", async (req, res): Promise<void> => {
  const parsedParams = UpdateTaskParams.safeParse({ id: parseId(req.params.id) });
  if (!parsedParams.success) {
    res.status(400).json({ error: parsedParams.error.message });
    return;
  }

  const parsedBody = UpdateTaskBody.safeParse(req.body);
  if (!parsedBody.success) {
    res.status(400).json({ error: parsedBody.error.message });
    return;
  }

  const update = {
    ...(parsedBody.data.title !== undefined ? { title: parsedBody.data.title.trim() } : {}),
    ...(parsedBody.data.description !== undefined
      ? { description: parsedBody.data.description.trim() || null }
      : {}),
    ...(parsedBody.data.category !== undefined ? { category: parsedBody.data.category } : {}),
    ...(parsedBody.data.priority !== undefined ? { priority: parsedBody.data.priority } : {}),
    ...(parsedBody.data.dueDate !== undefined ? { dueDate: toDateOnly(parsedBody.data.dueDate) } : {}),
    ...(parsedBody.data.completed !== undefined
      ? {
          completed: parsedBody.data.completed,
          completedAt: parsedBody.data.completed ? new Date() : null,
        }
      : {}),
    updatedAt: new Date(),
  };

  const [task] = await db
    .update(tasksTable)
    .set(update)
    .where(eq(tasksTable.id, parsedParams.data.id))
    .returning();

  if (!task) {
    res.status(404).json({ error: "Task not found" });
    return;
  }

  res.json(UpdateTaskResponse.parse(task));
});

router.delete("/tasks/:id", async (req, res): Promise<void> => {
  const parsed = DeleteTaskParams.safeParse({ id: parseId(req.params.id) });
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [task] = await db.delete(tasksTable).where(eq(tasksTable.id, parsed.data.id)).returning();
  if (!task) {
    res.status(404).json({ error: "Task not found" });
    return;
  }

  res.sendStatus(204);
});

router.patch("/tasks/:id/toggle", async (req, res): Promise<void> => {
  const parsed = ToggleTaskParams.safeParse({ id: parseId(req.params.id) });
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [current] = await db.select().from(tasksTable).where(eq(tasksTable.id, parsed.data.id));
  if (!current) {
    res.status(404).json({ error: "Task not found" });
    return;
  }

  const [task] = await db
    .update(tasksTable)
    .set({
      completed: !current.completed,
      completedAt: current.completed ? null : new Date(),
      updatedAt: new Date(),
    })
    .where(eq(tasksTable.id, parsed.data.id))
    .returning();

  res.json(ToggleTaskResponse.parse(task));
});

router.get("/dashboard/summary", async (_req, res): Promise<void> => {
  const tasks = await db
    .select()
    .from(tasksTable)
    .orderBy(asc(tasksTable.completed), asc(tasksTable.dueDate), desc(tasksTable.createdAt));

  const completed = tasks.filter((task) => task.completed).length;
  const active = tasks.length - completed;
  const categories = ["DSA", "Academics", "Projects", "Placement", "Personal"] as const;
  const categorySummaries = categories.map((category) => {
    const categoryTasks = tasks.filter((task) => task.category === category);
    const categoryCompleted = categoryTasks.filter((task) => task.completed).length;
    return {
      category,
      total: categoryTasks.length,
      completed: categoryCompleted,
      active: categoryTasks.length - categoryCompleted,
    };
  });

  res.json(
    GetDashboardSummaryResponse.parse({
      total: tasks.length,
      completed,
      active,
      completionRate: tasks.length ? Math.round((completed / tasks.length) * 100) : 0,
      highPriorityActive: tasks.filter((task) => !task.completed && task.priority === "high").length,
      categorySummaries,
      upcoming: tasks.filter((task) => !task.completed && task.dueDate).slice(0, 4),
    }),
  );
});

export default router;