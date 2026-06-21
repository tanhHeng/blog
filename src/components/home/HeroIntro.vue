<script setup lang="ts">
import { exploreLinks } from "./homeData";
</script>

<template>
  <section
    class="intro-copy pointer-events-auto z-[8] mt-[clamp(8px,1.2vw,16px)] w-full max-w-[760px] self-start max-[860px]:mt-0 max-[860px]:max-w-none"
    aria-label="Site introduction"
  >
    <p
      class="hello mb-[clamp(10px,1.8vw,22px)] ml-12 text-[clamp(1.05rem,1.52vw,1.72rem)] leading-normal font-medium max-[860px]:ml-0"
    >
      你好，这里是
    </p>
    <h1
      id="home-title"
      class="brand-title m-0 flex items-baseline gap-[clamp(12px,1.5vw,28px)] text-[clamp(4.4rem,5vw,6rem)] leading-[0.9] font-extrabold tracking-normal text-white max-[860px]:flex-wrap max-[860px]:gap-x-4 max-[860px]:gap-y-2 max-[860px]:text-[clamp(4rem,17vw,6.4rem)]"
    >
      <span
        class="brand-marker inline-block h-[clamp(52px,3.45vw,66px)] w-[clamp(13px,0.98vw,19px)] self-start bg-[#ffaae6] max-[860px]:h-[50px]"
        aria-hidden="true"
      ></span>
      <span>I tanh</span>
      <span class="text-[#ffaae6]">丶</span>
      <span class="text-[#ffaae6]">桁</span>
    </h1>

    <div
      class="blog-label relative box-border mt-[clamp(10px,0.82vw,13px)] ml-[52px] flex h-[47px] w-[min(298px,70vw)] items-center border-[3px] border-white border-t-[#ffaae6] border-r-[#ffaae6] px-[17px] text-[clamp(1.05rem,1.1vw,1.32rem)] leading-none font-medium tracking-[0.2em] whitespace-nowrap uppercase max-[860px]:ml-0"
      aria-label="Personal blog"
    >
      <span>PERSONAL BLOG</span>
    </div>

    <p
      class="mt-[clamp(20px,1.8vw,26px)] ml-[52px] text-[clamp(0.95rem,1.08vw,1.28rem)] leading-tight font-medium tracking-[0.22em] max-[860px]:ml-0 max-[860px]:tracking-[0.14em]"
    >
      DEVELOP · DESIGN · DEEPLEARNING
    </p>

    <div
      class="explore-block relative mt-[clamp(26px,2.25vw,34px)] ml-[52px] pl-7 max-[860px]:ml-0"
    >
      <p
        class="explore-heading m-0 flex items-center gap-3 text-[clamp(0.98rem,1.12vw,1.35rem)] leading-none font-extrabold tracking-[0.36em] text-[#ffaae6]"
      >
        <span class="size-3 bg-[#ffaae6]"></span>EXPLORE
        <b class="font-extrabold tracking-normal">↓</b>
      </p>
      <ul class="mt-2.5 grid gap-2 p-0">
        <li v-for="link in exploreLinks" :key="link.label" class="relative list-none">
          <a
            :href="link.href"
            class="inline-flex items-baseline gap-2 text-[clamp(0.86rem,0.98vw,1.1rem)] font-semibold tracking-[0.18em] text-white no-underline transition duration-150 hover:translate-x-[5px] hover:text-[#ffaae6] focus-visible:translate-x-[5px] focus-visible:text-[#ffaae6] focus-visible:outline-none"
          >
            <span>{{ link.label }}</span>
            <small class="text-inherit tracking-[0.08em]">/ {{ link.cjk }}</small>
          </a>
        </li>
      </ul>
    </div>
  </section>
</template>

<style scoped>
.intro-copy {
  grid-column: var(--hero-intro-col);
  grid-row: var(--hero-intro-row);
}

.hello {
  text-shadow: 0 0 18px rgba(255, 255, 255, 0.18);
}

.blog-label::before,
.blog-label::after {
  position: absolute;
  background: #ffaae6;
  content: "";
}

.blog-label::before {
  right: -5px;
  bottom: -5px;
  width: 12px;
  height: 12px;
}

.blog-label::after {
  top: -3px;
  right: -3px;
  width: 12px;
  height: 12px;
  background: #ffffff;
}

.explore-block::before {
  position: absolute;
  top: 10px;
  left: 6px;
  width: 2px;
  height: 122px;
  background: linear-gradient(#ffaae6 0 72%, rgba(255, 170, 230, 0));
  content: "";
}

.explore-block li::before {
  position: absolute;
  top: 13px;
  left: -32px;
  width: 12px;
  height: 12px;
  border-radius: 999px;
  background: #ffaae6;
  content: "";
}
</style>
