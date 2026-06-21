<script setup lang="ts">
import { afterCards } from "./homeData";
</script>

<template>
  <section
    id="after-hero"
    class="after-hero relative z-[11] bg-white px-[clamp(24px,6vw,112px)] pt-[clamp(72px,8vw,130px)] pb-[clamp(64px,8vw,112px)] text-[#3558a7]"
    aria-label="Explore tanh.moe"
  >
    <p class="m-0 mb-[26px] text-[0.86rem] font-extrabold tracking-[0.3em] text-[#f47bdb]">
      EXPLORE THE JOURNAL
    </p>
    <div
      class="grid grid-cols-3 gap-px border border-[#dcebfa] bg-[#dcebfa] max-[860px]:grid-cols-1"
    >
      <a
        v-for="card in afterCards"
        :key="card.title"
        :href="card.href"
        class="grid min-h-[190px] gap-[13px] bg-white/90 p-[clamp(24px,3vw,42px)] text-[#3558a7] no-underline transition duration-150 hover:z-[1] hover:-translate-y-1 hover:bg-[#ffe8f8] hover:outline-2 hover:outline-offset-[-2px] hover:outline-[#f47bdb] focus-visible:z-[1] focus-visible:-translate-y-1 focus-visible:bg-[#ffe8f8] focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[#f47bdb]"
      >
        <strong class="text-[clamp(1.6rem,2.1vw,2.5rem)] leading-[1.1]">{{ card.title }}</strong>
        <span class="max-w-[30ch] text-base leading-[1.7] font-semibold">{{ card.body }}</span>
      </a>
    </div>
  </section>
</template>

<style scoped>
.after-hero {
  background:
    linear-gradient(90deg, rgba(238, 243, 250, 0.95) 1px, transparent 1px),
    linear-gradient(rgba(238, 243, 250, 0.95) 1px, transparent 1px), #ffffff;
  background-size: 54px 54px;
}
</style>
