import { onPageLoad } from "../lib/pageLifecycle"

// The text cursor (`src/styles/cursors.scss`) shows only while a mouse is over the glyph lines of selectable
// text, not over the blank rest of a block. CSS cannot tell the two apart, so this marks `<html>` with
// `data-over-text` and the cursor inherits from there; links and controls set their own cursor and keep it.
const interactive = "a, button, summary, label, select, [role='button'], [contenteditable]"

const textNodeAt = (x: number, y: number): Text | null => {
  const node = document.caretPositionFromPoint
    ? document.caretPositionFromPoint(x, y)?.offsetNode
    : document.caretRangeFromPoint?.(x, y)?.startContainer
  return node instanceof Text ? node : null
}

// The caret lookup snaps to the nearest text even from blank space beside a line, so the point must also
// fall inside one of the node's line boxes.
const isOverText = (x: number, y: number) => {
  const node = textNodeAt(x, y)
  const parent = node?.parentElement
  if (!node || !parent || !node.data.trim() || parent.closest(interactive)) return false
  if (getComputedStyle(parent).userSelect === "none") return false
  const range = document.createRange()
  range.selectNodeContents(node)
  for (const box of range.getClientRects()) {
    if (x >= box.left && x <= box.right && y >= box.top && y <= box.bottom) return true
  }
  return false
}

onPageLoad((scope) => {
  const root = document.documentElement
  let x = -1
  let y = -1
  const update = () => root.toggleAttribute("data-over-text", x >= 0 && isOverText(x, y))
  const clear = () => {
    x = y = -1
    root.removeAttribute("data-over-text")
  }

  scope.listen(document, "pointermove", (event: PointerEvent) => {
    if (event.pointerType !== "mouse") return clear()
    x = event.clientX
    y = event.clientY
    update()
  })
  // Scrolling moves the text under a resting pointer.
  scope.listen(window, "scroll", update, { passive: true })
  scope.listen(document, "mouseout", (event: MouseEvent) => {
    if (!event.relatedTarget) clear()
  })
  scope.listen(window, "blur", clear)
  scope.cleanup(clear)
})
