import {NodeType, Tree, AbstractParser, ParseSpec} from "lezer-tree"
import ist from "ist"
import {parser} from ".."

function nest(info: string) {
  if (info == "none") return null
  let type = NodeType.define({id: 1, name: info ? "Nest_" + info : "Anon", top: true})
  return new class extends AbstractParser {
    startParse(spec: ParseSpec) {
      let {from = 0, to = spec.input.length} = spec
      return {
        pos: from,
        advance() {
          this.pos = to
          return new Tree(type, [], [], to - from)
        },
        forceFinish() {
          return new Tree(type, [], [], 0)
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
})
