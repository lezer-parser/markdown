import {parser as cmParser, InlineContext} from "../dist/index.js"
import {compareTree} from "./compare-tree.js"
import {SpecParser} from "./spec.js"
import {it, describe} from "mocha"

// A resolver that clears all asterisk emphasis delimiters (identified by checking
// the character at their position). This demonstrates access to delimiters added
// by the built-in Emphasis parser.
function clearAsteriskEmphasis(cx: InlineContext) {
  for (let i = 0; i < (cx as any).parts.length; i++) {
    let part = (cx as any).parts[i]
    // InlineDelimiter has type.resolve, Elements don't
    if (part && part.type && part.type.resolve === "Emphasis") {
      // Check if this is an asterisk delimiter by looking at the character
      let char = cx.slice(part.from, part.from + 1)
      if (char === "*") {
        (cx as any).parts[i] = null
      }
    }
  }
}

const NoAsteriskEmphasis = {
  delimiterResolvers: [clearAsteriskEmphasis]
} as any

const parser = cmParser.configure([NoAsteriskEmphasis])
const specParser = new SpecParser(parser)

function test(name: string, spec: string, p = parser) {
  it(name, () => {
    let {tree, doc} = specParser.parse(spec, name)
    compareTree(p.parse(doc), tree)
  })
}

describe("delimiterResolvers", () => {
  test("clears asterisk emphasis", `
{P:*hello*}`)

  test("clears strong asterisk emphasis", `
{P:**hello**}`)

  test("preserves underscore emphasis", `
{P:{Em:{e:_}hello{e:_}}}`)

  test("clears asterisk but preserves underscore", `
{P:*foo* {Em:{e:_}bar{e:_}}}`)

  test("clears nested asterisk in underscore", `
{P:{Em:{e:_}hello *world*{e:_}}}`)
})
