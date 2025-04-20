import { getDB, getJobs, getLatestSync } from '../database';
import { formatJobsWithStatus, getOverallStatus } from '../utils/status-calculator';

export default defineEventHandler(async (event) => {
  // Get query parameter for simplified response
  const query = getQuery(event);
  const simpleStatus = query.simple === 'true';

  const db = getDB(event.context.cloudflare.env);

  // Get all jobs
  const jobs = await getJobs(db);

  // Calculate status for each job
  const jobsWithStatus = formatJobsWithStatus(jobs);

  // Calculate overall status
  const { status, missedJobs } = getOverallStatus(jobsWithStatus);

  // Get last sync time
  const latestSync = await getLatestSync(db);
  console.log('Latest sync from status endpoint:', latestSync);

  const lastSyncedAt = latestSync?.syncedAt
    ? new Date(latestSync.syncedAt).toISOString()
    : null;

  // Return simplified response if requested
  if (simpleStatus) {
    return {
      status,
      lastSyncedAt
    };
  }

  // Return full response
  return {
    status,
    lastSyncedAt: lastSyncedAt,
    missedJobCount: missedJobs.length,
    missedJobs: missedJobs.map(job => job.name),
    jobs: jobsWithStatus.map(job => ({
      name: job.name,
      description: job.description,
      status: job.status,
      schedule: job.schedule,
      lastHeartbeat: job.lastHeartbeatFormatted,
      nextExpectedRun: job.nextRunFormatted,
      graceMinutes: job.graceMinutes,
      isMonitored: job.isMonitored
    }))
  };
});