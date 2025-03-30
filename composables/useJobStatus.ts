import { ref, computed } from 'vue';

interface Job {
  name: string;
  description?: string;
  status: 'healthy' | 'warning' | 'missed' | 'unknown';
  schedule: string;
  lastHeartbeat: string | null;
  nextExpectedRun: string | null;
  graceMinutes: number;
  isMonitored: boolean;
}

interface StatusResponse {
  status: 'healthy' | 'warning' | 'missed' | 'unknown';
  lastSyncedAt: string | null;
  missedJobCount: number;
  missedJobs: string[];
  jobs: Job[];
}

export function useJobStatus() {
  const data = ref<StatusResponse | null>(null);
  const loading = ref(false);
  const error = ref<string | null>(null);

  const fetchStatus = async () => {
    loading.value = true;
    error.value = null;

    try {
      const response = await fetch('/api/status');

      if (!response.ok) {
        throw new Error(`HTTP error ${response.status}`);
      }

      data.value = await response.json();
    } catch (err) {
      console.error('Error fetching job status:', err);
      error.value = err instanceof Error ? err.message : 'Unknown error';
    } finally {
      loading.value = false;
    }
  };

  const jobs = computed(() => data.value?.jobs || []);
  const overallStatus = computed(() => data.value?.status || 'unknown');
  const lastSyncedAt = computed(() => data.value?.lastSyncedAt);
  const missedJobs = computed(() => data.value?.missedJobs || []);
  const missedJobCount = computed(() => data.value?.missedJobCount || 0);

  // Group jobs by status
  const jobsByStatus = computed(() => {
    const result = {
      healthy: [] as Job[],
      warning: [] as Job[],
      missed: [] as Job[],
      unknown: [] as Job[]
    };

    if (jobs.value) {
      jobs.value.forEach(job => {
        result[job.status].push(job);
      });
    }

    return result;
  });

  return {
    fetchStatus,
    loading,
    error,
    jobs,
    overallStatus,
    lastSyncedAt,
    missedJobs,
    missedJobCount,
    jobsByStatus
  };
}