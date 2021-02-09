import {parser, GFM} from ".."
import {Tree, stringInput} from "lezer-tree"
import {compareTree} from "./compare-tree"
import {SpecParser} from "./spec"

const gfmParser = parser.configure(GFM)

const specParser = new SpecParser(gfmParser, {
  __proto__: null as any,
  Th: "Strikethrough",
  tm: "StrikethroughMark",
  TB: "Table",
  TH: "TableHeader",
  TR: "TableRow",
  TC: "TableCell",
  tb: "TableDelimiter"
})

function test(name: string, spec: string) {
  it(name, () => {
    let {tree, doc} = specParser.parse(spec, name)
    let parse = gfmParser.startParse(stringInput(doc)), result: Tree | null
    while (!(result = parse.advance())) {}
    compareTree(result, tree)
  })
}

describe("GFM", () => {
  test("Tables (example 198)", `
{TB:{TH:{tb:|} {TC:foo} {tb:|} {TC:bar} {tb:|}}
{tb:| --- | --- |}
{TR:{tb:|} {TC:baz} {tb:|} {TC:bim} {tb:|}}}`)

  test("Tables (example 199)", `
{TB:{TH:{tb:|} {TC:abc} {tb:|} {TC:defghi} {tb:|}}
{tb::-: | -----------:}
{TR:{TC:bar} {tb:|} {TC:baz}}}`)

  test("Tables (example 200)", `
{TB:{TH:{tb:|} {TC:f{Esc:\\|}oo}  {tb:|}}
{tb:| ------ |}
{TR:{tb:|} {TC:b {C:{c:\`}\\|{c:\`}} az} {tb:|}}
{TR:{tb:|} {TC:b {St:{e:**}{Esc:\\|}{e:**}} im} {tb:|}}}`)

  test("Tables (example 201)", `
{TB:{TH:{tb:|} {TC:abc} {tb:|} {TC:def} {tb:|}}
{tb:| --- | --- |}
{TR:{tb:|} {TC:bar} {tb:|} {TC:baz} {tb:|}}}
{Q:{q:>} {P:bar}}`)

  test("Tables (example 202)", `
{TB:{TH:{tb:|} {TC:abc} {tb:|} {TC:def} {tb:|}}
{tb:| --- | --- |}
{TR:{tb:|} {TC:bar} {tb:|} {TC:baz} {tb:|}}
{TR:{TC:bar}}}

{P:bar}`)

  test("Tables (example 203)", `
{P:| abc | def |
| --- |
| bar |}`)

  test("Tables (example 204)", `
{TB:{TH:{tb:|} {TC:abc} {tb:|} {TC:def} {tb:|}}
{tb:| --- | --- |}
{TR:{tb:|} {TC:bar} {tb:|}}
{TR:{tb:|} {TC:bar} {tb:|} {TC:baz} {tb:|} {TC:boo} {tb:|}}}`)

  test("Tables (example 205)", `
{TB:{TH:{tb:|} {TC:abc} {tb:|} {TC:def} {tb:|}}
{tb:| --- | --- |}}`)

  test("Tables (in blockquote)", `
{Q:{q:>} {TB:{TH:{tb:|} {TC:one} {tb:|} {TC:two} {tb:|}}
{q:>} {tb:| --- | --- |}
{q:>} {TR:{tb:|} {TC:123} {tb:|} {TC:456} {tb:|}}}
{q:>}
{q:>} {P:Okay}}`)

  test("Strikethrough (example 491)", `
{P:{Th:{tm:~~}Hi{tm:~~}} Hello, world!}`)

  test("Strikethrough (example 492)", `
{P:This ~~has a}

{P:new paragraph~~.}`)

  test("Strikethrough (nested)", `
{P:Nesting {St:{e:**}with {Th:{tm:~~}emphasis{tm:~~}}{e:**}}.}`)

  test("Strikethrough (overlapping)", `
{P:One {St:{e:**}two ~~three{e:**}} four~~}

{P:One {Th:{tm:~~}two **three{tm:~~}} four**}`)

  test("Strikethrough (escaped)", `
{P:A {Esc:\\~}~b~~}`)

})
