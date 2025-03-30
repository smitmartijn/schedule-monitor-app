import { getNextRunDate } from './cron-parser';
import { Job } from '../database/schema';

export type JobStatus = 'healthy' | 'warning' | 'missed' | 'unknown';

export interface JobWithStatus extends Job {
  status: JobStatus;
  nextRunFormatted: string;
  lastHeartbeatFormatted: string | null;
}

export function calculateJobStatus(job: Job): JobStatus {
  if (!job.isMonitored) {
    return 'unknown';
  }

  // If no heartbeat has been received yet, mark as unknown instead of warning
  if (!job.lastHeartbeat) {
    return 'unknown';
  }

  if (!job.nextExpectedRun) {
    return 'unknown';
  }

  const now = Date.now();
  const gracePeriodMs = (job.graceMinutes || 15) * 60 * 1000;

  // If we're past the expected run + grace period, mark as missed
  if (job.nextExpectedRun + gracePeriodMs < now) {
    return 'missed';
  }

  // If we're past the expected run but within grace period, mark as warning
  if (job.nextExpectedRun < now) {
    return 'warning';
  }

  return 'healthy';
}

export function updateJobNextRun(job: Job): Job {
  // Calculate the next expected run time based on the cron expression
  if (!job.schedule) {
    return job;
  }

  const lastRunDate = job.lastHeartbeat ? new Date(job.lastHeartbeat) : undefined;
  const nextRunDate = getNextRunDate(job.schedule, lastRunDate);

  return {
    ...job,
    nextExpectedRun: nextRunDate.getTime()
  };
}

export function formatJobsWithStatus(jobs: Job[]): JobWithStatus[] {
  return jobs.map(job => {
    const updatedJob = updateJobNextRun(job);
    const status = calculateJobStatus(updatedJob);

    return {
      ...updatedJob,
      status,
      nextRunFormatted: updatedJob.nextExpectedRun
        ? new Date(updatedJob.nextExpectedRun).toISOString()
        : 'Unknown',
      lastHeartbeatFormatted: updatedJob.lastHeartbeat
        ? new Date(updatedJob.lastHeartbeat).toISOString()
        : null
    };
  });
}

export function getOverallStatus(jobs: JobWithStatus[]): {
  status: JobStatus;
  missedJobs: JobWithStatus[];
} {
  const monitoredJobs = jobs.filter(job => job.isMonitored);
  const missedJobs = monitoredJobs.filter(job => job.status === 'missed');

  if (missedJobs.length > 0) {
    return { status: 'missed', missedJobs };
  }

  const warningJobs = monitoredJobs.filter(job => job.status === 'warning');
  if (warningJobs.length > 0) {
    return { status: 'warning', missedJobs: [] };
  }

  if (monitoredJobs.length === 0) {
    return { status: 'unknown', missedJobs: [] };
  }

  // Check if all jobs are in 'unknown' status
  const unknownJobs = monitoredJobs.filter(job => job.status === 'unknown');
  if (unknownJobs.length === monitoredJobs.length) {
    return { status: 'unknown', missedJobs: [] };
  }

  return { status: 'healthy', missedJobs: [] };
}