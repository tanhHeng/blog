import type { PageScope } from "../lib/pageLifecycle"

interface MistBrushOptions {
  /** Switches the mist to its narrow-screen shape; keep in sync with the page's `max-width: 850px` rules. */
  narrow: MediaQueryList
  reducedMotion: MediaQueryList
  /** Checked on every stroke; the brush only paints while it returns true. */
  canPaint: () => boolean
  /** The stage video under the mist; washed areas show it sharp and saturated, wherever it is transformed to. */
  video: HTMLVideoElement
  /** Width / height of the video frame; the opening camera covers the stage with it, centred, unscaled. */
  frameRatio: number
}

interface Point {
  x: number
  y: number
}

// Canvas pixels per CSS pixel. The mist is soft, so half resolution looks the same.
const RESOLUTION = 0.5
// Canvas pixels per cell of the wetness field (8 CSS pixels); the bilinear upscale keeps wash edges soft.
const CELL = 4
// The most mist a wash takes away: one pass clears part of it, overlapping passes deepen towards this.
const MAX_REVEAL = 0.7
// How a washed area shows the stage video: unlike the blurred, desaturated opening, colour deepens where it is wet.
const PAINT_FILTER = "saturate(1.35) contrast(1.06)"
// Milliseconds for a fully wet patch to dry back into mist.
const DRY = 4200
// Time constant (ms) of the brush trailing the pointer, which turns jittery input into broad, even strokes.
const FOLLOW = 110

const smoothstep = (from: number, to: number, value: number) => {
  const t = Math.min(Math.max((value - from) / (to - from), 0), 1)
  return t * t * (3 - 2 * t)
}

/** Smooth value noise over a `cols`×`rows` grid with lattice points every `spacing` cells, in 0..1. */
function valueNoise(cols: number, rows: number, spacing: number) {
  const width = Math.ceil(cols / spacing) + 2
  const lattice = Float32Array.from(
    { length: width * (Math.ceil(rows / spacing) + 2) },
    Math.random,
  )
  return (x: number, y: number) => {
    const gx = x / spacing
    const gy = y / spacing
    const ix = Math.floor(gx)
    const iy = Math.floor(gy)
    const fx = smoothstep(0, 1, gx - ix)
    const fy = smoothstep(0, 1, gy - iy)
    const at = (dx: number, dy: number) => lattice[(iy + dy) * width + ix + dx]
    const top = at(0, 0) + (at(1, 0) - at(0, 0)) * fx
    const bottom = at(0, 1) + (at(1, 1) - at(0, 1)) * fx
    return top + (bottom - top) * fy
  }
}

/**
 * Paints the opening's white mist on `canvas` and lets the pointer wash it thinner, after the watercolour tree on
 * davidwhyte.com/experience: a broad brush trails the pointer and wets a soft field; where the field is wet the
 * mist thins with an irregular, pigment-rimmed edge and the video beneath shows sharp and saturated, deepening
 * where strokes overlap, then dries back over a few seconds. Mouse and pen paint while moving; a touch wets one
 * patch where it lands.
 *
 * The canvas must cover the same box as the stage (it reads both bounding boxes to line the video up). It takes
 * the mist's colour from its CSS `color` and the rim tint from `--wash-edge`, and gets `is-painted` once the mist
 * is drawn, so its CSS fallback background can step aside.
 */
export function paintMistBrush(
  canvas: HTMLCanvasElement,
  scope: PageScope,
  options: MistBrushOptions,
) {
  const context = canvas.getContext("2d")
  if (!context) return
  const ctx = context
  const layer = () => {
    const element = document.createElement("canvas")
    return { element, ctx: element.getContext("2d")! }
  }
  const mist = layer()
  const reveal = layer()
  const rim = layer()
  // Offscreen composites: the sharp video cut to the washes, and the mist thinned by them.
  const paint = layer()
  const veil = layer()

  let cols = 0
  let rows = 0
  let radius = 0
  let wet = new Float32Array(0)
  // Per-cell threshold offset: drying follows it, so wash edges come out lobed instead of round.
  let grain = new Float32Array(0)
  let revealImage: ImageData | undefined
  let rimImage: ImageData | undefined
  let wetCells = false
  let brush: Point | undefined
  let target: Point | undefined
  let frame = 0
  let lastTime = 0

  const drawMist = () => {
    const width = Math.max(1, Math.round(canvas.clientWidth * RESOLUTION))
    const height = Math.max(1, Math.round(canvas.clientHeight * RESOLUTION))
    canvas.width = mist.element.width = paint.element.width = veil.element.width = width
    canvas.height = mist.element.height = paint.element.height = veil.element.height = height

    const style = getComputedStyle(canvas)
    const [r, g, b] = style.color.match(/[\d.]+/g)!.map(Number)
    const tone = (alpha: number) => `rgba(${r}, ${g}, ${b}, ${alpha})`
    // A tilted elliptical veil hugging the character: thinnest over her and thickening smoothly towards the edges.
    // Placed in video-frame coordinates (fractions of the frame's width and height, measured on
    // `public/novel/meadow-poster.webp`, head to knees) inside the frame as the opening camera shows it, so it stays
    // on her at every viewport shape. `along`/`across` are semi-axes in frame widths where the veil reaches
    // `outer`; it stays clear to about 32% of them, then thickens over a long, eased band. A negative `tilt`
    // (radians) leans the top left, like her body. Narrow screens keep more mist, as their copy sits over her feet.
    const character = { x: 0.491, y: 0.413, along: 0.32, across: 0.22, tilt: -0.53 }
    const [inner, outer] = options.narrow.matches ? [0.6, 0.92] : [0.6, 0.94]
    const frameWidth = Math.max(width, height * options.frameRatio)
    const frameHeight = frameWidth / options.frameRatio
    const across = character.across * frameWidth
    const squash = character.along / character.across
    const gradient = mist.ctx.createRadialGradient(0, 0, 0, 0, 0, across)
    // The core stays clear over her, then eased stops thicken the veil without a visible ring.
    const STOPS = 10
    for (let stop = 0; stop <= STOPS; stop += 1) {
      const t = stop / STOPS
      gradient.addColorStop(t, tone(inner + (outer - inner) * smoothstep(0.26, 1, t)))
    }
    const reach = Math.hypot(width, height) * 2
    mist.ctx.save()
    mist.ctx.translate(
      (width - frameWidth) / 2 + character.x * frameWidth,
      (height - frameHeight) / 2 + character.y * frameHeight,
    )
    mist.ctx.rotate(character.tilt)
    mist.ctx.scale(1, squash)
    mist.ctx.fillStyle = gradient
    mist.ctx.fillRect(-reach, -reach / squash, reach * 2, (reach * 2) / squash)
    mist.ctx.restore()

    // A canvas normalizes any CSS colour to `#rrggbb`.
    mist.ctx.fillStyle = style.getPropertyValue("--wash-edge").trim() || tone(1)
    const edge = (mist.ctx.fillStyle as string).match(/\w\w/g)!.map((hex) => parseInt(hex, 16))

    cols = Math.ceil(width / CELL)
    rows = Math.ceil(height / CELL)
    radius = Math.min(width, height) * 0.13
    wet = new Float32Array(cols * rows)
    wetCells = false
    const broad = valueNoise(cols, rows, 8)
    const fine = valueNoise(cols, rows, 2.5)
    grain = new Float32Array(cols * rows)
    for (let y = 0; y < rows; y += 1) {
      for (let x = 0; x < cols; x += 1) grain[y * cols + x] = 0.65 * broad(x, y) + 0.35 * fine(x, y)
    }
    reveal.element.width = rim.element.width = cols
    reveal.element.height = rim.element.height = rows
    revealImage = reveal.ctx.createImageData(cols, rows)
    rimImage = rim.ctx.createImageData(cols, rows)
    for (let i = 0; i < cols * rows; i += 1) rimImage.data.set(edge, i * 4)

    render()
    canvas.classList.add("is-painted")
  }

  // Draws the current video frame where the stage shows it, cut to the washes. False while it has no frame yet.
  const drawPaint = (width: number, height: number) => {
    const { video } = options
    if (video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) return false
    const box = canvas.getBoundingClientRect()
    // The video fills its camera box at the frame's own ratio, so its transformed box is the frame.
    const shown = video.getBoundingClientRect()
    const p = paint.ctx
    p.globalCompositeOperation = "copy"
    p.filter = PAINT_FILTER
    p.drawImage(
      video,
      (shown.left - box.left) * RESOLUTION,
      (shown.top - box.top) * RESOLUTION,
      shown.width * RESOLUTION,
      shown.height * RESOLUTION,
    )
    p.filter = "none"
    p.globalCompositeOperation = "destination-in"
    p.drawImage(reveal.element, 0, 0, width, height)
    p.globalCompositeOperation = "source-over"
    return true
  }

  const render = () => {
    ctx.globalCompositeOperation = "copy"
    if (!wetCells || !revealImage || !rimImage) {
      ctx.drawImage(mist.element, 0, 0)
      ctx.globalCompositeOperation = "source-over"
      return
    }
    const wash = revealImage.data
    const edge = rimImage.data
    for (let i = 0; i < wet.length; i += 1) {
      const level = wet[i] - grain[i] * 0.45
      const body = smoothstep(0.05, 0.3, level)
      // A first pass reaches a little over half of what overlapping passes can.
      wash[i * 4 + 3] = (0.55 * body + 0.45 * smoothstep(0.5, 1.2, level)) * 255
      // Pigment gathers where the wash meets the mist.
      edge[i * 4 + 3] = body * (1 - body) * 4 * 0.12 * 255
    }
    reveal.ctx.putImageData(revealImage, 0, 0)
    rim.ctx.putImageData(rimImage, 0, 0)
    const width = cols * CELL
    const height = rows * CELL

    const v = veil.ctx
    v.imageSmoothingQuality = "high"
    v.globalCompositeOperation = "copy"
    v.drawImage(mist.element, 0, 0)
    v.globalCompositeOperation = "destination-out"
    v.globalAlpha = MAX_REVEAL
    v.drawImage(reveal.element, 0, 0, width, height)
    v.globalAlpha = 1
    v.globalCompositeOperation = "source-over"
    v.drawImage(rim.element, 0, 0, width, height)

    // The washes keep the full-strength mask for the paint, so one pass already shows sharp colour under thinner mist.
    paint.ctx.imageSmoothingQuality = "high"
    if (drawPaint(width, height)) {
      ctx.drawImage(paint.element, 0, 0)
      ctx.globalCompositeOperation = "source-over"
    }
    ctx.drawImage(veil.element, 0, 0)
    ctx.globalCompositeOperation = "source-over"
  }

  // Adds a gaussian of wetness centred on (x, y), in canvas pixels.
  const wetAt = (x: number, y: number, amount: number, size: number) => {
    const sigma = size / 2
    const reach = size * 1.2
    const fromX = Math.max(0, Math.floor((x - reach) / CELL))
    const toX = Math.min(cols - 1, Math.ceil((x + reach) / CELL))
    const fromY = Math.max(0, Math.floor((y - reach) / CELL))
    const toY = Math.min(rows - 1, Math.ceil((y + reach) / CELL))
    for (let cy = fromY; cy <= toY; cy += 1) {
      for (let cx = fromX; cx <= toX; cx += 1) {
        const dx = (cx + 0.5) * CELL - x
        const dy = (cy + 0.5) * CELL - y
        const i = cy * cols + cx
        wet[i] = Math.min(
          1.4,
          wet[i] + amount * Math.exp(-(dx * dx + dy * dy) / (2 * sigma * sigma)),
        )
      }
    }
    wetCells = true
  }

  // Wets evenly along the brush's path, so slow and fast strokes lay the same amount of paint per distance.
  const stroke = (from: Point, to: Point) => {
    const distance = Math.hypot(to.x - from.x, to.y - from.y)
    if (distance < 0.01) return
    const spacing = radius * 0.18
    const steps = Math.ceil(distance / spacing)
    const amount = (0.16 * distance) / (steps * spacing)
    for (let step = 1; step <= steps; step += 1) {
      const t = step / steps
      wetAt(from.x + (to.x - from.x) * t, from.y + (to.y - from.y) * t, amount, radius)
    }
  }

  const tick = (now: number) => {
    const elapsed = Math.min(now - lastTime, 50)
    lastTime = now
    if (!options.canPaint()) brush = target = undefined
    let chasing = false
    if (brush && target) {
      const follow = 1 - Math.exp(-elapsed / FOLLOW)
      const next = {
        x: brush.x + (target.x - brush.x) * follow,
        y: brush.y + (target.y - brush.y) * follow,
      }
      stroke(brush, next)
      brush = next
      chasing = Math.hypot(target.x - next.x, target.y - next.y) > 0.5
    }
    if (wetCells) {
      const dry = elapsed / DRY
      wetCells = false
      for (let i = 0; i < wet.length; i += 1) {
        if (wet[i] <= 0) continue
        wet[i] = Math.max(0, wet[i] - dry)
        if (wet[i] > 0) wetCells = true
      }
    }
    render()
    frame = wetCells || chasing ? scope.frame(tick) : 0
  }

  const start = () => {
    if (frame) return
    lastTime = performance.now()
    frame = scope.frame(tick)
  }

  const toCanvas = (event: PointerEvent): Point => {
    const box = canvas.getBoundingClientRect()
    return { x: (event.clientX - box.left) * RESOLUTION, y: (event.clientY - box.top) * RESOLUTION }
  }

  scope.listen(
    window,
    "pointermove",
    (event) => {
      if (event.pointerType === "touch" || options.reducedMotion.matches || !options.canPaint()) {
        brush = target = undefined
        return
      }
      target = toCanvas(event)
      brush ??= { ...target }
      start()
    },
    { passive: true },
  )

  scope.listen(
    window,
    "pointerdown",
    (event) => {
      if (event.pointerType !== "touch" || options.reducedMotion.matches || !options.canPaint())
        return
      const point = toCanvas(event)
      wetAt(point.x, point.y, 0.9, radius * 1.3)
      start()
    },
    { passive: true },
  )

  scope.listen(document.documentElement, "pointerleave", () => {
    brush = target = undefined
  })

  const resize = new ResizeObserver(drawMist)
  resize.observe(canvas)
  scope.observe(resize)
  scope.listen(options.narrow, "change", drawMist)
}
