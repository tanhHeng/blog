<template>
  <div class="wave purple-wave" aria-hidden="true">
    <span></span>
    <span></span>
    <span></span>
    <span></span>
  </div>
  <div class="wave white-wave" aria-hidden="true">
    <span></span>
    <span></span>
    <span></span>
    <span></span>
  </div>
</template>

<style scoped>
.wave {
  position: absolute;
  right: 0;
  bottom: 0;
  left: 0;
  z-index: 10;
  height: clamp(82px, 9.7vw, 108px);
  pointer-events: none;
}

.wave span {
  position: absolute;
  bottom: 0;
  width: 30%;
  height: 82%;
  border-radius: 50% 50% 0 0 / 100% 100% 0 0;
}

.purple-wave {
  opacity: 0.82;
}

.purple-wave span {
  background: rgba(187, 125, 199, 0.78);
}

.white-wave {
  bottom: -27px;
}

.white-wave span {
  background: #ffffff;
}

.wave span:nth-child(1) {
  left: -2%;
}

.wave span:nth-child(2) {
  left: 22%;
}

.wave span:nth-child(3) {
  left: 48%;
}

.wave span:nth-child(4) {
  left: 76%;
}
</style>
