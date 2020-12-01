import {NodeType, Tree, stringInput, Input} from "lezer-tree"
import ist from "ist"
import {parser} from ".."

function nest(info: string) {
  if (info == "none") return null
  let type = NodeType.define({id: 1, name: info ? "Nest_" + info : "Anon", top: true})
  return {startParse(input: Input, startPos = 0) {
    return {
      pos: startPos,
      advance() {
        this.pos = input.length
        return new Tree(type, [], [], input.length - startPos)
      },
      forceFinish() {
        return new Tree(type, [], [], 0)
      }
    }
  }}
}

function parse(input: string) {
  let parse = parser.configure({codeParser: nest}).startParse(stringInput(input))
  for (;;) {
    let done = parse.advance()
    if (done) return done
  }
}

describe("Markdown nested parsing", () => {
  it("Can nest code parsers", () => {
    let tree = parse(`
~~~
This is code
~~~
`)
    ist(tree.toString(), "Document(FencedCode(CodeMark,Anon,CodeMark))")
    let fence = tree.topNode.firstChild!, mark = fence.firstChild!, inner = mark.nextSibling!
    ist(fence.from, 1); ist(fence.to, 21)
    ist(mark.from, 1); ist(mark.to, 4)
    ist(inner.from, 5); ist(inner.to, 17)
  })

  it("Gets passed the code info string", () => {
    ist(parse(`
~~~ javascript
var x = null
~~~
`).toString(), "Document(FencedCode(CodeMark,CodeInfo,Nest_javascript,CodeMark))")

  })

  it("Can decline to nest", () => {
    ist(parse(`
~~~ none
This is code
~~~
`).toString(), "Document(FencedCode(CodeMark,CodeInfo,CodeMark))")
  })

  it("Doesn't nest when there are quote marks in the block", () => {
    ist(parse(`
> Hello
>
> ~~~ okay
> Code!
> ~~~
`).toString(), "Document(Blockquote(QuoteMark,Paragraph,QuoteMark,QuoteMark,FencedCode(CodeMark,CodeInfo,QuoteMark,QuoteMark,CodeMark)))")
  })

  it("Can parse the content of indented code blocks", () => {
    ist(parse(`
Hello

    This is
    Code

Done.
`).toString(), "Document(Paragraph,CodeBlock(Anon),Paragraph)")
  })

  it("Won't try to parse indented code with quote marks in it", () => {
    ist(parse(`
Hello

>     This is
>     Code
>
> Done.
`).toString(), "Document(Paragraph,Blockquote(QuoteMark,CodeBlock(QuoteMark),QuoteMark,QuoteMark,Paragraph))")
  })
})
