<template>
  <div>
    <div class="mb-8">
      <div class="flex items-center justify-between">
        <h2 class="text-2xl font-bold text-gray-900 dark:text-white">
          Scheduled Jobs
        </h2>
        <button @click="refreshData" class="btn btn-primary flex gap-1 items-center" :disabled="loading">
          <svg v-if="loading" class="animate-spin h-4 w-4 mr-1" xmlns="http://www.w3.org/2000/svg" fill="none"
            viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z">
            </path>
          </svg>
          <span v-else class="i-heroicons-arrow-path h-4 w-4 mr-1"></span>
          Refresh
        </button>
      </div>

      <div class="mt-4 flex flex-wrap gap-4">
        <div class="card flex-1 min-w-64">
          <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-2">Overall Status</h3>
          <div class="flex items-center mb-4">
            <StatusBadge :status="overallStatus" />
          </div>
          <p class="text-sm text-gray-500 dark:text-gray-400">
            <template v-if="missedJobCount > 0">
              {{ missedJobCount }} {{ missedJobCount === 1 ? 'job has' : 'jobs have' }} missed their scheduled run.
            </template>
            <template v-else-if="overallStatus === 'healthy'">
              All monitored jobs are running as scheduled.
            </template>
            <template v-else-if="overallStatus === 'warning'">
              Some jobs are approaching their expected run times.
            </template>
            <template v-else>
              No monitored jobs found or status unknown.
            </template>
          </p>
        </div>

        <div class="card flex-1 min-w-64">
          <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-2">Summary</h3>
          <div class="grid grid-cols-2 gap-2">
            <div>
              <p class="text-sm text-gray-500 dark:text-gray-400">Total Jobs</p>
              <p class="text-2xl font-semibold">{{ jobs.length }}</p>
            </div>
            <div>
              <p class="text-sm text-gray-500 dark:text-gray-400">Healthy</p>
              <p class="text-2xl font-semibold text-green-600 dark:text-green-400">
                {{ jobsByStatus.healthy.length }}
              </p>
            </div>
            <div>
              <p class="text-sm text-gray-500 dark:text-gray-400">Warning</p>
              <p class="text-2xl font-semibold text-yellow-600 dark:text-yellow-400">
                {{ jobsByStatus.warning.length }}
              </p>
            </div>
            <div>
              <p class="text-sm text-gray-500 dark:text-gray-400">Missed</p>
              <p class="text-2xl font-semibold text-red-600 dark:text-red-400">
                {{ jobsByStatus.missed.length }}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <JobStatusTable :jobs="jobs" :lastSyncedAt="lastSyncedAt" :loading="loading" />
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import { useJobStatus } from '~/composables/useJobStatus';
import JobStatusTable from '~/components/JobStatusTable.vue';
import StatusBadge from '~/components/StatusBadge.vue';

const {
  fetchStatus,
  loading,
  jobs,
  overallStatus,
  lastSyncedAt,
  missedJobs,
  missedJobCount,
  jobsByStatus
} = useJobStatus();

const refreshData = () => {
  fetchStatus();
};

onMounted(() => {
  fetchStatus();
  // Refresh data every minute
  const interval = setInterval(fetchStatus, 60000);

  // Clean up interval on component unmount
  onUnmounted(() => {
    clearInterval(interval);
  });
});
</script>