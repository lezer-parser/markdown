import {Tree, TreeBuffer, NodeType, NodeProp, NodePropSource, TreeFragment, NodeSet, TreeCursor,
        Input, PartialParse, stringInput, ParseContext} from "lezer-tree"

class BlockContext {
  static create(type: number, value: number, from: number, parentHash: number, end: number) {
    let hash = (parentHash + (parentHash << 8) + type + (value << 4)) | 0
    return new BlockContext(type, value, from, hash, end, [], [])
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
    return new BlockContext(this.type, this.value, this.from, this.hash, this.end,
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

class Line {
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
}

function skipForList(cx: BlockContext, p: Parse, line: Line) {
  if (line.pos == line.text.length ||
      (cx != p.context && line.indent >= p.contextStack[line.depth + 1].value + line.baseIndent)) return true
  if (line.indent >= line.baseIndent + 4) return false
  let size = (cx.type == Type.OrderedList ? isOrderedList : isBulletList)(line, p, false)
  return size > 0 &&
    (cx.type != Type.BulletList || isHorizontalRule(line) < 0) &&
    line.text.charCodeAt(line.pos + size - 1) == cx.value
}

const DefaultSkipMarkup: {[type: number]: (cx: BlockContext, p: Parse, line: Line) => boolean} = {
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

function isHorizontalRule(line: Line) {
  if (line.next != 42 && line.next != 45 && line.next != 95 /* '-_*' */) return -1
  let count = 1
  for (let pos = line.pos + 1; pos < line.text.length; pos++) {
    let ch = line.text.charCodeAt(pos)
    if (ch == line.next) count++
    else if (!space(ch)) return -1
  }
  return count < 3 ? -1 : 1
}

function inList(p: Parse, type: Type) {
  return p.context.type == type ||
    p.contextStack.length > 1 && p.contextStack[p.contextStack.length - 2].type == type
}

function isBulletList(line: Line, p: Parse, breaking: boolean) {
  return (line.next == 45 || line.next == 43 || line.next == 42 /* '-+*' */) &&
    (line.pos == line.text.length - 1 || space(line.text.charCodeAt(line.pos + 1))) &&
    (!breaking || inList(p, Type.BulletList) || line.skipSpace(line.pos + 2) < line.text.length) ? 1 : -1
}

function isOrderedList(line: Line, p: Parse, breaking: boolean) {
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

function isHTMLBlock(line: Line, _p: Parse, breaking: boolean) {
  if (line.next != 60 /* '<' */) return -1
  let rest = line.text.slice(line.pos)
  for (let i = 0, e = HTMLBlockStyle.length - (breaking ? 1 : 0); i < e; i++)
    if (HTMLBlockStyle[i][0].test(rest)) return i
  return -1
}

function isSetextUnderline(line: Line) {
  if (line.next != 45 && line.next != 61 /* '-=' */) return -1
  let pos = line.pos + 1
  while (pos < line.text.length && line.text.charCodeAt(pos) == line.next) pos++
  let end = pos
  while (pos < line.text.length && space(line.text.charCodeAt(pos))) pos++
  return pos == line.text.length ? end : -1
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
const DefaultBlockStart: {[name: string]: ((p: Parse, line: Line) => BlockResult) | undefined} = {
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

  SetextHeading: undefined, // Specifies relative precedence for block-continue function

  HorizontalRule(p, line) {
    if (isHorizontalRule(line) < 0) return false
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
      .writeElements(parseInline(p, line.text.slice(off + size, after), from + size), -from)
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

  Paragraph(p, line) {
    let from = p.lineStart + line.pos, content = line.text.slice(line.pos), marks: Element[] = []
    lines: while (p.nextLine()) {
      if (line.pos == line.text.length) break
      if (line.indent < line.baseIndent + 4) {
        for (let cont of p.parser.blockContinue) if (cont) {
          let result = cont(p, line, content, from)
          if (result === true) break lines
          if (result !== false) { // Created a node
            let node = new Buffer(p)
              .writeElements(injectMarks(result.children ? result.children.slice() : [], marks), -result.from)
              .finish(result.type, result.to - result.from)
            p.addNode(node, result.from)
            return true
          }
        }
      }
      content += "\n"
      for (let i = 0; i < line.basePos; i++) content += " "
      content += line.text.slice(line.basePos)
      for (let m of line.markers) marks.push(m)
    }

    for (;;) {
      let ref = parseLinkReference(p, content)
      if (!ref) break
      p.addNode(ref, from)
      if (content.length <= ref.length + 1) return true
      content = content.slice(ref.length + 1)
      from += ref.length + 1
      // FIXME these are dropped, but should be added to the ref (awkward!)
      while (marks.length && marks[0].to <= from) marks.shift()
    }

    let inline = injectMarks(parseInline(p, content, from), marks)
    p.addNode(new Buffer(p)
      .writeElements(inline, -from)
      .finish(Type.Paragraph, content.length), from)
    return true
  }
}

//  (line: Line, p: Parse, breaking: boolean) => number)[] = [
const DefaultBlockContinue: {[name: string]: (p: Parse, line: Line, content: string, start: number) => boolean | Element} = {
  SetextHeading(p, line, content, start) {
    let underline = isSetextUnderline(line)
    if (underline < 0 || line.depth < p.contextStack.length) return false
    let inline = parseInline(p, content, start)
    let {lineStart} = p, markStart = lineStart + line.pos, end = p.lineStart + line.text.length
    p.nextLine()
    return elt(Type.SetextHeading, start, end, [
      ...inline,
      elt(Type.HeaderMark, markStart, lineStart + underline)
    ])
  },

  ATXHeading(_, line) { return isAtxHeading(line) >= 0 },
  FencedCode(_, line) { return isFencedCode(line) >= 0 },
  Blockquote(_, line) { return isBlockquote(line) >= 0 },
  BulletList(p, line) { return isBulletList(line, p, true) >= 0 },
  OrderedList(p, line) { return isOrderedList(line, p, true) >= 0 },
  HorizontalRule(_, line) { return isHorizontalRule(line) >= 0 },
  HTMLBlock(p, line) { return isHTMLBlock(line, p, true) >= 0 }
}

class NestedParse {
  constructor(
    readonly from: number,
    readonly parser: PartialParse,
    readonly finish: (tree: Tree) => Tree | TreeBuffer
  ) {}
}

class Parse implements PartialParse {
  context: BlockContext
  contextStack: BlockContext[]
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
    this.context = BlockContext.create(Type.Document, 0, this.lineStart, 0, 0)
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
    for (;;) {
      for (let type of this.parser.blockStart) if (type) {
        let result = type(this, line)
        if (result != false) {
          if (result == true) return null
          this.line.forward()
          break
        }
      }
    }
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
    this.context = BlockContext.create(type, value, this.lineStart + start, this.context.hash, this.lineStart + this.line.text.length)
    this.contextStack.push(this.context)
  }

  addNode(block: Type | Tree | TreeBuffer, from: number, to?: number) {
    if (typeof block == "number") block = new Tree(this.parser.nodeSet.types[block], none, none, (to ?? this.prevLineEnd()) - from)
    this.context.children.push(block)
    this.context.positions.push(from - this.context.from)
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
}

/// The type that nested parsers should conform to.
export type InnerParser = {
  startParse(input: Input, startPos: number, context: ParseContext): PartialParse
}

export interface NodeSpec {
  name: string,
  block?: boolean,
  composite?(p: Parse, value: number): boolean
}

export interface InlineParser {
  parse(cx: InlineContext, next: number, pos: number): number,
  before?: string,
  after?: string
}  

export interface BlockParser {
  start?(p: Parse): BlockResult
  continue?(p: Parse, content: string): BlockResult
  before?: string,
  after?: string,
  endParagraph?(p: Parse, breaking: boolean): boolean
}

export class MarkdownParser {
  /// @internal
  constructor(
    readonly nodeSet: NodeSet,
    readonly codeParser: null | ((info: string) => null | InnerParser),
    readonly htmlParser: null | InnerParser,
    readonly blockStart: readonly (((p: Parse, line: Line) => BlockResult) | undefined)[],
    readonly blockContinue: readonly (((p: Parse, line: Line, content: string, start: number) => (Element | boolean)) | undefined)[],
    readonly blockNames: readonly string[],
    readonly skipContextMarkup: {readonly [type: number]: (cx: BlockContext, p: Parse, line: Line) => boolean},
    readonly inlineParsers: readonly ((cx: InlineContext, next: number, pos: number) => number)[],
    readonly inlineNames: readonly string[]
  ) {}

  /// Start a parse on the given input.
  startParse(input: Input, startPos = 0, parseContext: ParseContext = {}): PartialParse {
    return new Parse(this, input, startPos, parseContext)
  }

  /// Reconfigure the parser.
  configure(config: {
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
    parseBlock?: {[name: string]: BlockParser},
    parseInline?: {[name: string]: InlineParser}
  }) {
    let {nodeSet, blockStart, blockContinue, blockNames, skipContextMarkup, inlineParsers, inlineNames} = this
    if (config.defineNodes) {
      skipContextMarkup = Object.assign({}, skipContextMarkup)
      let nodeTypes = nodeSet.types.slice()
      for (let s of config.defineNodes) {
        let {name, block, composite}: NodeSpec = typeof s == "string" ? {name: s} : s
        if (nodeTypes.some(t => t.name == name)) throw new RangeError(`Duplicate definition of node ${name}`)
        if (composite) (skipContextMarkup as any)[nodeTypes.length] = (cx: BlockContext, p: Parse) => composite!(p, cx.value)
        nodeTypes.push(NodeType.define({
          id: nodeTypes.length,
          name,
          props: composite ? [[NodeProp.group, ["Block", "BlockContext"]]]
            : block ? [[NodeProp.group, ["Block", "LeafBlock"]]] : undefined
        }))
      }
      nodeSet = new NodeSet(nodeTypes)
    }

    if (config.props) nodeSet = this.nodeSet.extend(...config.props)

    if (config.parseBlock) {
      blockStart = blockStart.slice()
      blockNames = blockNames.slice()
      for (let name of Object.keys(config.parseBlock)) {
        let spec = config.parseBlock[name]
        let pos = spec.before ? findName(blockNames, spec.before)
          : spec.after ? findName(blockNames, spec.after) + 1 : blockNames.length - 1
        ;(blockStart as any).splice(pos, 0, spec.start)
        ;(blockContinue as any).splice(pos, 0, spec.continue)
        ;(blockNames as any).splice(pos, 0, name)
      }
    }

    if (config.parseInline) {
      inlineParsers = inlineParsers.slice()
      inlineNames = inlineNames.slice()
      for (let name of Object.keys(config.parseInline)) {
        let spec = config.parseInline[name]
        let pos = spec.before ? findName(inlineNames, spec.before)
          : spec.after ? findName(inlineNames, spec.after) + 1 : inlineNames.length - 1
        ;(inlineParsers as any).splice(pos, 0, spec.parse)
        ;(inlineNames as any).splice(pos, 0, name)
      }
    }

    return new MarkdownParser(nodeSet,
                              config.codeParser || this.codeParser,
                              config.htmlParser || this.htmlParser,
                              blockStart, blockContinue, blockNames,
                              skipContextMarkup,
                              inlineParsers, inlineNames)
  }
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

function finishContext(stack: BlockContext[], nodeSet: NodeSet): BlockContext {
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
  constructor(p: Parse) { this.nodeSet = p.parser.nodeSet }

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

class Element {
  constructor(readonly type: Type,
              readonly from: number,
              readonly to: number,
              // FIXME drop null exception for none?
              readonly children: readonly (Element | TreeElement)[] | null = null) {}

  writeTo(buf: Buffer, offset: number) {
    let startOff = buf.content.length
    if (this.children) buf.writeElements(this.children, offset)
    buf.content.push(this.type, this.from + offset, this.to + offset, buf.content.length + 4 - startOff)
  }

  toTree(nodeSet: NodeSet, offset: number): Tree | TreeBuffer {
    return new Tree(nodeSet.types[this.type], this.children ? this.children.map(ch => ch.toTree(nodeSet, this.from)) : [],
                    this.children ? this.children.map(ch => ch.from + offset) : [], this.to - this.from)
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

class InlineMarker {
  constructor(readonly type: Type,
              readonly from: number,
              readonly to: number,
              public value: number) {}
}

const Escapable = "!\"#$%&'()*+,-./:;<=>?@[\\]^_`{|}~"

let Punctuation = /[!"#$%&'()*+,\-.\/:;<=>?@\[\\\]^_`{|}~\xA1\u2010-\u2027]/
try { Punctuation = /[\p{Pc}|\p{Pd}|\p{Pe}|\p{Pf}|\p{Pi}|\p{Po}|\p{Ps}]/u } catch (_) {}

const DefaultInline: {[name: string]: (cx: InlineContext, next: number, pos: number) => number} = {
  escape(cx, next, start) {
    if (next != 92 /* '\\' */ || start == cx.end - 1) return -1
    let escaped = cx.char(start + 1)
    for (let i = 0; i < Escapable.length; i++) if (Escapable.charCodeAt(i) == escaped)
      return cx.append(elt(Type.Escape, start, start + 2))
    return -1
  },

  entity(cx, next, start) {
    if (next != 38 /* '&' */) return -1
    let m = /^(?:#\d+|#x[a-f\d]+|\w+);/i.exec(cx.slice(start + 1, start + 31))
    return m ? cx.append(elt(Type.Entity, start, start + 1 + m[0].length)) : -1
  },

  code(cx, next, start) {
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

  htmlTagOrURL(cx, next, start) {
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

  emphasis(cx, next, start) {
    if (next != 95 && next != 42) return -1
    let pos = start + 1
    while (pos < cx.end && cx.char(pos) == next) pos++
    let before = cx.slice(start - 1, start), after = cx.slice(pos, pos + 1)
    let pBefore = Punctuation.test(before), pAfter = Punctuation.test(after)
    let sBefore = /\s|^$/.test(before), sAfter = /\s|^$/.test(after)
    let leftFlanking = !sAfter && (!pAfter || sBefore || pBefore)
    let rightFlanking = !sBefore && (!pBefore || sAfter || pAfter)
    let canOpen = leftFlanking && (next == 42 || !rightFlanking || pBefore)
    let canClose = rightFlanking && (next == 42 || !leftFlanking || pAfter)
    return cx.append(new InlineMarker(Type.Emphasis, start, pos, (canOpen ? Mark.Open : 0) | (canClose ? Mark.Close : 0)))
  },

  hardBreak(cx, next, start) {
    if (next == 92 /* '\\' */ && cx.char(start + 1) == 10 /* '\n' */)
      return cx.append(elt(Type.HardBreak, start, start + 2))
    if (next == 32) {
      let pos = start + 1
      while (pos < cx.end && cx.char(pos) == 32) pos++
      if (cx.char(pos) == 10 && pos >= start + 2)
        return cx.append(elt(Type.HardBreak, start, pos + 1))
    }
    return -1
  },

  linkOpen(cx, next, start) {
    return next == 91 /* '[' */ ? cx.append(new InlineMarker(Type.Link, start, start + 1, 1)) : -1
  },

  imageOpen(cx, next, start) {
    return next == 33 /* '!' */ && start < cx.end - 1 && cx.char(start + 1) == 91 /* '[' */
      ? cx.append(new InlineMarker(Type.Image, start, start + 2, 1)) : -1
  },

  linkEnd(cx, next, start) {
    if (next != 93 /* ']' */) return -1
    // Scanning back to the next link/image start marker
    for (let i = cx.parts.length - 1; i >= 0; i--) {
      let part = cx.parts[i]
      if (part instanceof InlineMarker && (part.type == Type.Link || part.type == Type.Image)) {
        // If this one has been set invalid (because it would produce
        // a nested link) or there's no valid link here ignore both.
        if (!part.value || cx.skipSpace(part.to) == start && !/[(\[]/.test(cx.slice(start + 1, start + 2))) {
          cx.parts[i] = null
          return -1
        }
        // Finish the content and replace the entire range in
        // this.parts with the link/image node.
        let content = cx.resolveMarkers(i + 1)
        cx.parts.length = i
        let link = cx.parts[i] = finishLink(cx, content, part.type, part.from, start + 1)
        // Set any open-link markers before this link to invalid.
        for (let j = 0; j < i; j++) {
          let p = cx.parts[j]
          if (part.type == Type.Link && p instanceof InlineMarker && p.type == Type.Link) p.value = 0
        }
        return link.to
      }
    }
    return -1
  }
}

function finishLink(cx: InlineContext, content: Element[], type: Type, start: number, startPos: number) {
  let {text} = cx, next = startPos < cx.end ? cx.char(startPos) : -1, endPos = startPos
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

function parseURL(text: string, start: number, offset: number) {
  let next = text.charCodeAt(start)
  if (next == 60 /* '<' */) {
    for (let pos = start + 1; pos < text.length; pos++) {
      let ch = text.charCodeAt(pos)
      if (ch == 62 /* '>' */) return elt(Type.URL, start + offset, pos + 1 + offset)
      if (ch == 60 || ch == 10 /* '<\n' */) break
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
    return pos > start ? elt(Type.URL, start + offset, pos + offset) : null
  }
}

function parseLinkTitle(text: string, start: number, offset: number) {
  let next = text.charCodeAt(start)
  if (next != 39 && next != 34 && next != 40 /* '"\'(' */) return null
  let end = next == 40 ? 41 : next
  for (let pos = start + 1, escaped = false; pos < text.length; pos++) {
    let ch = text.charCodeAt(pos)
    if (escaped) escaped = false
    else if (ch == end) return elt(Type.LinkTitle, start + offset, pos + 1 + offset)
    else if (ch == 92 /* '\\' */) escaped = true
  }
  return null
}

function parseLinkLabel(text: string, start: number, offset: number, requireNonWS: boolean) {
  for (let escaped = false, pos = start + 1, end = Math.min(text.length, pos + 999); pos < end; pos++) {
    let ch = text.charCodeAt(pos)
    if (escaped) escaped = false
    else if (ch == 93 /* ']' */) return requireNonWS ? null : elt(Type.LinkLabel, start + offset, pos + 1 + offset)
    else {
      if (requireNonWS && !space(ch)) requireNonWS = false
      if (ch == 91 /* '[' */) break
      else if (ch == 92 /* '\\' */) escaped = true
    }
  }
  return null
}

function lineEnd(text: string, pos: number) {
  for (; pos < text.length; pos++) {
    let next = text.charCodeAt(pos)
    if (next == 10) break
    if (!space(next)) return -1
  }
  return pos
}

function parseLinkReference(p: Parse, text: string) {
  if (text.charCodeAt(0) != 91 /* '[' */) return null
  let ref = parseLinkLabel(text, 0, 0, true)
  if (!ref || text.charCodeAt(ref.to) != 58 /* ':' */) return null
  let elts = [ref, elt(Type.LinkMark, ref.to, ref.to + 1)]
  let url = parseURL(text, skipSpace(text, ref.to + 1), 0)
  if (!url) return null
  elts.push(url)
  let pos = skipSpace(text, url.to), title, end = 0
  if (pos > url.to && (title = parseLinkTitle(text, pos, 0))) {
    let afterURL = lineEnd(text, title.to)
    if (afterURL > 0) {
      elts.push(title)
      end = afterURL
    }
  }
  if (end == 0) end = lineEnd(text, url.to)
  return end < 0 ? null : new Buffer(p).writeElements(elts).finish(Type.LinkReference, end)
}

class InlineContext {
  parts: (Element | InlineMarker | null)[] = []

  constructor(readonly parser: MarkdownParser, readonly text: string, readonly offset: number) {}

  char(pos: number) { return this.text.charCodeAt(pos - this.offset) }
  get end() { return this.offset + this.text.length }
  slice(from: number, to: number) { return this.text.slice(from - this.offset, to - this.offset) }

  append(elt: Element | InlineMarker) {
    this.parts.push(elt)
    return elt.to
  }

  resolveMarkers(from: number) {
    for (let i = from; i < this.parts.length; i++) {
      let close = this.parts[i]
      if (!(close instanceof InlineMarker && close.type == Type.Emphasis && (close.value & Mark.Close))) continue

      let type = this.char(close.from), closeSize = close.to - close.from
      let open: InlineMarker | undefined, openSize = 0, j = i - 1
      for (; j >= from; j--) {
        let part = this.parts[j] as InlineMarker
        if (!(part instanceof InlineMarker && (part.value & Mark.Open) && this.char(part.from) == type))
          continue
        openSize = part.to - part.from
        if (!((close.value & Mark.Open) || (part.value & Mark.Close)) ||
            (openSize + closeSize) % 3 || (openSize % 3 == 0 && closeSize % 3 == 0)) {
          open = part
          break
        }
      }
      if (!open) continue

      let size = Math.min(2, openSize, closeSize)
      let start = open.to - size, end: number = close.from + size, content = [elt(Type.EmphasisMark, start, open.to)]
      for (let k = j + 1; k < i; k++) {
        if (this.parts[k] instanceof Element) content.push(this.parts[k] as Element)
        this.parts[k] = null
      }
      content.push(elt(Type.EmphasisMark, close.from, end))
      let element = elt(size == 1 ? Type.Emphasis : Type.StrongEmphasis, open.to - size, close.from + size, content)
      this.parts[j] = open.from == start ? null : new InlineMarker(open.type, open.from, start, open.value)
      let keep = this.parts[i] = close.to == end ? null : new InlineMarker(close.type, end, close.to, close.value)
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
}

function parseInline(p: Parse, text: string, offset: number) {
  let cx = new InlineContext(p.parser, text, offset)
  outer: for (let pos = offset; pos < cx.end;) {
    let next = cx.char(pos)
    for (let token of p.parser.inlineParsers) {
      let result = token(cx, next, pos)
      if (result >= 0) { pos = result; continue outer }
    }
    pos++
  }
  return cx.resolveMarkers(0)
}

function injectMarks(elts: (Element | TreeElement)[], marks: Element[]) {
  let eI = 0
  for (let mark of marks) {
    while (eI < elts.length && elts[eI].to < mark.to) eI++
    if (eI < elts.length && elts[eI].from < mark.from) {
      let e = elts[eI]
      if (e instanceof Element)
        elts[eI] = new Element(e.type, e.from, e.to, e.children ? injectMarks(e.children.slice(), [mark]) : [mark])
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

  takeNodes(p: Parse) {
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
  Object.keys(DefaultBlockStart).map(n => DefaultBlockStart[n]),
  Object.keys(DefaultBlockStart).map(n => DefaultBlockContinue[n]),
  Object.keys(DefaultBlockStart),
  DefaultSkipMarkup,
  Object.keys(DefaultInline).map(n => DefaultInline[n]),
  Object.keys(DefaultInline)
)
