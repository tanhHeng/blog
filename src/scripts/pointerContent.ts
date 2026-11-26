// Whether a pointer is over readable or actionable content (text, links, media, controls), as opposed to the
// blank page around it, for effects that should only answer the blank page.
const contentSelector =
  'a, button, input, textarea, select, summary, label, dialog, img, video, svg, figure, pre, code, table, blockquote, li, p, h1, h2, h3, h4, h5, h6, [role="button"], .circles-grid'

// Decorative `aria-hidden` subtrees are skipped: some, like the homepage attraction layer, span the whole
// viewport.
const isContent = (element: Element) => element.closest('[aria-hidden="true"]') === null

/**
 * Content under `pointer-events: none` (the homepage sections, which let the scroll targets beneath take input)
 * never becomes the event target, so the point is also tested against the boxes of the page's content. That
 * reads layout: call it from an event handler or a frame's `"read"` phase.
 */
export function pointsAtContent(target: EventTarget | null, x: number, y: number) {
  const hit = target instanceof Element ? target.closest(contentSelector) : null
  if (hit && isContent(hit)) return true
  const page = document.querySelector(".page-content")
  if (!page) return false
  for (const element of page.querySelectorAll(contentSelector)) {
    const box = element.getBoundingClientRect()
    if (
      x >= box.left &&
      x <= box.right &&
      y >= box.top &&
      y <= box.bottom &&
      box.width > 0 &&
      isContent(element)
    )
      return true
  }
  return false
}
