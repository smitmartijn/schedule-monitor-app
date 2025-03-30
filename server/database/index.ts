import { drizzle } from 'drizzle-orm/d1';
import { eq, desc } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';
import * as schema from './schema';

// This will be available in the runtime context
declare global {
  interface Env {
    DB: D1Database;
  }
}

export function getDB(env: Env) {
  return drizzle(env.DB, { schema });
}

export async function getJobs(db: ReturnType<typeof getDB>) {
  return await db.select().from(schema.jobs);
}

export async function getJob(db: ReturnType<typeof getDB>, id: string) {
  return await db.select().from(schema.jobs).where(eq(schema.jobs.id, id));
}

export async function createJob(db: ReturnType<typeof getDB>, job: Omit<schema.NewJob, 'id' | 'createdAt' | 'updatedAt'>) {
  const now = Date.now();
  const id = uuidv4();

  await db.insert(schema.jobs).values({
    ...job,
    id,
    createdAt: now,
    updatedAt: now
  });

  return id;
}

export async function updateJob(db: ReturnType<typeof getDB>, id: string, job: Partial<Omit<schema.NewJob, 'id' | 'createdAt'>>) {
  await db.update(schema.jobs)
    .set({
      ...job,
      updatedAt: Date.now()
    })
    .where(eq(schema.jobs.id, id));
}

export async function recordHeartbeat(db: ReturnType<typeof getDB>, jobId: string, runtime?: number, status: string = 'success') {
  const now = Date.now();
  const id = uuidv4();

  await db.insert(schema.heartbeats).values({
    id,
    jobId,
    receivedAt: now,
    runtime,
    status
  });

  await db.update(schema.jobs)
    .set({
      lastHeartbeat: now,
      updatedAt: now
    })
    .where(eq(schema.jobs.id, jobId));

  return id;
}

export async function recordSync(db: ReturnType<typeof getDB>, sourceIp: string | null, jobCount: number) {
  const now = Date.now();
  const id = uuidv4();

  await db.insert(schema.syncLogs).values({
    id,
    syncedAt: now,
    sourceIp,
    jobCount
  });

  return id;
}

export async function getLatestSync(db: ReturnType<typeof getDB>) {
  try {
    const logs = await db.select()
      .from(schema.syncLogs)
      .orderBy(desc(schema.syncLogs.syncedAt))
      .limit(1);

    console.log('Latest sync log:', logs);
    return logs[0] || null;
  } catch (error) {
    console.error('Error fetching latest sync log:', error);
    return null;
  }
}