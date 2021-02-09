import {MarkdownParser, BlockContext, MarkdownConfig, LeafBlockParser, LeafBlock, Line, Element} from "./markdown"

const StrikethroughDelim = {resolve: "Strikethrough", mark: "StrikethroughMark"}

export const Strikethrough: MarkdownConfig = {
  defineNodes: ["Strikethrough", "StrikethroughMark"],
  parseInline: [{
    name: "Strikethrough",
    parse(cx, next, pos) {
      if (next != 126 /* '~' */ || cx.char(pos + 1) != 126) return -1
      return cx.addDelimiter(StrikethroughDelim, pos, pos + 2, true, true)
    },
    after: "Emphasis"
  }]
}

function countCells(p: MarkdownParser, elts: readonly Element[]) {
  return elts.reduce((c, e) => c + (p.nodeSet.types[e.type].name == "TableCell" ? 1 : 0), 0)
}

function parseRow(cx: BlockContext, line: string, offset: number, startI = 0) {
  let elts = [], cellStart = -1, cellEnd = -1, esc = false
  let parseCell = () => {
    elts.push(cx.elt("TableCell", offset + cellStart, offset + cellEnd,
                     cx.parseInline(line.slice(cellStart, cellEnd), offset + cellStart)))
  }

  for (let i = startI; i < line.length; i++) {
    let next = line.charCodeAt(i)
    if (next == 124 /* '|' */ && !esc) {
      if (cellStart > -1) parseCell()
      elts.push(cx.elt("TableDelimiter", i + offset, i + offset + 1))
      cellStart = cellEnd = -1
    } else if (esc || next != 32 && next != 9) {
      if (cellStart < 0) cellStart = i
      cellEnd = i + 1
    }
    esc = !esc && next == 92
  }
  if (cellStart > -1) parseCell()
  return elts
}

function hasPipe(str: string, start: number) {
  for (let i = start; i < str.length; i++) {
    let next = str.charCodeAt(i)
    if (next == 124 /* '|' */) return true
    if (next == 92 /* '\\' */) i++
  }
  return false
}

class TableParser implements LeafBlockParser {
  // Null means we haven't seen the second line yet, false means this
  // isn't a table, and an array means this is a table and we've
  // parsed the given rows so far.
  rows: false | null | Element[] = null

  nextLine(cx: BlockContext, line: Line, leaf: LeafBlock) {
    if (this.rows == null) { // Second line
      this.rows = false
      let lineText
      if ((line.next == 45 || line.next == 58 || line.next == 124 /* '-:|' */) &&
          /^\|?(\s*:?-+:?\s*\|)+(\s*:?-+:?\s*)?$/.test(lineText = line.text.slice(line.pos))) {
        let first = parseRow(cx, leaf.content, leaf.start)
        let delim = parseRow(cx, lineText, cx.lineStart + line.pos, line.pos)
        if (countCells(cx.parser, first) == countCells(cx.parser, delim))
          this.rows = [cx.elt("TableHeader", leaf.start, leaf.start + leaf.content.length, first),
                       cx.elt("TableDelimiter", cx.lineStart + line.pos, cx.lineStart + line.text.length)]
      }
    } else if (this.rows) { // Line after the second
      this.rows.push(cx.elt("TableRow", cx.lineStart + line.pos, cx.lineStart + line.text.length,
                            parseRow(cx, line.text, cx.lineStart, line.pos)))
    }
    return false
  }

  finish(cx: BlockContext, leaf: LeafBlock) {
    if (this.rows) {
      this.emit(cx, leaf)
      return true
    }
    return false // FIXME
  }

  emit(cx: BlockContext, leaf: LeafBlock) {
    cx.addLeafElement(leaf, cx.elt("Table", leaf.start, leaf.start + leaf.content.length, this.rows as readonly Element[]))
  }
}

export const Table: MarkdownConfig = {
  defineNodes: [
    {name: "Table", block: true},
    "TableHeader",
    "TableRow",
    "TableCell",
    "TableDelimiter"
  ],
  parseBlock: [{
    name: "Table",
    leaf(_, leaf) { return hasPipe(leaf.content, 0) ? new TableParser : null },
    before: "SetextHeading"
  }]
}

class TaskParser implements LeafBlockParser {
  nextLine() { return false }

  finish(cx: BlockContext, leaf: LeafBlock) {
    cx.addLeafElement(leaf, cx.elt("Task", leaf.start, leaf.start + leaf.content.length, [
      cx.elt("TaskMarker", leaf.start, leaf.start + 3),
      ...cx.parseInline(leaf.content.slice(3), leaf.start + 3)
    ]))
    return true
  }
}

export const TaskList: MarkdownConfig = {
  defineNodes: [
    {name: "Task", block: true},
    "TaskMarker"
  ],
  parseBlock: [{
    name: "TaskList",
    leaf(cx, leaf) {
      return /^\[[ xX]\]/.test(leaf.content) && cx.parser.nodeSet.types[cx.context.type].name == "ListItem" ? new TaskParser : null
    },
    after: "SetextHeading"
  }]
}

export const GFM = [Table, TaskList, Strikethrough]
