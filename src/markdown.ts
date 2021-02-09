import {Tree, TreeBuffer, NodeType, NodeProp, NodePropSource, TreeFragment, NodeSet, TreeCursor,
        Input, PartialParse, stringInput, ParseContext} from "lezer-tree"

class CompositeBlock {
  static create(type: number, value: number, from: number, parentHash: number, end: number) {
    let hash = (parentHash + (parentHash << 8) + type + (value << 4)) | 0
    return new CompositeBlock(type, value, from, hash, end, [], [])
  }

  constructor(readonly type: number,
              // Used for indentation in list items, markup character in lists
              readonly value: number,
              readonly from: number,
              readonly hash: number,
              public end: number,
              readonly children: (Tree | TreeBuffer)[],
              readonly positions: number[]) {}

  toTree(nodeSet: NodeSet, end = this.end) {
    let last = this.children.length - 1
    if (last >= 0) end = Math.max(end, this.positions[last] + this.children[last].length + this.from)
    let tree = new Tree(nodeSet.types[this.type], this.children, this.positions, end - this.from).balance(2048)
    stampContext(tree.children, this.hash)
    return tree
  }

  copy() {
    return new CompositeBlock(this.type, this.value, this.from, this.hash, this.end,
                            this.children.slice(), this.positions.slice())
  }
}

enum Type {
  Document = 1,

  CodeBlock,
  FencedCode,
  Blockquote,
  HorizontalRule,
  BulletList,
  OrderedList,
  ListItem,
  ATXHeading,
  SetextHeading,
  HTMLBlock,
  LinkReference,
  Paragraph,
  CommentBlock,
  ProcessingInstructionBlock,

  // Inline
  Escape,
  Entity,
  HardBreak,
  Emphasis,
  StrongEmphasis,
  Link,
  Image,
  InlineCode,
  HTMLTag,
  Comment,
  ProcessingInstruction,
  URL,

  // Smaller tokens
  HeaderMark,
  QuoteMark,
  ListMark,
  LinkMark,
  EmphasisMark,
  CodeMark,
  CodeInfo,
  LinkTitle,
  LinkLabel
}

export class LeafBlock {
  marks: Element[] = []
  parsers: LeafBlockParser[] = []

  constructor(
    readonly start: number,
    public content: string
  ) {}
}

export class Line {
  // The line's text
  text = ""
  // The base indent provided by the contexts (handled so far)
  baseIndent = 0
  // The position corresponding to the base indent
  basePos = 0
  // The number of contexts handled
  depth = 0
  // Any markers (i.e. block quote markers) parsed for the contexts.
  markers: Element[] = []
  // The next non-whitespace character
  pos = 0
  // The column of the next non-whitespace character
  indent = 0
  // The character code of the character after this.pos
  next = -1

  forward() {
    if (this.basePos > this.pos) this.forwardInner()
  }
  
  forwardInner() {
    let newPos = this.skipSpace(this.basePos)
    this.indent = this.countIndent(newPos, this.pos, this.indent)
    this.pos = newPos
    this.next = newPos == this.text.length ? -1 : this.text.charCodeAt(newPos)
  }

  skipSpace(from: number) { return skipSpace(this.text, from) }

  reset(text: string) {
    this.text = text
    this.baseIndent = this.basePos = this.pos = this.indent = 0
    this.forwardInner()
    this.depth = 1
    while (this.markers.length) this.markers.pop()
  }

  moveBase(to: number) {
    this.basePos = to
    this.baseIndent = this.countIndent(to, this.pos, this.indent)
  }

  moveBaseIndent(indent: number) {
    this.baseIndent = indent
    this.basePos = this.findIndent(indent)
  }

  countIndent(to: number, from = 0, indent = 0) {
    for (let i = from; i < to; i++)
      indent += this.text.charCodeAt(i) == 9 ? 4 - indent % 4 : 1
    return indent
  }

  findIndent(goal: number) {
    let i = 0
    for (let indent = 0; i < this.text.length && indent < goal; i++)
      indent += this.text.charCodeAt(i) == 9 ? 4 - indent % 4 : 1
    return i
  }

  scrub() {
    if (!this.baseIndent) return this.text
    let result = ""
    for (let i = 0; i < this.baseIndent; i++) result += " "
    return result + this.text.slice(this.basePos)
  }
}

function skipForList(cx: CompositeBlock, p: BlockContext, line: Line) {
  if (line.pos == line.text.length ||
      (cx != p.context && line.indent >= p.contextStack[line.depth + 1].value + line.baseIndent)) return true
  if (line.indent >= line.baseIndent + 4) return false
  let size = (cx.type == Type.OrderedList ? isOrderedList : isBulletList)(line, p, false)
  return size > 0 &&
    (cx.type != Type.BulletList || isHorizontalRule(line, cx, false) < 0) &&
    line.text.charCodeAt(line.pos + size - 1) == cx.value
}

const DefaultSkipMarkup: {[type: number]: (cx: CompositeBlock, p: BlockContext, line: Line) => boolean} = {
  [Type.Blockquote](cx, p, line) {
    if (line.next != 62 /* '>' */) return false
    line.markers.push(elt(Type.QuoteMark, p.lineStart + line.pos, p.lineStart + line.pos + 1))
    line.moveBase(line.pos + 1)
    cx.end = p.lineStart + line.text.length
    return true
  },
  [Type.ListItem](cx, _p, line) {
    if (line.indent < line.baseIndent + cx.value && line.next > -1) return false
    line.moveBaseIndent(line.baseIndent + cx.value)
    return true
  },
  [Type.OrderedList]: skipForList,
  [Type.BulletList]: skipForList,
  [Type.Document]() { return true }
}

function space(ch: number) { return ch == 32 || ch == 9 || ch == 10 || ch == 13 }

function skipSpace(line: string, i = 0) {
  while (i < line.length && space(line.charCodeAt(i))) i++
  return i
}

function skipSpaceBack(line: string, i: number, to: number) {
  while (i > to && space(line.charCodeAt(i - 1))) i--
  return i
}

function isFencedCode(line: Line) {
  if (line.next != 96 && line.next != 126 /* '`~' */) return -1
  let pos = line.pos + 1
  while (pos < line.text.length && line.text.charCodeAt(pos) == line.next) pos++
  if (pos < line.pos + 3) return -1
  if (line.next == 96) for (let i = pos; i < line.text.length; i++) if (line.text.charCodeAt(i) == 96) return -1
  return pos
}

function isBlockquote(line: Line) {
  return line.next != 62 /* '>' */ ? -1 : line.text.charCodeAt(line.pos + 1) == 32 ? 2 : 1
}

function isHorizontalRule(line: Line, cx: BlockContext, breaking: boolean) {
  if (line.next != 42 && line.next != 45 && line.next != 95 /* '_-*' */) return -1
  let count = 1
  for (let pos = line.pos + 1; pos < line.text.length; pos++) {
    let ch = line.text.charCodeAt(pos)
    if (ch == line.next) count++
    else if (!space(ch)) return -1
  }
  // Setext headers take precedence
  if (breaking && line.next == 45 && isSetextUnderline(line) > -1 && line.depth == cx.contextStack.length) return -1
  return count < 3 ? -1 : 1
}

function inList(p: BlockContext, type: Type) {
  return p.context.type == type ||
    p.contextStack.length > 1 && p.contextStack[p.contextStack.length - 2].type == type
}

function isBulletList(line: Line, p: BlockContext, breaking: boolean) {
  return (line.next == 45 || line.next == 43 || line.next == 42 /* '-+*' */) &&
    (line.pos == line.text.length - 1 || space(line.text.charCodeAt(line.pos + 1))) &&
    (!breaking || inList(p, Type.BulletList) || line.skipSpace(line.pos + 2) < line.text.length) ? 1 : -1
}

function isOrderedList(line: Line, p: BlockContext, breaking: boolean) {
  let pos = line.pos, next = line.next
  for (;;) {
    if (next >= 48 && next <= 57 /* '0-9' */) pos++
    else break
    if (pos == line.text.length) return -1
    next = line.text.charCodeAt(pos)
  }
  if (pos == line.pos || pos > line.pos + 9 ||
      (next != 46 && next != 41 /* '.)' */) ||
      (pos < line.text.length - 1 && !space(line.text.charCodeAt(pos + 1))) ||
      breaking && !inList(p, Type.OrderedList) &&
      (line.skipSpace(pos + 1) == line.text.length || pos > line.pos + 1 || line.next != 49 /* '1' */))
    return -1
  return pos + 1 - line.pos
}

function isAtxHeading(line: Line) {
  if (line.next != 35 /* '#' */) return -1
  let pos = line.pos + 1
  while (pos < line.text.length && line.text.charCodeAt(pos) == 35) pos++
  if (pos < line.text.length && line.text.charCodeAt(pos) != 32) return -1
  let size = pos - line.pos
  return size > 6 ? -1 : size + 1
}

function isSetextUnderline(line: Line) {
  if (line.next != 45 && line.next != 61 /* '-=' */ || line.indent >= line.baseIndent + 4) return -1
  let pos = line.pos + 1
  while (pos < line.text.length && line.text.charCodeAt(pos) == line.next) pos++
  let end = pos
  while (pos < line.text.length && space(line.text.charCodeAt(pos))) pos++
  return pos == line.text.length ? end : -1
}

const EmptyLine = /^[ \t]*$/, CommentEnd = /-->/, ProcessingEnd = /\?>/
const HTMLBlockStyle = [
  [/^<(?:script|pre|style)(?:\s|>|$)/i, /<\/(?:script|pre|style)>/i],
  [/^\s*<!--/, CommentEnd],
  [/^\s*<\?/, ProcessingEnd],
  [/^\s*<![A-Z]/, />/],
  [/^\s*<!\[CDATA\[/, /\]\]>/],
  [/^\s*<\/?(?:address|article|aside|base|basefont|blockquote|body|caption|center|col|colgroup|dd|details|dialog|dir|div|dl|dt|fieldset|figcaption|figure|footer|form|frame|frameset|h1|h2|h3|h4|h5|h6|head|header|hr|html|iframe|legend|li|link|main|menu|menuitem|nav|noframes|ol|optgroup|option|p|param|section|source|summary|table|tbody|td|tfoot|th|thead|title|tr|track|ul)(?:\s|\/?>|$)/i, EmptyLine],
  [/^\s*(?:<\/[a-z][\w-]*\s*>|<[a-z][\w-]*(\s+[a-z:_][\w-.]*(?:\s*=\s*(?:[^\s"'=<>`]+|'[^']*'|"[^"]*"))?)*\s*>)\s*$/i, EmptyLine]
]

function isHTMLBlock(line: Line, _p: BlockContext, breaking: boolean) {
  if (line.next != 60 /* '<' */) return -1
  let rest = line.text.slice(line.pos)
  for (let i = 0, e = HTMLBlockStyle.length - (breaking ? 1 : 0); i < e; i++)
    if (HTMLBlockStyle[i][0].test(rest)) return i
  return -1
}

function getListIndent(line: Line, pos: number) {
  let indentAfter = line.countIndent(pos, line.pos, line.indent)
  let indented = line.countIndent(line.skipSpace(pos), pos, indentAfter)
  return indented >= indentAfter + 5 ? indentAfter + 1 : indented
}

// Return type for block parsing functions. Can be either:
//
// - false to indicate that nothing was matched and lower-precedence
//   parsers should run.
//
// - true to indicate that a leaf block was parsed and the stream
//   was advanced past its content.
//
// - null to indicate that a context was opened and block parsing
//   should continue on this line.
type BlockResult = boolean | null

// Rules for parsing blocks. A return value of false means the rule
// doesn't apply here, true means it does. When true is returned and
// `p.line` has been updated, the rule is assumed to have consumed a
// leaf block. Otherwise, it is assumed to have opened a context.
const DefaultBlockParsers: {[name: string]: ((p: BlockContext, line: Line) => BlockResult) | undefined} = {
  LinkReference: undefined,

  IndentedCode(p, line) {
    let base = line.baseIndent + 4
    if (line.indent < base) return false
    let start = line.findIndent(base)
    let from = p.lineStart + start, end = p.lineStart + line.text.length
    let marks: Element[] = [], pendingMarks: Element[] = []
    for (; p.nextLine();) {
      if (line.depth < p.contextStack.length) break
      if (line.pos == line.text.length) { // Empty
        for (let m of line.markers) pendingMarks.push(m)
      } else if (line.indent < base) {
        break
      } else {
        if (pendingMarks.length) {
          for (let m of pendingMarks) marks.push(m)
          pendingMarks = []
        }
        for (let m of line.markers) marks.push(m)
        end = p.lineStart + line.text.length
      }
    }
    if (pendingMarks.length) line.markers = pendingMarks.concat(line.markers)

    let nest = !marks.length && p.parser.codeParser && p.parser.codeParser("")
    if (nest)
      p.startNested(new NestedParse(from, nest.startParse(p.input.clip(end), from, p.parseContext),
                                    tree => new Tree(p.parser.nodeSet.types[Type.CodeBlock], [tree], [0], end - from)))
    else
      p.addNode(new Buffer(p).writeElements(marks, -from).finish(Type.CodeBlock, end - from), from)
    return true
  },

  FencedCode(p, line) {
    let fenceEnd = isFencedCode(line)
    if (fenceEnd < 0) return false
    let from = p.lineStart + line.pos, ch = line.next, len = fenceEnd - line.pos
    let infoFrom = line.skipSpace(fenceEnd), infoTo = skipSpaceBack(line.text, line.text.length, infoFrom)
    let marks: (Element | TreeElement)[] = [elt(Type.CodeMark, from, from + len)], info = ""
    if (infoFrom < infoTo) {
      marks.push(elt(Type.CodeInfo, p.lineStart + infoFrom, p.lineStart + infoTo))
      info = line.text.slice(infoFrom, infoTo)
    }
    let ownMarks = marks.length, startMarks = ownMarks
    let codeStart = p.lineStart + line.text.length + 1, codeEnd = -1

    for (; p.nextLine();) {
      if (line.depth < p.contextStack.length) break
      for (let m of line.markers) marks.push(m)
      let i = line.pos
      if (line.indent - line.baseIndent < 4)
        while (i < line.text.length && line.text.charCodeAt(i) == ch) i++
      if (i - line.pos >= len && line.skipSpace(i) == line.text.length) {
        marks.push(elt(Type.CodeMark, p.lineStart + line.pos, p.lineStart + i))
        ownMarks++
        codeEnd = p.lineStart - 1
        p.nextLine()
        break
      }
    }
    let to = p.prevLineEnd()
    if (codeEnd < 0) codeEnd = to
    // (Don't try to nest if there are blockquote marks in the region.)
    let nest = marks.length == ownMarks && p.parser.codeParser && p.parser.codeParser(info)
    if (nest) {
      p.startNested(new NestedParse(from, nest.startParse(p.input.clip(codeEnd), codeStart, p.parseContext), tree => {
        marks.splice(startMarks, 0, new TreeElement(tree, codeStart))
        return elt(Type.FencedCode, from, to, marks).toTree(p.parser.nodeSet, -from)
      }))
    } else {
      p.addNode(new Buffer(p).writeElements(marks, -from).finish(Type.FencedCode, p.prevLineEnd() - from), from)
    }
    return true
  },

  Blockquote(p, line) {
    let size = isBlockquote(line)
    if (size < 0) return false
    p.startContext(Type.Blockquote, line.pos)
    p.addNode(Type.QuoteMark, p.lineStart + line.pos, p.lineStart + line.pos + 1)
    line.moveBase(line.pos + size)
    return null
  },

  HorizontalRule(p, line) {
    if (isHorizontalRule(line, p, false) < 0) return false
    let from = p.lineStart + line.pos
    p.nextLine()
    p.addNode(Type.HorizontalRule, from)
    return true
  },

  BulletList(p, line) {
    let size = isBulletList(line, p, false)
    if (size < 0) return false
    if (p.context.type != Type.BulletList)
      p.startContext(Type.BulletList, line.basePos, line.next)
    let newBase = getListIndent(line, line.pos + 1)
    p.startContext(Type.ListItem, line.basePos, newBase - line.baseIndent)
    p.addNode(Type.ListMark, p.lineStart + line.pos, p.lineStart + line.pos + size)
    line.moveBaseIndent(newBase)
    return null
  },

  OrderedList(p, line) {
    let size = isOrderedList(line, p, false)
    if (size < 0) return false
    if (p.context.type != Type.OrderedList)
      p.startContext(Type.OrderedList, line.basePos, line.text.charCodeAt(line.pos + size - 1))
    let newBase = getListIndent(line, line.pos + size)
    p.startContext(Type.ListItem, line.basePos, newBase - line.baseIndent)
    p.addNode(Type.ListMark, p.lineStart + line.pos, p.lineStart + line.pos + size)
    line.moveBaseIndent(newBase)
    return null
  },

  ATXHeading(p, line) {
    let size = isAtxHeading(line)
    if (size < 0) return false
    let off = line.pos, from = p.lineStart + off
    let endOfSpace = skipSpaceBack(line.text, line.text.length, off), after = endOfSpace
    while (after > off && line.text.charCodeAt(after - 1) == line.next) after--
    if (after == endOfSpace || after == off || !space(line.text.charCodeAt(after - 1))) after = line.text.length
    let buf = new Buffer(p)
      .write(Type.HeaderMark, 0, size - 1)
      .writeElements(p.parseInline(line.text.slice(off + size, after), from + size), -from)
    if (after < line.text.length) buf.write(Type.HeaderMark, after - off, endOfSpace - off)
    let node = buf.finish(Type.ATXHeading, line.text.length - off)
    p.nextLine()
    p.addNode(node, from)
    return true
  },

  HTMLBlock(p, line) {
    let type = isHTMLBlock(line, p, false)
    if (type < 0) return false
    let from = p.lineStart + line.pos, end = HTMLBlockStyle[type][1]
    let marks: Element[] = [], trailing = end != EmptyLine
    while (!end.test(line.text) && p.nextLine()) {
      if (line.depth < p.contextStack.length) { trailing = false; break }
      for (let m of line.markers) marks.push(m)
    }
    if (trailing) p.nextLine()
    let nodeType = end == CommentEnd ? Type.CommentBlock : end == ProcessingEnd ? Type.ProcessingInstructionBlock : Type.HTMLBlock
    let to = p.prevLineEnd()
    if (!marks.length && nodeType == Type.HTMLBlock && p.parser.htmlParser) {
      p.startNested(new NestedParse(from, p.parser.htmlParser.startParse(p.input.clip(to), from, p.parseContext),
                                    tree => new Tree(p.parser.nodeSet.types[nodeType], [tree], [0], to - from)))
    } else {
      p.addNode(new Buffer(p).writeElements(marks, -from).finish(nodeType, to - from), from)
    }
    return true
  },

  SetextHeading: undefined // Specifies relative precedence for block-continue function
}

const enum RefStage { Failed = -1, Start, Label, Link, Title }

// This implements a state machine that incrementally parses link references. At each
// next line, it looks ahead to see if the line continues the reference or not. If it
// doesn't and a valid link is available ending before that line, it finishes that.
// Similarly, on `finish` (when the leaf is terminated by external circumstances), it
// creates a link reference if there's a valid reference up to the current point.
class LinkReferenceParser implements LeafBlockParser {
  stage = RefStage.Start
  elts: Element[] = []
  pos = 0
  start: number

  constructor(leaf: LeafBlock) {
    this.start = leaf.start
    this.advance(leaf.content)
  }

  nextLine(p: BlockContext, line: Line, leaf: LeafBlock) {
    if (this.stage == RefStage.Failed) return false
    let content = leaf.content + "\n" + line.scrub()
    let finish = this.advance(content)
    if (finish > -1 && finish < content.length) return this.complete(p, leaf, finish)
    return false
  }

  finish(p: BlockContext, leaf: LeafBlock) {
    if ((this.stage == RefStage.Link || this.stage == RefStage.Title) && skipSpace(leaf.content, this.pos) == leaf.content.length)
      return this.complete(p, leaf, leaf.content.length)
    return false
  }

  complete(p: BlockContext, leaf: LeafBlock, len: number) {
    p.addLeafNode(leaf, elt(Type.LinkReference, this.start, this.start + len, this.elts))
    return true
  }

  nextStage(elt: Element | null | false) {
    if (elt) {
      this.pos = elt.to - this.start
      this.elts.push(elt)
      this.stage++
      return true
    }
    if (elt === false) this.stage = RefStage.Failed
    return false
  }

  advance(content: string) {
    for (;;) {
      if (this.stage == RefStage.Failed) {
        return -1
      } else if (this.stage == RefStage.Start) {
        if (!this.nextStage(parseLinkLabel(content, this.pos, this.start, true))) return -1
        if (content.charCodeAt(this.pos) != 58 /* ':' */) return this.stage = RefStage.Failed
        this.elts.push(elt(Type.LinkMark, this.pos + this.start, this.pos + this.start + 1))
        this.pos++
      } else if (this.stage == RefStage.Label) {
        if (!this.nextStage(parseURL(content, skipSpace(content, this.pos), this.start))) return -1
      } else if (this.stage == RefStage.Link) {
        let skip = skipSpace(content, this.pos), end = 0
        if (skip > this.pos) {
          let title = parseLinkTitle(content, skip, this.start)
          if (title) {
            let titleEnd = lineEnd(content, title.to - this.start)
            if (titleEnd > 0) { this.nextStage(title); end = titleEnd }
          }
        }
        if (!end) end = lineEnd(content, this.pos)
        return end > 0 && end < content.length ? end : -1
      } else { // RefStage.Title
        return lineEnd(content, this.pos)
      }
    }
  }
}

function lineEnd(text: string, pos: number) {
  for (; pos < text.length; pos++) {
    let next = text.charCodeAt(pos)
    if (next == 10) break
    if (!space(next)) return -1
  }
  return pos
}

class SetextHeadingParser implements LeafBlockParser {
  nextLine(p: BlockContext, line: Line, leaf: LeafBlock) {
    let underline = line.depth < p.contextStack.length ? -1 : isSetextUnderline(line)
    if (underline < 0) return false
    let underlineMark = elt(Type.HeaderMark, p.lineStart + line.pos, p.lineStart + underline)
    p.nextLine()
    p.addLeafNode(leaf, elt(Type.SetextHeading, leaf.start, p.prevLineEnd(), [
      ...p.parseInline(leaf.content, leaf.start),
      underlineMark
    ]))
    return true
  }

  finish() {
    return false
  }
}

const DefaultLeafBlocks: {[name: string]: (p: BlockContext, leaf: LeafBlock) => LeafBlockParser | null} = {
  LinkReference(_, leaf) { return leaf.content.charCodeAt(0) == 91 /* '[' */ ? new LinkReferenceParser(leaf) : null },
  SetextHeading() { return new SetextHeadingParser }
}

//  (line: Line, p: Parse, breaking: boolean) => number)[] = [
const DefaultEndLeaf: readonly ((p: BlockContext, line: Line) => boolean)[] = [
  (_, line) => isAtxHeading(line) >= 0,
  (_, line) => isFencedCode(line) >= 0,
  (_, line) => isBlockquote(line) >= 0,
  (p, line) => isBulletList(line, p, true) >= 0,
  (p, line) => isOrderedList(line, p, true) >= 0,
  (p, line) => isHorizontalRule(line, p, true) >= 0,
  (p, line) => isHTMLBlock(line, p, true) >= 0
]

class NestedParse {
  constructor(
    readonly from: number,
    readonly parser: PartialParse,
    readonly finish: (tree: Tree) => Tree | TreeBuffer
  ) {}
}

export class BlockContext implements PartialParse {
  context: CompositeBlock
  contextStack: CompositeBlock[]
  line = new Line()
  private atEnd = false
  private fragments: FragmentCursor | null
  private nested: NestedParse | null = null

  lineStart: number

  constructor(readonly parser: MarkdownParser,
              readonly input: Input,
              startPos: number,
              readonly parseContext: ParseContext) {
    this.lineStart = startPos
    this.context = CompositeBlock.create(Type.Document, 0, this.lineStart, 0, 0)
    this.contextStack = [this.context]
    this.fragments = parseContext?.fragments ? new FragmentCursor(parseContext.fragments, input) : null
    this.updateLine(input.lineAfter(this.lineStart))
  }

  get pos() {
    return this.nested ? this.nested.parser.pos : this.lineStart
  }

  advance() {
    if (this.nested) {
      let done = this.nested.parser.advance()
      if (done) {
        this.addNode(this.nested.finish(done), this.nested.from)
        this.nested = null
      }
      return null
    }

    let {line} = this
    for (;;) {
      while (line.depth < this.contextStack.length) this.finishContext()
      for (let mark of line.markers) this.addNode(mark.type, mark.from, mark.to)
      if (line.pos < line.text.length) break
      // Empty line
      if (!this.nextLine()) return this.finish()
    }

    if (this.fragments && this.reuseFragment(line.basePos)) return null

    start: for (;;) {
      for (let type of this.parser.blockParsers) if (type) {
        let result = type(this, line)
        if (result != false) {
          if (result == true) return null
          this.line.forward()
          continue start
        }
      }
      break
    }
      
    let leaf = new LeafBlock(this.lineStart + line.pos, line.text.slice(line.pos))
    for (let parse of this.parser.leafBlockParsers) if (parse) {
      let parser = parse!(this, leaf)
      if (parser) leaf.parsers.push(parser!)
    }
    lines: while (this.nextLine()) {
      if (line.pos == line.text.length) break
      if (line.indent < line.baseIndent + 4) {
        for (let stop of parser.endLeafBlock) if (stop(this, line)) break lines
      }
      for (let parser of leaf.parsers) if (parser.nextLine(this, line, leaf)) return null
      leaf.content += "\n" + line.scrub()
      for (let m of line.markers) leaf.marks.push(m)
    }
    this.finishLeaf(leaf)
    return null
  }

  private reuseFragment(start: number) {
    if (!this.fragments!.moveTo(this.lineStart + start, this.lineStart) ||
        !this.fragments!.matches(this.context.hash)) return false
    let taken = this.fragments!.takeNodes(this)
    if (!taken) return false
    this.lineStart += taken
    if (this.lineStart < this.input.length) {
      this.lineStart++
      this.updateLine(this.input.lineAfter(this.lineStart))
    } else {
      this.atEnd = true
      this.updateLine("")
    }
    return true
  }

  nextLine() {
    this.lineStart += this.line.text.length
    if (this.lineStart >= this.input.length) {
      this.atEnd = true
      this.updateLine("")
      return false
    } else {
      this.lineStart++
      this.updateLine(this.input.lineAfter(this.lineStart))
      return true
    }
  }

  updateLine(text: string) {
    let {line} = this
    line.reset(text)
    for (; line.depth < this.contextStack.length; line.depth++) {
      let cx = this.contextStack[line.depth], handler = this.parser.skipContextMarkup[cx.type]
      if (!handler) throw new Error("Unhandled block context " + Type[cx.type])
      if (!handler(cx, this, line)) break
      line.forward()
    }
  }

  prevLineEnd() { return this.atEnd ? this.lineStart : this.lineStart - 1 }

  startContext(type: Type, start: number, value = 0) {
    this.context = CompositeBlock.create(type, value, this.lineStart + start, this.context.hash, this.lineStart + this.line.text.length)
    this.contextStack.push(this.context)
  }

  addNode(block: Type | Tree | TreeBuffer, from: number, to?: number) {
    if (typeof block == "number") block = new Tree(this.parser.nodeSet.types[block], none, none, (to ?? this.prevLineEnd()) - from)
    this.context.children.push(block)
    this.context.positions.push(from - this.context.from)
  }

  addLeafNode(leaf: LeafBlock, elt: Element) {
    this.addNode(new Buffer(this)
      .writeElements(injectMarks(elt.children, leaf.marks), -elt.from)
      .finish(elt.type, elt.to - elt.from), elt.from)
  }

  startNested(parse: NestedParse) {
    this.nested = parse
  }

  finishContext() {
    this.context = finishContext(this.contextStack, this.parser.nodeSet)
  }

  private finish() {
    while (this.contextStack.length > 1) this.finishContext()
    return this.context.toTree(this.parser.nodeSet, this.lineStart)
  }

  forceFinish() {
    let cx = this.contextStack.map(cx => cx.copy())
    if (this.nested) {
      let inner = cx[cx.length - 1]
      inner.children.push(this.nested.parser.forceFinish())
      inner.positions.push(this.nested.from - inner.from)
    }
    while (cx.length > 1) finishContext(cx, this.parser.nodeSet)
    return cx[0].toTree(this.parser.nodeSet, this.lineStart)
  }

  finishLeaf(leaf: LeafBlock) {
    for (let parser of leaf.parsers) if (parser.finish(this, leaf)) return
    let inline = injectMarks(this.parseInline(leaf.content, leaf.start), leaf.marks)
    this.addNode(new Buffer(this)
      .writeElements(inline, -leaf.start)
      .finish(Type.Paragraph, leaf.content.length), leaf.start)
  }

  parseInline(text: string, offset: number) {
    let cx = new InlineContext(this.parser, text, offset)
    outer: for (let pos = offset; pos < cx.end;) {
      let next = cx.char(pos)
      for (let token of this.parser.inlineParsers) {
        let result = token(cx, next, pos)
        if (result >= 0) { pos = result; continue outer }
      }
      pos++
    }
    return cx.resolveMarkers(0)
  }

  elt(type: string, from: number, to: number, children?: readonly Element[]) {
    return elt(this.parser.getNodeType(type), from, to, children)
  }
}

/// The type that nested parsers should conform to.
export type InnerParser = {
  startParse(input: Input, startPos: number, context: ParseContext): PartialParse
}

export interface NodeSpec {
  name: string,
  block?: boolean,
  composite?(p: BlockContext, value: number): boolean
}

export interface InlineParser {
  name: string,
  parse(cx: InlineContext, next: number, pos: number): number,
  before?: string,
  after?: string
}  

export interface BlockParser {
  name: string,
  parse?(p: BlockContext): BlockResult
  leaf?(p: BlockContext, leaf: LeafBlock): LeafBlockParser | null
  endLeaf?(p: BlockContext, line: Line): boolean
  before?: string,
  after?: string,
}

export interface LeafBlockParser {
  nextLine(p: BlockContext, line: Line, leaf: LeafBlock): boolean
  finish(p: BlockContext, leaf: LeafBlock): boolean
}

export interface MarkdownConfig {
  /// Node props to add to the parser's node set.
  props?: readonly NodePropSource[],
  /// When provided, this will be used to parse the content of code
  /// blocks. `info` is the string after the opening ` ``` ` marker,
  /// or the empty string if there is no such info or this is an
  /// indented code block. If there is a parser available for the
  /// code, it should return a function that can construct the
  /// [partse](#lezer.PartialParse).
  codeParser?: (info: string) => null | InnerParser
  /// The parser used to parse HTML tags (both block and inline).
  htmlParser?: InnerParser,
  defineNodes?: readonly (string | NodeSpec)[],
  parseBlock?: readonly BlockParser[],
  parseInline?: readonly InlineParser[]
}

export type MarkdownConfigElement = MarkdownConfig | readonly MarkdownConfigElement[]

export class MarkdownParser {
  /// @internal
  nodeTypes: {[name: string]: number} = Object.create(null)

  /// @internal
  constructor(
    readonly nodeSet: NodeSet,
    readonly codeParser: null | ((info: string) => null | InnerParser),
    readonly htmlParser: null | InnerParser,
    readonly blockParsers: readonly (((p: BlockContext, line: Line) => BlockResult) | undefined)[],
    readonly leafBlockParsers: readonly (((p: BlockContext, leaf: LeafBlock) => LeafBlockParser | null) | undefined)[],
    readonly blockNames: readonly string[],
    readonly endLeafBlock: readonly ((p: BlockContext, line: Line) => boolean)[],
    readonly skipContextMarkup: {readonly [type: number]: (cx: CompositeBlock, p: BlockContext, line: Line) => boolean},
    readonly inlineParsers: readonly ((cx: InlineContext, next: number, pos: number) => number)[],
    readonly inlineNames: readonly string[]
  ) {
    for (let t of nodeSet.types) this.nodeTypes[t.name] = t.id
  }

  /// Start a parse on the given input.
  startParse(input: Input, startPos = 0, parseContext: ParseContext = {}): PartialParse {
    return new BlockContext(this, input, startPos, parseContext)
  }

  /// Reconfigure the parser.
  configure(spec: MarkdownConfigElement) {
    let config = resolveConfig(spec)
    let {nodeSet, blockParsers, leafBlockParsers, blockNames, endLeafBlock,
         skipContextMarkup, inlineParsers, inlineNames} = this

    if (nonEmpty(config.defineNodes)) {
      skipContextMarkup = Object.assign({}, skipContextMarkup)
      let nodeTypes = nodeSet.types.slice()
      for (let s of config.defineNodes) {
        let {name, block, composite}: NodeSpec = typeof s == "string" ? {name: s} : s
        if (nodeTypes.some(t => t.name == name)) throw new RangeError(`Duplicate definition of node ${name}`)
        if (composite) (skipContextMarkup as any)[nodeTypes.length] =
          (cx: CompositeBlock, p: BlockContext) => composite!(p, cx.value)
        nodeTypes.push(NodeType.define({
          id: nodeTypes.length,
          name,
          props: composite ? [[NodeProp.group, ["Block", "BlockContext"]]]
            : block ? [[NodeProp.group, ["Block", "LeafBlock"]]] : undefined
        }))
      }
      nodeSet = new NodeSet(nodeTypes)
    }

    if (nonEmpty(config.props)) nodeSet = nodeSet.extend(...config.props)

    if (nonEmpty(config.parseBlock)) {
      blockParsers = blockParsers.slice()
      leafBlockParsers = leafBlockParsers.slice()
      blockNames = blockNames.slice()
      endLeafBlock = endLeafBlock.slice()
      for (let spec of config.parseBlock) {
        let pos = spec.before ? findName(blockNames, spec.before)
          : spec.after ? findName(blockNames, spec.after) + 1 : blockNames.length - 1
        ;(blockParsers as any).splice(pos, 0, spec.parse)
        ;(leafBlockParsers as any).splice(pos, 0, spec.leaf)
        ;(blockNames as any).splice(pos, 0, spec.name)
        if (spec.endLeaf) (endLeafBlock as any).push(spec.endLeaf)
      }
    }

    if (nonEmpty(config.parseInline)) {
      inlineParsers = inlineParsers.slice()
      inlineNames = inlineNames.slice()
      for (let spec of config.parseInline) {
        let pos = spec.before ? findName(inlineNames, spec.before)
          : spec.after ? findName(inlineNames, spec.after) + 1 : inlineNames.length - 1
        ;(inlineParsers as any).splice(pos, 0, spec.parse)
        ;(inlineNames as any).splice(pos, 0, spec.name)
      }
    }

    return new MarkdownParser(nodeSet,
                              config.codeParser || this.codeParser,
                              config.htmlParser || this.htmlParser,
                              blockParsers, leafBlockParsers, blockNames,
                              endLeafBlock, skipContextMarkup,
                              inlineParsers, inlineNames)
  }

  /// @internal
  getNodeType(name: string) {
    let found = this.nodeTypes[name]
    if (found == null) throw new RangeError(`Unknown node type '${name}'`)
    return found
  }
}

function nonEmpty<T>(a: undefined | readonly T[]): a is readonly T[] {
  return a != null && a.length > 0
}

function resolveConfig(spec: MarkdownConfigElement): MarkdownConfig {
  if (!Array.isArray(spec)) return spec as MarkdownConfig
  let conf = resolveConfig(spec[0])
  if (spec.length == 1) return conf
  let rest = resolveConfig(spec.slice(1))
  let conc: <T>(a: readonly T[] | undefined, b: readonly T[] | undefined) => readonly T[] =
    (a, b) => (a || none).concat(b || none)
  return {props: conc(conf.props, rest.props),
          codeParser: rest.codeParser || conf.codeParser,
          htmlParser: rest.htmlParser || conf.htmlParser,
          defineNodes: conc(conf.defineNodes, rest.defineNodes),
          parseBlock: conc(conf.parseBlock, rest.parseBlock),
          parseInline: conc(conf.parseInline, rest.parseInline)}
}

function findName(names: readonly string[], name: string) {
  let found = names.indexOf(name)
  if (found < 0) throw new RangeError(`Position specified relative to unknown parser ${name}`)
  return found
}

let nodeTypes = [NodeType.none]
for (let i = 1, name; name = Type[i]; i++) {
  nodeTypes[i] = NodeType.define({
    id: i,
    name,
    props: i >= Type.Escape ? [] : [[NodeProp.group, i in DefaultSkipMarkup ? ["Block", "BlockContext"] : ["Block", "LeafBlock"]]]
  })
}

function finishContext(stack: CompositeBlock[], nodeSet: NodeSet): CompositeBlock {
  let cx = stack.pop()!
  let top = stack[stack.length - 1]
  top.children.push(cx.toTree(nodeSet))
  top.positions.push(cx.from - top.from)
  return top
}

const none: readonly any[] = []

class Buffer {
  content: number[] = []
  nodeSet: NodeSet
  nodes: (Tree | TreeBuffer)[] = []
  constructor(p: BlockContext) { this.nodeSet = p.parser.nodeSet }

  write(type: Type, from: number, to: number, children = 0) {
    this.content.push(type, from, to, 4 + children * 4)
    return this
  }

  writeElements(elts: readonly (Element | TreeElement)[], offset = 0) {
    for (let e of elts) e.writeTo(this, offset)
    return this
  }

  finish(type: Type, length: number) {
    return Tree.build({
      buffer: this.content,
      nodeSet: this.nodeSet,
      reused: this.nodes,
      topID: type,
      length
    })
  }
}  

export class Element {
  constructor(readonly type: Type,
              readonly from: number,
              readonly to: number,
              readonly children: readonly (Element | TreeElement)[] = none) {}

  writeTo(buf: Buffer, offset: number) {
    let startOff = buf.content.length
    buf.writeElements(this.children, offset)
    buf.content.push(this.type, this.from + offset, this.to + offset, buf.content.length + 4 - startOff)
  }

  toTree(nodeSet: NodeSet, offset: number): Tree | TreeBuffer {
    return new Tree(nodeSet.types[this.type],
                    this.children.length ? this.children.map(ch => ch.toTree(nodeSet, this.from)) : none,
                    this.children.length ? this.children.map(ch => ch.from + offset) : none,
                    this.to - this.from)
  }
}

class TreeElement {
  constructor(readonly tree: Tree | TreeBuffer, readonly from: number) {}

  get to() { return this.from + this.tree.length }

  writeTo(buf: Buffer, offset: number) {
    buf.nodes.push(this.tree)
    buf.content.push(buf.nodes.length - 1, this.from + offset, this.to + offset, -1)
  }

  toTree(): Tree | TreeBuffer { return this.tree }
}

function elt(type: Type, from: number, to: number, children?: readonly (Element | TreeElement)[]) {
  return new Element(type, from, to, children)
}

const enum Mark { Open = 1, Close = 2 }

export interface DelimiterType {
  resolve?: string,
  mark?: string
}

const EmphasisUnderscore: DelimiterType = {resolve: "Emphasis", mark: "EmphasisMark"}
const EmphasisAsterisk: DelimiterType = {resolve: "Emphasis", mark: "EmphasisMark"}
const LinkStart: DelimiterType = {}, ImageStart: DelimiterType = {}

class InlineDelimiter {
  constructor(readonly type: DelimiterType,
              readonly from: number,
              readonly to: number,
              public side: Mark) {}
}

const Escapable = "!\"#$%&'()*+,-./:;<=>?@[\\]^_`{|}~"

let Punctuation = /[!"#$%&'()*+,\-.\/:;<=>?@\[\\\]^_`{|}~\xA1\u2010-\u2027]/
try { Punctuation = /[\p{Pc}|\p{Pd}|\p{Pe}|\p{Pf}|\p{Pi}|\p{Po}|\p{Ps}]/u } catch (_) {}

const DefaultInline: {[name: string]: (cx: InlineContext, next: number, pos: number) => number} = {
  Escape(cx, next, start) {
    if (next != 92 /* '\\' */ || start == cx.end - 1) return -1
    let escaped = cx.char(start + 1)
    for (let i = 0; i < Escapable.length; i++) if (Escapable.charCodeAt(i) == escaped)
      return cx.append(elt(Type.Escape, start, start + 2))
    return -1
  },

  Entity(cx, next, start) {
    if (next != 38 /* '&' */) return -1
    let m = /^(?:#\d+|#x[a-f\d]+|\w+);/i.exec(cx.slice(start + 1, start + 31))
    return m ? cx.append(elt(Type.Entity, start, start + 1 + m[0].length)) : -1
  },

  InlineCode(cx, next, start) {
    if (next != 96 /* '`' */ || start && cx.char(start - 1) == 96) return -1
    let pos = start + 1
    while (pos < cx.end && cx.char(pos) == 96) pos++
    let size = pos - start, curSize = 0
    for (; pos < cx.end; pos++) {
      if (cx.char(pos) == 96) {
        curSize++
        if (curSize == size && cx.char(pos + 1) != 96)
          return cx.append(elt(Type.InlineCode, start, pos + 1, [
            elt(Type.CodeMark, start, start + size),
            elt(Type.CodeMark, pos + 1 - size, pos + 1)
          ]))
      } else {
        curSize = 0
      }
    }
    return -1
  },

  HTMLTag(cx, next, start) { // or URL
    if (next != 60 /* '<' */ || start == cx.end - 1) return -1
    let after = cx.slice(start + 1, cx.end)
    let url = /^(?:[a-z][-\w+.]+:[^\s>]+|[a-z\d.!#$%&'*+/=?^_`{|}~-]+@[a-z\d](?:[a-z\d-]{0,61}[a-z\d])?(?:\.[a-z\d](?:[a-z\d-]{0,61}[a-z\d])?)*)>/i.exec(after)
    if (url) return cx.append(elt(Type.URL, start, start + 1 + url[0].length))
    let comment = /^!--[^>](?:-[^-]|[^-])*?-->/i.exec(after)
    if (comment) return cx.append(elt(Type.Comment, start, start + 1 + comment[0].length))
    let procInst = /^\?[^]*?\?>/.exec(after)
    if (procInst) return cx.append(elt(Type.ProcessingInstruction, start, start + 1 + procInst[0].length))
    let m = /^(?:![A-Z][^]*?>|!\[CDATA\[[^]*?\]\]>|\/\s*[a-zA-Z][\w-]*\s*>|\s*[a-zA-Z][\w-]*(\s+[a-zA-Z:_][\w-.:]*(?:\s*=\s*(?:[^\s"'=<>`]+|'[^']*'|"[^"]*"))?)*\s*(\/\s*)?>)/.exec(after)
    if (!m) return -1
    let children: TreeElement[] = []
    if (cx.parser.htmlParser) {
      let p = cx.parser.htmlParser.startParse(stringInput(cx.slice(start, start + 1 + m[0].length)), 0, {}), tree: Tree | null
      while (!(tree = p.advance())) {}
      children = tree.children.map((ch, i) => new TreeElement(ch, start + tree!.positions[i]))
    }
    return cx.append(elt(Type.HTMLTag, start, start + 1 + m[0].length, children))
  },

  Emphasis(cx, next, start) {
    if (next != 95 && next != 42) return -1
    let pos = start + 1
    while (cx.char(pos) == next) pos++
    let before = cx.slice(start - 1, start), after = cx.slice(pos, pos + 1)
    let pBefore = Punctuation.test(before), pAfter = Punctuation.test(after)
    let sBefore = /\s|^$/.test(before), sAfter = /\s|^$/.test(after)
    let leftFlanking = !sAfter && (!pAfter || sBefore || pBefore)
    let rightFlanking = !sBefore && (!pBefore || sAfter || pAfter)
    let canOpen = leftFlanking && (next == 42 || !rightFlanking || pBefore)
    let canClose = rightFlanking && (next == 42 || !leftFlanking || pAfter)
    return cx.append(new InlineDelimiter(next == 95 ? EmphasisUnderscore : EmphasisAsterisk, start, pos,
                                         (canOpen ? Mark.Open : 0) | (canClose ? Mark.Close : 0)))
  },

  HardBreak(cx, next, start) {
    if (next == 92 /* '\\' */ && cx.char(start + 1) == 10 /* '\n' */)
      return cx.append(elt(Type.HardBreak, start, start + 2))
    if (next == 32) {
      let pos = start + 1
      while (cx.char(pos) == 32) pos++
      if (cx.char(pos) == 10 && pos >= start + 2)
        return cx.append(elt(Type.HardBreak, start, pos + 1))
    }
    return -1
  },

  Link(cx, next, start) {
    return next == 91 /* '[' */ ? cx.append(new InlineDelimiter(LinkStart, start, start + 1, Mark.Open)) : -1
  },

  Image(cx, next, start) {
    return next == 33 /* '!' */ && cx.char(start + 1) == 91 /* '[' */
      ? cx.append(new InlineDelimiter(ImageStart, start, start + 2, Mark.Open)) : -1
  },

  LinkEnd(cx, next, start) {
    if (next != 93 /* ']' */) return -1
    // Scanning back to the next link/image start marker
    for (let i = cx.parts.length - 1; i >= 0; i--) {
      let part = cx.parts[i]
      if (part instanceof InlineDelimiter && (part.type == LinkStart || part.type == ImageStart)) {
        // If this one has been set invalid (because it would produce
        // a nested link) or there's no valid link here ignore both.
        if (!part.side || cx.skipSpace(part.to) == start && !/[(\[]/.test(cx.slice(start + 1, start + 2))) {
          cx.parts[i] = null
          return -1
        }
        // Finish the content and replace the entire range in
        // this.parts with the link/image node.
        let content = cx.resolveMarkers(i + 1)
        cx.parts.length = i
        let link = cx.parts[i] = finishLink(cx, content, part.type == LinkStart ? Type.Link : Type.Image, part.from, start + 1)
        // Set any open-link markers before this link to invalid.
        if (part.type == LinkStart) for (let j = 0; j < i; j++) {
          let p = cx.parts[j]
          if (p instanceof InlineDelimiter && p.type == LinkStart) p.side = 0
        }
        return link.to
      }
    }
    return -1
  }
}

function finishLink(cx: InlineContext, content: Element[], type: Type, start: number, startPos: number) {
  let {text} = cx, next = cx.char(startPos), endPos = startPos
  content.unshift(elt(Type.LinkMark, start, start + (type == Type.Image ? 2 : 1)))
  content.push(elt(Type.LinkMark, startPos - 1, startPos))
  if (next == 40 /* '(' */) {
    let pos = cx.skipSpace(startPos + 1)
    let dest = parseURL(text, pos - cx.offset, cx.offset), title
    if (dest) {
      pos = cx.skipSpace(dest.to)
      title = parseLinkTitle(text, pos - cx.offset, cx.offset)
      if (title) pos = cx.skipSpace(title.to)
    }
    if (cx.char(pos) == 41 /* ')' */) {
      content.push(elt(Type.LinkMark, startPos, startPos + 1))
      endPos = pos + 1
      if (dest) content.push(dest)
      if (title) content.push(title)
      content.push(elt(Type.LinkMark, pos, endPos))
    }
  } else if (next == 91 /* '[' */) {
    let label = parseLinkLabel(text, startPos - cx.offset, cx.offset, false)
    if (label) {
      content.push(label)
      endPos = label.to
    }
  }
  return elt(type, start, endPos, content)
}

// These return `null` when falling off the end of the input, `false`
// when parsing fails otherwise (for use in the incremental link
// reference parser).

function parseURL(text: string, start: number, offset: number): null | false | Element {
  let next = text.charCodeAt(start)
  if (next == 60 /* '<' */) {
    for (let pos = start + 1; pos < text.length; pos++) {
      let ch = text.charCodeAt(pos)
      if (ch == 62 /* '>' */) return elt(Type.URL, start + offset, pos + 1 + offset)
      if (ch == 60 || ch == 10 /* '<\n' */) return false
    }
    return null
  } else {
    let depth = 0, pos = start
    for (let escaped = false; pos < text.length; pos++) {
      let ch = text.charCodeAt(pos)
      if (space(ch)) {
        break
      } else if (escaped) {
        escaped = false
      } else if (ch == 40 /* '(' */) {
        depth++
      } else if (ch == 41 /* ')' */) {
        if (!depth) break
        depth--
      } else if (ch == 92 /* '\\' */) {
        escaped = true
      }
    }
    return pos > start ? elt(Type.URL, start + offset, pos + offset) : pos == text.length ? null : false
  }
}

function parseLinkTitle(text: string, start: number, offset: number): null | false | Element {
  let next = text.charCodeAt(start)
  if (next != 39 && next != 34 && next != 40 /* '"\'(' */) return false
  let end = next == 40 ? 41 : next
  for (let pos = start + 1, escaped = false; pos < text.length; pos++) {
    let ch = text.charCodeAt(pos)
    if (escaped) escaped = false
    else if (ch == end) return elt(Type.LinkTitle, start + offset, pos + 1 + offset)
    else if (ch == 92 /* '\\' */) escaped = true
  }
  return null
}

function parseLinkLabel(text: string, start: number, offset: number, requireNonWS: boolean): null | false | Element {
  for (let escaped = false, pos = start + 1, end = Math.min(text.length, pos + 999); pos < end; pos++) {
    let ch = text.charCodeAt(pos)
    if (escaped) escaped = false
    else if (ch == 93 /* ']' */) return requireNonWS ? false : elt(Type.LinkLabel, start + offset, pos + 1 + offset)
    else {
      if (requireNonWS && !space(ch)) requireNonWS = false
      if (ch == 91 /* '[' */) return false
      else if (ch == 92 /* '\\' */) escaped = true
    }
  }
  return null
}

export class InlineContext {
  parts: (Element | InlineDelimiter | null)[] = []

  constructor(readonly parser: MarkdownParser, readonly text: string, readonly offset: number) {}

  char(pos: number) { return pos >= this.end ? -1 : this.text.charCodeAt(pos - this.offset) }
  get end() { return this.offset + this.text.length }
  slice(from: number, to: number) { return this.text.slice(from - this.offset, to - this.offset) }

  append(elt: Element | InlineDelimiter) {
    this.parts.push(elt)
    return elt.to
  }

  addDelimiter(type: DelimiterType, from: number, to: number, open: boolean, close: boolean) {
    return this.append(new InlineDelimiter(type, from, to, (open ? Mark.Open : 0) | (close ? Mark.Close : 0)))
  }

  addElement(elt: Element) {
    return this.append(elt)
  }

  resolveMarkers(from: number) {
    for (let i = from; i < this.parts.length; i++) {
      let close = this.parts[i]
      if (!(close instanceof InlineDelimiter && close.type.resolve && (close.side & Mark.Close))) continue

      let emp = close.type == EmphasisUnderscore || close.type == EmphasisAsterisk
      let closeSize = close.to - close.from
      let open: InlineDelimiter | undefined, j = i - 1
      for (; j >= from; j--) {
        let part = this.parts[j] as InlineDelimiter
        if (!(part instanceof InlineDelimiter && (part.side & Mark.Open) && part.type == close.type) ||
            emp && ((close.side & Mark.Open) || (part.side & Mark.Close)) &&
            (part.to - part.from + closeSize) % 3 == 0 && ((part.to - part.from) % 3 || closeSize % 3))
          continue
        open = part
        break
      }
      if (!open) continue

      let type = close.type.resolve, content = []
      let start = open.from, end = close.to
      if (emp) {
        let size = Math.min(2, open.to - open.from, closeSize)
        start = open.to - size
        end = close.from + size
        type = size == 1 ? "Emphasis" : "StrongEmphasis"
      }
      if (open.type.mark) content.push(this.elt(open.type.mark, start, open.to))
      for (let k = j + 1; k < i; k++) {
        if (this.parts[k] instanceof Element) content.push(this.parts[k] as Element)
        this.parts[k] = null
      }
      if (close.type.mark) content.push(this.elt(close.type.mark, close.from, end))
      let element = this.elt(type, start, end, content)
      this.parts[j] = emp && open.from != start ? new InlineDelimiter(open.type, open.from, start, open.side) : null
      let keep = this.parts[i] = emp && close.to != end ? new InlineDelimiter(close.type, end, close.to, close.side) : null
      if (keep) this.parts.splice(i, 0, element)
      else this.parts[i] = element
    }

    let result = []
    for (let i = from; i < this.parts.length; i++) {
      let part = this.parts[i]
      if (part instanceof Element) result.push(part)
    }
    return result
  }

  skipSpace(from: number) { return skipSpace(this.text, from - this.offset) + this.offset }

  elt(type: string, from: number, to: number, children?: readonly Element[]) {
    return elt(this.parser.getNodeType(type), from, to, children)
  }
}

function injectMarks(elements: readonly (Element | TreeElement)[], marks: Element[]) {
  if (!marks.length) return elements
  if (!elements.length) return marks
  let elts = elements.slice(), eI = 0
  for (let mark of marks) {
    while (eI < elts.length && elts[eI].to < mark.to) eI++
    if (eI < elts.length && elts[eI].from < mark.from) {
      let e = elts[eI]
      if (e instanceof Element)
        elts[eI] = new Element(e.type, e.from, e.to, injectMarks(e.children, [mark]))
    } else {
      elts.splice(eI++, 0, mark)
    }
  }
  return elts
}

const ContextHash = new WeakMap<Tree | TreeBuffer, number>()

function stampContext(nodes: readonly (Tree | TreeBuffer)[], hash: number) {
  for (let n of nodes) {
    ContextHash.set(n, hash)
    if (n instanceof Tree && n.type.isAnonymous) stampContext(n.children, hash)
  }
}

// These are blocks that can span blank lines, and should thus only be
// reused if their next sibling is also being reused.
const NotLast = [Type.CodeBlock, Type.ListItem, Type.OrderedList, Type.BulletList]

class FragmentCursor {
  // Index into fragment array
  i = 0
  // Active fragment
  fragment: TreeFragment | null = null
  fragmentEnd = -1
  // Cursor into the current fragment, if any. When `moveTo` returns
  // true, this points at the first block after `pos`.
  cursor: TreeCursor | null = null

  constructor(readonly fragments: readonly TreeFragment[], readonly input: Input) {
    if (fragments.length) this.fragment = fragments[this.i++]
  }

  nextFragment() {
    this.fragment = this.i < this.fragments.length ? this.fragments[this.i++] : null
    this.cursor = null
    this.fragmentEnd = -1
  }

  moveTo(pos: number, lineStart: number) {
    while (this.fragment && this.fragment.to <= pos) this.nextFragment()
    if (!this.fragment || this.fragment.from > (pos ? pos - 1 : 0)) return false
    if (this.fragmentEnd < 0) {
      let end = this.fragment.to
      while (end > 0 && this.input.get(end - 1) != 10) end--
      this.fragmentEnd = end ? end - 1 : 0
    }

    let c = this.cursor
    if (!c) {
      c = this.cursor = this.fragment.tree.cursor()
      c.firstChild()
    }

    let rPos = pos + this.fragment.offset
    while (c.to <= rPos) if (!c.parent()) return false
    for (;;) {
      if (c.from >= rPos) return this.fragment.from <= lineStart
      if (!c.childAfter(rPos)) return false
    }
  }

  matches(hash: number) {
    let tree = this.cursor!.tree
    return tree && ContextHash.get(tree) == hash
  }

  takeNodes(p: BlockContext) {
    let cur = this.cursor!, off = this.fragment!.offset
    let start = p.lineStart, end = start, blockI = p.context.children.length
    let prevEnd = end, prevI = blockI
    for (;;) {
      if (cur.to - off >= this.fragmentEnd) {
        if (cur.type.isAnonymous && cur.firstChild()) continue
        break
      }
      p.addNode(cur.tree!, cur.from - off)
      // Taken content must always end in a block, because incremental
      // parsing happens on block boundaries. Never stop directly
      // after an indented code block, since those can continue after
      // any number of blank lines.
      if (cur.type.is("Block")) {
        if (NotLast.indexOf(cur.type.id) < 0) {
          end = cur.to - off
          blockI = p.context.children.length
        } else {
          end = prevEnd
          blockI = prevI
          prevEnd = cur.to - off
          prevI = p.context.children.length
        }
      }
      if (!cur.nextSibling()) break
    }
    while (p.context.children.length > blockI) {
      p.context.children.pop()
      p.context.positions.pop()
    }
    return end - start
  }
}

export const parser = new MarkdownParser(
  new NodeSet(nodeTypes),
  null,
  null,
  Object.keys(DefaultBlockParsers).map(n => DefaultBlockParsers[n]),
  Object.keys(DefaultBlockParsers).map(n => DefaultLeafBlocks[n]),
  Object.keys(DefaultBlockParsers),
  DefaultEndLeaf,
  DefaultSkipMarkup,
  Object.keys(DefaultInline).map(n => DefaultInline[n]),
  Object.keys(DefaultInline)
)
