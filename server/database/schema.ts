import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

export const jobs = sqliteTable('jobs', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  schedule: text('schedule').notNull(),
  lastHeartbeat: integer('last_heartbeat'),
  nextExpectedRun: integer('next_expected_run'),
  graceMinutes: integer('grace_minutes').default(15),
  isMonitored: integer('is_monitored', { mode: 'boolean' }).default(true),
  createdAt: integer('created_at'),
  updatedAt: integer('updated_at')
});

export const heartbeats = sqliteTable('heartbeats', {
  id: text('id').primaryKey(),
  jobId: text('job_id').notNull(),
  receivedAt: integer('received_at').notNull(),
  runtime: integer('runtime'),
  status: text('status').default('success') // 'success', 'failure'
});

export const syncLogs = sqliteTable('sync_logs', {
  id: text('id').primaryKey(),
  syncedAt: integer('synced_at').notNull(),
  sourceIp: text('source_ip'),
  jobCount: integer('job_count')
});

// Types
export type Job = typeof jobs.$inferSelect;
export type NewJob = typeof jobs.$inferInsert;

export type Heartbeat = typeof heartbeats.$inferSelect;
export type NewHeartbeat = typeof heartbeats.$inferInsert;

export type SyncLog = typeof syncLogs.$inferSelect;
export type NewSyncLog = typeof syncLogs.$inferInsert;