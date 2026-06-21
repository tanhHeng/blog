<script setup lang="ts">
import { navItems } from "./homeData";
</script>

<template>
  <nav
    class="home-nav relative pointer-events-auto z-[8] mt-[clamp(30px,5.45vw,60px)] flex items-end gap-[clamp(22px,3.8vw,72px)] self-start text-white max-[860px]:mt-[30px] max-[860px]:justify-between max-[860px]:gap-3"
    aria-label="Primary navigation"
  >
    <a
      v-for="item in navItems"
      :key="item.label"
      class="nav-link relative grid min-w-[clamp(70px,4.9vw,88px)] gap-1 no-underline uppercase transition duration-200 max-[860px]:min-w-0"
      :href="item.href"
    >
      <span class="text-[clamp(0.72rem,0.84vw,1rem)] leading-none font-bold">{{ item.cjk }}</span>
      <span class="text-[clamp(1rem,1.45vw,1.55rem)] leading-none font-extrabold tracking-normal">{{
        item.label
      }}</span>
    </a>
  </nav>
</template>

<style scoped>
.home-nav {
  grid-column: var(--hero-nav-col);
  grid-row: var(--hero-nav-row);
}

.home-nav::before,
.home-nav::after {
  position: absolute;
  top: clamp(34px, 3.1vw, 37px);
  height: 2px;
  background: rgba(255, 255, 255, 0.9);
  content: "";
}

.home-nav::before {
  right: calc(100% - 72px);
  width: 120px;
}

.home-nav::after {
  left: calc(100% - 62px);
  width: 90px;
}

.nav-link::after {
  position: absolute;
  top: clamp(34px, 3.1vw, 37px);
  right: calc(100% - 4px);
  width: clamp(30px, 3vw, 58px);
  height: 2px;
  background: rgba(255, 255, 255, 0.86);
  content: "";
}

.nav-link:first-child::before {
  position: absolute;
  top: clamp(55px, 4.85vw, 58px);
  left: 0;
  width: clamp(70px, 3.85vw, 73px);
  height: 10px;
  background: #ffaae6;
  content: "";
}

.nav-link:hover,
.nav-link:focus-visible {
  color: #ffaae6;
  transform: translateY(-2px);
  outline: none;
}

@media (max-width: 860px) {
  .home-nav::before,
  .home-nav::after,
  .nav-link::after {
    display: none;
  }

  .nav-link:first-child::before {
    top: 48px;
    width: 52px;
    height: 7px;
  }
}
</style>
