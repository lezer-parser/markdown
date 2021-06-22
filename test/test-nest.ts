import {NodeType, Tree, AbstractParser, ParseSpec, InputGap} from "lezer-tree"
import ist from "ist"
import {parser} from ".."

function nest(info: string) {
  if (info == "none") return null
  let type = NodeType.define({id: 1, name: info ? "Nest_" + info : "Anon", top: true})
  return new class extends AbstractParser {
    startParse(spec: ParseSpec) {
      let {from = 0, to = spec.input.length} = spec
      let mount = (spec.gaps || []).filter(g => g.from > from && g.to < to && g.mount)
      let children = mount.map(m => m.mount!), positions = mount.map(m => m.from - from)
      return {
        pos: from,
        advance() {
          this.pos = to
          return new Tree(type, children, positions, to - from)
        },
        forceFinish() {
          return new Tree(type, children, positions, 0)
        }
      }
    }
  }
}

let nestParser = parser.configure({codeParser: nest})

describe("Markdown nested parsing", () => {
  it("Can nest code parsers", () => {
    let tree = nestParser.parse({input: `
~~~
This is code
~~~
`})
    ist(tree.toString(), "Document(FencedCode(CodeMark,Anon,CodeMark))")
    let fence = tree.topNode.firstChild!, mark = fence.firstChild!, inner = mark.nextSibling!
    ist(fence.from, 1); ist(fence.to, 21)
    ist(mark.from, 1); ist(mark.to, 4)
    ist(inner.from, 5); ist(inner.to, 17)
  })

  it("Gets passed the code info string", () => {
    ist(nestParser.parse({input: `
~~~ javascript
var x = null
~~~
`}).toString(), "Document(FencedCode(CodeMark,CodeInfo,Nest_javascript,CodeMark))")

  })

  it("Can decline to nest", () => {
    ist(nestParser.parse({input: `
~~~ none
This is code
~~~
`}).toString(), "Document(FencedCode(CodeMark,CodeInfo,CodeMark))")
  })

  it("Doesn't nest when there are quote marks in the block", () => {
    ist(nestParser.parse({input: `
> Hello
>
> ~~~ okay
> Code!
> ~~~
`}).toString(), "Document(Blockquote(QuoteMark,Paragraph,QuoteMark,QuoteMark,FencedCode(CodeMark,CodeInfo,QuoteMark,QuoteMark,CodeMark)))")
  })

  it("Can parse the content of indented code blocks", () => {
    ist(nestParser.parse({input: `
Hello

    This is
    Code

Done.
`}).toString(), "Document(Paragraph,CodeBlock(Anon),Paragraph)")
  })

  it("Won't try to parse indented code with quote marks in it", () => {
    ist(nestParser.parse({input: `
Hello

>     This is
>     Code
>
> Done.
`}).toString(), "Document(Paragraph,Blockquote(QuoteMark,CodeBlock(QuoteMark),QuoteMark,QuoteMark,Paragraph))")
  })

  function nodeIs(node: SyntaxNode | null, name: string, from: number, to: number) {
    ist(node)
    ist(node.name, name)
    ist(node.from, from)
    ist(node.to, to)
  }

  let gapType = NodeType.define({name: "Xs", id: 1})
  function gap(from: number, to: number) { return new InputGap(from, to, new Tree(gapType, [], [], to - from)) }

  it("Allows gaps in the input", () => {
    let doc = `
The first X *y* XXX
XXXXXXXXX
XXXXX paragraph.

 - And *a XXXXX list*
`
    let tree = parser.parse({
      input: doc,
      gaps: [gap(11, 36), gap(59, 64)]
    })
    ist(tree.toString(),
        "Document(Paragraph(Xs),BulletList(ListItem(ListMark,Paragraph(Emphasis(EmphasisMark,Xs,EmphasisMark)))))")
    ist(tree.length, doc.length)
    let top = tree.topNode
    nodeIs(top.firstChild, "Paragraph", 1, 47)
    nodeIs(top.firstChild!.firstChild, "Xs", 11, 36)
    let para2 = top.lastChild!.lastChild!.lastChild!
    nodeIs(para2, "Paragraph", 52, 70)
    nodeIs(para2.firstChild, "Emphasis", 56, 70)
    nodeIs(para2.firstChild!.childAfter(58), "Xs", 59, 64)
  })

  it("Can handle multiple gaps in a single node", () => {
    let tree = parser.parse({
      input: "One XXX two XXX three XXX four",
      gaps: [gap(4, 7), gap(12, 15), gap(22, 25)]
    })
    ist(tree.toString(), "Document(Paragraph(Xs,Xs,Xs))")
    ist(tree.length, 30)
    let top = tree.topNode
    nodeIs(top.firstChild, "Paragraph", 0, 30)
    nodeIs(top.firstChild!.firstChild, "Xs", 4, 7)
    nodeIs(top.firstChild!.childAfter(8), "Xs", 12, 15)
    nodeIs(top.firstChild!.lastChild, "Xs", 22, 25)
  })

  it("Places gap nodes in their outermost parent", () => {
    let tree = parser.parse({
      input: "One XXX*XXXtwoXXX*XXX three",
      gaps: [gap(4, 7), gap(8, 11), gap(14, 17), gap(18, 21)]
    })
    ist(tree.toString(), "Document(Paragraph(Xs,Emphasis(EmphasisMark,Xs,Xs,EmphasisMark),Xs))")
  })

  it("Can handle gaps before nested trees", () => {
    let tree = nestParser.parse({
      input: "XXX\n```\nreturn\n```",
      gaps: [gap(0, 3)]
    })
    ist(tree.toString(), "Document(Xs,FencedCode(CodeMark,Anon,CodeMark))")
    let code = tree.topNode.lastChild!
    nodeIs(code, "FencedCode", 4, 18)
    nodeIs(code.childAfter(8)!, "Anon", 8, 14)
  })

  it("Properly forwards gaps inside nested ranges", () => {
    let tree = nestParser.parse({
      input: "```\nretXXXurn\n```",
      gaps: [gap(7, 10)]
    })
    ist(tree.toString(), "Document(FencedCode(CodeMark,Anon(Xs),CodeMark))")
    nodeIs(tree.topNode.firstChild, "FencedCode", 0, 17)
    nodeIs(tree.resolve(4, 1), "Anon", 4, 13)
    nodeIs(tree.resolve(7, 1), "Xs", 7, 10)
  })
})
