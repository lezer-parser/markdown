import {parser, GFM} from ".."
import {Tree, stringInput} from "lezer-tree"
import {compareTree} from "./compare-tree"
import {SpecParser} from "./spec"

const gfmParser = parser.configure(GFM)

const specParser = new SpecParser(gfmParser)

function test(name: string, spec: string) {
  it(name, () => {
    let {tree, doc} = specParser.parse(spec, name)
    let parse = gfmParser.startParse(stringInput(doc)), result: Tree | null
    while (!(result = parse.advance())) {}
    compareTree(result, tree)
  })
}

describe("GFM", () => {
  test("Strike-through", `
{P:Paragraph with {StrikeThrough:{StrikeThroughMark:~~}deleted{StrikeThroughMark:~~}} text.}

{P:Nesting {St:{e:**}with {StrikeThrough:{StrikeThroughMark:~~}emphasis{StrikeThroughMark:~~}}{e:**}}.}`)
})
