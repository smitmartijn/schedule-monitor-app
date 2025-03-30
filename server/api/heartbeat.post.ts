import { z } from 'zod';
import { eq } from 'drizzle-orm';
import { getDB, recordHeartbeat } from '../database';
import * as schema from '../database/schema';
import { updateJobNextRun } from '../utils/status-calculator';

// Define schema for input validation
const HeartbeatSchema = z.object({
  job: z.string(),
  runtime: z.number().optional(),
  status: z.enum(['success', 'failure']).optional()
});

export default defineEventHandler(async (event) => {
  // Validation already handled by auth middleware
  const body = await readBody(event);

  // Validate input
  const result = HeartbeatSchema.safeParse(body);
  if (!result.success) {
    return createError({
      statusCode: 400,
      statusMessage: 'Bad Request',
      message: 'Invalid request body'
    });
  }

  const db = getDB(event.context.cloudflare.env);

  // Look up job by name
  const jobs = await db.select()
    .from(schema.jobs)
    .where(eq(schema.jobs.name, result.data.job));

  if (jobs.length === 0) {
    return createError({
      statusCode: 404,
      statusMessage: 'Not Found',
      message: `Job "${result.data.job}" not found`
    });
  }

  const job = jobs[0];

  // Record heartbeat
  await recordHeartbeat(
    db,
    job.id,
    result.data.runtime,
    result.data.status || 'success'
  );

  // Update next expected run
  const updatedJob = updateJobNextRun({
    ...job,
    lastHeartbeat: Date.now()
  });

  await db.update(schema.jobs)
    .set({
      nextExpectedRun: updatedJob.nextExpectedRun,
      updatedAt: Date.now()
    })
    .where(eq(schema.jobs.id, job.id));

  return {
    success: true,
    job: job.name,
    receivedAt: new Date().toISOString(),
    nextExpectedRun: updatedJob.nextExpectedRun
      ? new Date(updatedJob.nextExpectedRun).toISOString()
      : null
  };
});