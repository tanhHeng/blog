import type { PageScope } from "../lib/pageLifecycle"

interface MistBrushOptions {
  /** Switches the mist to its narrow-screen shape; keep in sync with the page's `max-width: 850px` rules. */
  narrow: MediaQueryList
  reducedMotion: MediaQueryList
  /** Whether the mist is showing; the brush paints only while it is. */
  active: () => boolean
  /** Holds the clouds still (the page's motion toggle is on Pause). */
  still: () => boolean
  /** The stage video under the mist; washed areas show it sharp and saturated, wherever it is transformed to. */
  video: HTMLVideoElement
  /** Width / height of the video frame; the opening camera covers the stage with it, centred, unscaled. */
  frameRatio: number
  /** Elements whose text the mist guards: behind each of their text lines it resists the brush. */
  guards: Element[]
}

interface Point {
  x: number
  y: number
}

// Canvas pixels per CSS pixel. The mist is soft, so half resolution looks the same.
const RESOLUTION = 0.5
// Canvas pixels per cell of the wetness and cloud fields (8 CSS pixels); the bilinear upscale keeps edges soft.
const CELL = 4
// The most mist a wash takes away: one pass clears part of it, overlapping passes deepen towards this.
const MAX_REVEAL = 0.7
// How a washed area shows the stage video: unlike the blurred, desaturated opening, colour deepens where it is wet.
const PAINT_FILTER = "saturate(1.35) contrast(1.06)"
// Milliseconds for a fully wet patch to dry back into mist.
const DRY = 4200
// Time constant (ms) of the brush trailing the pointer, which turns jittery input into broad, even strokes.
const FOLLOW = 110
// Text guards: each text line has a core around its centre line (a capsule as long as the line, its radius
// `1 - GUARD_CORE` of the line box's half-height plus `GUARD_PAD` CSS pixels) where the brush keeps only
// `GUARD_CORE_SHARE` of its strength and the mist may thin by only `GUARD_CORE_SHARE` of `GUARD_MAX_REVEAL` (of
// the mist's opacity), so text stays readable. Around the core runs a band `GUARD_BAND` CSS pixels wide, the same
// for every font size and about as wide as a wash's own edge: across it the brush weakens linearly from full
// strength to the core's share, and the cap closes in over a wash's two tiers, so a text line grades into the
// washed mist the way a wash grades into the mist. The band is never drawn as such: it is sampled through a
// slowly flowing displacement of up to about `GUARD_WARP` CSS pixels, so its edge billows in and out like cloud,
// reaching past it and drifting; only the outer half of the band may billow inwards, so the core always stays.
const GUARD_PAD = 16
const GUARD_CORE = 0.505
const GUARD_BAND = 64
const GUARD_CORE_SHARE = 0.3
const GUARD_MAX_REVEAL = 0.3
const GUARD_WARP = 30
// Where the band's first tier ends, on the same 0..1.2 scale (a wash's own ends at 0.3): about half way across,
// so the cell's mist dissolves gradually into the washed mist at its outer edge instead of rising in a ring.
const GUARD_FIRST_TIER = 0.6
// Where the second tier of the band's two-tier edge starts, on a 0..1.2 scale across the band (a wash's own
// second tier starts at 0.5 of its wetness), so it runs longer than a wash's.
const GUARD_SECOND_TIER = 0.1
// Eases the second tier in (its progress raised to this power), so most of it stays almost as clear as the first
// tier leaves it and it closes in mainly near the core: a subtler, more transparent second tier.
const GUARD_SECOND_EASE = 2
// Thin strokes lose contrast sooner, so smaller text keeps more mist: lines up to `SMALL_LINE` CSS pixels tall may
// thin only `SMALL_TEXT_REVEAL` of what `GUARD_MAX_REVEAL` allows, easing to the full limit at `LARGE_LINE`.
const SMALL_TEXT_REVEAL = 0.75
const SMALL_LINE = 24
const LARGE_LINE = 64

const smoothstep = (from: number, to: number, value: number) => {
  const t = Math.min(Math.max((value - from) / (to - from), 0), 1)
  return t * t * (3 - 2 * t)
}

/** Smooth value noise in 0..1 with one lattice point per unit, repeating every `period` units. */
function valueNoise(period = 64) {
  const lattice = Float32Array.from({ length: period * period }, Math.random)
  const wrap = (n: number) => ((n % period) + period) % period
  return (x: number, y: number) => {
    const ix = Math.floor(x)
    const iy = Math.floor(y)
    const fx = smoothstep(0, 1, x - ix)
    const fy = smoothstep(0, 1, y - iy)
    const at = (dx: number, dy: number) => lattice[wrap(iy + dy) * period + wrap(ix + dx)]
    const top = at(0, 0) + (at(1, 0) - at(0, 0)) * fx
    const bottom = at(0, 1) + (at(1, 1) - at(0, 1)) * fx
    return top + (bottom - top) * fy
  }
}

/** Text nodes with visible characters under `roots`, measured every frame for their line boxes. */
function textNodesOf(roots: Element[]) {
  const nodes: Text[] = []
  for (const root of roots) {
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT)
    for (let node = walker.nextNode(); node; node = walker.nextNode()) {
      if (node.textContent?.trim()) nodes.push(node as Text)
    }
  }
  return nodes
}

/**
 * Paints the opening's white mist on `canvas` and lets the pointer wash it thinner, after the watercolour tree on
 * davidwhyte.com/experience: a broad brush trails the pointer and wets a soft field; where the field is wet the
 * mist thins with an irregular, pigment-rimmed edge and the video beneath shows sharp and saturated, deepening
 * where strokes overlap, then dries back over a few seconds. Mouse and pen paint while moving; a touch wets one
 * patch where it lands.
 *
 * Behind the text of `guards` the mist resists the brush: each text line is a capsule inside which the wash
 * weakens linearly towards the line's centre, and the mist there never thins past a readable limit. Where a wash meets
 * that resistance, a slowly flowing, glowing cloud edge shows, fading as it dries.
 *
 * The canvas must cover the same box as the stage (it reads both bounding boxes to line the video up). It takes
 * the mist's colour from its CSS `color`, the wash rim and cloud halo tint from `--wash-edge`, and the cloud edge
 * glow from `--mist-glow`; it gets `is-painted` once the mist is drawn, so its CSS fallback background can step
 * aside.
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
  const clouds = layer()
  // Offscreen composites: the sharp video cut to the washes, and the mist thinned by them.
  const paint = layer()
  const veil = layer()
  const texts = textNodesOf(options.guards)
  const range = document.createRange()
  const grainBroad = valueNoise()
  const grainFine = valueNoise()
  const flowBroad = valueNoise()
  const flowFine = valueNoise()

  let cols = 0
  let rows = 0
  let radius = 0
  let wet = new Float32Array(0)
  // Per-cell threshold offset: drying follows it, so wash edges come out lobed instead of round.
  let grain = new Float32Array(0)
  // Per-cell hold behind text (0 outside the bands, rising linearly to 1 at a core), the reveal
  // limit factor of the line it comes from (smaller text keeps more mist), and the opacity of its glowing cloud
  // edge before the wash scales it.
  let guard = new Float32Array(0)
  let guardReveal = new Float32Array(0)
  let cloudAlpha = new Float32Array(0)
  let revealImage: ImageData | undefined
  let rimImage: ImageData | undefined
  let cloudImage: ImageData | undefined
  let colours = { halo: [0, 0, 0], glow: [0, 0, 0] }
  let wetCells = false
  let brush: Point | undefined
  let target: Point | undefined
  let frame = 0
  let lastTime = 0
  // Seconds of cloud flow; it advances only while the clouds may move.
  let flow = 0

  const drawMist = () => {
    const width = Math.max(1, Math.round(canvas.clientWidth * RESOLUTION))
    const height = Math.max(1, Math.round(canvas.clientHeight * RESOLUTION))
    canvas.width = mist.element.width = paint.element.width = veil.element.width = width
    canvas.height = mist.element.height = paint.element.height = veil.element.height = height

    const style = getComputedStyle(canvas)
    // A canvas normalizes any CSS colour to `#rrggbb`.
    const rgb = (colour: string) => {
      mist.ctx.fillStyle = colour
      return (mist.ctx.fillStyle as string).match(/\w\w/g)!.map((hex) => parseInt(hex, 16))
    }
    const [r, g, b] = rgb(style.color)
    const tone = (alpha: number) => `rgba(${r}, ${g}, ${b}, ${alpha})`
    const edge = rgb(style.getPropertyValue("--wash-edge").trim() || style.color)
    colours = { halo: edge, glow: rgb(style.getPropertyValue("--mist-glow").trim() || "#fff") }

    // A tilted elliptical veil hugging the character: thinnest over her and thickening smoothly towards the edges.
    // Placed in video-frame coordinates (fractions of the frame's width and height, measured on
    // `public/novel/meadow-poster.webp`, head to knees) inside the frame as the opening camera shows it, so it stays
    // on her at every viewport shape. `along`/`across` are semi-axes in frame widths where the veil reaches
    // `outer`; it stays clear to about 26% of them, then thickens over a long, eased band. A negative `tilt`
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

    cols = Math.ceil(width / CELL)
    rows = Math.ceil(height / CELL)
    radius = Math.min(width, height) * 0.13
    wet = new Float32Array(cols * rows)
    wetCells = false
    grain = new Float32Array(cols * rows)
    for (let y = 0; y < rows; y += 1) {
      for (let x = 0; x < cols; x += 1) {
        grain[y * cols + x] = 0.65 * grainBroad(x / 8, y / 8) + 0.35 * grainFine(x / 2.5, y / 2.5)
      }
    }
    guard = new Float32Array(cols * rows)
    guardReveal = new Float32Array(cols * rows)
    cloudAlpha = new Float32Array(cols * rows)
    reveal.element.width = rim.element.width = clouds.element.width = cols
    reveal.element.height = rim.element.height = clouds.element.height = rows
    revealImage = reveal.ctx.createImageData(cols, rows)
    rimImage = rim.ctx.createImageData(cols, rows)
    cloudImage = clouds.ctx.createImageData(cols, rows)
    for (let i = 0; i < cols * rows; i += 1) rimImage.data.set(edge, i * 4)

    render()
    canvas.classList.add("is-painted")
  }

  // Flowing displacement (in cells) of the guard capsules at cell (x, y): two noise layers per axis, drifting
  // different ways, so the edge billows in broad lobes with gentler curls on them. The finer layer's features
  // span several 8px cells and it weighs little, so neighbouring cells move together instead of leaving
  // cell-sized patches of heavier mist. The scale keeps the overall spread of the earlier, more even mix, so the
  // band reaches no further out than before.
  const displace = (x: number, y: number, warp: number) => {
    const t = flow
    const along = (broad: number, fine: number) => (0.8 * broad + 0.2 * fine - 0.5) * 2.9 * warp
    return [
      along(
        flowBroad((x + t * 0.9) / 6, (y - t * 0.35) / 6),
        flowFine((x - t * 1.4) / 4, (y + t * 0.5) / 4),
      ),
      along(
        flowBroad((x - t * 0.6) / 6 + 31.7, (y + t * 0.4) / 6 + 17.3),
        flowFine((x + t * 1.1) / 4 + 11.1, (y - t * 0.7) / 4 + 5.9),
      ),
    ]
  }

  // Measures the text's current line boxes into `guard` through the flowing displacement, then lays the cloud edge
  // along it. Writes its colour into `cloudImage` and its full opacity into `cloudAlpha`; `render` scales it by
  // the wash.
  const shapeClouds = () => {
    const data = cloudImage!.data
    guard.fill(0)
    cloudAlpha.fill(0)
    const box = canvas.getBoundingClientRect()
    const scale = RESOLUTION / CELL
    const warp = GUARD_WARP * scale
    const band = GUARD_BAND * scale
    for (const text of texts) {
      range.selectNodeContents(text)
      for (const line of range.getClientRects()) {
        if (!line.width || !line.height) continue
        // The centre line runs between the centres of the capsule's round ends; a line shorter than it is tall
        // collapses to a point, and its capsule to a circle.
        const cy = (line.top + line.height / 2 - box.top) * scale - 0.5
        const inset = Math.min(line.height, line.width) / 2
        const startX = (line.left + inset - box.left) * scale - 0.5
        const endX = (line.right - inset - box.left) * scale - 0.5
        const outer = (line.height / 2 + GUARD_PAD) * (1 - GUARD_CORE) * scale + band
        const lineReveal =
          SMALL_TEXT_REVEAL +
          (1 - SMALL_TEXT_REVEAL) *
            Math.min(Math.max((line.height - SMALL_LINE) / (LARGE_LINE - SMALL_LINE), 0), 1)
        // The displacement peaks at 1.6 × `warp`; the box covers every cell it can pull into the band.
        const reach = outer + warp * 1.6
        const fromX = Math.max(0, Math.floor(startX - reach))
        const toX = Math.min(cols - 1, Math.ceil(endX + reach))
        const fromY = Math.max(0, Math.floor(cy - reach))
        const toY = Math.min(rows - 1, Math.ceil(cy + reach))
        for (let y = fromY; y <= toY; y += 1) {
          for (let x = fromX; x <= toX; x += 1) {
            const [dx, dy] = displace(x, y, warp)
            const px = x + dx
            const along = Math.min(Math.max(px, startX), endX)
            const warped = (outer - Math.hypot(px - along, y + dy - cy)) / band
            // Undisplaced, the hold floors the billowing: nothing in the band's outer half, reaching 1 where the
            // core starts, so the edge only billows inwards across the outer half.
            const plain =
              (outer - Math.hypot(x - Math.min(Math.max(x, startX), endX), y - cy)) / band
            const hold = Math.min(Math.max(warped, (plain - 0.5) * 2, 0), 1)
            const i = y * cols + x
            if (hold > guard[i]) {
              guard[i] = hold
              guardReveal[i] = lineReveal
            }
          }
        }
      }
    }

    const { halo, glow } = colours
    for (let y = 0; y < rows; y += 1) {
      for (let x = 0; x < cols; x += 1) {
        const i = y * cols + x
        if (!guard[i]) continue
        // Spread across the whole band: a glow peaking near the band's edge reads as a ring of heavier mist.
        const s = smoothstep(0, 1, guard[i])
        // A faint cool halo, then a soft glow across the billowing band of the resistance.
        const layers: [number[], number][] = [
          [halo, s * 0.1],
          [glow, 4 * s * (1 - s) * 0.2],
        ]
        let alpha = 0
        let red = 0
        let green = 0
        let blue = 0
        for (const [colour, a] of layers) {
          red = colour[0] * a + red * (1 - a)
          green = colour[1] * a + green * (1 - a)
          blue = colour[2] * a + blue * (1 - a)
          alpha = a + alpha * (1 - a)
        }
        if (!alpha) continue
        data[i * 4] = red / alpha
        data[i * 4 + 1] = green / alpha
        data[i * 4 + 2] = blue / alpha
        cloudAlpha[i] = alpha
      }
    }
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
    if (!wetCells || !revealImage || !rimImage || !cloudImage) {
      ctx.drawImage(mist.element, 0, 0)
      ctx.globalCompositeOperation = "source-over"
      return
    }
    shapeClouds()
    const width = cols * CELL
    const height = rows * CELL
    const wash = revealImage.data
    const edge = rimImage.data
    const vapour = cloudImage.data
    // The wash strength (0..1, scaled by `MAX_REVEAL` on the mist) that keeps text mist within its limit.
    const guardCap = GUARD_MAX_REVEAL / MAX_REVEAL
    for (let i = 0; i < wet.length; i += 1) {
      const level = wet[i] - grain[i] * 0.45
      const reach = smoothstep(0.05, 0.3, level)
      // How far overlapping passes have deepened the wash: a wash's own second tier.
      const deep = smoothstep(0.5, 1.2, level)
      // A first pass reaches a little over half of what overlapping passes can.
      const strength = 0.55 * reach + 0.45 * deep
      // Behind text the wash weakens linearly across the band to `GUARD_CORE_SHARE` at the core, and its cap closes
      // in over a wash's two tiers, with a longer second tier, so the text cell grades into the washed mist. Like
      // a wash's second tier, the cell's yields to overlapping passes: as they deepen the wash, it opens again,
      // less so towards the core and not at all there, while the first tier always holds.
      const hold = guard[i]
      const share = 1 - (1 - GUARD_CORE_SHARE) * hold
      const tiers = hold * 1.2
      const closing =
        0.55 * smoothstep(0.05, GUARD_FIRST_TIER, tiers) +
        0.45 *
          smoothstep(GUARD_SECOND_TIER, 1.2, tiers) ** GUARD_SECOND_EASE *
          (1 - deep * (1 - hold))
      const cap = 1 - (1 - guardCap * share * guardReveal[i]) * closing
      const held = Math.min(strength * share, cap)
      wash[i * 4 + 3] = held * 255
      // Pigment gathers where the wash meets the mist, but not where the text's band holds it back: there the
      // mist should dissolve, not draw a line.
      edge[i * 4 + 3] = reach * (1 - reach) * 4 * 0.12 * (1 - guard[i]) * 255
      vapour[i * 4 + 3] = cloudAlpha[i] * reach * 255
    }
    reveal.ctx.putImageData(revealImage, 0, 0)
    rim.ctx.putImageData(rimImage, 0, 0)
    clouds.ctx.putImageData(cloudImage, 0, 0)

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

    // The washes keep the full-strength mask for the paint, so one pass already shows sharp colour under thinner
    // mist.
    ctx.imageSmoothingQuality = "high"
    paint.ctx.imageSmoothingQuality = "high"
    if (drawPaint(width, height)) {
      ctx.drawImage(paint.element, 0, 0)
      ctx.globalCompositeOperation = "source-over"
    }
    ctx.drawImage(veil.element, 0, 0)
    ctx.globalCompositeOperation = "source-over"
    // A slight blur hides the cells of the upscaled field, so the edge reads as vapour.
    ctx.filter = `blur(${CELL * 0.75}px)`
    ctx.drawImage(clouds.element, 0, 0, width, height)
    ctx.filter = "none"
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
    if (!options.active()) brush = target = undefined
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
    // The clouds only show where something is wet, so they need to flow only then.
    if (!options.still() && !options.reducedMotion.matches) flow += elapsed / 1000
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
      if (event.pointerType === "touch" || options.reducedMotion.matches || !options.active()) {
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
      if (event.pointerType !== "touch" || options.reducedMotion.matches || !options.active())
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
