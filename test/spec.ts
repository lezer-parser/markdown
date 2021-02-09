import {Tree} from "lezer-tree"
import {MarkdownParser} from ".."

const abbrev: {[abbr: string]: string} = {
  __proto__: null as any,
  CB: "CodeBlock",
  FC: "FencedCode",
  Q: "Blockquote",
  HR: "HorizontalRule",
  BL: "BulletList",
  OL: "OrderedList",
  LI: "ListItem",
  AH: "ATXHeading",
  SH: "SetextHeading",
  HB: "HTMLBlock",
  PI: "ProcessingInstructionBlock",
  CMB: "CommentBlock",
  LR: "LinkReference",
  P: "Paragraph",
  Esc: "Escape",
  Ent: "Entity",
  BR: "HardBreak",
  Em: "Emphasis",
  St: "StrongEmphasis",
  Ln: "Link",
  Im: "Image",
  C: "InlineCode",
  HT: "HTMLTag",
  CM: "Comment",
  Pi: "ProcessingInstruction",
  h: "HeaderMark",
  q: "QuoteMark",
  l: "ListMark",
  L: "LinkMark",
  e: "EmphasisMark",
  c: "CodeMark",
  cI: "CodeInfo",
  LT: "LinkTitle",
  LL: "LinkLabel"
}

export class SpecParser {
  constructor(readonly parser: MarkdownParser) {}

  type(name: string) {
    name = abbrev[name] || name
    return this.parser.nodeSet.types.find(t => t.name == name)?.id
  }

  parse(spec: string, specName: string) {
    let doc = "", buffer = [], stack: number[] = []
    for (let pos = 0; pos < spec.length; pos++) {
      let ch = spec[pos]
      if (ch == "{") {
        let name = /^(\w+):/.exec(spec.slice(pos + 1)), tag = name && this.type(name[1])
        if (tag == null) throw new Error(`Invalid node opening mark at ${pos} in ${specName}`)
        pos += name![0].length
        stack.push(tag, doc.length, buffer.length)
      } else if (ch == "}") {
        if (!stack.length) throw new Error(`Mismatched node close mark at ${pos} in ${specName}`)
        let bufStart = stack.pop()!, from = stack.pop()!, type = stack.pop()!
        buffer.push(type, from, doc.length, 4 + buffer.length - bufStart)
      } else {
        doc += ch
      }
    }
    if (stack.length) throw new Error(`Unclosed node in ${specName}`)
    return {tree: Tree.build({buffer, nodeSet: this.parser.nodeSet, topID: this.type("Document"), length: doc.length}), doc}
  }
}

