import {
  pgTable,
  uuid,
  text,
  boolean,
  integer,
  timestamp,
  index,
} from "drizzle-orm/pg-core";
import { profiles } from "./users";

export const workflows = pgTable(
  "workflows",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),

    name: text("name").notNull(),
    description: text("description"),

    // Lifecycle state machine: draft → published ⇄ paused
    // draft     — editable, not scheduled, does not respond to webhooks
    // published — live; isActive=true; increments version on each publish
    // paused    — frozen; isActive=false; can be resumed without re-publishing
    status: text("status").default("draft").notNull(),

    // Monotonically increasing counter; incremented on each publish action
    version: integer("version").default(0).notNull(),

    // Timestamp of the most recent publish action
    publishedAt: timestamp("published_at", { withTimezone: true }),

    // Active flag: only active workflows respond to webhooks and cron
    isActive: boolean("is_active").default(false).notNull(),

    // Stable secret for webhook authentication
    // Format: whsec_<uuid> — generated on workflow creation, never changed
    webhookSecret: text("webhook_secret").notNull(),

    // Cron expression — stored here for quick scheduler access
    // null means no cron trigger configured
    cronExpression: text("cron_expression"),

    // Soft delete — keeps run history intact after user "deletes" workflow
    deletedAt: timestamp("deleted_at", { withTimezone: true }),

    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    // Workflows: user's workflow list (most common query)
    userIdIdx: index("idx_workflows_user_id").on(table.userId),

    // Workflows: cron scheduler lookup (only active ones)
    activeIdx: index("idx_workflows_active_cron").on(
      table.isActive,
      table.cronExpression,
    ),
  }),
);

export type Workflow = typeof workflows.$inferSelect;
export type NewWorkflow = typeof workflows.$inferInsert;
