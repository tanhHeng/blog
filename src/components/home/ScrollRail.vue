<script setup lang="ts">
import { computed } from "vue";

const props = defineProps<{
  progress: number;
}>();

const emit = defineEmits<{
  scrollExplore: [];
}>();

const railStyle = computed(() => ({
  transform: `scaleY(${Math.max(0.08, props.progress)})`,
}));
</script>

<template>
  <button
    class="scroll-rail relative pointer-events-auto z-[9] w-9 cursor-pointer self-stretch justify-self-end border-0 bg-transparent p-0 text-white max-[860px]:hidden"
    type="button"
    @click="emit('scrollExplore')"
    aria-label="Scroll to explore"
  >
    <span class="rail-menu" aria-hidden="true">
      <i></i>
      <i></i>
      <i></i>
    </span>
    <span class="rail-track" aria-hidden="true">
      <b :style="railStyle"></b>
    </span>
    <span class="rail-copy">← SCROLL TO EXPLORE</span>
  </button>
</template>

<style scoped>
.scroll-rail {
  grid-column: var(--hero-rail-col);
  grid-row: var(--hero-rail-row);
}

.scroll-rail:focus-visible {
  outline: 2px solid #ffaae6;
  outline-offset: 8px;
}

.rail-menu {
  position: absolute;
  top: 0;
  left: 12px;
  display: grid;
  gap: 96px;
}

.rail-menu i {
  width: 9px;
  height: 9px;
  background: #ffffff;
}

.rail-track {
  position: absolute;
  top: 90px;
  bottom: 90px;
  left: 16px;
  width: 3px;
  background: rgba(255, 170, 230, 0.82);
  transform-origin: center top;
}

.rail-track::before,
.rail-track::after {
  position: absolute;
  left: -4px;
  width: 11px;
  height: 11px;
  border: 3px solid #ffffff;
  background: #07144d;
  content: "";
  transform: rotate(45deg);
}

.rail-track::before {
  top: 12px;
}

.rail-track::after {
  bottom: 12px;
}

.rail-track b {
  position: absolute;
  inset: 0;
  display: block;
  background: #ffffff;
  opacity: 0.35;
  transform-origin: top;
}

.rail-copy {
  position: absolute;
  right: -9px;
  bottom: 34px;
  width: 220px;
  color: #ffffff;
  font-size: clamp(0.7rem, 0.86vw, 1rem);
  font-weight: 800;
  letter-spacing: 0.22em;
  text-align: right;
  transform: rotate(-90deg);
  transform-origin: right bottom;
}
</style>
