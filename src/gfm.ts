import {MarkdownConfig} from "./markdown"

const StrikeThroughDelim = {resolve: "StrikeThrough", mark: "StrikeThroughMark"}

export const StrikeThrough: MarkdownConfig = {
  defineNodes: ["StrikeThrough", "StrikeThroughMark"],
  parseInline: [{
    name: "StrikeThrough",
    parse(cx, next, pos) {
      if (next != 126 /* '~' */ || cx.char(pos + 1) != 126) return -1
      return cx.addDelimiter(StrikeThroughDelim, pos, pos + 2, true, true)
    },
    after: "Emphasis"
  }]
}

export const GFM = [StrikeThrough]
