import type { Element, ElementContent } from "hast"
import { defineHastPlugin } from "satteri"

// Markdown has no captions: a paragraph that holds only an image with a title (`![alt](src "title")`)
// becomes a `<figure>` whose `<figcaption>` is that title. The title leaves the image, so the caption
// is not repeated as a tooltip. Images without a title stay as they are.

const isBlank = (node: ElementContent) => node.type === "text" && !node.value.trim()

export const figureCaptions = defineHastPlugin({
  name: "figure-captions",
  element: {
    filter: ["p"],
    visit(paragraph, ctx) {
      const content = paragraph.children.filter((child) => !isBlank(child))
      const [image] = content
      if (content.length !== 1 || image.type !== "element" || image.tagName !== "img") return
      const { title, ...properties } = image.properties
      if (typeof title !== "string" || !title.trim()) return
      const figure: Element = {
        type: "element",
        tagName: "figure",
        properties: {},
        children: [
          { type: "element", tagName: "img", properties, children: [] },
          {
            type: "element",
            tagName: "figcaption",
            properties: {},
            children: [{ type: "text", value: title }],
          },
        ],
      }
      ctx.replaceNode(paragraph, figure)
    },
  },
})
