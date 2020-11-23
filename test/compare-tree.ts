import {MarkdownParser} from ".."
import {Tree, TreeCursor} from "lezer-tree"

function nextMD(cursor: TreeCursor) {
  for (;;) {
    if (!cursor.next()) return false
    if (cursor.type == MarkdownParser.nodeSet.types[cursor.type.id]) return true
  }
}

export function compareTree(a: Tree, b: Tree) {
  let curA = a.cursor(), curB = b.cursor()
  for (;;) {
    let mismatch = null, next = false
    if (curA.type != curB.type) mismatch = `Node type mismatch (${curA.name} vs ${curB.name})`
    else if (curA.from != curB.from) mismatch = `Start pos mismatch for ${curA.name}: ${curA.from} vs ${curB.from}`
    else if (curA.to != curB.to) mismatch = `End pos mismatch for ${curA.name}: ${curA.to} vs ${curB.to}`
    else if ((next = nextMD(curA)) != nextMD(curB)) mismatch = `Tree size mismatch`
    if (mismatch) throw new Error(`${mismatch}\n  ${a}\n  ${b}`)
    if (!next) break
  }
}
