<template>
  <span :class="[
    'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
    statusClasses
  ]">
    <span :class="['w-2 h-2 mr-1.5 rounded-full', dotClass]"></span>
    {{ statusText }}
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
  status: 'healthy' | 'warning' | 'missed' | 'unknown'
}>();

const statusClasses = computed(() => {
  switch (props.status) {
    case 'healthy':
      return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
    case 'warning':
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
    case 'missed':
      return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
    case 'unknown':
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
  }
});

const dotClass = computed(() => {
  switch (props.status) {
    case 'healthy':
      return 'bg-green-400';
    case 'warning':
      return 'bg-yellow-400';
    case 'missed':
      return 'bg-red-400';
    case 'unknown':
    default:
      return 'bg-gray-400';
  }
});

const statusText = computed(() => {
  switch (props.status) {
    case 'healthy':
      return 'Healthy';
    case 'warning':
      return 'Warning';
    case 'missed':
      return 'Missed';
    case 'unknown':
    default:
      return 'Unknown';
  }
});
</script>