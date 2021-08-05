import {Tree, NodeProp, SyntaxNode} from "@lezer/common"
import {parser as html} from "@lezer/html"
import ist from "ist"
import {parser, parseCode} from "../dist/index.js"

let full = parser.configure(parseCode({
  codeParser(str) { return !str || str == "html" ? html : null },
  htmlParser: html.configure({dialect: "noMatch"})
}))

function findMounts(tree: Tree) {
  let result = []
  for (let cur = tree.cursor(); cur.next();) {
    let mount = cur.tree?.prop(NodeProp.mounted)
    if (mount) result.push({at: cur.from, mount})
  }
  return result
}

function test(doc: string, ...nest: [string, ...number[]][]) {
  return () => {
    let tree = full.parse(doc), mounts = findMounts(tree)
    ist(mounts.length, nest.length)
    nest.forEach(([repr, ...ranges], i) => {
      let {mount, at} = mounts[i]
      ist(mount.tree.toString(), "Document(" + repr + ")")
      ist(mount.overlay!.map(r => (r.from + at) + "," + (r.to + at)).join(), ranges.join())
    })
  }
}

describe("Code parsing", () => {
  it("parses HTML blocks", test(`
Paragraph

<div id=x>
  Hello &amp; goodbye
</div>`, ["Element(OpenTag(StartTag,TagName,Attribute(AttributeName,Is,UnquotedAttributeValue),EndTag),Text,EntityReference,Text,CloseTag(StartCloseTag,TagName,EndTag))", 12, 51]))

  it("parses inline HTML", test(
    `Paragraph with <em>inline tags</em> in it.`,
    ["Element(OpenTag(StartTag,TagName,EndTag))", 15, 19],
    ["CloseTag(StartCloseTag,TagName,EndTag)", 30, 35]))

  it("parses indented code", test(`
Paragraph.

    <!doctype html>
    Hi
`, ["DoctypeDecl,Text", 17, 33, 37, 39]))

  it("parses fenced code", test(`
Okay

~~~
<p>
  Hey
</p>
~~~`, ["Element(OpenTag(StartTag,TagName,EndTag),Text,CloseTag(StartCloseTag,TagName,EndTag))", 11, 25]))

  it("allows gaps in fenced code", test(`
- >~~~
  ><!doctype html>
  >yay
  > ~~~`, ["DoctypeDecl,Text", 11, 27, 30, 33]))

  it("passes fenced code info", test(`
~~~html
&raquo;
~~~

~~~python
False
~~~`, ["EntityReference", 9, 16]))
})
