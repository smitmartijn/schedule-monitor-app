<template>
  <span :title="fullDate" :class="{ 'text-gray-500': !value }">
    {{ formattedDate }}
  </span>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue';
import { formatDistanceToNow, parseISO } from 'date-fns';

const props = defineProps<{
  value: string | null
}>();

const formattedDate = ref('');
const fullDate = ref('');
let interval: NodeJS.Timeout | null = null;

const updateTime = () => {
  if (!props.value) {
    formattedDate.value = 'Never';
    fullDate.value = 'Never';
    return;
  }

  try {
    const date = parseISO(props.value);
    formattedDate.value = formatDistanceToNow(date, { addSuffix: true });
    fullDate.value = date.toLocaleString();
  } catch (e) {
    formattedDate.value = props.value || 'Invalid date';
    fullDate.value = props.value || 'Invalid date';
  }
};

onMounted(() => {
  updateTime();
  interval = setInterval(updateTime, 60000); // Update every minute
});

onUnmounted(() => {
  if (interval) {
    clearInterval(interval);
  }
});
</script>