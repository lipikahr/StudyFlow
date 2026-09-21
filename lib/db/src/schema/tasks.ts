import { createInsertSchema } from "drizzle-zod";
import { boolean, date, integer, pgEnum, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { z } from "zod/v4";

export const taskCategoryEnum = pgEnum("task_category", [
  "DSA",
  "Academics",
  "Projects",
  "Placement",
  "Personal",
]);

export const taskPriorityEnum = pgEnum("task_priority", ["low", "medium", "high"]);

export const tasksTable = pgTable("tasks", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  title: text("title").notNull(),
  description: text("description"),
  category: taskCategoryEnum("category").notNull(),
  priority: taskPriorityEnum("priority").notNull().default("medium"),
  dueDate: date("due_date", { mode: "string" }),
  completed: boolean("completed").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
  completedAt: timestamp("completed_at", { withTimezone: true }),
});

export const insertTaskSchema = createInsertSchema(tasksTable).omit({
  createdAt: true,
  updatedAt: true,
  completedAt: true,
});

export type InsertTask = z.infer<typeof insertTaskSchema>;
export type Task = typeof tasksTable.$inferSelect;