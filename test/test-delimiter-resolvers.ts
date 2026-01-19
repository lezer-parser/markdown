import {parser as cmParser, PreResolveContext} from "../dist/index.js"
import {compareTree} from "./compare-tree.js"
import {SpecParser} from "./spec.js"
import {it, describe} from "mocha"

// A resolver that clears all asterisk emphasis delimiters (identified by checking
// the character at their position). This demonstrates access to delimiters added
// by the built-in Emphasis parser.
function clearAsteriskEmphasis(ctx: PreResolveContext) {
  for (let i = 0; i < ctx.delimiters.length; i++) {
    const delim = ctx.delimiters[i]
    // Check if this is an emphasis delimiter
    if (delim.type && (delim.type as any).resolve === "Emphasis") {
      // Check if this is an asterisk delimiter by looking at the character
      let char = ctx.slice(delim.from, delim.from + 1)
      if (char === "*") {
        ctx.markResolved(i)
      }
    }
  }
}

const NoAsteriskEmphasis = {
  preResolveDelimiters: [clearAsteriskEmphasis]
} as any

const parser = cmParser.configure([NoAsteriskEmphasis])
const specParser = new SpecParser(parser)

function test(name: string, spec: string, p = parser) {
  it(name, () => {
    let {tree, doc} = specParser.parse(spec, name)
    compareTree(p.parse(doc), tree)
  })
}

describe("preResolveDelimiters", () => {
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
