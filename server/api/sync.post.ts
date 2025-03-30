import { z } from 'zod';
import { eq, not, inArray } from 'drizzle-orm';
import { getDB, getJobs, recordSync } from '../database/index';
import * as schema from '../database/schema';
import { updateJobNextRun } from '../utils/status-calculator';

// Define schema for input validation
const JobSchema = z.object({
  name: z.string(),
  description: z.string().optional(),
  schedule: z.string(),
  graceMinutes: z.number().optional(),
  isMonitored: z.boolean().optional()
});

const SyncSchema = z.object({
  jobs: z.array(JobSchema)
});

export default defineEventHandler(async (event) => {
  // Validation already handled by auth middleware
  const body = await readBody(event);

  // Validate input
  const result = SyncSchema.safeParse(body);
  if (!result.success) {
    return createError({
      statusCode: 400,
      statusMessage: 'Bad Request',
      message: 'Invalid request body'
    });
  }

  // Get client IP
  const sourceIp = getRequestHeader(event, 'x-forwarded-for') || null;

  const db = getDB(event.context.cloudflare.env);

  // Get all existing job names to track what should be removed
  const existingJobs = await getJobs(db);
  const existingJobNames = existingJobs.map(job => job.name);
  const incomingJobNames = result.data.jobs.map(job => job.name);

  // Track created, updated, and removed jobs
  let created = 0;
  let updated = 0;
  let removed = 0;

  // Process each job in the incoming data
  for (const jobData of result.data.jobs) {
    // Check if job already exists (by name)
    const existingJobs = await db.select()
      .from(schema.jobs)
      .where(eq(schema.jobs.name, jobData.name));

    if (existingJobs.length > 0) {
      // Update existing job
      const existingJob = existingJobs[0];
      await db.update(schema.jobs)
        .set({
          schedule: jobData.schedule,
          description: jobData.description,
          graceMinutes: jobData.graceMinutes,
          isMonitored: jobData.isMonitored ?? true,
          updatedAt: Date.now()
        })
        .where(eq(schema.jobs.id, existingJob.id));

      // Update next expected run
      const updatedJob = {
        ...existingJob,
        schedule: jobData.schedule,
        graceMinutes: jobData.graceMinutes
      };

      await db.update(schema.jobs)
        .set({
          nextExpectedRun: updateJobNextRun(updatedJob).nextExpectedRun
        })
        .where(eq(schema.jobs.id, existingJob.id));

      updated++;
    } else {
      // Create new job
      const jobWithNextRun = updateJobNextRun({
        id: '',
        name: jobData.name,
        description: jobData.description,
        schedule: jobData.schedule,
        lastHeartbeat: null,
        nextExpectedRun: null,
        graceMinutes: jobData.graceMinutes,
        isMonitored: jobData.isMonitored ?? true,
        createdAt: Date.now(),
        updatedAt: Date.now()
      });

      await db.insert(schema.jobs).values({
        id: crypto.randomUUID(),
        name: jobData.name,
        description: jobData.description,
        schedule: jobData.schedule,
        nextExpectedRun: jobWithNextRun.nextExpectedRun,
        graceMinutes: jobData.graceMinutes,
        isMonitored: jobData.isMonitored ?? true,
        createdAt: Date.now(),
        updatedAt: Date.now()
      });

      created++;
    }
  }

  // Remove jobs that are no longer in the incoming list
  const jobsToRemove = existingJobNames.filter(name => !incomingJobNames.includes(name));

  if (jobsToRemove.length > 0) {
    // Delete associated heartbeats first (to maintain referential integrity)
    for (const jobName of jobsToRemove) {
      const jobToRemove = existingJobs.find(job => job.name === jobName);
      if (jobToRemove) {
        await db.delete(schema.heartbeats)
          .where(eq(schema.heartbeats.jobId, jobToRemove.id));
      }
    }

    // Now delete the jobs
    const deleteResult = await db.delete(schema.jobs)
      .where(inArray(schema.jobs.name, jobsToRemove))
      .returning();

    removed = deleteResult.length;
  }

  // Record the sync
  const syncLogId = await recordSync(db, sourceIp, result.data.jobs.length);

  // Get the newly created sync log for the response
  const syncLog = await db.select()
      .from(schema.syncLogs)
      .where(eq(schema.syncLogs.id, syncLogId))
      .limit(1);

  const syncedAt = syncLog.length > 0
      ? new Date(syncLog[0].syncedAt).toISOString()
      : new Date().toISOString();

  return {
    success: true,
    syncedAt: new Date().toISOString(),
    jobCount: result.data.jobs.length,
    stats: {
      created,
      updated,
      removed
    }
  };
});