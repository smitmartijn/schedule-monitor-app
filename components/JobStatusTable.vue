<template>
  <div class="overflow-hidden bg-white dark:bg-gray-800 shadow-sm sm:rounded-lg">
    <div v-if="loading" class="p-6 text-center text-gray-500">
      Loading job data...
    </div>
    <table v-else class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
      <thead class="bg-gray-50 dark:bg-gray-700">
        <tr>
          <th scope="col" class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white">
            Status
          </th>
          <th scope="col" class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white">
            Job Name
          </th>
          <th scope="col" class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white">
            Schedule
          </th>
          <th scope="col" class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white">
            Last Heartbeat
          </th>
          <th scope="col" class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white">
            Next Expected Run
          </th>
          <th scope="col" class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white">
            Grace Period
          </th>
        </tr>
      </thead>
      <tbody class="divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-800">
        <tr v-for="job in jobs" :key="job.name" class="hover:bg-gray-50 dark:hover:bg-gray-700">
          <td class="whitespace-nowrap px-3 py-4 text-sm">
            <StatusBadge :status="job.status" />
          </td>
          <td class="whitespace-nowrap px-3 py-4 text-sm font-medium text-gray-900 dark:text-white">
            {{ formatJobName(job.name) }}
            <p v-if="job.description" class="text-xs text-gray-500 mt-0.5 truncate max-w-sm">
              {{ job.description }}
            </p>
          </td>
          <td class="whitespace-nowrap px-3 py-4 text-sm text-gray-500 dark:text-gray-400">
            {{ job.schedule }}
          </td>
          <td class="whitespace-nowrap px-3 py-4 text-sm text-gray-500 dark:text-gray-400">
            <TimeAgo :value="job.lastHeartbeat" />
          </td>
          <td class="whitespace-nowrap px-3 py-4 text-sm text-gray-500 dark:text-gray-400">
            <TimeAgo :value="job.nextExpectedRun" />
          </td>
          <td class="whitespace-nowrap px-3 py-4 text-sm text-gray-500 dark:text-gray-400">
            {{ job.graceMinutes }} min
          </td>
        </tr>
        <tr v-if="jobs.length === 0">
          <td colspan="6" class="px-3 py-4 text-sm text-center text-gray-500 dark:text-gray-400">
            No scheduled jobs found
          </td>
        </tr>
      </tbody>
    </table>
    <div v-if="lastSyncedAt"
      class="p-4 border-t border-gray-200 dark:border-gray-700 text-sm text-gray-500 dark:text-gray-400">
      Last synced:
      <TimeAgo :value="lastSyncedAt" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import StatusBadge from './StatusBadge.vue';
import TimeAgo from './TimeAgo.vue';

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

const jobs = ref<Job[]>([]);
const lastSyncedAt = ref<string | null>(null);
const loading = ref(true);

const fetchData = async () => {
  loading.value = true;
  try {
    const res = await fetch('/api/status');
    const data = await res.json();
    jobs.value = data.jobs;
    lastSyncedAt.value = data.lastSyncedAt;
  } catch (error) {
    console.error('Failed to fetch job status:', error);
  } finally {
    loading.value = false;
  }
};

// Format job name to make it more readable (for Laravel job classes)
function formatJobName(name: string): string {
  // Handle fully qualified class names with namespaces
  if (name.includes('\\')) {
    // Get just the class name (last part after \)
    const parts = name.split('\\');
    return parts[parts.length - 1];
  }

  return name;
}

onMounted(() => {
  fetchData();
  // Refresh data every minute
  setInterval(fetchData, 60000);
});
</script>