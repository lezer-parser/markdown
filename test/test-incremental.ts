import {Tree, TreeFragment} from "lezer-tree"
import {stringInput} from "lezer"
import ist from "ist"
import {MarkdownParser} from ".."
import {compareTree} from "./compare-tree"

let doc1 = `
Header
---
One **two**
three *four*
five.

> Start of quote
>
> 1. Nested list
>
> 2. More content
>    inside the [list][link]
>
>    Continued item
>
>    ~~~
>    Block of code
>    ~~~
>
> 3. And so on

[link]: /ref
[another]: /one
And a final paragraph.
  ***  
The end.
`

function parse(d: string, fragments?: readonly TreeFragment[]) {
  let parser = new MarkdownParser(stringInput(d), {fragments}), result: Tree
  while (!(result = parser.advance())) {}
  return result
}

type ChangeSpec = {from: number, to?: number, insert?: string}[]

class State {
  constructor(readonly doc: string,
              readonly tree: Tree,
              readonly fragments: readonly TreeFragment[]) {}

  static start(doc: string) {
    let tree = parse(doc)
    return new State(doc, tree, TreeFragment.addTree(tree))
  }

  update(changes: ChangeSpec, reparse = true) {
    let changed = [], doc = this.doc, off = 0
    for (let {from, to = from, insert = ""} of changes) {
      doc = doc.slice(0, from) + insert + doc.slice(to)
      changed.push({fromA: from - off, toA: to - off, fromB: from, toB: from + insert.length})
      off += insert.length - (to - from)
    }
    let fragments = TreeFragment.applyChanges(this.fragments, changed, 2)
    if (!reparse) return new State(doc, Tree.empty, fragments)
    let tree = parse(doc, fragments)
    return new State(doc, tree, TreeFragment.addTree(tree, fragments))
  }
}

let _state1: State | null = null, state1 = () => _state1 || (_state1 = State.start(doc1))

function overlap(a: Tree, b: Tree) {
  let inA = new Set<Tree>(), shared = 0, sharingTo = 0
  for (let cur = a.cursor(); cur.next();) if (cur.tree) inA.add(cur.tree)
  for (let cur = b.cursor(); cur.next();) if (cur.tree && inA.has(cur.tree) && cur.type.is("Block") && cur.from >= sharingTo) {
    shared += cur.to - cur.from
    sharingTo = cur.to
  }
  return Math.round(shared * 100 / b.length)
}

function testChange(change: ChangeSpec, reuse = 10) {
  let state = state1().update(change)
  compareTree(state.tree, parse(state.doc))
  if (reuse) ist(overlap(state.tree, state1().tree), reuse, ">")
}

describe("Markdown incremental parsing", () => {
  it("can produce the proper tree", () => {
    // Replace 'three' with 'bears'
    let state = state1().update([{from: 24, to: 29, insert: "bears"}])
    compareTree(state.tree, state1().tree)
  })

  it("reuses nodes from the previous parse", () => {
    // Replace 'three' with 'bears'
    let state = state1().update([{from: 24, to: 29, insert: "bears"}])
    ist(overlap(state1().tree, state.tree), 80, ">")
  })

  it("can reuse content for a change in a block context", () => {
    // Replace 'content' with 'monkeys'
    let state = state1().update([{from: 92, to: 99, insert: "monkeys"}])
    compareTree(state.tree, state1().tree)
    ist(overlap(state1().tree, state.tree), 20, ">")
  })

  it("can handle deleting a quote mark", () => testChange([{from: 82, to: 83}]))

  it("can handle adding to a quoted block", () => testChange([{from: 37, insert: "> "}, {from: 45, insert: "> "}]))

  it("can handle a change in a post-linkref paragraph", () => testChange([{from: 249, to: 251}]))

  it("can handle a change in a paragraph-adjacent linkrefs", () => testChange([{from: 230, to: 231}]))

  it("can deal with multiple changes applied separately", () => {
    let state = state1().update([{from: 190, to: 191}], false).update([{from: 30, insert: "hi\n\nyou"}])
    compareTree(state.tree, parse(state.doc))
    ist(overlap(state.tree, state1().tree), 20, ">")
  })

  it("works when a change happens directly after a block", () => testChange([{from: 150, to: 167}]))

  it("works when a change deletes a blank line after a paragraph", () => testChange([{from: 207, to: 213}]))

  it("doesn't get confused by removing paragraph-breaking markup", () => testChange([{from: 264, to: 265}]))

  function r(n: number) { return Math.floor(Math.random() * n) }
  function rStr(len: number) {
    let result = "", chars = "\n>x-"
    while (result.length < len) result += chars[r(chars.length)]
    return result
  }

  it("survives random changes", () => {
    for (let i = 0, l = doc1.length; i < 20; i++) {
      let c = 1 + r(4), changes = []
      for (let i = 0, rFrom = 0; i < c; i++) {
        let rTo = rFrom + Math.floor((l - rFrom) / (c - i))
        let from = rFrom + r(rTo - rFrom - 1), to = r(2) == 1 ? from : from + r(Math.min(rTo - from, 20))
        let iR = r(3), insert = iR == 0 && from != to ? "" : iR == 1 ? "\n\n" : rStr(r(5) + 1)
        changes.push({from, to, insert})
        l += insert.length - (to - from)
        rFrom = to + insert.length
      }
      testChange(changes, 0)
    }
  })

  it("can handle large documents", () => {
    let doc = doc1.repeat(50)
    let state = State.start(doc)
    let newState = state.update([{from: doc.length >> 1, insert: "a\n\nb"}])
    ist(overlap(state.tree, newState.tree), 90, ">")
  })

  it("properly re-parses a continued indented code block", () => {
    let state = State.start(`
One paragraph to create a bit of string length here

    Code
    Block



Another paragraph that is long enough to create a fragment
`).update([{from: 76, insert: "    "}])
    compareTree(state.tree, parse(state.doc))
  })

  it("properly re-parses a continued list", () => {
    let state = State.start(`
One paragraph to create a bit of string length here

 * List



More content

Another paragraph that is long enough to create a fragment
`).update([{from: 65, insert: " * "}])
    compareTree(state.tree, parse(state.doc))
  })

  it("can recover from incremental parses that stop in the middle of a list", () => {
    let doc = `
1. I am a list item with ***some* emphasized
   content inside** and the parser hopefully stops
   parsing after me.

2. Oh no the list continues.
`
    let parser = new MarkdownParser(stringInput(doc))
    parser.advance()
    ist(parser.pos, doc.length, "<")
    let tree = parser.forceFinish()
    let state = new State(doc, tree, TreeFragment.addTree(tree)).update([])
    ist(state.tree.topNode.lastChild!.from, 1)
  })
})
