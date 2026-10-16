<script setup>
defineProps({
  visible: { type: Boolean, default: false },
});
</script>

<template>
  <Transition
    leave-active-class="transition-opacity duration-700 ease-[var(--ease-standard)]"
    leave-to-class="opacity-0"
  >
    <div
      v-if="visible"
      class="bg-sky fixed inset-0 z-30 flex flex-col items-center justify-center gap-4"
      role="status"
      aria-live="polite"
    >
      <span class="loader-dot" aria-hidden="true" />
      <p class="text-2xl font-medium">Cargando…</p>
    </div>
  </Transition>
</template>

<style scoped>
.loader-dot {
  width: 3rem;
  height: 3rem;
  border-radius: 9999px;
  background: radial-gradient(circle at 35% 30%, var(--color-cream), var(--color-lilac) 60%, transparent 72%);
  box-shadow: inset 0 0 0 2px rgb(255 250 237 / 0.7);
  animation: loader-float 1.6s var(--ease-standard) infinite alternate;
}

@keyframes loader-float {
  to {
    transform: translateY(-0.75rem) scale(1.08);
  }
}
</style>
