<script setup lang="ts">
defineProps<{
  illustrationUrl: string;
}>();
</script>

<template>
  <img
    class="absolute inset-x-0 top-0 z-0 h-[calc(100%-clamp(20px,2vw,33px))] w-full object-cover object-top opacity-90 saturate-[1.08] contrast-[1.04]"
    :src="illustrationUrl"
    alt=""
    loading="eager"
  />
  <div class="stage-tint absolute inset-0 z-[1]" aria-hidden="true"></div>
  <div
    class="blueprint-grid absolute inset-0 z-[2] pointer-events-none opacity-90 mix-blend-screen"
    aria-hidden="true"
  ></div>
  <div class="stage-markers absolute z-[8] grid gap-[19px] max-[860px]:hidden" aria-hidden="true">
    <span class="block size-3 bg-white"></span>
    <span class="block size-3 bg-white"></span>
    <span class="block size-3 bg-white"></span>
  </div>
</template>

<style scoped>
.stage-tint {
  background:
    radial-gradient(42% 54% at 54% 42%, rgba(6, 20, 73, 0), rgba(6, 20, 73, 0.36) 70%),
    linear-gradient(
      90deg,
      rgba(6, 20, 73, 0.94),
      rgba(6, 20, 73, 0.2) 30%,
      rgba(6, 20, 73, 0.1) 72%,
      rgba(6, 20, 73, 0.94)
    ),
    linear-gradient(180deg, rgba(6, 20, 73, 0.1), rgba(6, 20, 73, 0.04) 54%, rgba(6, 20, 73, 0.62));
}

.blueprint-grid {
  background-image:
    linear-gradient(rgba(186, 207, 255, 0.12) 1px, transparent 1px),
    linear-gradient(90deg, rgba(186, 207, 255, 0.12) 1px, transparent 1px),
    linear-gradient(
      45deg,
      transparent 49.3%,
      rgba(186, 207, 255, 0.1) 49.7%,
      rgba(186, 207, 255, 0.1) 50.3%,
      transparent 50.7%
    );
  background-size:
    162px 162px,
    162px 162px,
    162px 162px;
  background-position:
    -60px -44px,
    -60px -44px,
    20px -124px;
}

.stage-markers {
  top: calc(100% / 12 * 0.65);
  right: calc(var(--hero-margin) * 0.8);
}

@media (max-width: 860px) {
  img {
    height: 100%;
    object-position: 57% top;
  }

  .stage-tint {
    background:
      linear-gradient(
        90deg,
        rgba(6, 20, 73, 0.94),
        rgba(6, 20, 73, 0.42) 68%,
        rgba(6, 20, 73, 0.72)
      ),
      linear-gradient(180deg, rgba(6, 20, 73, 0.12), rgba(6, 20, 73, 0.66));
  }
}
</style>
