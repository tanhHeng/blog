<script setup lang="ts">
import { createTanhBlocks, createTanhPath } from "./tanhGeometry";

const dotColumns = Array.from({ length: 8 }, (_, column) => column);
const dotRows = Array.from({ length: 6 }, (_, row) => row);
const tanhBlocks = createTanhBlocks();
const tanhPath = createTanhPath();
</script>

<template>
  <div class="math-overlay" aria-hidden="true">
    <div class="name-tag name-tag-left">tanh.moe /</div>
    <div class="name-tag name-tag-center">wqtanh_Heng</div>

    <div class="axis axis-horizontal">
      <span class="axis-label">f(x)=tanh(x)</span>
    </div>
    <div class="axis axis-vertical">
      <span class="axis-arrow"></span>
      <span class="axis-ticks"></span>
    </div>
    <svg class="curve-line" viewBox="0 0 12 6" preserveAspectRatio="none">
      <path :d="tanhPath" />
    </svg>
    <div class="curve-dot"></div>
    <div class="orbit orbit-large"></div>
    <div class="orbit orbit-small"></div>

    <div class="pink-dot-field">
      <span v-for="column in dotColumns" :key="`column-${column}`">
        <i v-for="row in dotRows" :key="`dot-${column}-${row}`"></i>
      </span>
    </div>

    <div class="chapter-index" aria-label="Featured sections">
      <a href="/" class="active">01</a>
      <a href="/about">02</a>
      <a href="/blog">03</a>
      <a href="/blog">04</a>
      <span class="chapter-plus">+</span>
    </div>

    <div class="geometry-blocks">
      <span
        v-for="block in tanhBlocks"
        :key="block.id"
        class="tone-block"
        :class="block.tone"
        :style="{ left: block.left, top: block.top, width: block.size, height: block.size }"
      ></span>
    </div>

    <div class="life-card">
      <span class="life-li">LI</span>
      <span class="life-fe">FE</span>
      <span class="life-jour">JOUR</span>
      <span class="life-ney">NEY</span>
      <span class="life-square"></span>
      <span class="life-stroke"></span>
    </div>

    <p class="wind-quote">风雪拂枕，北星饮尘。</p>
  </div>
</template>

<style scoped>
.math-overlay {
  position: relative;
  z-index: 6;
  display: grid;
  grid-column: var(--hero-math-col);
  grid-row: var(--hero-math-row);
  grid-template-columns: repeat(12, minmax(0, 1fr));
  grid-template-rows: repeat(12, minmax(0, 1fr));
  column-gap: var(--hero-gutter);
  pointer-events: none;
}

.name-tag {
  z-index: 8;
  color: #ffaae6;
  font-size: clamp(0.85rem, 1.14vw, 1.36rem);
  font-weight: 500;
  line-height: 1;
  text-shadow: 0 0 18px rgba(255, 170, 230, 0.25);
}

.name-tag-left {
  grid-column: 6 / span 1;
  grid-row: 6 / span 1;
  align-self: center;
  justify-self: start;
}

.name-tag-center {
  grid-column: 7 / span 2;
  grid-row: 6 / span 1;
  align-self: center;
  justify-self: start;
  margin-top: clamp(30px, 3vw, 42px);
}

.axis {
  position: relative;
  z-index: 5;
}

.axis-horizontal {
  grid-column: 5 / 13;
  grid-row: 6 / span 1;
  align-self: center;
  height: 3px;
  background: linear-gradient(
    90deg,
    transparent,
    rgba(255, 255, 255, 0.72) 12%,
    rgba(255, 255, 255, 0.72)
  );
}

.axis-horizontal::after {
  position: absolute;
  top: -9px;
  right: -3px;
  border-top: 10px solid transparent;
  border-bottom: 10px solid transparent;
  border-left: 20px solid rgba(255, 255, 255, 0.78);
  content: "";
}

.axis-label {
  position: absolute;
  right: 2%;
  bottom: 6px;
  color: #ffaae6;
  font-size: clamp(1rem, 1.2vw, 1.45rem);
  font-weight: 500;
}

.axis-vertical {
  grid-column: 9 / span 1;
  grid-row: 1 / 12;
  align-self: stretch;
  justify-self: center;
  width: 4px;
  height: auto;
  margin-block: clamp(60px, 6.2vw, 86px) clamp(26px, 4vw, 48px);
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.78), rgba(255, 255, 255, 0.68));
}

.axis-arrow {
  position: absolute;
  top: -12px;
  left: -9px;
  border-right: 11px solid transparent;
  border-bottom: 22px solid rgba(255, 255, 255, 0.78);
  border-left: 11px solid transparent;
}

.axis-ticks {
  position: absolute;
  top: 13.6%;
  left: -29px;
  width: 58px;
  height: 24px;
  background:
    linear-gradient(
        90deg,
        transparent 0 5px,
        rgba(255, 255, 255, 0.65) 5px 6px,
        transparent 6px 11px
      )
      0 0 / 8px 100%,
    linear-gradient(rgba(255, 255, 255, 0.65), rgba(255, 255, 255, 0.65)) center / 100% 1px
      no-repeat;
}

.curve-line {
  z-index: 6;
  grid-column: 5 / 13;
  grid-row: 4 / 9;
  width: 100%;
  height: 100%;
  align-self: stretch;
  overflow: visible;
}

.curve-line path {
  fill: none;
  stroke: rgba(255, 170, 230, 0.82);
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-width: 12px;
  vector-effect: non-scaling-stroke;
}

.curve-dot {
  z-index: 7;
  grid-column: 9 / span 1;
  grid-row: 6 / span 1;
  align-self: center;
  justify-self: center;
  width: 18px;
  height: 18px;
  border-radius: 999px;
  background: #ffaae6;
  box-shadow: 0 0 32px rgba(255, 170, 230, 0.45);
}

.orbit {
  z-index: 4;
  border: 1px solid rgba(255, 255, 255, 0.56);
  border-radius: 999px;
}

.orbit-large {
  grid-column: 7 / 11;
  grid-row: 2 / 11;
  width: 100%;
  height: 100%;
  transform: rotate(-12deg);
}

.orbit-small {
  grid-column: 7 / 10;
  grid-row: 3 / 7;
  width: 100%;
  height: 100%;
  border-color: rgba(255, 255, 255, 0.44);
  transform: rotate(9deg);
}

.pink-dot-field {
  z-index: 5;
  grid-column: 7 / 9;
  grid-row: 3 / 6;
  display: grid;
  grid-auto-flow: column;
  gap: clamp(18px, 1.56vw, 30px);
  align-self: end;
  justify-self: center;
}

.pink-dot-field span {
  display: grid;
  gap: clamp(18px, 1.56vw, 30px);
}

.pink-dot-field i {
  width: 8px;
  height: 8px;
  border-radius: 999px;
  background: rgba(251, 142, 234, 0.55);
}

.chapter-index {
  position: relative;
  z-index: 8;
  grid-column: 10 / 12;
  grid-row: 1 / 3;
  display: grid;
  grid-template-columns: repeat(2, auto);
  gap: 32px 78px;
  align-items: center;
  align-self: center;
  justify-self: start;
  color: #ffaae6;
  font-size: clamp(1.65rem, 1.85vw, 2.2rem);
  font-weight: 500;
  line-height: 1;
}

.chapter-index a {
  position: relative;
  color: rgba(255, 170, 230, 0.9);
  text-decoration: none;
  transition:
    color 160ms ease,
    transform 160ms ease;
  pointer-events: auto;
}

.chapter-index a:hover,
.chapter-index a:focus-visible {
  color: #ffffff;
  transform: translateY(-2px);
  outline: none;
}

.chapter-index .active {
  padding: 0 3px 0 0;
  background: #ffaae6;
  color: #07144d;
}

.chapter-plus {
  position: absolute;
  top: 38px;
  left: 62px;
  font-size: 4rem;
  font-weight: 300;
  line-height: 0.6;
}

.geometry-blocks,
.tone-block {
  position: absolute;
  z-index: 3;
}

.geometry-blocks {
  position: relative;
  grid-column: 3 / 13;
  grid-row: 3 / 11;
  align-self: stretch;
  justify-self: stretch;
}

.tone-block {
  transform: translate(-50%, -50%);
  border: 1px solid rgba(65, 111, 219, 0.74);
  background: rgba(255, 255, 255, 0.25);
  box-shadow: inset 0 0 45px rgba(126, 196, 255, 0.2);
  mix-blend-mode: screen;
}

.tone-block.pink {
  background: rgba(255, 170, 230, 0.27);
  mix-blend-mode: multiply;
}

.tone-block.light {
  background: rgba(255, 255, 255, 0.28);
}

.life-card {
  position: relative;
  z-index: 8;
  grid-column: 10 / 12;
  grid-row: 8 / 12;
  align-self: center;
  justify-self: end;
  width: clamp(210px, 14.8vw, 284px);
  height: clamp(190px, 15vw, 288px);
  color: #ffaae6;
  font-weight: 700;
  letter-spacing: 0.04em;
}

.life-card::before {
  position: absolute;
  top: 18%;
  left: 24%;
  width: 45%;
  height: 61%;
  border: 3px solid rgba(255, 170, 230, 0.8);
  content: "";
}

.life-li,
.life-fe,
.life-jour,
.life-ney,
.life-square,
.life-stroke {
  position: absolute;
}

.life-li {
  top: 6%;
  left: 24%;
  font-size: clamp(1.6rem, 1.8vw, 2.18rem);
}

.life-fe {
  top: 20%;
  right: 0;
  font-size: clamp(1.65rem, 1.85vw, 2.2rem);
}

.life-jour {
  bottom: 20%;
  left: 0;
  font-size: clamp(1.65rem, 1.85vw, 2.2rem);
}

.life-ney {
  bottom: 7%;
  left: 24%;
  font-size: clamp(1.65rem, 1.85vw, 2.2rem);
}

.life-square {
  right: 0;
  bottom: 11%;
  width: 34%;
  height: 15%;
  background: rgba(255, 170, 230, 0.85);
}

.life-stroke {
  top: 43%;
  left: 39%;
  width: 33%;
  height: 3px;
  background: #ffaae6;
  transform: rotate(47deg);
}

.wind-quote {
  z-index: 8;
  grid-column: 9 / 13;
  grid-row: 6 / span 1;
  align-self: end;
  justify-self: start;
  margin: 0 0 -10px;
  color: #ffffff;
  font-size: clamp(1.3rem, 1.72vw, 2.08rem);
  font-weight: 800;
  letter-spacing: 0.18em;
  line-height: 1.4;
  text-shadow: 0 0 18px rgba(255, 255, 255, 0.12);
}

@media (max-width: 1180px) {
  .curve-line,
  .orbit-large,
  .orbit-small,
  .pink-dot-field,
  .chapter-index,
  .life-card,
  .name-tag {
    opacity: 0.72;
  }

  .wind-quote {
    max-width: 420px;
  }
}

@media (max-width: 860px) {
  .math-overlay {
    display: none;
  }
}
</style>
