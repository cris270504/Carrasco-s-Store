<script setup lang="ts">
defineProps<{ type: 'physical' | 'digital' | 'service', size?: number }>()
</script>

<template>
  <svg v-if="type === 'physical'" :width="size ?? 32" :height="size ?? 32" viewBox="0 0 24 24" fill="none">
    <path d="M3 8l9-4 9 4-9 4-9-4Z" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round" />
    <path d="M3 8v8l9 4 9-4V8" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round" />
    <path d="M12 12v8" stroke="currentColor" stroke-width="1.6" />
  </svg>
  <svg v-else-if="type === 'digital'" :width="size ?? 32" :height="size ?? 32" viewBox="0 0 24 24" fill="none">
    <circle cx="8" cy="15" r="4" stroke="currentColor" stroke-width="1.6" />
    <path d="M11 12l9-9M17 6l3 3M14 9l2.5 2.5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" />
  </svg>
  <svg v-else :width="size ?? 32" :height="size ?? 32" viewBox="0 0 24 24" fill="none">
    <path
      d="M14.5 6.5a3.5 3.5 0 0 1-4.6 4.6L4 17l3 3 5.9-5.9a3.5 3.5 0 0 1 4.6-4.6L21 6l-3-3-3.5 3.5Z"
      stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"
    />
  </svg>
</template>
