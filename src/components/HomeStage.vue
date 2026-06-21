<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from "vue";
import AfterHero from "./home/AfterHero.vue";
import HeroBackdrop from "./home/HeroBackdrop.vue";
import HeroIntro from "./home/HeroIntro.vue";
import HomeNav from "./home/HomeNav.vue";
import MathOverlay from "./home/MathOverlay.vue";
import ScrollRail from "./home/ScrollRail.vue";
import WaveDivider from "./home/WaveDivider.vue";

defineProps<{
  illustrationUrl: string;
}>();

const railProgress = ref(0);

function updateRailProgress() {
  const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
  railProgress.value = maxScroll > 0 ? Math.min(1, window.scrollY / maxScroll) : 0.18;
}

function scrollToExplore() {
  document.querySelector("#after-hero")?.scrollIntoView({ behavior: "smooth", block: "start" });
}

onMounted(() => {
  updateRailProgress();
  window.addEventListener("scroll", updateRailProgress, { passive: true });
  window.addEventListener("resize", updateRailProgress);
});

onBeforeUnmount(() => {
  window.removeEventListener("scroll", updateRailProgress);
  window.removeEventListener("resize", updateRailProgress);
});
</script>

<template>
  <main class="home-root relative m-0 w-full max-w-none bg-white p-0 text-white">
    <section
      class="hero-stage relative isolate min-h-svh overflow-hidden bg-[#061449]"
      aria-labelledby="home-title"
    >
      <HeroBackdrop :illustration-url="illustrationUrl" />
      <div class="hero-layout absolute inset-0 z-[8] grid grid-cols-12 grid-rows-12">
        <HomeNav />
        <HeroIntro />
        <MathOverlay />
        <ScrollRail :progress="railProgress" @scroll-explore="scrollToExplore" />
      </div>
      <WaveDivider />
    </section>

    <AfterHero />
  </main>
</template>

<style scoped>
.home-root {
  font-family:
    Inter, Montserrat, "Noto Sans SC", "Microsoft YaHei", var(--font-atkinson), sans-serif;
}

.hero-stage {
  --hero-margin: clamp(40px, 4.17vw, 80px);
  --hero-gutter: clamp(18px, 1.25vw, 24px);
  --hero-nav-col: 1 / span 4;
  --hero-nav-row: 1 / span 1;
  --hero-intro-col: 1 / span 5;
  --hero-intro-row: 4 / span 4;
  --hero-math-col: 1 / -1;
  --hero-math-row: 1 / -1;
  --hero-rail-col: 12 / span 1;
  --hero-rail-row: 3 / span 8;

  height: min(1113px, max(760px, 100svh));
}

.hero-layout {
  column-gap: var(--hero-gutter);
  padding-inline: var(--hero-margin);
  pointer-events: none;
}

@media (max-width: 1180px) {
  .hero-stage {
    height: 900px;
    --hero-intro-col: 1 / span 6;
    --hero-rail-row: 3 / span 7;
  }
}

@media (max-width: 860px) {
  .hero-stage {
    --hero-margin: 24px;
    --hero-gutter: 16px;
    --hero-nav-col: 1 / -1;
    --hero-nav-row: 1 / span 1;
    --hero-intro-col: 1 / -1;
    --hero-intro-row: 3 / span 6;
    --hero-rail-col: 12 / span 1;
    --hero-rail-row: 8 / span 3;

    height: 920px;
    min-height: 920px;
  }
}

@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    scroll-behavior: auto !important;
    transition-duration: 1ms !important;
    animation-duration: 1ms !important;
  }
}
</style>
