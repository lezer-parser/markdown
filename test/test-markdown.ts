import ist from 'ist';
import {parser} from "../dist/index.js"
import {formatNode} from "./format-node.js"

function parse(spec: string) {
  return formatNode(spec, parser.parse(spec).topNode, 0);
}

const r = String.raw;

// These are the tests from revision 0.29 of the CommonMark spec,
// mechanically translated to the format used here (because their
// original format, providing expected HTML output, doesn't cover most
// of the aspects of the output that we're interested in), and then eyeballed
// to check whether the produced output corresponds to the intent of
// the test.

describe("CommonMark spec", () => {
  it("Tabs (example 1)", () => {
    ist(parse("\tfoo\tbaz\t\tbim\n"), r`Document {
  CodeBlock {
    CodeText("foo\tbaz\t\tbim")
  }
}
`)
  });

  it("Tabs (example 2)", () => {
    ist(parse("  \tfoo\tbaz\t\tbim\n"), r`Document {
  CodeBlock {
    CodeText("foo\tbaz\t\tbim")
  }
}
`)
  });

  it("Tabs (example 3)", () => {
    ist(parse("    a\ta\n    ὐ\ta\n"), r`Document {
  CodeBlock {
    CodeText("a\ta\n")
    CodeText("ὐ\ta")
  }
}
`)
  });

  it("Tabs (example 4)", () => {
    ist(parse("  - foo\n\n\tbar\n"), r`Document {
  BulletList {
    ListItem {
      ListMark("-", 2-3)
      Paragraph("foo")
      Paragraph("bar")
    }
  }
}
`)
  });

  it("Tabs (example 5)", () => {
    ist(parse("- foo\n\n\t\tbar\n"), r`Document {
  BulletList {
    ListItem {
      ListMark("-", 0-1)
      Paragraph("foo")
      CodeBlock {
        CodeText("bar")
      }
    }
  }
}
`)
  });

  it("Tabs (example 6)", () => {
    ist(parse(">\t\tfoo\n"), r`Document {
  Blockquote {
    QuoteMark(">", 0-1)
    CodeBlock {
      CodeText("foo")
    }
  }
}
`)
  });

  it("Tabs (example 7)", () => {
    ist(parse("-\t\tfoo\n"), r`Document {
  BulletList {
    ListItem {
      ListMark("-", 0-1)
      CodeBlock {
        CodeText("foo")
      }
    }
  }
}
`)
  });

  it("Tabs (example 8)", () => {
    ist(parse("    foo\n\tbar\n"), r`Document {
  CodeBlock {
    CodeText("foo\n")
    CodeText("bar")
  }
}
`)
  });

  it("Tabs (example 9)", () => {
    ist(parse(" - foo\n   - bar\n\t - baz\n"), r`Document {
  BulletList {
    ListItem {
      ListMark("-", 1-2)
      Paragraph("foo")
      BulletList {
        ListItem {
          ListMark("-", 10-11)
          Paragraph("bar")
          BulletList {
            ListItem {
              ListMark("-", 18-19)
              Paragraph("baz")
            }
          }
        }
      }
    }
  }
}
`)
  });

  it("Tabs (example 10)", () => {
    ist(parse("#\tFoo\n"), r`Document {
  Paragraph("#\tFoo")
}
`)
  });

  it("Tabs (example 11)", () => {
    ist(parse("*\t*\t*\t\n"), r`Document {
  HorizontalRule("*\t*\t*\t")
}
`)
  });

  it("Precedence (example 12)", () => {
    ist(parse("- `one\n- two`\n"), r`Document {
  BulletList {
    ListItem {
      ListMark("-", 0-1)
      Paragraph("‘one")
    }
    ListItem {
      ListMark("-", 7-8)
      Paragraph("two‘")
    }
  }
}
`)
  });

  it("Thematic breaks (example 13)", () => {
    ist(parse("***\n---\n___\n"), r`Document {
  HorizontalRule("***")
  HorizontalRule("---")
  HorizontalRule("___")
}
`)
  });

  it("Thematic breaks (example 14)", () => {
    ist(parse("+++\n"), r`Document {
  Paragraph("+++")
}
`)
  });

  it("Thematic breaks (example 15)", () => {
    ist(parse("===\n"), r`Document {
  Paragraph("===")
}
`)
  });

  it("Thematic breaks (example 16)", () => {
    ist(parse("--\n**\n__\n"), r`Document {
  Paragraph("--\n**\n__")
}
`)
  });

  it("Thematic breaks (example 17)", () => {
    ist(parse(" ***\n  ***\n   ***\n"), r`Document {
  HorizontalRule("***")
  HorizontalRule("***")
  HorizontalRule("***")
}
`)
  });

  it("Thematic breaks (example 18)", () => {
    ist(parse("    ***\n"), r`Document {
  CodeBlock {
    CodeText("***")
  }
}
`)
  });

  it("Thematic breaks (example 19)", () => {
    ist(parse("Foo\n    ***\n"), r`Document {
  Paragraph("Foo\n    ***")
}
`)
  });

  it("Thematic breaks (example 20)", () => {
    ist(parse("_____________________________________\n"), r`Document {
  HorizontalRule("_____________________________________")
}
`)
  });

  it("Thematic breaks (example 21)", () => {
    ist(parse(" - - -\n"), r`Document {
  HorizontalRule("- - -")
}
`)
  });

  it("Thematic breaks (example 22)", () => {
    ist(parse(" **  * ** * ** * **\n"), r`Document {
  HorizontalRule("**  * ** * ** * **")
}
`)
  });

  it("Thematic breaks (example 23)", () => {
    ist(parse("-     -      -      -\n"), r`Document {
  HorizontalRule("-     -      -      -")
}
`)
  });

  it("Thematic breaks (example 24)", () => {
    ist(parse("- - - -    \n"), r`Document {
  HorizontalRule("- - - -    ")
}
`)
  });

  it("Thematic breaks (example 25)", () => {
    ist(parse("_ _ _ _ a\n\na------\n\n---a---\n"), r`Document {
  Paragraph("_ _ _ _ a")
  Paragraph("a------")
  Paragraph("---a---")
}
`)
  });

  it("Thematic breaks (example 26)", () => {
    ist(parse(" *-*\n"), r`Document {
  Paragraph {
    Emphasis {
      EmphasisMark("*", 1-2)
      EmphasisMark("*", 3-4)
    }
  }
}
`)
  });

  it("Thematic breaks (example 27)", () => {
    ist(parse("- foo\n***\n- bar\n"), r`Document {
  BulletList {
    ListItem {
      ListMark("-", 0-1)
      Paragraph("foo")
    }
  }
  HorizontalRule("***")
  BulletList {
    ListItem {
      ListMark("-", 10-11)
      Paragraph("bar")
    }
  }
}
`)
  });

  it("Thematic breaks (example 28)", () => {
    ist(parse("Foo\n***\nbar\n"), r`Document {
  Paragraph("Foo")
  HorizontalRule("***")
  Paragraph("bar")
}
`)
  });

  it("Thematic breaks (example 29)", () => {
    ist(parse("Foo\n---\nbar\n"), r`Document {
  SetextHeading2 {
    HeaderMark("---", 4-7)
  }
  Paragraph("bar")
}
`)
  });

  it("Thematic breaks (example 30)", () => {
    ist(parse("* Foo\n* * *\n* Bar\n"), r`Document {
  BulletList {
    ListItem {
      ListMark("*", 0-1)
      Paragraph("Foo")
    }
  }
  HorizontalRule("* * *")
  BulletList {
    ListItem {
      ListMark("*", 12-13)
      Paragraph("Bar")
    }
  }
}
`)
  });

  it("Thematic breaks (example 31)", () => {
    ist(parse("- Foo\n- * * *\n"), r`Document {
  BulletList {
    ListItem {
      ListMark("-", 0-1)
      Paragraph("Foo")
    }
    ListItem {
      ListMark("-", 6-7)
      HorizontalRule("* * *")
    }
  }
}
`)
  });

  it("ATX headings (example 32)", () => {
    ist(parse("# foo\n## foo\n### foo\n#### foo\n##### foo\n###### foo\n"), r`Document {
  ATXHeading1 {
    HeaderMark("#", 0-1)
  }
  ATXHeading2 {
    HeaderMark("##", 6-8)
  }
  ATXHeading3 {
    HeaderMark("###", 13-16)
  }
  ATXHeading4 {
    HeaderMark("####", 21-25)
  }
  ATXHeading5 {
    HeaderMark("#####", 30-35)
  }
  ATXHeading6 {
    HeaderMark("######", 40-46)
  }
}
`)
  });

  it("ATX headings (example 33)", () => {
    ist(parse("####### foo\n"), r`Document {
  Paragraph("####### foo")
}
`)
  });

  it("ATX headings (example 34)", () => {
    ist(parse("#5 bolt\n\n#hashtag\n"), r`Document {
  Paragraph("#5 bolt")
  Paragraph("#hashtag")
}
`)
  });

  it("ATX headings (example 35)", () => {
    ist(parse("\\## foo\n"), r`Document {
  Paragraph {
    Escape("\\#")
  }
}
`)
  });

  it("ATX headings (example 36)", () => {
    ist(parse("# foo *bar* \\*baz\\*\n"), r`Document {
  ATXHeading1 {
    HeaderMark("#", 0-1)
    Emphasis {
      EmphasisMark("*", 6-7)
      EmphasisMark("*", 10-11)
    }
    Escape("\\*")
    Escape("\\*")
  }
}
`)
  });

  it("ATX headings (example 37)", () => {
    ist(parse("#                  foo                     \n"), r`Document {
  ATXHeading1 {
    HeaderMark("#", 0-1)
  }
}
`)
  });

  it("ATX headings (example 38)", () => {
    ist(parse(" ### foo\n  ## foo\n   # foo\n"), r`Document {
  ATXHeading3 {
    HeaderMark("###", 1-4)
  }
  ATXHeading2 {
    HeaderMark("##", 11-13)
  }
  ATXHeading1 {
    HeaderMark("#", 21-22)
  }
}
`)
  });

  it("ATX headings (example 39)", () => {
    ist(parse("    # foo\n"), r`Document {
  CodeBlock {
    CodeText("# foo")
  }
}
`)
  });

  it("ATX headings (example 40)", () => {
    ist(parse("foo\n    # bar\n"), r`Document {
  Paragraph("foo\n    # bar")
}
`)
  });

  it("ATX headings (example 41)", () => {
    ist(parse("## foo ##\n  ###   bar    ###\n"), r`Document {
  ATXHeading2 {
    HeaderMark("##", 0-2)
    HeaderMark("##", 7-9)
  }
  ATXHeading3 {
    HeaderMark("###", 12-15)
    HeaderMark("###", 25-28)
  }
}
`)
  });

  it("ATX headings (example 42)", () => {
    ist(parse("# foo ##################################\n##### foo ##\n"), r`Document {
  ATXHeading1 {
    HeaderMark("#", 0-1)
    HeaderMark("##################################", 6-40)
  }
  ATXHeading5 {
    HeaderMark("#####", 41-46)
    HeaderMark("##", 51-53)
  }
}
`)
  });

  it("ATX headings (example 43)", () => {
    ist(parse("### foo ###     \n"), r`Document {
  ATXHeading3 {
    HeaderMark("###", 0-3)
    HeaderMark("###", 8-11)
  }
}
`)
  });

  it("ATX headings (example 44)", () => {
    ist(parse("### foo ### b\n"), r`Document {
  ATXHeading3 {
    HeaderMark("###", 0-3)
  }
}
`)
  });

  it("ATX headings (example 45)", () => {
    ist(parse("# foo#\n"), r`Document {
  ATXHeading1 {
    HeaderMark("#", 0-1)
  }
}
`)
  });

  it("ATX headings (example 46)", () => {
    ist(parse("### foo \\###\n## foo #\\##\n# foo \\#\n"), r`Document {
  ATXHeading3 {
    HeaderMark("###", 0-3)
    Escape("\\#")
  }
  ATXHeading2 {
    HeaderMark("##", 13-15)
    Escape("\\#")
  }
  ATXHeading1 {
    HeaderMark("#", 25-26)
    Escape("\\#")
  }
}
`)
  });

  it("ATX headings (example 47)", () => {
    ist(parse("****\n## foo\n****\n"), r`Document {
  HorizontalRule("****")
  ATXHeading2 {
    HeaderMark("##", 5-7)
  }
  HorizontalRule("****")
}
`)
  });

  it("ATX headings (example 48)", () => {
    ist(parse("Foo bar\n# baz\nBar foo\n"), r`Document {
  Paragraph("Foo bar")
  ATXHeading1 {
    HeaderMark("#", 8-9)
  }
  Paragraph("Bar foo")
}
`)
  });

  it("ATX headings (example 49)", () => {
    ist(parse("## \n#\n### ###\n"), r`Document {
  ATXHeading2 {
    HeaderMark("##", 0-2)
  }
  ATXHeading1 {
    HeaderMark("#", 4-5)
  }
  ATXHeading3 {
    HeaderMark("###", 6-9)
    HeaderMark("###", 10-13)
  }
}
`)
  });

  it("Setext headings (example 50)", () => {
    ist(parse("Foo *bar*\n=========\n\nFoo *bar*\n---------\n"), r`Document {
  SetextHeading1 {
    Emphasis {
      EmphasisMark("*", 4-5)
      EmphasisMark("*", 8-9)
    }
    HeaderMark("=========", 10-19)
  }
  SetextHeading2 {
    Emphasis {
      EmphasisMark("*", 25-26)
      EmphasisMark("*", 29-30)
    }
    HeaderMark("---------", 31-40)
  }
}
`)
  });

  it("Setext headings (example 51)", () => {
    ist(parse("Foo *bar\nbaz*\n====\n"), r`Document {
  SetextHeading1 {
    Emphasis {
      EmphasisMark("*", 4-5)
      EmphasisMark("*", 12-13)
    }
    HeaderMark("====", 14-18)
  }
}
`)
  });

  it("Setext headings (example 52)", () => {
    ist(parse("  Foo *bar\nbaz*\t\n====\n"), r`Document {
  SetextHeading1 {
    Emphasis {
      EmphasisMark("*", 6-7)
      EmphasisMark("*", 14-15)
    }
    HeaderMark("====", 17-21)
  }
}
`)
  });

  it("Setext headings (example 53)", () => {
    ist(parse("Foo\n-------------------------\n\nFoo\n=\n"), r`Document {
  SetextHeading2 {
    HeaderMark("-------------------------", 4-29)
  }
  SetextHeading1 {
    HeaderMark("=", 35-36)
  }
}
`)
  });

  it("Setext headings (example 54)", () => {
    ist(parse("   Foo\n---\n\n  Foo\n-----\n\n  Foo\n  ===\n"), r`Document {
  SetextHeading2 {
    HeaderMark("---", 7-10)
  }
  SetextHeading2 {
    HeaderMark("-----", 18-23)
  }
  SetextHeading1 {
    HeaderMark("===", 33-36)
  }
}
`)
  });

  it("Setext headings (example 55)", () => {
    ist(parse("    Foo\n    ---\n\n    Foo\n---\n"), r`Document {
  CodeBlock {
    CodeText("Foo\n")
    CodeText("---\n\n")
    CodeText("Foo")
  }
  HorizontalRule("---")
}
`)
  });

  it("Setext headings (example 56)", () => {
    ist(parse("Foo\n   ----      \n"), r`Document {
  SetextHeading2 {
    HeaderMark("----", 7-11)
  }
}
`)
  });

  it("Setext headings (example 57)", () => {
    ist(parse("Foo\n    ---\n"), r`Document {
  Paragraph("Foo\n    ---")
}
`)
  });

  it("Setext headings (example 58)", () => {
    ist(parse("Foo\n= =\n\nFoo\n--- -\n"), r`Document {
  Paragraph("Foo\n= =")
  Paragraph("Foo")
  HorizontalRule("--- -")
}
`)
  });

  it("Setext headings (example 59)", () => {
    ist(parse("Foo  \n-----\n"), r`Document {
  SetextHeading2 {
    HeaderMark("-----", 6-11)
  }
}
`)
  });

  it("Setext headings (example 60)", () => {
    ist(parse("Foo\\\n----\n"), r`Document {
  SetextHeading2 {
    HeaderMark("----", 5-9)
  }
}
`)
  });

  it("Setext headings (example 61)", () => {
    ist(parse("`Foo\n----\n`\n\n<a title=\"a lot\n---\nof dashes\"/>\n"), r`Document {
  SetextHeading2 {
    HeaderMark("----", 5-9)
  }
  Paragraph("‘")
  SetextHeading2 {
    HeaderMark("---", 29-32)
  }
  Paragraph("of dashes\"/>")
}
`)
  });

  it("Setext headings (example 62)", () => {
    ist(parse("> Foo\n---\n"), r`Document {
  Blockquote {
    QuoteMark(">", 0-1)
    Paragraph("Foo")
  }
  HorizontalRule("---")
}
`)
  });

  it("Setext headings (example 63)", () => {
    ist(parse("> foo\nbar\n===\n"), r`Document {
  Blockquote {
    QuoteMark(">", 0-1)
    Paragraph("foo\nbar\n===")
  }
}
`)
  });

  it("Setext headings (example 64)", () => {
    ist(parse("- Foo\n---\n"), r`Document {
  BulletList {
    ListItem {
      ListMark("-", 0-1)
      Paragraph("Foo")
    }
  }
  HorizontalRule("---")
}
`)
  });

  it("Setext headings (example 65)", () => {
    ist(parse("Foo\nBar\n---\n"), r`Document {
  SetextHeading2 {
    HeaderMark("---", 8-11)
  }
}
`)
  });

  it("Setext headings (example 66)", () => {
    ist(parse("---\nFoo\n---\nBar\n---\nBaz\n"), r`Document {
  HorizontalRule("---")
  SetextHeading2 {
    HeaderMark("---", 8-11)
  }
  SetextHeading2 {
    HeaderMark("---", 16-19)
  }
  Paragraph("Baz")
}
`)
  });

  it("Setext headings (example 67)", () => {
    ist(parse("\n====\n"), r`Document {
  Paragraph("====")
}
`)
  });

  it("Setext headings (example 68)", () => {
    ist(parse("---\n---\n"), r`Document {
  HorizontalRule("---")
  HorizontalRule("---")
}
`)
  });

  it("Setext headings (example 69)", () => {
    ist(parse("- foo\n-----\n"), r`Document {
  BulletList {
    ListItem {
      ListMark("-", 0-1)
      Paragraph("foo")
    }
  }
  HorizontalRule("-----")
}
`)
  });

  it("Setext headings (example 70)", () => {
    ist(parse("    foo\n---\n"), r`Document {
  CodeBlock {
    CodeText("foo")
  }
  HorizontalRule("---")
}
`)
  });

  it("Setext headings (example 71)", () => {
    ist(parse("> foo\n-----\n"), r`Document {
  Blockquote {
    QuoteMark(">", 0-1)
    Paragraph("foo")
  }
  HorizontalRule("-----")
}
`)
  });

  it("Setext headings (example 72)", () => {
    ist(parse("\\> foo\n------\n"), r`Document {
  SetextHeading2 {
    Escape("\\>")
    HeaderMark("------", 7-13)
  }
}
`)
  });

  it("Setext headings (example 73)", () => {
    ist(parse("Foo\n\nbar\n---\nbaz\n"), r`Document {
  Paragraph("Foo")
  SetextHeading2 {
    HeaderMark("---", 9-12)
  }
  Paragraph("baz")
}
`)
  });

  it("Setext headings (example 74)", () => {
    ist(parse("Foo\nbar\n\n---\n\nbaz\n"), r`Document {
  Paragraph("Foo\nbar")
  HorizontalRule("---")
  Paragraph("baz")
}
`)
  });

  it("Setext headings (example 75)", () => {
    ist(parse("Foo\nbar\n* * *\nbaz\n"), r`Document {
  Paragraph("Foo\nbar")
  HorizontalRule("* * *")
  Paragraph("baz")
}
`)
  });

  it("Setext headings (example 76)", () => {
    ist(parse("Foo\nbar\n\\---\nbaz\n"), r`Document {
  Paragraph {
    Escape("\\-")
  }
}
`)
  });

  it("Indented code blocks (example 77)", () => {
    ist(parse("    a simple\n      indented code block\n"), r`Document {
  CodeBlock {
    CodeText("a simple\n")
    CodeText("  indented code block")
  }
}
`)
  });

  it("Indented code blocks (example 78)", () => {
    ist(parse("  - foo\n\n    bar\n"), r`Document {
  BulletList {
    ListItem {
      ListMark("-", 2-3)
      Paragraph("foo")
      Paragraph("bar")
    }
  }
}
`)
  });

  it("Indented code blocks (example 79)", () => {
    ist(parse("1.  foo\n\n    - bar\n"), r`Document {
  OrderedList {
    ListItem {
      ListMark("1.", 0-2)
      Paragraph("foo")
      BulletList {
        ListItem {
          ListMark("-", 13-14)
          Paragraph("bar")
        }
      }
    }
  }
}
`)
  });

  it("Indented code blocks (example 80)", () => {
    ist(parse("    <a/>\n    *hi*\n\n    - one\n"), r`Document {
  CodeBlock {
    CodeText("<a/>\n")
    CodeText("*hi*\n\n")
    CodeText("- one")
  }
}
`)
  });

  it("Indented code blocks (example 81)", () => {
    ist(parse("    chunk1\n\n    chunk2\n  \n \n \n    chunk3\n"), r`Document {
  CodeBlock {
    CodeText("chunk1\n\n")
    CodeText("chunk2\n")
    CodeText("\n")
    CodeText("\n")
    CodeText("\n")
    CodeText("chunk3")
  }
}
`)
  });

  it("Indented code blocks (example 82)", () => {
    ist(parse("    chunk1\n      \n      chunk2\n"), r`Document {
  CodeBlock {
    CodeText("chunk1\n")
    CodeText("\n")
    CodeText("  chunk2")
  }
}
`)
  });

  it("Indented code blocks (example 83)", () => {
    ist(parse("Foo\n    bar\n\n"), r`Document {
  Paragraph("Foo\n    bar")
}
`)
  });

  it("Indented code blocks (example 84)", () => {
    ist(parse("    foo\nbar\n"), r`Document {
  CodeBlock {
    CodeText("foo")
  }
  Paragraph("bar")
}
`)
  });

  it("Indented code blocks (example 85)", () => {
    ist(parse("# Heading\n    foo\nHeading\n------\n    foo\n----\n"), r`Document {
  ATXHeading1 {
    HeaderMark("#", 0-1)
  }
  CodeBlock {
    CodeText("foo")
  }
  SetextHeading2 {
    HeaderMark("------", 26-32)
  }
  CodeBlock {
    CodeText("foo")
  }
  HorizontalRule("----")
}
`)
  });

  it("Indented code blocks (example 86)", () => {
    ist(parse("        foo\n    bar\n"), r`Document {
  CodeBlock {
    CodeText("    foo\n")
    CodeText("bar")
  }
}
`)
  });

  it("Indented code blocks (example 87)", () => {
    ist(parse("\n    \n    foo\n    \n\n"), r`Document {
  CodeBlock {
    CodeText("foo")
  }
}
`)
  });

  it("Indented code blocks (example 88)", () => {
    ist(parse("    foo  \n"), r`Document {
  CodeBlock {
    CodeText("foo  ")
  }
}
`)
  });

  it("Fenced code blocks (example 89)", () => {
    ist(parse("```\n<\n >\n```\n"), r`Document {
  FencedCode {
    CodeMark("‘‘‘", 0-3)
    CodeText("<\n >")
    CodeMark("‘‘‘", 9-12)
  }
}
`)
  });

  it("Fenced code blocks (example 90)", () => {
    ist(parse("~~~\n<\n >\n~~~\n"), r`Document {
  FencedCode {
    CodeMark("~~~", 0-3)
    CodeText("<\n >")
    CodeMark("~~~", 9-12)
  }
}
`)
  });

  it("Fenced code blocks (example 91)", () => {
    ist(parse("``\nfoo\n``\n"), r`Document {
  Paragraph {
    InlineCode {
      CodeMark("‘‘", 0-2)
      CodeMark("‘‘", 7-9)
    }
  }
}
`)
  });

  it("Fenced code blocks (example 92)", () => {
    ist(parse("```\naaa\n~~~\n```\n"), r`Document {
  FencedCode {
    CodeMark("‘‘‘", 0-3)
    CodeText("aaa\n~~~")
    CodeMark("‘‘‘", 12-15)
  }
}
`)
  });

  it("Fenced code blocks (example 93)", () => {
    ist(parse("~~~\naaa\n```\n~~~\n"), r`Document {
  FencedCode {
    CodeMark("~~~", 0-3)
    CodeText("aaa\n‘‘‘")
    CodeMark("~~~", 12-15)
  }
}
`)
  });

  it("Fenced code blocks (example 94)", () => {
    ist(parse("````\naaa\n```\n``````\n"), r`Document {
  FencedCode {
    CodeMark("‘‘‘‘", 0-4)
    CodeText("aaa\n‘‘‘")
    CodeMark("‘‘‘‘‘‘", 13-19)
  }
}
`)
  });

  it("Fenced code blocks (example 95)", () => {
    ist(parse("~~~~\naaa\n~~~\n~~~~\n"), r`Document {
  FencedCode {
    CodeMark("~~~~", 0-4)
    CodeText("aaa\n~~~")
    CodeMark("~~~~", 13-17)
  }
}
`)
  });

  it("Fenced code blocks (example 96)", () => {
    ist(parse("```\n"), r`Document {
  FencedCode {
    CodeMark("‘‘‘", 0-3)
  }
}
`)
  });

  it("Fenced code blocks (example 97)", () => {
    ist(parse("`````\n\n```\naaa\n"), r`Document {
  FencedCode {
    CodeMark("‘‘‘‘‘", 0-5)
    CodeText("\n‘‘‘\naaa\n")
  }
}
`)
  });

  it("Fenced code blocks (example 98)", () => {
    ist(parse("> ```\n> aaa\n\nbbb\n"), r`Document {
  Blockquote {
    QuoteMark(">", 0-1)
    FencedCode {
      CodeMark("‘‘‘", 2-5)
      QuoteMark(">", 6-7)
      CodeText("aaa")
    }
  }
  Paragraph("bbb")
}
`)
  });

  it("Fenced code blocks (example 99)", () => {
    ist(parse("```\n\n  \n```\n"), r`Document {
  FencedCode {
    CodeMark("‘‘‘", 0-3)
    CodeText("\n  ")
    CodeMark("‘‘‘", 8-11)
  }
}
`)
  });

  it("Fenced code blocks (example 100)", () => {
    ist(parse("```\n```\n"), r`Document {
  FencedCode {
    CodeMark("‘‘‘", 0-3)
    CodeMark("‘‘‘", 4-7)
  }
}
`)
  });

  it("Fenced code blocks (example 101)", () => {
    ist(parse(" ```\n aaa\naaa\n```\n"), r`Document {
  FencedCode {
    CodeMark("‘‘‘", 1-4)
    CodeText(" aaa\naaa")
    CodeMark("‘‘‘", 14-17)
  }
}
`)
  });

  it("Fenced code blocks (example 102)", () => {
    ist(parse("  ```\naaa\n  aaa\naaa\n  ```\n"), r`Document {
  FencedCode {
    CodeMark("‘‘‘", 2-5)
    CodeText("aaa\n  aaa\naaa")
    CodeMark("‘‘‘", 22-25)
  }
}
`)
  });

  it("Fenced code blocks (example 103)", () => {
    ist(parse("   ```\n   aaa\n    aaa\n  aaa\n   ```\n"), r`Document {
  FencedCode {
    CodeMark("‘‘‘", 3-6)
    CodeText("   aaa\n    aaa\n  aaa")
    CodeMark("‘‘‘", 31-34)
  }
}
`)
  });

  it("Fenced code blocks (example 104)", () => {
    ist(parse("    ```\n    aaa\n    ```\n"), r`Document {
  CodeBlock {
    CodeText("‘‘‘\n")
    CodeText("aaa\n")
    CodeText("‘‘‘")
  }
}
`)
  });

  it("Fenced code blocks (example 105)", () => {
    ist(parse("```\naaa\n  ```\n"), r`Document {
  FencedCode {
    CodeMark("‘‘‘", 0-3)
    CodeText("aaa")
    CodeMark("‘‘‘", 10-13)
  }
}
`)
  });

  it("Fenced code blocks (example 106)", () => {
    ist(parse("   ```\naaa\n  ```\n"), r`Document {
  FencedCode {
    CodeMark("‘‘‘", 3-6)
    CodeText("aaa")
    CodeMark("‘‘‘", 13-16)
  }
}
`)
  });

  it("Fenced code blocks (example 107)", () => {
    ist(parse("```\naaa\n    ```\n"), r`Document {
  FencedCode {
    CodeMark("‘‘‘", 0-3)
    CodeText("aaa\n    ‘‘‘\n")
  }
}
`)
  });

  it("Fenced code blocks (example 108)", () => {
    ist(parse("``` ```\naaa\n"), r`Document {
  Paragraph {
    InlineCode {
      CodeMark("‘‘‘", 0-3)
      CodeMark("‘‘‘", 4-7)
    }
  }
}
`)
  });

  it("Fenced code blocks (example 109)", () => {
    ist(parse("~~~~~~\naaa\n~~~ ~~\n"), r`Document {
  FencedCode {
    CodeMark("~~~~~~", 0-6)
    CodeText("aaa\n~~~ ~~\n")
  }
}
`)
  });

  it("Fenced code blocks (example 110)", () => {
    ist(parse("foo\n```\nbar\n```\nbaz\n"), r`Document {
  Paragraph("foo")
  FencedCode {
    CodeMark("‘‘‘", 4-7)
    CodeText("bar")
    CodeMark("‘‘‘", 12-15)
  }
  Paragraph("baz")
}
`)
  });

  it("Fenced code blocks (example 111)", () => {
    ist(parse("foo\n---\n~~~\nbar\n~~~\n# baz\n"), r`Document {
  SetextHeading2 {
    HeaderMark("---", 4-7)
  }
  FencedCode {
    CodeMark("~~~", 8-11)
    CodeText("bar")
    CodeMark("~~~", 16-19)
  }
  ATXHeading1 {
    HeaderMark("#", 20-21)
  }
}
`)
  });

  it("Fenced code blocks (example 112)", () => {
    ist(parse("```ruby\ndef foo(x)\n  return 3\nend\n```\n"), r`Document {
  FencedCode {
    CodeMark("‘‘‘", 0-3)
    CodeInfo("ruby")
    CodeText("def foo(x)\n  return 3\nend")
    CodeMark("‘‘‘", 34-37)
  }
}
`)
  });

  it("Fenced code blocks (example 113)", () => {
    ist(parse("~~~~    ruby startline=3 $%@#$\ndef foo(x)\n  return 3\nend\n~~~~~~~\n"), r`Document {
  FencedCode {
    CodeMark("~~~~", 0-4)
    CodeInfo("ruby startline=3 $%@#$")
    CodeText("def foo(x)\n  return 3\nend")
    CodeMark("~~~~~~~", 57-64)
  }
}
`)
  });

  it("Fenced code blocks (example 114)", () => {
    ist(parse("````;\n````\n"), r`Document {
  FencedCode {
    CodeMark("‘‘‘‘", 0-4)
    CodeInfo(";")
    CodeMark("‘‘‘‘", 6-10)
  }
}
`)
  });

  it("Fenced code blocks (example 115)", () => {
    ist(parse("``` aa ```\nfoo\n"), r`Document {
  Paragraph {
    InlineCode {
      CodeMark("‘‘‘", 0-3)
      CodeMark("‘‘‘", 7-10)
    }
  }
}
`)
  });

  it("Fenced code blocks (example 116)", () => {
    ist(parse("~~~ aa ``` ~~~\nfoo\n~~~\n"), r`Document {
  FencedCode {
    CodeMark("~~~", 0-3)
    CodeInfo("aa ‘‘‘ ~~~")
    CodeText("foo")
    CodeMark("~~~", 19-22)
  }
}
`)
  });

  it("Fenced code blocks (example 117)", () => {
    ist(parse("```\n``` aaa\n```\n"), r`Document {
  FencedCode {
    CodeMark("‘‘‘", 0-3)
    CodeText("‘‘‘ aaa")
    CodeMark("‘‘‘", 12-15)
  }
}
`)
  });

  it("HTML blocks (example 118)", () => {
    ist(parse("<table><tr><td>\n<pre>\n**Hello**,\n\n_world_.\n</pre>\n</td></tr></table>\n"), r`Document {
  HTMLBlock("<table><tr><td>\n<pre>\n**Hello**,")
  Paragraph {
    Emphasis {
      EmphasisMark("_", 34-35)
      EmphasisMark("_", 40-41)
    }
    HTMLTag("</pre>")
  }
  HTMLBlock("</td></tr></table>")
}
`)
  });

  it("HTML blocks (example 119)", () => {
    ist(parse("<table>\n  <tr>\n    <td>\n           hi\n    </td>\n  </tr>\n</table>\n\nokay.\n"), r`Document {
  HTMLBlock("<table>\n  <tr>\n    <td>\n           hi\n    </td>\n  </tr>\n</table>")
  Paragraph("okay.")
}
`)
  });

  it("HTML blocks (example 120)", () => {
    ist(parse(" <div>\n  *hello*\n         <foo><a>\n"), r`Document {
  HTMLBlock("<div>\n  *hello*\n         <foo><a>")
}
`)
  });

  it("HTML blocks (example 121)", () => {
    ist(parse("</div>\n*foo*\n"), r`Document {
  HTMLBlock("</div>\n*foo*")
}
`)
  });

  it("HTML blocks (example 122)", () => {
    ist(parse("<DIV CLASS=\"foo\">\n\n*Markdown*\n\n</DIV>\n"), r`Document {
  HTMLBlock("<DIV CLASS=\"foo\">")
  Paragraph {
    Emphasis {
      EmphasisMark("*", 19-20)
      EmphasisMark("*", 28-29)
    }
  }
  HTMLBlock("</DIV>")
}
`)
  });

  it("HTML blocks (example 123)", () => {
    ist(parse("<div id=\"foo\"\n  class=\"bar\">\n</div>\n"), r`Document {
  HTMLBlock("<div id=\"foo\"\n  class=\"bar\">\n</div>")
}
`)
  });

  it("HTML blocks (example 124)", () => {
    ist(parse("<div id=\"foo\" class=\"bar\n  baz\">\n</div>\n"), r`Document {
  HTMLBlock("<div id=\"foo\" class=\"bar\n  baz\">\n</div>")
}
`)
  });

  it("HTML blocks (example 125)", () => {
    ist(parse("<div>\n*foo*\n\n*bar*\n"), r`Document {
  HTMLBlock("<div>\n*foo*")
  Paragraph {
    Emphasis {
      EmphasisMark("*", 13-14)
      EmphasisMark("*", 17-18)
    }
  }
}
`)
  });

  it("HTML blocks (example 126)", () => {
    ist(parse("<div id=\"foo\"\n*hi*\n"), r`Document {
  HTMLBlock("<div id=\"foo\"\n*hi*")
}
`)
  });

  it("HTML blocks (example 127)", () => {
    ist(parse("<div class\nfoo\n"), r`Document {
  HTMLBlock("<div class\nfoo")
}
`)
  });

  it("HTML blocks (example 128)", () => {
    ist(parse("<div *???-&&&-<---\n*foo*\n"), r`Document {
  HTMLBlock("<div *???-&&&-<---\n*foo*")
}
`)
  });

  it("HTML blocks (example 129)", () => {
    ist(parse("<div><a href=\"bar\">*foo*</a></div>\n"), r`Document {
  HTMLBlock("<div><a href=\"bar\">*foo*</a></div>")
}
`)
  });

  it("HTML blocks (example 130)", () => {
    ist(parse("<table><tr><td>\nfoo\n</td></tr></table>\n"), r`Document {
  HTMLBlock("<table><tr><td>\nfoo\n</td></tr></table>")
}
`)
  });

  it("HTML blocks (example 131)", () => {
    ist(parse("<div></div>\n``` c\nint x = 33;\n```\n"), r`Document {
  HTMLBlock("<div></div>\n‘‘‘ c\nint x = 33;\n‘‘‘")
}
`)
  });

  it("HTML blocks (example 132)", () => {
    ist(parse("<a href=\"foo\">\n*bar*\n</a>\n"), r`Document {
  HTMLBlock("<a href=\"foo\">\n*bar*\n</a>")
}
`)
  });

  it("HTML blocks (example 133)", () => {
    ist(parse("<Warning>\n*bar*\n</Warning>\n"), r`Document {
  HTMLBlock("<Warning>\n*bar*\n</Warning>")
}
`)
  });

  it("HTML blocks (example 134)", () => {
    ist(parse("<i class=\"foo\">\n*bar*\n</i>\n"), r`Document {
  HTMLBlock("<i class=\"foo\">\n*bar*\n</i>")
}
`)
  });

  it("HTML blocks (example 135)", () => {
    ist(parse("</ins>\n*bar*\n"), r`Document {
  HTMLBlock("</ins>\n*bar*")
}
`)
  });

  it("HTML blocks (example 136)", () => {
    ist(parse("<del>\n*foo*\n</del>\n"), r`Document {
  HTMLBlock("<del>\n*foo*\n</del>")
}
`)
  });

  it("HTML blocks (example 137)", () => {
    ist(parse("<del>\n\n*foo*\n\n</del>\n"), r`Document {
  HTMLBlock("<del>")
  Paragraph {
    Emphasis {
      EmphasisMark("*", 7-8)
      EmphasisMark("*", 11-12)
    }
  }
  HTMLBlock("</del>")
}
`)
  });

  it("HTML blocks (example 138)", () => {
    ist(parse("<del>*foo*</del>\n"), r`Document {
  Paragraph {
    HTMLTag("<del>")
    Emphasis {
      EmphasisMark("*", 5-6)
      EmphasisMark("*", 9-10)
    }
    HTMLTag("</del>")
  }
}
`)
  });

  it("HTML blocks (example 139)", () => {
    ist(parse("<pre language=\"haskell\"><code>\nimport Text.HTML.TagSoup\n\nmain :: IO ()\nmain = print $ parseTags tags\n</code></pre>\nokay\n"), r`Document {
  HTMLBlock("<pre language=\"haskell\"><code>\nimport Text.HTML.TagSoup\n\nmain :: IO ()\nmain = print $ parseTags tags\n</code></pre>")
  Paragraph("okay")
}
`)
  });

  it("HTML blocks (example 140)", () => {
    ist(parse("<script type=\"text/javascript\">\n// JavaScript example\n\ndocument.getElementById(\"demo\").innerHTML = \"Hello JavaScript!\";\n</script>\nokay\n"), r`Document {
  HTMLBlock("<script type=\"text/javascript\">\n// JavaScript example\n\ndocument.getElementById(\"demo\").innerHTML = \"Hello JavaScript!\";\n</script>")
  Paragraph("okay")
}
`)
  });

  it("HTML blocks (example 141)", () => {
    ist(parse("<style\n  type=\"text/css\">\nh1 {color:red;}\n\np {color:blue;}\n</style>\nokay\n"), r`Document {
  HTMLBlock("<style\n  type=\"text/css\">\nh1 {color:red;}\n\np {color:blue;}\n</style>")
  Paragraph("okay")
}
`)
  });

  it("HTML blocks (example 142)", () => {
    ist(parse("<style\n  type=\"text/css\">\n\nfoo\n"), r`Document {
  HTMLBlock("<style\n  type=\"text/css\">\n\nfoo\n")
}
`)
  });

  it("HTML blocks (example 143)", () => {
    ist(parse("> <div>\n> foo\n\nbar\n"), r`Document {
  Blockquote {
    QuoteMark(">", 0-1)
    HTMLBlock {
      QuoteMark(">", 8-9)
    }
  }
  Paragraph("bar")
}
`)
  });

  it("HTML blocks (example 144)", () => {
    ist(parse("- <div>\n- foo\n"), r`Document {
  BulletList {
    ListItem {
      ListMark("-", 0-1)
      HTMLBlock("<div>")
    }
    ListItem {
      ListMark("-", 8-9)
      Paragraph("foo")
    }
  }
}
`)
  });

  it("HTML blocks (example 145)", () => {
    ist(parse("<style>p{color:red;}</style>\n*foo*\n"), r`Document {
  HTMLBlock("<style>p{color:red;}</style>")
  Paragraph {
    Emphasis {
      EmphasisMark("*", 29-30)
      EmphasisMark("*", 33-34)
    }
  }
}
`)
  });

  it("HTML blocks (example 146)", () => {
    ist(parse("<!-- foo -->*bar*\n*baz*\n"), r`Document {
  CommentBlock("<!-- foo -->*bar*")
  Paragraph {
    Emphasis {
      EmphasisMark("*", 18-19)
      EmphasisMark("*", 22-23)
    }
  }
}
`)
  });

  it("HTML blocks (example 147)", () => {
    ist(parse("<script>\nfoo\n</script>1. *bar*\n"), r`Document {
  HTMLBlock("<script>\nfoo\n</script>1. *bar*")
}
`)
  });

  it("HTML blocks (example 148)", () => {
    ist(parse("<!-- Foo\n\nbar\n   baz -->\nokay\n"), r`Document {
  CommentBlock("<!-- Foo\n\nbar\n   baz -->")
  Paragraph("okay")
}
`)
  });

  it("HTML blocks (example 149)", () => {
    ist(parse("<?php\n\n  echo '>';\n\n?>\nokay\n"), r`Document {
  ProcessingInstructionBlock("<?php\n\n  echo '>';\n\n?>")
  Paragraph("okay")
}
`)
  });

  it("HTML blocks (example 150)", () => {
    ist(parse("<!DOCTYPE html>\n"), r`Document {
  HTMLBlock("<!DOCTYPE html>")
}
`)
  });

  it("HTML blocks (example 151)", () => {
    ist(parse("<![CDATA[\nfunction matchwo(a,b)\n{\n  if (a < b && a < 0) then {\n    return 1;\n\n  } else {\n\n    return 0;\n  }\n}\n]]>\nokay\n"), r`Document {
  HTMLBlock("<![CDATA[\nfunction matchwo(a,b)\n{\n  if (a < b && a < 0) then {\n    return 1;\n\n  } else {\n\n    return 0;\n  }\n}\n]]>")
  Paragraph("okay")
}
`)
  });

  it("HTML blocks (example 152)", () => {
    ist(parse("  <!-- foo -->\n\n    <!-- foo -->\n"), r`Document {
  CommentBlock("<!-- foo -->")
  CodeBlock {
    CodeText("<!-- foo -->")
  }
}
`)
  });

  it("HTML blocks (example 153)", () => {
    ist(parse("  <div>\n\n    <div>\n"), r`Document {
  HTMLBlock("<div>")
  CodeBlock {
    CodeText("<div>")
  }
}
`)
  });

  it("HTML blocks (example 154)", () => {
    ist(parse("Foo\n<div>\nbar\n</div>\n"), r`Document {
  Paragraph("Foo")
  HTMLBlock("<div>\nbar\n</div>")
}
`)
  });

  it("HTML blocks (example 155)", () => {
    ist(parse("<div>\nbar\n</div>\n*foo*\n"), r`Document {
  HTMLBlock("<div>\nbar\n</div>\n*foo*")
}
`)
  });

  it("HTML blocks (example 156)", () => {
    ist(parse("Foo\n<a href=\"bar\">\nbaz\n"), r`Document {
  Paragraph {
    HTMLTag("<a href=\"bar\">")
  }
}
`)
  });

  it("HTML blocks (example 157)", () => {
    ist(parse("<div>\n\n*Emphasized* text.\n\n</div>\n"), r`Document {
  HTMLBlock("<div>")
  Paragraph {
    Emphasis {
      EmphasisMark("*", 7-8)
      EmphasisMark("*", 18-19)
    }
  }
  HTMLBlock("</div>")
}
`)
  });

  it("HTML blocks (example 158)", () => {
    ist(parse("<div>\n*Emphasized* text.\n</div>\n"), r`Document {
  HTMLBlock("<div>\n*Emphasized* text.\n</div>")
}
`)
  });

  it("HTML blocks (example 159)", () => {
    ist(parse("<table>\n\n<tr>\n\n<td>\nHi\n</td>\n\n</tr>\n\n</table>\n"), r`Document {
  HTMLBlock("<table>")
  HTMLBlock("<tr>")
  HTMLBlock("<td>\nHi\n</td>")
  HTMLBlock("</tr>")
  HTMLBlock("</table>")
}
`)
  });

  it("HTML blocks (example 160)", () => {
    ist(parse("<table>\n\n  <tr>\n\n    <td>\n      Hi\n    </td>\n\n  </tr>\n\n</table>\n"), r`Document {
  HTMLBlock("<table>")
  HTMLBlock("<tr>")
  CodeBlock {
    CodeText("<td>\n")
    CodeText("  Hi\n")
    CodeText("</td>")
  }
  HTMLBlock("</tr>")
  HTMLBlock("</table>")
}
`)
  });

  it("Link reference definitions (example 161)", () => {
    ist(parse("[foo]: /url \"title\"\n\n[foo]\n"), r`Document {
  LinkReference {
    LinkLabel("[foo]")
    LinkMark(":", 5-6)
    URL("/url")
    LinkTitle("\"title\"")
  }
  Paragraph {
    Link {
      LinkMark("[", 21-22)
      LinkMark("]", 25-26)
    }
  }
}
`)
  });

  it("Link reference definitions (example 162)", () => {
    ist(parse("   [foo]: \n      /url  \n           'the title'  \n\n[foo]\n"), r`Document {
  LinkReference {
    LinkLabel("[foo]")
    LinkMark(":", 8-9)
    URL("/url")
    LinkTitle("'the title'")
  }
  Paragraph {
    Link {
      LinkMark("[", 50-51)
      LinkMark("]", 54-55)
    }
  }
}
`)
  });

  it("Link reference definitions (example 163)", () => {
    ist(parse("[Foo*bar\\]]:my_(url) 'title (with parens)'\n\n[Foo*bar\\]]\n"), r`Document {
  LinkReference {
    LinkLabel("[Foo*bar\\]]")
    LinkMark(":", 11-12)
    URL("my_(url)")
    LinkTitle("'title (with parens)'")
  }
  Paragraph {
    Link {
      LinkMark("[", 44-45)
      Escape("\\]")
      LinkMark("]", 54-55)
    }
  }
}
`)
  });

  it("Link reference definitions (example 164)", () => {
    ist(parse("[Foo bar]:\n<my url>\n'title'\n\n[Foo bar]\n"), r`Document {
  LinkReference {
    LinkLabel("[Foo bar]")
    LinkMark(":", 9-10)
    URL("<my url>")
    LinkTitle("'title'")
  }
  Paragraph {
    Link {
      LinkMark("[", 29-30)
      LinkMark("]", 37-38)
    }
  }
}
`)
  });

  it("Link reference definitions (example 165)", () => {
    ist(parse("[foo]: /url '\ntitle\nline1\nline2\n'\n\n[foo]\n"), r`Document {
  LinkReference {
    LinkLabel("[foo]")
    LinkMark(":", 5-6)
    URL("/url")
    LinkTitle("'\ntitle\nline1\nline2\n'")
  }
  Paragraph {
    Link {
      LinkMark("[", 35-36)
      LinkMark("]", 39-40)
    }
  }
}
`)
  });

  it("Link reference definitions (example 166)", () => {
    ist(parse("[foo]: /url 'title\n\nwith blank line'\n\n[foo]\n"), r`Document {
  Paragraph {
    Link {
      LinkMark("[", 0-1)
      LinkMark("]", 4-5)
    }
  }
  Paragraph("with blank line'")
  Paragraph {
    Link {
      LinkMark("[", 38-39)
      LinkMark("]", 42-43)
    }
  }
}
`)
  });

  it("Link reference definitions (example 167)", () => {
    ist(parse("[foo]:\n/url\n\n[foo]\n"), r`Document {
  LinkReference {
    LinkLabel("[foo]")
    LinkMark(":", 5-6)
    URL("/url")
  }
  Paragraph {
    Link {
      LinkMark("[", 13-14)
      LinkMark("]", 17-18)
    }
  }
}
`)
  });

  it("Link reference definitions (example 168)", () => {
    ist(parse("[foo]:\n\n[foo]\n"), r`Document {
  Paragraph {
    Link {
      LinkMark("[", 0-1)
      LinkMark("]", 4-5)
    }
  }
  Paragraph {
    Link {
      LinkMark("[", 8-9)
      LinkMark("]", 12-13)
    }
  }
}
`)
  });

  it("Link reference definitions (example 169)", () => {
    ist(parse("[foo]: <>\n\n[foo]\n"), r`Document {
  LinkReference {
    LinkLabel("[foo]")
    LinkMark(":", 5-6)
    URL("<>")
  }
  Paragraph {
    Link {
      LinkMark("[", 11-12)
      LinkMark("]", 15-16)
    }
  }
}
`)
  });

  it("Link reference definitions (example 170)", () => {
    ist(parse("[foo]: <bar>(baz)\n\n[foo]\n"), r`Document {
  Paragraph {
    Link {
      LinkMark("[", 0-1)
      LinkMark("]", 4-5)
    }
    HTMLTag("<bar>")
  }
  Paragraph {
    Link {
      LinkMark("[", 19-20)
      LinkMark("]", 23-24)
    }
  }
}
`)
  });

  it("Link reference definitions (example 171)", () => {
    ist(parse("[foo]: /url\\bar\\*baz \"foo\\\"bar\\baz\"\n\n[foo]\n"), r`Document {
  LinkReference {
    LinkLabel("[foo]")
    LinkMark(":", 5-6)
    URL("/url\\bar\\*baz")
    LinkTitle("\"foo\\\"bar\\baz\"")
  }
  Paragraph {
    Link {
      LinkMark("[", 37-38)
      LinkMark("]", 41-42)
    }
  }
}
`)
  });

  it("Link reference definitions (example 172)", () => {
    ist(parse("[foo]\n\n[foo]: url\n"), r`Document {
  Paragraph {
    Link {
      LinkMark("[", 0-1)
      LinkMark("]", 4-5)
    }
  }
  LinkReference {
    LinkLabel("[foo]")
    LinkMark(":", 12-13)
    URL("url")
  }
}
`)
  });

  it("Link reference definitions (example 173)", () => {
    ist(parse("[foo]\n\n[foo]: first\n[foo]: second\n"), r`Document {
  Paragraph {
    Link {
      LinkMark("[", 0-1)
      LinkMark("]", 4-5)
    }
  }
  LinkReference {
    LinkLabel("[foo]")
    LinkMark(":", 12-13)
    URL("first")
  }
  LinkReference {
    LinkLabel("[foo]")
    LinkMark(":", 25-26)
    URL("second")
  }
}
`)
  });

  it("Link reference definitions (example 174)", () => {
    ist(parse("[FOO]: /url\n\n[Foo]\n"), r`Document {
  LinkReference {
    LinkLabel("[FOO]")
    LinkMark(":", 5-6)
    URL("/url")
  }
  Paragraph {
    Link {
      LinkMark("[", 13-14)
      LinkMark("]", 17-18)
    }
  }
}
`)
  });

  it("Link reference definitions (example 175)", () => {
    ist(parse("[ΑΓΩ]: /φου\n\n[αγω]\n"), r`Document {
  LinkReference {
    LinkLabel("[ΑΓΩ]")
    LinkMark(":", 5-6)
    URL("/φου")
  }
  Paragraph {
    Link {
      LinkMark("[", 13-14)
      LinkMark("]", 17-18)
    }
  }
}
`)
  });

  it("Link reference definitions (example 176)", () => {
    ist(parse("[foo]: /url\n"), r`Document {
  LinkReference {
    LinkLabel("[foo]")
    LinkMark(":", 5-6)
    URL("/url")
  }
}
`)
  });

  it("Link reference definitions (example 177)", () => {
    ist(parse("[\nfoo\n]: /url\nbar\n"), r`Document {
  LinkReference {
    LinkLabel("[\nfoo\n]")
    LinkMark(":", 7-8)
    URL("/url")
  }
  Paragraph("bar")
}
`)
  });

  it("Link reference definitions (example 178)", () => {
    ist(parse("[foo]: /url \"title\" ok\n"), r`Document {
  Paragraph {
    Link {
      LinkMark("[", 0-1)
      LinkMark("]", 4-5)
    }
  }
}
`)
  });

  it("Link reference definitions (example 179)", () => {
    ist(parse("[foo]: /url\n\"title\" ok\n"), r`Document {
  LinkReference {
    LinkLabel("[foo]")
    LinkMark(":", 5-6)
    URL("/url")
  }
  Paragraph("\"title\" ok")
}
`)
  });

  it("Link reference definitions (example 180)", () => {
    ist(parse("    [foo]: /url \"title\"\n\n[foo]\n"), r`Document {
  CodeBlock {
    CodeText("[foo]: /url \"title\"")
  }
  Paragraph {
    Link {
      LinkMark("[", 25-26)
      LinkMark("]", 29-30)
    }
  }
}
`)
  });

  it("Link reference definitions (example 181)", () => {
    ist(parse("```\n[foo]: /url\n```\n\n[foo]\n"), r`Document {
  FencedCode {
    CodeMark("‘‘‘", 0-3)
    CodeText("[foo]: /url")
    CodeMark("‘‘‘", 16-19)
  }
  Paragraph {
    Link {
      LinkMark("[", 21-22)
      LinkMark("]", 25-26)
    }
  }
}
`)
  });

  it("Link reference definitions (example 182)", () => {
    ist(parse("Foo\n[bar]: /baz\n\n[bar]\n"), r`Document {
  Paragraph {
    Link {
      LinkMark("[", 4-5)
      LinkMark("]", 8-9)
    }
  }
  Paragraph {
    Link {
      LinkMark("[", 17-18)
      LinkMark("]", 21-22)
    }
  }
}
`)
  });

  it("Link reference definitions (example 183)", () => {
    ist(parse("# [Foo]\n[foo]: /url\n> bar\n"), r`Document {
  ATXHeading1 {
    HeaderMark("#", 0-1)
    Link {
      LinkMark("[", 2-3)
      LinkMark("]", 6-7)
    }
  }
  LinkReference {
    LinkLabel("[foo]")
    LinkMark(":", 13-14)
    URL("/url")
  }
  Blockquote {
    QuoteMark(">", 20-21)
    Paragraph("bar")
  }
}
`)
  });

  it("Link reference definitions (example 184)", () => {
    ist(parse("[foo]: /url\nbar\n===\n[foo]\n"), r`Document {
  LinkReference {
    LinkLabel("[foo]")
    LinkMark(":", 5-6)
    URL("/url")
  }
  SetextHeading1 {
    HeaderMark("===", 16-19)
  }
  Paragraph {
    Link {
      LinkMark("[", 20-21)
      LinkMark("]", 24-25)
    }
  }
}
`)
  });

  it("Link reference definitions (example 185)", () => {
    ist(parse("[foo]: /url\n===\n[foo]\n"), r`Document {
  LinkReference {
    LinkLabel("[foo]")
    LinkMark(":", 5-6)
    URL("/url")
  }
  Paragraph {
    Link {
      LinkMark("[", 16-17)
      LinkMark("]", 20-21)
    }
  }
}
`)
  });

  it("Link reference definitions (example 186)", () => {
    ist(parse("[foo]: /foo-url \"foo\"\n[bar]: /bar-url\n  \"bar\"\n[baz]: /baz-url\n\n[foo],\n[bar],\n[baz]\n"), r`Document {
  LinkReference {
    LinkLabel("[foo]")
    LinkMark(":", 5-6)
    URL("/foo-url")
    LinkTitle("\"foo\"")
  }
  LinkReference {
    LinkLabel("[bar]")
    LinkMark(":", 27-28)
    URL("/bar-url")
    LinkTitle("\"bar\"")
  }
  LinkReference {
    LinkLabel("[baz]")
    LinkMark(":", 51-52)
    URL("/baz-url")
  }
  Paragraph {
    Link {
      LinkMark("[", 63-64)
      LinkMark("]", 67-68)
    }
    Link {
      LinkMark("[", 70-71)
      LinkMark("]", 74-75)
    }
    Link {
      LinkMark("[", 77-78)
      LinkMark("]", 81-82)
    }
  }
}
`)
  });

  it("Link reference definitions (example 187)", () => {
    ist(parse("[foo]\n\n> [foo]: /url\n"), r`Document {
  Paragraph {
    Link {
      LinkMark("[", 0-1)
      LinkMark("]", 4-5)
    }
  }
  Blockquote {
    QuoteMark(">", 7-8)
    LinkReference {
      LinkLabel("[foo]")
      LinkMark(":", 14-15)
      URL("/url")
    }
  }
}
`)
  });

  it("Link reference definitions (example 188)", () => {
    ist(parse("[foo]: /url\n"), r`Document {
  LinkReference {
    LinkLabel("[foo]")
    LinkMark(":", 5-6)
    URL("/url")
  }
}
`)
  });

  it("Paragraphs (example 189)", () => {
    ist(parse("aaa\n\nbbb\n"), r`Document {
  Paragraph("aaa")
  Paragraph("bbb")
}
`)
  });

  it("Paragraphs (example 190)", () => {
    ist(parse("aaa\nbbb\n\nccc\nddd\n"), r`Document {
  Paragraph("aaa\nbbb")
  Paragraph("ccc\nddd")
}
`)
  });

  it("Paragraphs (example 191)", () => {
    ist(parse("aaa\n\n\nbbb\n"), r`Document {
  Paragraph("aaa")
  Paragraph("bbb")
}
`)
  });

  it("Paragraphs (example 192)", () => {
    ist(parse("  aaa\n bbb\n"), r`Document {
  Paragraph("aaa\n bbb")
}
`)
  });

  it("Paragraphs (example 193)", () => {
    ist(parse("aaa\n             bbb\n                                       ccc\n"), r`Document {
  Paragraph("aaa\n             bbb\n                                       ccc")
}
`)
  });

  it("Paragraphs (example 194)", () => {
    ist(parse("   aaa\nbbb\n"), r`Document {
  Paragraph("aaa\nbbb")
}
`)
  });

  it("Paragraphs (example 195)", () => {
    ist(parse("    aaa\nbbb\n"), r`Document {
  CodeBlock {
    CodeText("aaa")
  }
  Paragraph("bbb")
}
`)
  });

  it("Paragraphs (example 196)", () => {
    ist(parse("aaa     \nbbb     \n"), r`Document {
  Paragraph {
    HardBreak("     \n")
  }
}
`)
  });

  it("Blank lines (example 197)", () => {
    ist(parse("  \n\naaa\n  \n\n# aaa\n\n  \n"), r`Document {
  Paragraph("aaa")
  ATXHeading1 {
    HeaderMark("#", 12-13)
  }
}
`)
  });

  it("Block quotes (example 198)", () => {
    ist(parse("> # Foo\n> bar\n> baz\n"), r`Document {
  Blockquote {
    QuoteMark(">", 0-1)
    ATXHeading1 {
      HeaderMark("#", 2-3)
    }
    QuoteMark(">", 8-9)
    Paragraph {
      QuoteMark(">", 14-15)
    }
  }
}
`)
  });

  it("Block quotes (example 199)", () => {
    ist(parse("># Foo\n>bar\n> baz\n"), r`Document {
  Blockquote {
    QuoteMark(">", 0-1)
    ATXHeading1 {
      HeaderMark("#", 1-2)
    }
    QuoteMark(">", 7-8)
    Paragraph {
      QuoteMark(">", 12-13)
    }
  }
}
`)
  });

  it("Block quotes (example 200)", () => {
    ist(parse("   > # Foo\n   > bar\n > baz\n"), r`Document {
  Blockquote {
    QuoteMark(">", 3-4)
    ATXHeading1 {
      HeaderMark("#", 5-6)
    }
    QuoteMark(">", 14-15)
    Paragraph {
      QuoteMark(">", 21-22)
    }
  }
}
`)
  });

  it("Block quotes (example 201)", () => {
    ist(parse("    > # Foo\n    > bar\n    > baz\n"), r`Document {
  CodeBlock {
    CodeText("> # Foo\n")
    CodeText("> bar\n")
    CodeText("> baz")
  }
}
`)
  });

  it("Block quotes (example 202)", () => {
    ist(parse("> # Foo\n> bar\nbaz\n"), r`Document {
  Blockquote {
    QuoteMark(">", 0-1)
    ATXHeading1 {
      HeaderMark("#", 2-3)
    }
    QuoteMark(">", 8-9)
    Paragraph("bar\nbaz")
  }
}
`)
  });

  it("Block quotes (example 203)", () => {
    ist(parse("> bar\nbaz\n> foo\n"), r`Document {
  Blockquote {
    QuoteMark(">", 0-1)
    Paragraph {
      QuoteMark(">", 10-11)
    }
  }
}
`)
  });

  it("Block quotes (example 204)", () => {
    ist(parse("> foo\n---\n"), r`Document {
  Blockquote {
    QuoteMark(">", 0-1)
    Paragraph("foo")
  }
  HorizontalRule("---")
}
`)
  });

  it("Block quotes (example 205)", () => {
    ist(parse("> - foo\n- bar\n"), r`Document {
  Blockquote {
    QuoteMark(">", 0-1)
    BulletList {
      ListItem {
        ListMark("-", 2-3)
        Paragraph("foo")
      }
    }
  }
  BulletList {
    ListItem {
      ListMark("-", 8-9)
      Paragraph("bar")
    }
  }
}
`)
  });

  it("Block quotes (example 206)", () => {
    ist(parse(">     foo\n    bar\n"), r`Document {
  Blockquote {
    QuoteMark(">", 0-1)
    CodeBlock {
      CodeText("foo")
    }
  }
  CodeBlock {
    CodeText("bar")
  }
}
`)
  });

  it("Block quotes (example 207)", () => {
    ist(parse("> ```\nfoo\n```\n"), r`Document {
  Blockquote {
    QuoteMark(">", 0-1)
    FencedCode {
      CodeMark("‘‘‘", 2-5)
    }
  }
  Paragraph("foo")
  FencedCode {
    CodeMark("‘‘‘", 10-13)
  }
}
`)
  });

  it("Block quotes (example 208)", () => {
    ist(parse("> foo\n    - bar\n"), r`Document {
  Blockquote {
    QuoteMark(">", 0-1)
    Paragraph("foo\n    - bar")
  }
}
`)
  });

  it("Block quotes (example 209)", () => {
    ist(parse(">\n"), r`Document {
  Blockquote {
    QuoteMark(">", 0-1)
    Paragraph("")
  }
}
`)
  });

  it("Block quotes (example 210)", () => {
    ist(parse(">\n>  \n> \n"), r`Document {
  Blockquote {
    QuoteMark(">", 0-1)
    Paragraph("")
    QuoteMark(">", 2-3)
    QuoteMark(">", 6-7)
  }
}
`)
  });

  it("Block quotes (example 211)", () => {
    ist(parse(">\n> foo\n>  \n"), r`Document {
  Blockquote {
    QuoteMark(">", 0-1)
    Paragraph {
      QuoteMark(">", 2-3)
    }
    QuoteMark(">", 8-9)
  }
}
`)
  });

  it("Block quotes (example 212)", () => {
    ist(parse("> foo\n\n> bar\n"), r`Document {
  Blockquote {
    QuoteMark(">", 0-1)
    Paragraph("foo")
  }
  Blockquote {
    QuoteMark(">", 7-8)
    Paragraph("bar")
  }
}
`)
  });

  it("Block quotes (example 213)", () => {
    ist(parse("> foo\n> bar\n"), r`Document {
  Blockquote {
    QuoteMark(">", 0-1)
    Paragraph {
      QuoteMark(">", 6-7)
    }
  }
}
`)
  });

  it("Block quotes (example 214)", () => {
    ist(parse("> foo\n>\n> bar\n"), r`Document {
  Blockquote {
    QuoteMark(">", 0-1)
    Paragraph("foo")
    QuoteMark(">", 6-7)
    QuoteMark(">", 8-9)
    Paragraph("bar")
  }
}
`)
  });

  it("Block quotes (example 215)", () => {
    ist(parse("foo\n> bar\n"), r`Document {
  Paragraph("foo")
  Blockquote {
    QuoteMark(">", 4-5)
    Paragraph("bar")
  }
}
`)
  });

  it("Block quotes (example 216)", () => {
    ist(parse("> aaa\n***\n> bbb\n"), r`Document {
  Blockquote {
    QuoteMark(">", 0-1)
    Paragraph("aaa")
  }
  HorizontalRule("***")
  Blockquote {
    QuoteMark(">", 10-11)
    Paragraph("bbb")
  }
}
`)
  });

  it("Block quotes (example 217)", () => {
    ist(parse("> bar\nbaz\n"), r`Document {
  Blockquote {
    QuoteMark(">", 0-1)
    Paragraph("bar\nbaz")
  }
}
`)
  });

  it("Block quotes (example 218)", () => {
    ist(parse("> bar\n\nbaz\n"), r`Document {
  Blockquote {
    QuoteMark(">", 0-1)
    Paragraph("bar")
  }
  Paragraph("baz")
}
`)
  });

  it("Block quotes (example 219)", () => {
    ist(parse("> bar\n>\nbaz\n"), r`Document {
  Blockquote {
    QuoteMark(">", 0-1)
    Paragraph("bar")
    QuoteMark(">", 6-7)
  }
  Paragraph("baz")
}
`)
  });

  it("Block quotes (example 220)", () => {
    ist(parse("> > > foo\nbar\n"), r`Document {
  Blockquote {
    QuoteMark(">", 0-1)
    Blockquote {
      QuoteMark(">", 2-3)
      Blockquote {
        QuoteMark(">", 4-5)
        Paragraph("foo\nbar")
      }
    }
  }
}
`)
  });

  it("Block quotes (example 221)", () => {
    ist(parse(">>> foo\n> bar\n>>baz\n"), r`Document {
  Blockquote {
    QuoteMark(">", 0-1)
    Blockquote {
      QuoteMark(">", 1-2)
      Blockquote {
        QuoteMark(">", 2-3)
        Paragraph {
          QuoteMark(">", 8-9)
          QuoteMark(">", 14-15)
          QuoteMark(">", 15-16)
        }
      }
    }
  }
}
`)
  });

  it("Block quotes (example 222)", () => {
    ist(parse(">     code\n\n>    not code\n"), r`Document {
  Blockquote {
    QuoteMark(">", 0-1)
    CodeBlock {
      CodeText("code")
    }
  }
  Blockquote {
    QuoteMark(">", 12-13)
    Paragraph("not code")
  }
}
`)
  });

  it("List items (example 223)", () => {
    ist(parse("A paragraph\nwith two lines.\n\n    indented code\n\n> A block quote.\n"), r`Document {
  Paragraph("A paragraph\nwith two lines.")
  CodeBlock {
    CodeText("indented code")
  }
  Blockquote {
    QuoteMark(">", 48-49)
    Paragraph("A block quote.")
  }
}
`)
  });

  it("List items (example 224)", () => {
    ist(parse("1.  A paragraph\n    with two lines.\n\n        indented code\n\n    > A block quote.\n"), r`Document {
  OrderedList {
    ListItem {
      ListMark("1.", 0-2)
      Paragraph("A paragraph\n    with two lines.")
      CodeBlock {
        CodeText("indented code")
      }
      Blockquote {
        QuoteMark(">", 64-65)
        Paragraph("A block quote.")
      }
    }
  }
}
`)
  });

  it("List items (example 225)", () => {
    ist(parse("- one\n\n two\n"), r`Document {
  BulletList {
    ListItem {
      ListMark("-", 0-1)
      Paragraph("one")
    }
  }
  Paragraph("two")
}
`)
  });

  it("List items (example 226)", () => {
    ist(parse("- one\n\n  two\n"), r`Document {
  BulletList {
    ListItem {
      ListMark("-", 0-1)
      Paragraph("one")
      Paragraph("two")
    }
  }
}
`)
  });

  it("List items (example 227)", () => {
    ist(parse(" -    one\n\n     two\n"), r`Document {
  BulletList {
    ListItem {
      ListMark("-", 1-2)
      Paragraph("one")
    }
  }
  CodeBlock {
    CodeText(" two")
  }
}
`)
  });

  it("List items (example 228)", () => {
    ist(parse(" -    one\n\n      two\n"), r`Document {
  BulletList {
    ListItem {
      ListMark("-", 1-2)
      Paragraph("one")
      Paragraph("two")
    }
  }
}
`)
  });

  it("List items (example 229)", () => {
    ist(parse("   > > 1.  one\n>>\n>>     two\n"), r`Document {
  Blockquote {
    QuoteMark(">", 3-4)
    Blockquote {
      QuoteMark(">", 5-6)
      OrderedList {
        ListItem {
          ListMark("1.", 7-9)
          Paragraph("one")
          QuoteMark(">", 15-16)
          QuoteMark(">", 16-17)
          QuoteMark(">", 18-19)
          QuoteMark(">", 19-20)
          Paragraph("two")
        }
      }
    }
  }
}
`)
  });

  it("List items (example 230)", () => {
    ist(parse(">>- one\n>>\n  >  > two\n"), r`Document {
  Blockquote {
    QuoteMark(">", 0-1)
    Blockquote {
      QuoteMark(">", 1-2)
      BulletList {
        ListItem {
          ListMark("-", 2-3)
          Paragraph("one")
          QuoteMark(">", 8-9)
          QuoteMark(">", 9-10)
        }
      }
      QuoteMark(">", 13-14)
      QuoteMark(">", 16-17)
      Paragraph("two")
    }
  }
}
`)
  });

  it("List items (example 231)", () => {
    ist(parse("-one\n\n2.two\n"), r`Document {
  Paragraph("-one")
  Paragraph("2.two")
}
`)
  });

  it("List items (example 232)", () => {
    ist(parse("- foo\n\n\n  bar\n"), r`Document {
  BulletList {
    ListItem {
      ListMark("-", 0-1)
      Paragraph("foo")
      Paragraph("bar")
    }
  }
}
`)
  });

  it("List items (example 233)", () => {
    ist(parse("1.  foo\n\n    ```\n    bar\n    ```\n\n    baz\n\n    > bam\n"), r`Document {
  OrderedList {
    ListItem {
      ListMark("1.", 0-2)
      Paragraph("foo")
      FencedCode {
        CodeMark("‘‘‘", 13-16)
        CodeText("bar")
        CodeMark("‘‘‘", 29-32)
      }
      Paragraph("baz")
      Blockquote {
        QuoteMark(">", 47-48)
        Paragraph("bam")
      }
    }
  }
}
`)
  });

  it("List items (example 234)", () => {
    ist(parse("- Foo\n\n      bar\n\n\n      baz\n"), r`Document {
  BulletList {
    ListItem {
      ListMark("-", 0-1)
      Paragraph("Foo")
      CodeBlock {
        CodeText("bar\n\n\n")
        CodeText("baz")
      }
    }
  }
}
`)
  });

  it("List items (example 235)", () => {
    ist(parse("123456789. ok\n"), r`Document {
  OrderedList {
    ListItem {
      ListMark("123456789.", 0-10)
      Paragraph("ok")
    }
  }
}
`)
  });

  it("List items (example 236)", () => {
    ist(parse("1234567890. not ok\n"), r`Document {
  Paragraph("1234567890. not ok")
}
`)
  });

  it("List items (example 237)", () => {
    ist(parse("0. ok\n"), r`Document {
  OrderedList {
    ListItem {
      ListMark("0.", 0-2)
      Paragraph("ok")
    }
  }
}
`)
  });

  it("List items (example 238)", () => {
    ist(parse("003. ok\n"), r`Document {
  OrderedList {
    ListItem {
      ListMark("003.", 0-4)
      Paragraph("ok")
    }
  }
}
`)
  });

  it("List items (example 239)", () => {
    ist(parse("-1. not ok\n"), r`Document {
  Paragraph("-1. not ok")
}
`)
  });

  it("List items (example 240)", () => {
    ist(parse("- foo\n\n      bar\n"), r`Document {
  BulletList {
    ListItem {
      ListMark("-", 0-1)
      Paragraph("foo")
      CodeBlock {
        CodeText("bar")
      }
    }
  }
}
`)
  });

  it("List items (example 241)", () => {
    ist(parse("  10.  foo\n\n           bar\n"), r`Document {
  OrderedList {
    ListItem {
      ListMark("10.", 2-5)
      Paragraph("foo")
      CodeBlock {
        CodeText("bar")
      }
    }
  }
}
`)
  });

  it("List items (example 242)", () => {
    ist(parse("    indented code\n\nparagraph\n\n    more code\n"), r`Document {
  CodeBlock {
    CodeText("indented code")
  }
  Paragraph("paragraph")
  CodeBlock {
    CodeText("more code")
  }
}
`)
  });

  it("List items (example 243)", () => {
    ist(parse("1.     indented code\n\n   paragraph\n\n       more code\n"), r`Document {
  OrderedList {
    ListItem {
      ListMark("1.", 0-2)
      CodeBlock {
        CodeText("indented code")
      }
      Paragraph("paragraph")
      CodeBlock {
        CodeText("more code")
      }
    }
  }
}
`)
  });

  it("List items (example 244)", () => {
    ist(parse("1.      indented code\n\n   paragraph\n\n       more code\n"), r`Document {
  OrderedList {
    ListItem {
      ListMark("1.", 0-2)
      CodeBlock {
        CodeText(" indented code")
      }
      Paragraph("paragraph")
      CodeBlock {
        CodeText("more code")
      }
    }
  }
}
`)
  });

  it("List items (example 245)", () => {
    ist(parse("   foo\n\nbar\n"), r`Document {
  Paragraph("foo")
  Paragraph("bar")
}
`)
  });

  it("List items (example 246)", () => {
    ist(parse("-    foo\n\n  bar\n"), r`Document {
  BulletList {
    ListItem {
      ListMark("-", 0-1)
      Paragraph("foo")
    }
  }
  Paragraph("bar")
}
`)
  });

  it("List items (example 247)", () => {
    ist(parse("-  foo\n\n   bar\n"), r`Document {
  BulletList {
    ListItem {
      ListMark("-", 0-1)
      Paragraph("foo")
      Paragraph("bar")
    }
  }
}
`)
  });

  it("List items (example 248)", () => {
    ist(parse("-\n  foo\n-\n  ```\n  bar\n  ```\n-\n      baz\n"), r`Document {
  BulletList {
    ListItem {
      ListMark("-", 0-1)
      Paragraph("\n  foo")
    }
    ListItem {
      ListMark("-", 8-9)
      Paragraph("")
      FencedCode {
        CodeMark("‘‘‘", 12-15)
        CodeText(" bar")
        CodeMark("‘‘‘", 24-27)
      }
    }
    ListItem {
      ListMark("-", 28-29)
      Paragraph("\n      baz")
    }
  }
}
`)
  });

  it("List items (example 249)", () => {
    ist(parse("-   \n  foo\n"), r`Document {
  BulletList {
    ListItem {
      ListMark("-", 0-1)
      Paragraph("\n  foo")
    }
  }
}
`)
  });

  it("List items (example 250)", () => {
    ist(parse("-\n\n  foo\n"), r`Document {
  BulletList {
    ListItem {
      ListMark("-", 0-1)
      Paragraph("")
      Paragraph("foo")
    }
  }
}
`)
  });

  it("List items (example 251)", () => {
    ist(parse("- foo\n-\n- bar\n"), r`Document {
  BulletList {
    ListItem {
      ListMark("-", 0-1)
      Paragraph("foo")
    }
    ListItem {
      ListMark("-", 6-7)
      Paragraph("")
    }
    ListItem {
      ListMark("-", 8-9)
      Paragraph("bar")
    }
  }
}
`)
  });

  it("List items (example 252)", () => {
    ist(parse("- foo\n-   \n- bar\n"), r`Document {
  BulletList {
    ListItem {
      ListMark("-", 0-1)
      Paragraph("foo")
    }
    ListItem {
      ListMark("-", 6-7)
      Paragraph("")
    }
    ListItem {
      ListMark("-", 11-12)
      Paragraph("bar")
    }
  }
}
`)
  });

  it("List items (example 253)", () => {
    ist(parse("1. foo\n2.\n3. bar\n"), r`Document {
  OrderedList {
    ListItem {
      ListMark("1.", 0-2)
      Paragraph("foo")
    }
    ListItem {
      ListMark("2.", 7-9)
      Paragraph("")
    }
    ListItem {
      ListMark("3.", 10-12)
      Paragraph("bar")
    }
  }
}
`)
  });

  it("List items (example 254)", () => {
    ist(parse("*\n"), r`Document {
  BulletList {
    ListItem {
      ListMark("*", 0-1)
      Paragraph("")
    }
  }
}
`)
  });

  it("List items (example 255)", () => {
    ist(parse("foo\n*\n\nfoo\n1.\n"), r`Document {
  Paragraph("foo\n*")
  Paragraph("foo\n1.")
}
`)
  });

  it("List items (example 256)", () => {
    ist(parse(" 1.  A paragraph\n     with two lines.\n\n         indented code\n\n     > A block quote.\n"), r`Document {
  OrderedList {
    ListItem {
      ListMark("1.", 1-3)
      Paragraph("A paragraph\n     with two lines.")
      CodeBlock {
        CodeText("indented code")
      }
      Blockquote {
        QuoteMark(">", 68-69)
        Paragraph("A block quote.")
      }
    }
  }
}
`)
  });

  it("List items (example 257)", () => {
    ist(parse("  1.  A paragraph\n      with two lines.\n\n          indented code\n\n      > A block quote.\n"), r`Document {
  OrderedList {
    ListItem {
      ListMark("1.", 2-4)
      Paragraph("A paragraph\n      with two lines.")
      CodeBlock {
        CodeText("indented code")
      }
      Blockquote {
        QuoteMark(">", 72-73)
        Paragraph("A block quote.")
      }
    }
  }
}
`)
  });

  it("List items (example 258)", () => {
    ist(parse("   1.  A paragraph\n       with two lines.\n\n           indented code\n\n       > A block quote.\n"), r`Document {
  OrderedList {
    ListItem {
      ListMark("1.", 3-5)
      Paragraph("A paragraph\n       with two lines.")
      CodeBlock {
        CodeText("indented code")
      }
      Blockquote {
        QuoteMark(">", 76-77)
        Paragraph("A block quote.")
      }
    }
  }
}
`)
  });

  it("List items (example 259)", () => {
    ist(parse("    1.  A paragraph\n        with two lines.\n\n            indented code\n\n        > A block quote.\n"), r`Document {
  CodeBlock {
    CodeText("1.  A paragraph\n")
    CodeText("    with two lines.\n\n")
    CodeText("        indented code\n\n")
    CodeText("    > A block quote.")
  }
}
`)
  });

  it("List items (example 260)", () => {
    ist(parse("  1.  A paragraph\nwith two lines.\n\n          indented code\n\n      > A block quote.\n"), r`Document {
  OrderedList {
    ListItem {
      ListMark("1.", 2-4)
      Paragraph("A paragraph\nwith two lines.")
      CodeBlock {
        CodeText("indented code")
      }
      Blockquote {
        QuoteMark(">", 66-67)
        Paragraph("A block quote.")
      }
    }
  }
}
`)
  });

  it("List items (example 261)", () => {
    ist(parse("  1.  A paragraph\n    with two lines.\n"), r`Document {
  OrderedList {
    ListItem {
      ListMark("1.", 2-4)
      Paragraph("A paragraph\n    with two lines.")
    }
  }
}
`)
  });

  it("List items (example 262)", () => {
    ist(parse("> 1. > Blockquote\ncontinued here.\n"), r`Document {
  Blockquote {
    QuoteMark(">", 0-1)
    OrderedList {
      ListItem {
        ListMark("1.", 2-4)
        Blockquote {
          QuoteMark(">", 5-6)
          Paragraph("Blockquote\ncontinued here.")
        }
      }
    }
  }
}
`)
  });

  it("List items (example 263)", () => {
    ist(parse("> 1. > Blockquote\n> continued here.\n"), r`Document {
  Blockquote {
    QuoteMark(">", 0-1)
    OrderedList {
      ListItem {
        ListMark("1.", 2-4)
        Blockquote {
          QuoteMark(">", 5-6)
          Paragraph {
            QuoteMark(">", 18-19)
          }
        }
      }
    }
  }
}
`)
  });

  it("List items (example 264)", () => {
    ist(parse("- foo\n  - bar\n    - baz\n      - boo\n"), r`Document {
  BulletList {
    ListItem {
      ListMark("-", 0-1)
      Paragraph("foo")
      BulletList {
        ListItem {
          ListMark("-", 8-9)
          Paragraph("bar")
          BulletList {
            ListItem {
              ListMark("-", 18-19)
              Paragraph("baz")
              BulletList {
                ListItem {
                  ListMark("-", 30-31)
                  Paragraph("boo")
                }
              }
            }
          }
        }
      }
    }
  }
}
`)
  });

  it("List items (example 265)", () => {
    ist(parse("- foo\n - bar\n  - baz\n   - boo\n"), r`Document {
  BulletList {
    ListItem {
      ListMark("-", 0-1)
      Paragraph("foo")
    }
    ListItem {
      ListMark("-", 7-8)
      Paragraph("bar")
    }
    ListItem {
      ListMark("-", 15-16)
      Paragraph("baz")
    }
    ListItem {
      ListMark("-", 24-25)
      Paragraph("boo")
    }
  }
}
`)
  });

  it("List items (example 266)", () => {
    ist(parse("10) foo\n    - bar\n"), r`Document {
  OrderedList {
    ListItem {
      ListMark("10)", 0-3)
      Paragraph("foo")
      BulletList {
        ListItem {
          ListMark("-", 12-13)
          Paragraph("bar")
        }
      }
    }
  }
}
`)
  });

  it("List items (example 267)", () => {
    ist(parse("10) foo\n   - bar\n"), r`Document {
  OrderedList {
    ListItem {
      ListMark("10)", 0-3)
      Paragraph("foo")
    }
  }
  BulletList {
    ListItem {
      ListMark("-", 11-12)
      Paragraph("bar")
    }
  }
}
`)
  });

  it("List items (example 268)", () => {
    ist(parse("- - foo\n"), r`Document {
  BulletList {
    ListItem {
      ListMark("-", 0-1)
      BulletList {
        ListItem {
          ListMark("-", 2-3)
          Paragraph("foo")
        }
      }
    }
  }
}
`)
  });

  it("List items (example 269)", () => {
    ist(parse("1. - 2. foo\n"), r`Document {
  OrderedList {
    ListItem {
      ListMark("1.", 0-2)
      BulletList {
        ListItem {
          ListMark("-", 3-4)
          OrderedList {
            ListItem {
              ListMark("2.", 5-7)
              Paragraph("foo")
            }
          }
        }
      }
    }
  }
}
`)
  });

  it("List items (example 270)", () => {
    ist(parse("- # Foo\n- Bar\n  ---\n  baz\n"), r`Document {
  BulletList {
    ListItem {
      ListMark("-", 0-1)
      ATXHeading1 {
        HeaderMark("#", 2-3)
      }
    }
    ListItem {
      ListMark("-", 8-9)
      SetextHeading2 {
        HeaderMark("---", 16-19)
      }
      Paragraph("baz")
    }
  }
}
`)
  });

  it("Lists (example 271)", () => {
    ist(parse("- foo\n- bar\n+ baz\n"), r`Document {
  BulletList {
    ListItem {
      ListMark("-", 0-1)
      Paragraph("foo")
    }
    ListItem {
      ListMark("-", 6-7)
      Paragraph("bar")
    }
  }
  BulletList {
    ListItem {
      ListMark("+", 12-13)
      Paragraph("baz")
    }
  }
}
`)
  });

  it("Lists (example 272)", () => {
    ist(parse("1. foo\n2. bar\n3) baz\n"), r`Document {
  OrderedList {
    ListItem {
      ListMark("1.", 0-2)
      Paragraph("foo")
    }
    ListItem {
      ListMark("2.", 7-9)
      Paragraph("bar")
    }
  }
  OrderedList {
    ListItem {
      ListMark("3)", 14-16)
      Paragraph("baz")
    }
  }
}
`)
  });

  it("Lists (example 273)", () => {
    ist(parse("Foo\n- bar\n- baz\n"), r`Document {
  Paragraph("Foo")
  BulletList {
    ListItem {
      ListMark("-", 4-5)
      Paragraph("bar")
    }
    ListItem {
      ListMark("-", 10-11)
      Paragraph("baz")
    }
  }
}
`)
  });

  it("Lists (example 274)", () => {
    ist(parse("The number of windows in my house is\n14.  The number of doors is 6.\n"), r`Document {
  Paragraph("The number of windows in my house is\n14.  The number of doors is 6.")
}
`)
  });

  it("Lists (example 275)", () => {
    ist(parse("The number of windows in my house is\n1.  The number of doors is 6.\n"), r`Document {
  Paragraph("The number of windows in my house is")
  OrderedList {
    ListItem {
      ListMark("1.", 37-39)
      Paragraph("The number of doors is 6.")
    }
  }
}
`)
  });

  it("Lists (example 276)", () => {
    ist(parse("- foo\n\n- bar\n\n\n- baz\n"), r`Document {
  BulletList {
    ListItem {
      ListMark("-", 0-1)
      Paragraph("foo")
    }
    ListItem {
      ListMark("-", 7-8)
      Paragraph("bar")
    }
    ListItem {
      ListMark("-", 15-16)
      Paragraph("baz")
    }
  }
}
`)
  });

  it("Lists (example 277)", () => {
    ist(parse("- foo\n  - bar\n    - baz\n\n\n      bim\n"), r`Document {
  BulletList {
    ListItem {
      ListMark("-", 0-1)
      Paragraph("foo")
      BulletList {
        ListItem {
          ListMark("-", 8-9)
          Paragraph("bar")
          BulletList {
            ListItem {
              ListMark("-", 18-19)
              Paragraph("baz")
              Paragraph("bim")
            }
          }
        }
      }
    }
  }
}
`)
  });

  it("Lists (example 278)", () => {
    ist(parse("- foo\n- bar\n\n<!-- -->\n\n- baz\n- bim\n"), r`Document {
  BulletList {
    ListItem {
      ListMark("-", 0-1)
      Paragraph("foo")
    }
    ListItem {
      ListMark("-", 6-7)
      Paragraph("bar")
    }
  }
  CommentBlock("<!-- -->")
  BulletList {
    ListItem {
      ListMark("-", 23-24)
      Paragraph("baz")
    }
    ListItem {
      ListMark("-", 29-30)
      Paragraph("bim")
    }
  }
}
`)
  });

  it("Lists (example 279)", () => {
    ist(parse("-   foo\n\n    notcode\n\n-   foo\n\n<!-- -->\n\n    code\n"), r`Document {
  BulletList {
    ListItem {
      ListMark("-", 0-1)
      Paragraph("foo")
      Paragraph("notcode")
    }
    ListItem {
      ListMark("-", 22-23)
      Paragraph("foo")
    }
  }
  CommentBlock("<!-- -->")
  CodeBlock {
    CodeText("code")
  }
}
`)
  });

  it("Lists (example 280)", () => {
    ist(parse("- a\n - b\n  - c\n   - d\n  - e\n - f\n- g\n"), r`Document {
  BulletList {
    ListItem {
      ListMark("-", 0-1)
      Paragraph("a")
    }
    ListItem {
      ListMark("-", 5-6)
      Paragraph("b")
    }
    ListItem {
      ListMark("-", 11-12)
      Paragraph("c")
    }
    ListItem {
      ListMark("-", 18-19)
      Paragraph("d")
    }
    ListItem {
      ListMark("-", 24-25)
      Paragraph("e")
    }
    ListItem {
      ListMark("-", 29-30)
      Paragraph("f")
    }
    ListItem {
      ListMark("-", 33-34)
      Paragraph("g")
    }
  }
}
`)
  });

  it("Lists (example 281)", () => {
    ist(parse("1. a\n\n  2. b\n\n   3. c\n"), r`Document {
  OrderedList {
    ListItem {
      ListMark("1.", 0-2)
      Paragraph("a")
    }
    ListItem {
      ListMark("2.", 8-10)
      Paragraph("b")
    }
    ListItem {
      ListMark("3.", 17-19)
      Paragraph("c")
    }
  }
}
`)
  });

  it("Lists (example 282)", () => {
    ist(parse("- a\n - b\n  - c\n   - d\n    - e\n"), r`Document {
  BulletList {
    ListItem {
      ListMark("-", 0-1)
      Paragraph("a")
    }
    ListItem {
      ListMark("-", 5-6)
      Paragraph("b")
    }
    ListItem {
      ListMark("-", 11-12)
      Paragraph("c")
    }
    ListItem {
      ListMark("-", 18-19)
      Paragraph("d\n    - e")
    }
  }
}
`)
  });

  it("Lists (example 283)", () => {
    ist(parse("1. a\n\n  2. b\n\n    3. c\n"), r`Document {
  OrderedList {
    ListItem {
      ListMark("1.", 0-2)
      Paragraph("a")
    }
    ListItem {
      ListMark("2.", 8-10)
      Paragraph("b")
    }
  }
  CodeBlock {
    CodeText("3. c")
  }
}
`)
  });

  it("Lists (example 284)", () => {
    ist(parse("- a\n- b\n\n- c\n"), r`Document {
  BulletList {
    ListItem {
      ListMark("-", 0-1)
      Paragraph("a")
    }
    ListItem {
      ListMark("-", 4-5)
      Paragraph("b")
    }
    ListItem {
      ListMark("-", 9-10)
      Paragraph("c")
    }
  }
}
`)
  });

  it("Lists (example 285)", () => {
    ist(parse("* a\n*\n\n* c\n"), r`Document {
  BulletList {
    ListItem {
      ListMark("*", 0-1)
      Paragraph("a")
    }
    ListItem {
      ListMark("*", 4-5)
      Paragraph("")
    }
    ListItem {
      ListMark("*", 7-8)
      Paragraph("c")
    }
  }
}
`)
  });

  it("Lists (example 286)", () => {
    ist(parse("- a\n- b\n\n  c\n- d\n"), r`Document {
  BulletList {
    ListItem {
      ListMark("-", 0-1)
      Paragraph("a")
    }
    ListItem {
      ListMark("-", 4-5)
      Paragraph("b")
      Paragraph("c")
    }
    ListItem {
      ListMark("-", 13-14)
      Paragraph("d")
    }
  }
}
`)
  });

  it("Lists (example 287)", () => {
    ist(parse("- a\n- b\n\n  [ref]: /url\n- d\n"), r`Document {
  BulletList {
    ListItem {
      ListMark("-", 0-1)
      Paragraph("a")
    }
    ListItem {
      ListMark("-", 4-5)
      Paragraph("b")
      LinkReference {
        LinkLabel("[ref]")
        LinkMark(":", 16-17)
        URL("/url")
      }
    }
    ListItem {
      ListMark("-", 23-24)
      Paragraph("d")
    }
  }
}
`)
  });

  it("Lists (example 288)", () => {
    ist(parse("- a\n- ```\n  b\n\n\n  ```\n- c\n"), r`Document {
  BulletList {
    ListItem {
      ListMark("-", 0-1)
      Paragraph("a")
    }
    ListItem {
      ListMark("-", 4-5)
      FencedCode {
        CodeMark("‘‘‘", 6-9)
        CodeText("b\n\n")
        CodeMark("‘‘‘", 18-21)
      }
    }
    ListItem {
      ListMark("-", 22-23)
      Paragraph("c")
    }
  }
}
`)
  });

  it("Lists (example 289)", () => {
    ist(parse("- a\n  - b\n\n    c\n- d\n"), r`Document {
  BulletList {
    ListItem {
      ListMark("-", 0-1)
      Paragraph("a")
      BulletList {
        ListItem {
          ListMark("-", 6-7)
          Paragraph("b")
          Paragraph("c")
        }
      }
    }
    ListItem {
      ListMark("-", 17-18)
      Paragraph("d")
    }
  }
}
`)
  });

  it("Lists (example 290)", () => {
    ist(parse("* a\n  > b\n  >\n* c\n"), r`Document {
  BulletList {
    ListItem {
      ListMark("*", 0-1)
      Paragraph("a")
      Blockquote {
        QuoteMark(">", 6-7)
        Paragraph("b")
        QuoteMark(">", 12-13)
      }
    }
    ListItem {
      ListMark("*", 14-15)
      Paragraph("c")
    }
  }
}
`)
  });

  it("Lists (example 291)", () => {
    ist(parse("- a\n  > b\n  ```\n  c\n  ```\n- d\n"), r`Document {
  BulletList {
    ListItem {
      ListMark("-", 0-1)
      Paragraph("a")
      Blockquote {
        QuoteMark(">", 6-7)
        Paragraph("b")
      }
      FencedCode {
        CodeMark("‘‘‘", 12-15)
        CodeText("c")
        CodeMark("‘‘‘", 22-25)
      }
    }
    ListItem {
      ListMark("-", 26-27)
      Paragraph("d")
    }
  }
}
`)
  });

  it("Lists (example 292)", () => {
    ist(parse("- a\n"), r`Document {
  BulletList {
    ListItem {
      ListMark("-", 0-1)
      Paragraph("a")
    }
  }
}
`)
  });

  it("Lists (example 293)", () => {
    ist(parse("- a\n  - b\n"), r`Document {
  BulletList {
    ListItem {
      ListMark("-", 0-1)
      Paragraph("a")
      BulletList {
        ListItem {
          ListMark("-", 6-7)
          Paragraph("b")
        }
      }
    }
  }
}
`)
  });

  it("Lists (example 294)", () => {
    ist(parse("1. ```\n   foo\n   ```\n\n   bar\n"), r`Document {
  OrderedList {
    ListItem {
      ListMark("1.", 0-2)
      FencedCode {
        CodeMark("‘‘‘", 3-6)
        CodeText("foo")
        CodeMark("‘‘‘", 17-20)
      }
      Paragraph("bar")
    }
  }
}
`)
  });

  it("Lists (example 295)", () => {
    ist(parse("* foo\n  * bar\n\n  baz\n"), r`Document {
  BulletList {
    ListItem {
      ListMark("*", 0-1)
      Paragraph("foo")
      BulletList {
        ListItem {
          ListMark("*", 8-9)
          Paragraph("bar")
        }
      }
      Paragraph("baz")
    }
  }
}
`)
  });

  it("Lists (example 296)", () => {
    ist(parse("- a\n  - b\n  - c\n\n- d\n  - e\n  - f\n"), r`Document {
  BulletList {
    ListItem {
      ListMark("-", 0-1)
      Paragraph("a")
      BulletList {
        ListItem {
          ListMark("-", 6-7)
          Paragraph("b")
        }
        ListItem {
          ListMark("-", 12-13)
          Paragraph("c")
        }
      }
    }
    ListItem {
      ListMark("-", 17-18)
      Paragraph("d")
      BulletList {
        ListItem {
          ListMark("-", 23-24)
          Paragraph("e")
        }
        ListItem {
          ListMark("-", 29-30)
          Paragraph("f")
        }
      }
    }
  }
}
`)
  });

  it("Inlines (example 297)", () => {
    ist(parse("`hi`lo`\n"), r`Document {
  Paragraph {
    InlineCode {
      CodeMark("‘", 0-1)
      CodeMark("‘", 3-4)
    }
  }
}
`)
  });

  it("Backslash escapes (example 298)", () => {
    ist(parse("\\!\\\"\\#\\$\\%\\&\\'\\(\\)\\*\\+\\,\\-\\.\\/\\:\\;\\<\\=\\>\\?\\@\\[\\\\\\]\\^\\_\\`\\{\\|\\}\\~\n"), r`Document {
  Paragraph {
    Escape("\\!")
    Escape("\\\"")
    Escape("\\#")
    Escape("\\$")
    Escape("\\%")
    Escape("\\&")
    Escape("\\'")
    Escape("\\(")
    Escape("\\)")
    Escape("\\*")
    Escape("\\+")
    Escape("\\,")
    Escape("\\-")
    Escape("\\.")
    Escape("\\/")
    Escape("\\:")
    Escape("\\;")
    Escape("\\<")
    Escape("\\=")
    Escape("\\>")
    Escape("\\?")
    Escape("\\@")
    Escape("\\[")
    Escape("\\\\")
    Escape("\\]")
    Escape("\\^")
    Escape("\\_")
    Escape("\\‘")
    Escape("\\{")
    Escape("\\|")
    Escape("\\}")
    Escape("\\~")
  }
}
`)
  });

  it("Backslash escapes (example 299)", () => {
    ist(parse("\\\t\\A\\a\\ \\3\\φ\\«\n"), r`Document {
  Paragraph("\\\t\\A\\a\\ \\3\\φ\\«")
}
`)
  });

  it("Backslash escapes (example 300)", () => {
    ist(parse("\\*not emphasized*\n\\<br/> not a tag\n\\[not a link](/foo)\n\\`not code`\n1\\. not a list\n\\* not a list\n\\# not a heading\n\\[foo]: /url \"not a reference\"\n\\&ouml; not a character entity\n"), r`Document {
  Paragraph {
    Escape("\\*")
    Escape("\\<")
    Escape("\\[")
    Escape("\\‘")
    Escape("\\.")
    Escape("\\*")
    Escape("\\#")
    Escape("\\[")
    Escape("\\&")
  }
}
`)
  });

  it("Backslash escapes (example 301)", () => {
    ist(parse("\\\\*emphasis*\n"), r`Document {
  Paragraph {
    Escape("\\\\")
    Emphasis {
      EmphasisMark("*", 2-3)
      EmphasisMark("*", 11-12)
    }
  }
}
`)
  });

  it("Backslash escapes (example 302)", () => {
    ist(parse("foo\\\nbar\n"), r`Document {
  Paragraph {
    HardBreak("\\\n")
  }
}
`)
  });

  it("Backslash escapes (example 303)", () => {
    ist(parse("`` \\[\\` ``\n"), r`Document {
  Paragraph {
    InlineCode {
      CodeMark("‘‘", 0-2)
      CodeMark("‘‘", 8-10)
    }
  }
}
`)
  });

  it("Backslash escapes (example 304)", () => {
    ist(parse("    \\[\\]\n"), r`Document {
  CodeBlock {
    CodeText("\\[\\]")
  }
}
`)
  });

  it("Backslash escapes (example 305)", () => {
    ist(parse("~~~\n\\[\\]\n~~~\n"), r`Document {
  FencedCode {
    CodeMark("~~~", 0-3)
    CodeText("\\[\\]")
    CodeMark("~~~", 9-12)
  }
}
`)
  });

  it("Backslash escapes (example 306)", () => {
    ist(parse("<http://example.com?find=\\*>\n"), r`Document {
  Paragraph {
    Autolink {
      LinkMark("<", 0-1)
      URL("http://example.com?find=\\*")
      LinkMark(">", 27-28)
    }
  }
}
`)
  });

  it("Backslash escapes (example 307)", () => {
    ist(parse("<a href=\"/bar\\/)\">\n"), r`Document {
  HTMLBlock("<a href=\"/bar\\/)\">")
}
`)
  });

  it("Backslash escapes (example 308)", () => {
    ist(parse("[foo](/bar\\* \"ti\\*tle\")\n"), r`Document {
  Paragraph {
    Link {
      LinkMark("[", 0-1)
      LinkMark("]", 4-5)
      LinkMark("(", 5-6)
      URL("/bar\\*")
      LinkTitle("\"ti\\*tle\"")
      LinkMark(")", 22-23)
    }
  }
}
`)
  });

  it("Backslash escapes (example 309)", () => {
    ist(parse("[foo]\n\n[foo]: /bar\\* \"ti\\*tle\"\n"), r`Document {
  Paragraph {
    Link {
      LinkMark("[", 0-1)
      LinkMark("]", 4-5)
    }
  }
  LinkReference {
    LinkLabel("[foo]")
    LinkMark(":", 12-13)
    URL("/bar\\*")
    LinkTitle("\"ti\\*tle\"")
  }
}
`)
  });

  it("Backslash escapes (example 310)", () => {
    ist(parse("``` foo\\+bar\nfoo\n```\n"), r`Document {
  FencedCode {
    CodeMark("‘‘‘", 0-3)
    CodeInfo("foo\\+bar")
    CodeText("foo")
    CodeMark("‘‘‘", 17-20)
  }
}
`)
  });

  it("Entity and numeric character references (example 311)", () => {
    ist(parse("&nbsp; &amp; &copy; &AElig; &Dcaron;\n&frac34; &HilbertSpace; &DifferentialD;\n&ClockwiseContourIntegral; &ngE;\n"), r`Document {
  Paragraph {
    Entity("&nbsp;")
    Entity("&amp;")
    Entity("&copy;")
    Entity("&AElig;")
    Entity("&Dcaron;")
    Entity("&frac34;")
    Entity("&HilbertSpace;")
    Entity("&DifferentialD;")
    Entity("&ClockwiseContourIntegral;")
    Entity("&ngE;")
  }
}
`)
  });

  it("Entity and numeric character references (example 312)", () => {
    ist(parse("&#35; &#1234; &#992; &#0;\n"), r`Document {
  Paragraph {
    Entity("&#35;")
    Entity("&#1234;")
    Entity("&#992;")
    Entity("&#0;")
  }
}
`)
  });

  it("Entity and numeric character references (example 313)", () => {
    ist(parse("&#X22; &#XD06; &#xcab;\n"), r`Document {
  Paragraph {
    Entity("&#X22;")
    Entity("&#XD06;")
    Entity("&#xcab;")
  }
}
`)
  });

  it("Entity and numeric character references (example 314)", () => {
    ist(parse("&nbsp &x; &#; &#x;\n&#987654321;\n&#abcdef0;\n&ThisIsNotDefined; &hi?;\n"), r`Document {
  Paragraph {
    Entity("&x;")
    Entity("&#987654321;")
    Entity("&ThisIsNotDefined;")
  }
}
`)
  });

  it("Entity and numeric character references (example 315)", () => {
    ist(parse("&copy\n"), r`Document {
  Paragraph("&copy")
}
`)
  });

  it("Entity and numeric character references (example 316)", () => {
    ist(parse("&MadeUpEntity;\n"), r`Document {
  Paragraph {
    Entity("&MadeUpEntity;")
  }
}
`)
  });

  it("Entity and numeric character references (example 317)", () => {
    ist(parse("<a href=\"&ouml;&ouml;.html\">\n"), r`Document {
  HTMLBlock("<a href=\"&ouml;&ouml;.html\">")
}
`)
  });

  it("Entity and numeric character references (example 318)", () => {
    ist(parse("[foo](/f&ouml;&ouml; \"f&ouml;&ouml;\")\n"), r`Document {
  Paragraph {
    Link {
      LinkMark("[", 0-1)
      LinkMark("]", 4-5)
      LinkMark("(", 5-6)
      URL("/f&ouml;&ouml;")
      LinkTitle("\"f&ouml;&ouml;\"")
      LinkMark(")", 36-37)
    }
  }
}
`)
  });

  it("Entity and numeric character references (example 319)", () => {
    ist(parse("[foo]\n\n[foo]: /f&ouml;&ouml; \"f&ouml;&ouml;\"\n"), r`Document {
  Paragraph {
    Link {
      LinkMark("[", 0-1)
      LinkMark("]", 4-5)
    }
  }
  LinkReference {
    LinkLabel("[foo]")
    LinkMark(":", 12-13)
    URL("/f&ouml;&ouml;")
    LinkTitle("\"f&ouml;&ouml;\"")
  }
}
`)
  });

  it("Entity and numeric character references (example 320)", () => {
    ist(parse("``` f&ouml;&ouml;\nfoo\n```\n"), r`Document {
  FencedCode {
    CodeMark("‘‘‘", 0-3)
    CodeInfo("f&ouml;&ouml;")
    CodeText("foo")
    CodeMark("‘‘‘", 22-25)
  }
}
`)
  });

  it("Entity and numeric character references (example 321)", () => {
    ist(parse("`f&ouml;&ouml;`\n"), r`Document {
  Paragraph {
    InlineCode {
      CodeMark("‘", 0-1)
      CodeMark("‘", 14-15)
    }
  }
}
`)
  });

  it("Entity and numeric character references (example 322)", () => {
    ist(parse("    f&ouml;f&ouml;\n"), r`Document {
  CodeBlock {
    CodeText("f&ouml;f&ouml;")
  }
}
`)
  });

  it("Entity and numeric character references (example 323)", () => {
    ist(parse("&#42;foo&#42;\n*foo*\n"), r`Document {
  Paragraph {
    Entity("&#42;")
    Entity("&#42;")
    Emphasis {
      EmphasisMark("*", 14-15)
      EmphasisMark("*", 18-19)
    }
  }
}
`)
  });

  it("Entity and numeric character references (example 324)", () => {
    ist(parse("&#42; foo\n\n* foo\n"), r`Document {
  Paragraph {
    Entity("&#42;")
  }
  BulletList {
    ListItem {
      ListMark("*", 11-12)
      Paragraph("foo")
    }
  }
}
`)
  });

  it("Entity and numeric character references (example 325)", () => {
    ist(parse("foo&#10;&#10;bar\n"), r`Document {
  Paragraph {
    Entity("&#10;")
    Entity("&#10;")
  }
}
`)
  });

  it("Entity and numeric character references (example 326)", () => {
    ist(parse("&#9;foo\n"), r`Document {
  Paragraph {
    Entity("&#9;")
  }
}
`)
  });

  it("Entity and numeric character references (example 327)", () => {
    ist(parse("[a](url &quot;tit&quot;)\n"), r`Document {
  Paragraph {
    Link {
      LinkMark("[", 0-1)
      LinkMark("]", 2-3)
    }
    Entity("&quot;")
    Entity("&quot;")
  }
}
`)
  });

  it("Code spans (example 328)", () => {
    ist(parse("`foo`\n"), r`Document {
  Paragraph {
    InlineCode {
      CodeMark("‘", 0-1)
      CodeMark("‘", 4-5)
    }
  }
}
`)
  });

  it("Code spans (example 329)", () => {
    ist(parse("`` foo ` bar ``\n"), r`Document {
  Paragraph {
    InlineCode {
      CodeMark("‘‘", 0-2)
      CodeMark("‘‘", 13-15)
    }
  }
}
`)
  });

  it("Code spans (example 330)", () => {
    ist(parse("` `` `\n"), r`Document {
  Paragraph {
    InlineCode {
      CodeMark("‘", 0-1)
      CodeMark("‘", 5-6)
    }
  }
}
`)
  });

  it("Code spans (example 331)", () => {
    ist(parse("`  ``  `\n"), r`Document {
  Paragraph {
    InlineCode {
      CodeMark("‘", 0-1)
      CodeMark("‘", 7-8)
    }
  }
}
`)
  });

  it("Code spans (example 332)", () => {
    ist(parse("` a`\n"), r`Document {
  Paragraph {
    InlineCode {
      CodeMark("‘", 0-1)
      CodeMark("‘", 3-4)
    }
  }
}
`)
  });

  it("Code spans (example 333)", () => {
    ist(parse("` b `\n"), r`Document {
  Paragraph {
    InlineCode {
      CodeMark("‘", 0-1)
      CodeMark("‘", 4-5)
    }
  }
}
`)
  });

  it("Code spans (example 334)", () => {
    ist(parse("` `\n`  `\n"), r`Document {
  Paragraph {
    InlineCode {
      CodeMark("‘", 0-1)
      CodeMark("‘", 2-3)
    }
    InlineCode {
      CodeMark("‘", 4-5)
      CodeMark("‘", 7-8)
    }
  }
}
`)
  });

  it("Code spans (example 335)", () => {
    ist(parse("``\nfoo\nbar  \nbaz\n``\n"), r`Document {
  Paragraph {
    InlineCode {
      CodeMark("‘‘", 0-2)
      CodeMark("‘‘", 17-19)
    }
  }
}
`)
  });

  it("Code spans (example 336)", () => {
    ist(parse("``\nfoo \n``\n"), r`Document {
  Paragraph {
    InlineCode {
      CodeMark("‘‘", 0-2)
      CodeMark("‘‘", 8-10)
    }
  }
}
`)
  });

  it("Code spans (example 337)", () => {
    ist(parse("`foo   bar \nbaz`\n"), r`Document {
  Paragraph {
    InlineCode {
      CodeMark("‘", 0-1)
      CodeMark("‘", 15-16)
    }
  }
}
`)
  });

  it("Code spans (example 338)", () => {
    ist(parse("`foo\\`bar`\n"), r`Document {
  Paragraph {
    InlineCode {
      CodeMark("‘", 0-1)
      CodeMark("‘", 5-6)
    }
  }
}
`)
  });

  it("Code spans (example 339)", () => {
    ist(parse("``foo`bar``\n"), r`Document {
  Paragraph {
    InlineCode {
      CodeMark("‘‘", 0-2)
      CodeMark("‘‘", 9-11)
    }
  }
}
`)
  });

  it("Code spans (example 340)", () => {
    ist(parse("` foo `` bar `\n"), r`Document {
  Paragraph {
    InlineCode {
      CodeMark("‘", 0-1)
      CodeMark("‘", 13-14)
    }
  }
}
`)
  });

  it("Code spans (example 341)", () => {
    ist(parse("*foo`*`\n"), r`Document {
  Paragraph {
    InlineCode {
      CodeMark("‘", 4-5)
      CodeMark("‘", 6-7)
    }
  }
}
`)
  });

  it("Code spans (example 342)", () => {
    ist(parse("[not a `link](/foo`)\n"), r`Document {
  Paragraph {
    InlineCode {
      CodeMark("‘", 7-8)
      CodeMark("‘", 18-19)
    }
  }
}
`)
  });

  it("Code spans (example 343)", () => {
    ist(parse("`<a href=\"`\">`\n"), r`Document {
  Paragraph {
    InlineCode {
      CodeMark("‘", 0-1)
      CodeMark("‘", 10-11)
    }
  }
}
`)
  });

  it("Code spans (example 344)", () => {
    ist(parse("<a href=\"`\">`\n"), r`Document {
  Paragraph {
    HTMLTag("<a href=\"‘\">")
  }
}
`)
  });

  it("Code spans (example 345)", () => {
    ist(parse("`<http://foo.bar.`baz>`\n"), r`Document {
  Paragraph {
    InlineCode {
      CodeMark("‘", 0-1)
      CodeMark("‘", 17-18)
    }
  }
}
`)
  });

  it("Code spans (example 346)", () => {
    ist(parse("<http://foo.bar.`baz>`\n"), r`Document {
  Paragraph {
    Autolink {
      LinkMark("<", 0-1)
      URL("http://foo.bar.‘baz")
      LinkMark(">", 20-21)
    }
  }
}
`)
  });

  it("Code spans (example 347)", () => {
    ist(parse("```foo``\n"), r`Document {
  Paragraph("‘‘‘foo‘‘")
}
`)
  });

  it("Code spans (example 348)", () => {
    ist(parse("`foo\n"), r`Document {
  Paragraph("‘foo")
}
`)
  });

  it("Code spans (example 349)", () => {
    ist(parse("`foo``bar``\n"), r`Document {
  Paragraph {
    InlineCode {
      CodeMark("‘‘", 4-6)
      CodeMark("‘‘", 9-11)
    }
  }
}
`)
  });

  it("Emphasis and strong emphasis (example 350)", () => {
    ist(parse("*foo bar*\n"), r`Document {
  Paragraph {
    Emphasis {
      EmphasisMark("*", 0-1)
      EmphasisMark("*", 8-9)
    }
  }
}
`)
  });

  it("Emphasis and strong emphasis (example 351)", () => {
    ist(parse("a * foo bar*\n"), r`Document {
  Paragraph("a * foo bar*")
}
`)
  });

  it("Emphasis and strong emphasis (example 352)", () => {
    ist(parse("a*\"foo\"*\n"), r`Document {
  Paragraph("a*\"foo\"*")
}
`)
  });

  it("Emphasis and strong emphasis (example 353)", () => {
    ist(parse("* a *\n"), r`Document {
  Paragraph("* a *")
}
`)
  });

  it("Emphasis and strong emphasis (example 354)", () => {
    ist(parse("foo*bar*\n"), r`Document {
  Paragraph {
    Emphasis {
      EmphasisMark("*", 3-4)
      EmphasisMark("*", 7-8)
    }
  }
}
`)
  });

  it("Emphasis and strong emphasis (example 355)", () => {
    ist(parse("5*6*78\n"), r`Document {
  Paragraph {
    Emphasis {
      EmphasisMark("*", 1-2)
      EmphasisMark("*", 3-4)
    }
  }
}
`)
  });

  it("Emphasis and strong emphasis (example 356)", () => {
    ist(parse("_foo bar_\n"), r`Document {
  Paragraph {
    Emphasis {
      EmphasisMark("_", 0-1)
      EmphasisMark("_", 8-9)
    }
  }
}
`)
  });

  it("Emphasis and strong emphasis (example 357)", () => {
    ist(parse("_ foo bar_\n"), r`Document {
  Paragraph("_ foo bar_")
}
`)
  });

  it("Emphasis and strong emphasis (example 358)", () => {
    ist(parse("a_\"foo\"_\n"), r`Document {
  Paragraph("a_\"foo\"_")
}
`)
  });

  it("Emphasis and strong emphasis (example 359)", () => {
    ist(parse("foo_bar_\n"), r`Document {
  Paragraph("foo_bar_")
}
`)
  });

  it("Emphasis and strong emphasis (example 360)", () => {
    ist(parse("5_6_78\n"), r`Document {
  Paragraph("5_6_78")
}
`)
  });

  it("Emphasis and strong emphasis (example 361)", () => {
    ist(parse("пристаням_стремятся_\n"), r`Document {
  Paragraph("пристаням_стремятся_")
}
`)
  });

  it("Emphasis and strong emphasis (example 362)", () => {
    ist(parse("aa_\"bb\"_cc\n"), r`Document {
  Paragraph("aa_\"bb\"_cc")
}
`)
  });

  it("Emphasis and strong emphasis (example 363)", () => {
    ist(parse("foo-_(bar)_\n"), r`Document {
  Paragraph {
    Emphasis {
      EmphasisMark("_", 4-5)
      EmphasisMark("_", 10-11)
    }
  }
}
`)
  });

  it("Emphasis and strong emphasis (example 364)", () => {
    ist(parse("_foo*\n"), r`Document {
  Paragraph("_foo*")
}
`)
  });

  it("Emphasis and strong emphasis (example 365)", () => {
    ist(parse("*foo bar *\n"), r`Document {
  Paragraph("*foo bar *")
}
`)
  });

  it("Emphasis and strong emphasis (example 366)", () => {
    ist(parse("*foo bar\n*\n"), r`Document {
  Paragraph("*foo bar\n*")
}
`)
  });

  it("Emphasis and strong emphasis (example 367)", () => {
    ist(parse("*(*foo)\n"), r`Document {
  Paragraph("*(*foo)")
}
`)
  });

  it("Emphasis and strong emphasis (example 368)", () => {
    ist(parse("*(*foo*)*\n"), r`Document {
  Paragraph {
    Emphasis {
      EmphasisMark("*", 0-1)
      Emphasis {
        EmphasisMark("*", 2-3)
        EmphasisMark("*", 6-7)
      }
      EmphasisMark("*", 8-9)
    }
  }
}
`)
  });

  it("Emphasis and strong emphasis (example 369)", () => {
    ist(parse("*foo*bar\n"), r`Document {
  Paragraph {
    Emphasis {
      EmphasisMark("*", 0-1)
      EmphasisMark("*", 4-5)
    }
  }
}
`)
  });

  it("Emphasis and strong emphasis (example 370)", () => {
    ist(parse("_foo bar _\n"), r`Document {
  Paragraph("_foo bar _")
}
`)
  });

  it("Emphasis and strong emphasis (example 371)", () => {
    ist(parse("_(_foo)\n"), r`Document {
  Paragraph("_(_foo)")
}
`)
  });

  it("Emphasis and strong emphasis (example 372)", () => {
    ist(parse("_(_foo_)_\n"), r`Document {
  Paragraph {
    Emphasis {
      EmphasisMark("_", 0-1)
      Emphasis {
        EmphasisMark("_", 2-3)
        EmphasisMark("_", 6-7)
      }
      EmphasisMark("_", 8-9)
    }
  }
}
`)
  });

  it("Emphasis and strong emphasis (example 373)", () => {
    ist(parse("_foo_bar\n"), r`Document {
  Paragraph("_foo_bar")
}
`)
  });

  it("Emphasis and strong emphasis (example 374)", () => {
    ist(parse("_пристаням_стремятся\n"), r`Document {
  Paragraph("_пристаням_стремятся")
}
`)
  });

  it("Emphasis and strong emphasis (example 375)", () => {
    ist(parse("_foo_bar_baz_\n"), r`Document {
  Paragraph {
    Emphasis {
      EmphasisMark("_", 0-1)
      EmphasisMark("_", 12-13)
    }
  }
}
`)
  });

  it("Emphasis and strong emphasis (example 376)", () => {
    ist(parse("_(bar)_.\n"), r`Document {
  Paragraph {
    Emphasis {
      EmphasisMark("_", 0-1)
      EmphasisMark("_", 6-7)
    }
  }
}
`)
  });

  it("Emphasis and strong emphasis (example 377)", () => {
    ist(parse("**foo bar**\n"), r`Document {
  Paragraph {
    StrongEmphasis {
      EmphasisMark("**", 0-2)
      EmphasisMark("**", 9-11)
    }
  }
}
`)
  });

  it("Emphasis and strong emphasis (example 378)", () => {
    ist(parse("** foo bar**\n"), r`Document {
  Paragraph("** foo bar**")
}
`)
  });

  it("Emphasis and strong emphasis (example 379)", () => {
    ist(parse("a**\"foo\"**\n"), r`Document {
  Paragraph("a**\"foo\"**")
}
`)
  });

  it("Emphasis and strong emphasis (example 380)", () => {
    ist(parse("foo**bar**\n"), r`Document {
  Paragraph {
    StrongEmphasis {
      EmphasisMark("**", 3-5)
      EmphasisMark("**", 8-10)
    }
  }
}
`)
  });

  it("Emphasis and strong emphasis (example 381)", () => {
    ist(parse("__foo bar__\n"), r`Document {
  Paragraph {
    StrongEmphasis {
      EmphasisMark("__", 0-2)
      EmphasisMark("__", 9-11)
    }
  }
}
`)
  });

  it("Emphasis and strong emphasis (example 382)", () => {
    ist(parse("__ foo bar__\n"), r`Document {
  Paragraph("__ foo bar__")
}
`)
  });

  it("Emphasis and strong emphasis (example 383)", () => {
    ist(parse("__\nfoo bar__\n"), r`Document {
  Paragraph("__\nfoo bar__")
}
`)
  });

  it("Emphasis and strong emphasis (example 384)", () => {
    ist(parse("a__\"foo\"__\n"), r`Document {
  Paragraph("a__\"foo\"__")
}
`)
  });

  it("Emphasis and strong emphasis (example 385)", () => {
    ist(parse("foo__bar__\n"), r`Document {
  Paragraph("foo__bar__")
}
`)
  });

  it("Emphasis and strong emphasis (example 386)", () => {
    ist(parse("5__6__78\n"), r`Document {
  Paragraph("5__6__78")
}
`)
  });

  it("Emphasis and strong emphasis (example 387)", () => {
    ist(parse("пристаням__стремятся__\n"), r`Document {
  Paragraph("пристаням__стремятся__")
}
`)
  });

  it("Emphasis and strong emphasis (example 388)", () => {
    ist(parse("__foo, __bar__, baz__\n"), r`Document {
  Paragraph {
    StrongEmphasis {
      EmphasisMark("__", 0-2)
      StrongEmphasis {
        EmphasisMark("__", 7-9)
        EmphasisMark("__", 12-14)
      }
      EmphasisMark("__", 19-21)
    }
  }
}
`)
  });

  it("Emphasis and strong emphasis (example 389)", () => {
    ist(parse("foo-__(bar)__\n"), r`Document {
  Paragraph {
    StrongEmphasis {
      EmphasisMark("__", 4-6)
      EmphasisMark("__", 11-13)
    }
  }
}
`)
  });

  it("Emphasis and strong emphasis (example 390)", () => {
    ist(parse("**foo bar **\n"), r`Document {
  Paragraph("**foo bar **")
}
`)
  });

  it("Emphasis and strong emphasis (example 391)", () => {
    ist(parse("**(**foo)\n"), r`Document {
  Paragraph("**(**foo)")
}
`)
  });

  it("Emphasis and strong emphasis (example 392)", () => {
    ist(parse("*(**foo**)*\n"), r`Document {
  Paragraph {
    Emphasis {
      EmphasisMark("*", 0-1)
      StrongEmphasis {
        EmphasisMark("**", 2-4)
        EmphasisMark("**", 7-9)
      }
      EmphasisMark("*", 10-11)
    }
  }
}
`)
  });

  it("Emphasis and strong emphasis (example 393)", () => {
    ist(parse("**Gomphocarpus (*Gomphocarpus physocarpus*, syn.\n*Asclepias physocarpa*)**\n"), r`Document {
  Paragraph {
    StrongEmphasis {
      EmphasisMark("**", 0-2)
      Emphasis {
        EmphasisMark("*", 16-17)
        EmphasisMark("*", 41-42)
      }
      Emphasis {
        EmphasisMark("*", 49-50)
        EmphasisMark("*", 70-71)
      }
      EmphasisMark("**", 72-74)
    }
  }
}
`)
  });

  it("Emphasis and strong emphasis (example 394)", () => {
    ist(parse("**foo \"*bar*\" foo**\n"), r`Document {
  Paragraph {
    StrongEmphasis {
      EmphasisMark("**", 0-2)
      Emphasis {
        EmphasisMark("*", 7-8)
        EmphasisMark("*", 11-12)
      }
      EmphasisMark("**", 17-19)
    }
  }
}
`)
  });

  it("Emphasis and strong emphasis (example 395)", () => {
    ist(parse("**foo**bar\n"), r`Document {
  Paragraph {
    StrongEmphasis {
      EmphasisMark("**", 0-2)
      EmphasisMark("**", 5-7)
    }
  }
}
`)
  });

  it("Emphasis and strong emphasis (example 396)", () => {
    ist(parse("__foo bar __\n"), r`Document {
  Paragraph("__foo bar __")
}
`)
  });

  it("Emphasis and strong emphasis (example 397)", () => {
    ist(parse("__(__foo)\n"), r`Document {
  Paragraph("__(__foo)")
}
`)
  });

  it("Emphasis and strong emphasis (example 398)", () => {
    ist(parse("_(__foo__)_\n"), r`Document {
  Paragraph {
    Emphasis {
      EmphasisMark("_", 0-1)
      StrongEmphasis {
        EmphasisMark("__", 2-4)
        EmphasisMark("__", 7-9)
      }
      EmphasisMark("_", 10-11)
    }
  }
}
`)
  });

  it("Emphasis and strong emphasis (example 399)", () => {
    ist(parse("__foo__bar\n"), r`Document {
  Paragraph("__foo__bar")
}
`)
  });

  it("Emphasis and strong emphasis (example 400)", () => {
    ist(parse("__пристаням__стремятся\n"), r`Document {
  Paragraph("__пристаням__стремятся")
}
`)
  });

  it("Emphasis and strong emphasis (example 401)", () => {
    ist(parse("__foo__bar__baz__\n"), r`Document {
  Paragraph {
    StrongEmphasis {
      EmphasisMark("__", 0-2)
      EmphasisMark("__", 15-17)
    }
  }
}
`)
  });

  it("Emphasis and strong emphasis (example 402)", () => {
    ist(parse("__(bar)__.\n"), r`Document {
  Paragraph {
    StrongEmphasis {
      EmphasisMark("__", 0-2)
      EmphasisMark("__", 7-9)
    }
  }
}
`)
  });

  it("Emphasis and strong emphasis (example 403)", () => {
    ist(parse("*foo [bar](/url)*\n"), r`Document {
  Paragraph {
    Emphasis {
      EmphasisMark("*", 0-1)
      Link {
        LinkMark("[", 5-6)
        LinkMark("]", 9-10)
        LinkMark("(", 10-11)
        URL("/url")
        LinkMark(")", 15-16)
      }
      EmphasisMark("*", 16-17)
    }
  }
}
`)
  });

  it("Emphasis and strong emphasis (example 404)", () => {
    ist(parse("*foo\nbar*\n"), r`Document {
  Paragraph {
    Emphasis {
      EmphasisMark("*", 0-1)
      EmphasisMark("*", 8-9)
    }
  }
}
`)
  });

  it("Emphasis and strong emphasis (example 405)", () => {
    ist(parse("_foo __bar__ baz_\n"), r`Document {
  Paragraph {
    Emphasis {
      EmphasisMark("_", 0-1)
      StrongEmphasis {
        EmphasisMark("__", 5-7)
        EmphasisMark("__", 10-12)
      }
      EmphasisMark("_", 16-17)
    }
  }
}
`)
  });

  it("Emphasis and strong emphasis (example 406)", () => {
    ist(parse("_foo _bar_ baz_\n"), r`Document {
  Paragraph {
    Emphasis {
      EmphasisMark("_", 0-1)
      Emphasis {
        EmphasisMark("_", 5-6)
        EmphasisMark("_", 9-10)
      }
      EmphasisMark("_", 14-15)
    }
  }
}
`)
  });

  it("Emphasis and strong emphasis (example 407)", () => {
    ist(parse("__foo_ bar_\n"), r`Document {
  Paragraph {
    Emphasis {
      EmphasisMark("_", 0-1)
      Emphasis {
        EmphasisMark("_", 1-2)
        EmphasisMark("_", 5-6)
      }
      EmphasisMark("_", 10-11)
    }
  }
}
`)
  });

  it("Emphasis and strong emphasis (example 408)", () => {
    ist(parse("*foo *bar**\n"), r`Document {
  Paragraph {
    Emphasis {
      EmphasisMark("*", 0-1)
      Emphasis {
        EmphasisMark("*", 5-6)
        EmphasisMark("*", 9-10)
      }
      EmphasisMark("*", 10-11)
    }
  }
}
`)
  });

  it("Emphasis and strong emphasis (example 409)", () => {
    ist(parse("*foo **bar** baz*\n"), r`Document {
  Paragraph {
    Emphasis {
      EmphasisMark("*", 0-1)
      StrongEmphasis {
        EmphasisMark("**", 5-7)
        EmphasisMark("**", 10-12)
      }
      EmphasisMark("*", 16-17)
    }
  }
}
`)
  });

  it("Emphasis and strong emphasis (example 410)", () => {
    ist(parse("*foo**bar**baz*\n"), r`Document {
  Paragraph {
    Emphasis {
      EmphasisMark("*", 0-1)
      StrongEmphasis {
        EmphasisMark("**", 4-6)
        EmphasisMark("**", 9-11)
      }
      EmphasisMark("*", 14-15)
    }
  }
}
`)
  });

  it("Emphasis and strong emphasis (example 411)", () => {
    ist(parse("*foo**bar*\n"), r`Document {
  Paragraph {
    Emphasis {
      EmphasisMark("*", 0-1)
      EmphasisMark("*", 9-10)
    }
  }
}
`)
  });

  it("Emphasis and strong emphasis (example 412)", () => {
    ist(parse("***foo** bar*\n"), r`Document {
  Paragraph {
    Emphasis {
      EmphasisMark("*", 0-1)
      StrongEmphasis {
        EmphasisMark("**", 1-3)
        EmphasisMark("**", 6-8)
      }
      EmphasisMark("*", 12-13)
    }
  }
}
`)
  });

  it("Emphasis and strong emphasis (example 413)", () => {
    ist(parse("*foo **bar***\n"), r`Document {
  Paragraph {
    Emphasis {
      EmphasisMark("*", 0-1)
      StrongEmphasis {
        EmphasisMark("**", 5-7)
        EmphasisMark("**", 10-12)
      }
      EmphasisMark("*", 12-13)
    }
  }
}
`)
  });

  it("Emphasis and strong emphasis (example 414)", () => {
    ist(parse("*foo**bar***\n"), r`Document {
  Paragraph {
    Emphasis {
      EmphasisMark("*", 0-1)
      StrongEmphasis {
        EmphasisMark("**", 4-6)
        EmphasisMark("**", 9-11)
      }
      EmphasisMark("*", 11-12)
    }
  }
}
`)
  });

  it("Emphasis and strong emphasis (example 415)", () => {
    ist(parse("foo***bar***baz\n"), r`Document {
  Paragraph {
    Emphasis {
      EmphasisMark("*", 3-4)
      StrongEmphasis {
        EmphasisMark("**", 4-6)
        EmphasisMark("**", 9-11)
      }
      EmphasisMark("*", 11-12)
    }
  }
}
`)
  });

  it("Emphasis and strong emphasis (example 416)", () => {
    ist(parse("foo******bar*********baz\n"), r`Document {
  Paragraph {
    StrongEmphasis {
      EmphasisMark("**", 3-5)
      StrongEmphasis {
        EmphasisMark("**", 5-7)
        StrongEmphasis {
          EmphasisMark("**", 7-9)
          EmphasisMark("**", 12-14)
        }
        EmphasisMark("**", 14-16)
      }
      EmphasisMark("**", 16-18)
    }
  }
}
`)
  });

  it("Emphasis and strong emphasis (example 417)", () => {
    ist(parse("*foo **bar *baz* bim** bop*\n"), r`Document {
  Paragraph {
    Emphasis {
      EmphasisMark("*", 0-1)
      StrongEmphasis {
        EmphasisMark("**", 5-7)
        Emphasis {
          EmphasisMark("*", 11-12)
          EmphasisMark("*", 15-16)
        }
        EmphasisMark("**", 20-22)
      }
      EmphasisMark("*", 26-27)
    }
  }
}
`)
  });

  it("Emphasis and strong emphasis (example 418)", () => {
    ist(parse("*foo [*bar*](/url)*\n"), r`Document {
  Paragraph {
    Emphasis {
      EmphasisMark("*", 0-1)
      Link {
        LinkMark("[", 5-6)
        Emphasis {
          EmphasisMark("*", 6-7)
          EmphasisMark("*", 10-11)
        }
        LinkMark("]", 11-12)
        LinkMark("(", 12-13)
        URL("/url")
        LinkMark(")", 17-18)
      }
      EmphasisMark("*", 18-19)
    }
  }
}
`)
  });

  it("Emphasis and strong emphasis (example 419)", () => {
    ist(parse("** is not an empty emphasis\n"), r`Document {
  Paragraph("** is not an empty emphasis")
}
`)
  });

  it("Emphasis and strong emphasis (example 420)", () => {
    ist(parse("**** is not an empty strong emphasis\n"), r`Document {
  Paragraph("**** is not an empty strong emphasis")
}
`)
  });

  it("Emphasis and strong emphasis (example 421)", () => {
    ist(parse("**foo [bar](/url)**\n"), r`Document {
  Paragraph {
    StrongEmphasis {
      EmphasisMark("**", 0-2)
      Link {
        LinkMark("[", 6-7)
        LinkMark("]", 10-11)
        LinkMark("(", 11-12)
        URL("/url")
        LinkMark(")", 16-17)
      }
      EmphasisMark("**", 17-19)
    }
  }
}
`)
  });

  it("Emphasis and strong emphasis (example 422)", () => {
    ist(parse("**foo\nbar**\n"), r`Document {
  Paragraph {
    StrongEmphasis {
      EmphasisMark("**", 0-2)
      EmphasisMark("**", 9-11)
    }
  }
}
`)
  });

  it("Emphasis and strong emphasis (example 423)", () => {
    ist(parse("__foo _bar_ baz__\n"), r`Document {
  Paragraph {
    StrongEmphasis {
      EmphasisMark("__", 0-2)
      Emphasis {
        EmphasisMark("_", 6-7)
        EmphasisMark("_", 10-11)
      }
      EmphasisMark("__", 15-17)
    }
  }
}
`)
  });

  it("Emphasis and strong emphasis (example 424)", () => {
    ist(parse("__foo __bar__ baz__\n"), r`Document {
  Paragraph {
    StrongEmphasis {
      EmphasisMark("__", 0-2)
      StrongEmphasis {
        EmphasisMark("__", 6-8)
        EmphasisMark("__", 11-13)
      }
      EmphasisMark("__", 17-19)
    }
  }
}
`)
  });

  it("Emphasis and strong emphasis (example 425)", () => {
    ist(parse("____foo__ bar__\n"), r`Document {
  Paragraph {
    StrongEmphasis {
      EmphasisMark("__", 0-2)
      StrongEmphasis {
        EmphasisMark("__", 2-4)
        EmphasisMark("__", 7-9)
      }
      EmphasisMark("__", 13-15)
    }
  }
}
`)
  });

  it("Emphasis and strong emphasis (example 426)", () => {
    ist(parse("**foo **bar****\n"), r`Document {
  Paragraph {
    StrongEmphasis {
      EmphasisMark("**", 0-2)
      StrongEmphasis {
        EmphasisMark("**", 6-8)
        EmphasisMark("**", 11-13)
      }
      EmphasisMark("**", 13-15)
    }
  }
}
`)
  });

  it("Emphasis and strong emphasis (example 427)", () => {
    ist(parse("**foo *bar* baz**\n"), r`Document {
  Paragraph {
    StrongEmphasis {
      EmphasisMark("**", 0-2)
      Emphasis {
        EmphasisMark("*", 6-7)
        EmphasisMark("*", 10-11)
      }
      EmphasisMark("**", 15-17)
    }
  }
}
`)
  });

  it("Emphasis and strong emphasis (example 428)", () => {
    ist(parse("**foo*bar*baz**\n"), r`Document {
  Paragraph {
    StrongEmphasis {
      EmphasisMark("**", 0-2)
      Emphasis {
        EmphasisMark("*", 5-6)
        EmphasisMark("*", 9-10)
      }
      EmphasisMark("**", 13-15)
    }
  }
}
`)
  });

  it("Emphasis and strong emphasis (example 429)", () => {
    ist(parse("***foo* bar**\n"), r`Document {
  Paragraph {
    StrongEmphasis {
      EmphasisMark("**", 0-2)
      Emphasis {
        EmphasisMark("*", 2-3)
        EmphasisMark("*", 6-7)
      }
      EmphasisMark("**", 11-13)
    }
  }
}
`)
  });

  it("Emphasis and strong emphasis (example 430)", () => {
    ist(parse("**foo *bar***\n"), r`Document {
  Paragraph {
    StrongEmphasis {
      EmphasisMark("**", 0-2)
      Emphasis {
        EmphasisMark("*", 6-7)
        EmphasisMark("*", 10-11)
      }
      EmphasisMark("**", 11-13)
    }
  }
}
`)
  });

  it("Emphasis and strong emphasis (example 431)", () => {
    ist(parse("**foo *bar **baz**\nbim* bop**\n"), r`Document {
  Paragraph {
    StrongEmphasis {
      EmphasisMark("**", 0-2)
      Emphasis {
        EmphasisMark("*", 6-7)
        StrongEmphasis {
          EmphasisMark("**", 11-13)
          EmphasisMark("**", 16-18)
        }
        EmphasisMark("*", 22-23)
      }
      EmphasisMark("**", 27-29)
    }
  }
}
`)
  });

  it("Emphasis and strong emphasis (example 432)", () => {
    ist(parse("**foo [*bar*](/url)**\n"), r`Document {
  Paragraph {
    StrongEmphasis {
      EmphasisMark("**", 0-2)
      Link {
        LinkMark("[", 6-7)
        Emphasis {
          EmphasisMark("*", 7-8)
          EmphasisMark("*", 11-12)
        }
        LinkMark("]", 12-13)
        LinkMark("(", 13-14)
        URL("/url")
        LinkMark(")", 18-19)
      }
      EmphasisMark("**", 19-21)
    }
  }
}
`)
  });

  it("Emphasis and strong emphasis (example 433)", () => {
    ist(parse("__ is not an empty emphasis\n"), r`Document {
  Paragraph("__ is not an empty emphasis")
}
`)
  });

  it("Emphasis and strong emphasis (example 434)", () => {
    ist(parse("____ is not an empty strong emphasis\n"), r`Document {
  Paragraph("____ is not an empty strong emphasis")
}
`)
  });

  it("Emphasis and strong emphasis (example 435)", () => {
    ist(parse("foo ***\n"), r`Document {
  Paragraph("foo ***")
}
`)
  });

  it("Emphasis and strong emphasis (example 436)", () => {
    ist(parse("foo *\\**\n"), r`Document {
  Paragraph {
    Emphasis {
      EmphasisMark("*", 4-5)
      Escape("\\*")
      EmphasisMark("*", 7-8)
    }
  }
}
`)
  });

  it("Emphasis and strong emphasis (example 437)", () => {
    ist(parse("foo *_*\n"), r`Document {
  Paragraph {
    Emphasis {
      EmphasisMark("*", 4-5)
      EmphasisMark("*", 6-7)
    }
  }
}
`)
  });

  it("Emphasis and strong emphasis (example 438)", () => {
    ist(parse("foo *****\n"), r`Document {
  Paragraph("foo *****")
}
`)
  });

  it("Emphasis and strong emphasis (example 439)", () => {
    ist(parse("foo **\\***\n"), r`Document {
  Paragraph {
    StrongEmphasis {
      EmphasisMark("**", 4-6)
      Escape("\\*")
      EmphasisMark("**", 8-10)
    }
  }
}
`)
  });

  it("Emphasis and strong emphasis (example 440)", () => {
    ist(parse("foo **_**\n"), r`Document {
  Paragraph {
    StrongEmphasis {
      EmphasisMark("**", 4-6)
      EmphasisMark("**", 7-9)
    }
  }
}
`)
  });

  it("Emphasis and strong emphasis (example 441)", () => {
    ist(parse("**foo*\n"), r`Document {
  Paragraph {
    Emphasis {
      EmphasisMark("*", 1-2)
      EmphasisMark("*", 5-6)
    }
  }
}
`)
  });

  it("Emphasis and strong emphasis (example 442)", () => {
    ist(parse("*foo**\n"), r`Document {
  Paragraph {
    Emphasis {
      EmphasisMark("*", 0-1)
      EmphasisMark("*", 4-5)
    }
  }
}
`)
  });

  it("Emphasis and strong emphasis (example 443)", () => {
    ist(parse("***foo**\n"), r`Document {
  Paragraph {
    StrongEmphasis {
      EmphasisMark("**", 1-3)
      EmphasisMark("**", 6-8)
    }
  }
}
`)
  });

  it("Emphasis and strong emphasis (example 444)", () => {
    ist(parse("****foo*\n"), r`Document {
  Paragraph {
    Emphasis {
      EmphasisMark("*", 3-4)
      EmphasisMark("*", 7-8)
    }
  }
}
`)
  });

  it("Emphasis and strong emphasis (example 445)", () => {
    ist(parse("**foo***\n"), r`Document {
  Paragraph {
    StrongEmphasis {
      EmphasisMark("**", 0-2)
      EmphasisMark("**", 5-7)
    }
  }
}
`)
  });

  it("Emphasis and strong emphasis (example 446)", () => {
    ist(parse("*foo****\n"), r`Document {
  Paragraph {
    Emphasis {
      EmphasisMark("*", 0-1)
      EmphasisMark("*", 4-5)
    }
  }
}
`)
  });

  it("Emphasis and strong emphasis (example 447)", () => {
    ist(parse("foo ___\n"), r`Document {
  Paragraph("foo ___")
}
`)
  });

  it("Emphasis and strong emphasis (example 448)", () => {
    ist(parse("foo _\\__\n"), r`Document {
  Paragraph {
    Emphasis {
      EmphasisMark("_", 4-5)
      Escape("\\_")
      EmphasisMark("_", 7-8)
    }
  }
}
`)
  });

  it("Emphasis and strong emphasis (example 449)", () => {
    ist(parse("foo _*_\n"), r`Document {
  Paragraph {
    Emphasis {
      EmphasisMark("_", 4-5)
      EmphasisMark("_", 6-7)
    }
  }
}
`)
  });

  it("Emphasis and strong emphasis (example 450)", () => {
    ist(parse("foo _____\n"), r`Document {
  Paragraph("foo _____")
}
`)
  });

  it("Emphasis and strong emphasis (example 451)", () => {
    ist(parse("foo __\\___\n"), r`Document {
  Paragraph {
    StrongEmphasis {
      EmphasisMark("__", 4-6)
      Escape("\\_")
      EmphasisMark("__", 8-10)
    }
  }
}
`)
  });

  it("Emphasis and strong emphasis (example 452)", () => {
    ist(parse("foo __*__\n"), r`Document {
  Paragraph {
    StrongEmphasis {
      EmphasisMark("__", 4-6)
      EmphasisMark("__", 7-9)
    }
  }
}
`)
  });

  it("Emphasis and strong emphasis (example 453)", () => {
    ist(parse("__foo_\n"), r`Document {
  Paragraph {
    Emphasis {
      EmphasisMark("_", 1-2)
      EmphasisMark("_", 5-6)
    }
  }
}
`)
  });

  it("Emphasis and strong emphasis (example 454)", () => {
    ist(parse("_foo__\n"), r`Document {
  Paragraph {
    Emphasis {
      EmphasisMark("_", 0-1)
      EmphasisMark("_", 4-5)
    }
  }
}
`)
  });

  it("Emphasis and strong emphasis (example 455)", () => {
    ist(parse("___foo__\n"), r`Document {
  Paragraph {
    StrongEmphasis {
      EmphasisMark("__", 1-3)
      EmphasisMark("__", 6-8)
    }
  }
}
`)
  });

  it("Emphasis and strong emphasis (example 456)", () => {
    ist(parse("____foo_\n"), r`Document {
  Paragraph {
    Emphasis {
      EmphasisMark("_", 3-4)
      EmphasisMark("_", 7-8)
    }
  }
}
`)
  });

  it("Emphasis and strong emphasis (example 457)", () => {
    ist(parse("__foo___\n"), r`Document {
  Paragraph {
    StrongEmphasis {
      EmphasisMark("__", 0-2)
      EmphasisMark("__", 5-7)
    }
  }
}
`)
  });

  it("Emphasis and strong emphasis (example 458)", () => {
    ist(parse("_foo____\n"), r`Document {
  Paragraph {
    Emphasis {
      EmphasisMark("_", 0-1)
      EmphasisMark("_", 4-5)
    }
  }
}
`)
  });

  it("Emphasis and strong emphasis (example 459)", () => {
    ist(parse("**foo**\n"), r`Document {
  Paragraph {
    StrongEmphasis {
      EmphasisMark("**", 0-2)
      EmphasisMark("**", 5-7)
    }
  }
}
`)
  });

  it("Emphasis and strong emphasis (example 460)", () => {
    ist(parse("*_foo_*\n"), r`Document {
  Paragraph {
    Emphasis {
      EmphasisMark("*", 0-1)
      Emphasis {
        EmphasisMark("_", 1-2)
        EmphasisMark("_", 5-6)
      }
      EmphasisMark("*", 6-7)
    }
  }
}
`)
  });

  it("Emphasis and strong emphasis (example 461)", () => {
    ist(parse("__foo__\n"), r`Document {
  Paragraph {
    StrongEmphasis {
      EmphasisMark("__", 0-2)
      EmphasisMark("__", 5-7)
    }
  }
}
`)
  });

  it("Emphasis and strong emphasis (example 462)", () => {
    ist(parse("_*foo*_\n"), r`Document {
  Paragraph {
    Emphasis {
      EmphasisMark("_", 0-1)
      Emphasis {
        EmphasisMark("*", 1-2)
        EmphasisMark("*", 5-6)
      }
      EmphasisMark("_", 6-7)
    }
  }
}
`)
  });

  it("Emphasis and strong emphasis (example 463)", () => {
    ist(parse("****foo****\n"), r`Document {
  Paragraph {
    StrongEmphasis {
      EmphasisMark("**", 0-2)
      StrongEmphasis {
        EmphasisMark("**", 2-4)
        EmphasisMark("**", 7-9)
      }
      EmphasisMark("**", 9-11)
    }
  }
}
`)
  });

  it("Emphasis and strong emphasis (example 464)", () => {
    ist(parse("____foo____\n"), r`Document {
  Paragraph {
    StrongEmphasis {
      EmphasisMark("__", 0-2)
      StrongEmphasis {
        EmphasisMark("__", 2-4)
        EmphasisMark("__", 7-9)
      }
      EmphasisMark("__", 9-11)
    }
  }
}
`)
  });

  it("Emphasis and strong emphasis (example 465)", () => {
    ist(parse("******foo******\n"), r`Document {
  Paragraph {
    StrongEmphasis {
      EmphasisMark("**", 0-2)
      StrongEmphasis {
        EmphasisMark("**", 2-4)
        StrongEmphasis {
          EmphasisMark("**", 4-6)
          EmphasisMark("**", 9-11)
        }
        EmphasisMark("**", 11-13)
      }
      EmphasisMark("**", 13-15)
    }
  }
}
`)
  });

  it("Emphasis and strong emphasis (example 466)", () => {
    ist(parse("***foo***\n"), r`Document {
  Paragraph {
    Emphasis {
      EmphasisMark("*", 0-1)
      StrongEmphasis {
        EmphasisMark("**", 1-3)
        EmphasisMark("**", 6-8)
      }
      EmphasisMark("*", 8-9)
    }
  }
}
`)
  });

  it("Emphasis and strong emphasis (example 467)", () => {
    ist(parse("_____foo_____\n"), r`Document {
  Paragraph {
    Emphasis {
      EmphasisMark("_", 0-1)
      StrongEmphasis {
        EmphasisMark("__", 1-3)
        StrongEmphasis {
          EmphasisMark("__", 3-5)
          EmphasisMark("__", 8-10)
        }
        EmphasisMark("__", 10-12)
      }
      EmphasisMark("_", 12-13)
    }
  }
}
`)
  });

  it("Emphasis and strong emphasis (example 468)", () => {
    ist(parse("*foo _bar* baz_\n"), r`Document {
  Paragraph {
    Emphasis {
      EmphasisMark("*", 0-1)
      EmphasisMark("*", 9-10)
    }
  }
}
`)
  });

  it("Emphasis and strong emphasis (example 469)", () => {
    ist(parse("*foo __bar *baz bim__ bam*\n"), r`Document {
  Paragraph {
    Emphasis {
      EmphasisMark("*", 0-1)
      StrongEmphasis {
        EmphasisMark("__", 5-7)
        EmphasisMark("__", 19-21)
      }
      EmphasisMark("*", 25-26)
    }
  }
}
`)
  });

  it("Emphasis and strong emphasis (example 470)", () => {
    ist(parse("**foo **bar baz**\n"), r`Document {
  Paragraph {
    StrongEmphasis {
      EmphasisMark("**", 6-8)
      EmphasisMark("**", 15-17)
    }
  }
}
`)
  });

  it("Emphasis and strong emphasis (example 471)", () => {
    ist(parse("*foo *bar baz*\n"), r`Document {
  Paragraph {
    Emphasis {
      EmphasisMark("*", 5-6)
      EmphasisMark("*", 13-14)
    }
  }
}
`)
  });

  it("Emphasis and strong emphasis (example 472)", () => {
    ist(parse("*[bar*](/url)\n"), r`Document {
  Paragraph {
    Link {
      LinkMark("[", 1-2)
      LinkMark("]", 6-7)
      LinkMark("(", 7-8)
      URL("/url")
      LinkMark(")", 12-13)
    }
  }
}
`)
  });

  it("Emphasis and strong emphasis (example 473)", () => {
    ist(parse("_foo [bar_](/url)\n"), r`Document {
  Paragraph {
    Link {
      LinkMark("[", 5-6)
      LinkMark("]", 10-11)
      LinkMark("(", 11-12)
      URL("/url")
      LinkMark(")", 16-17)
    }
  }
}
`)
  });

  it("Emphasis and strong emphasis (example 474)", () => {
    ist(parse("*<img src=\"foo\" title=\"*\"/>\n"), r`Document {
  Paragraph {
    HTMLTag("<img src=\"foo\" title=\"*\"/>")
  }
}
`)
  });

  it("Emphasis and strong emphasis (example 475)", () => {
    ist(parse("**<a href=\"**\">\n"), r`Document {
  Paragraph {
    HTMLTag("<a href=\"**\">")
  }
}
`)
  });

  it("Emphasis and strong emphasis (example 476)", () => {
    ist(parse("__<a href=\"__\">\n"), r`Document {
  Paragraph {
    HTMLTag("<a href=\"__\">")
  }
}
`)
  });

  it("Emphasis and strong emphasis (example 477)", () => {
    ist(parse("*a `*`*\n"), r`Document {
  Paragraph {
    Emphasis {
      EmphasisMark("*", 0-1)
      InlineCode {
        CodeMark("‘", 3-4)
        CodeMark("‘", 5-6)
      }
      EmphasisMark("*", 6-7)
    }
  }
}
`)
  });

  it("Emphasis and strong emphasis (example 478)", () => {
    ist(parse("_a `_`_\n"), r`Document {
  Paragraph {
    Emphasis {
      EmphasisMark("_", 0-1)
      InlineCode {
        CodeMark("‘", 3-4)
        CodeMark("‘", 5-6)
      }
      EmphasisMark("_", 6-7)
    }
  }
}
`)
  });

  it("Emphasis and strong emphasis (example 479)", () => {
    ist(parse("**a<http://foo.bar/?q=**>\n"), r`Document {
  Paragraph {
    Autolink {
      LinkMark("<", 3-4)
      URL("http://foo.bar/?q=**")
      LinkMark(">", 24-25)
    }
  }
}
`)
  });

  it("Emphasis and strong emphasis (example 480)", () => {
    ist(parse("__a<http://foo.bar/?q=__>\n"), r`Document {
  Paragraph {
    Autolink {
      LinkMark("<", 3-4)
      URL("http://foo.bar/?q=__")
      LinkMark(">", 24-25)
    }
  }
}
`)
  });

  it("Links (example 481)", () => {
    ist(parse("[link](/uri \"title\")\n"), r`Document {
  Paragraph {
    Link {
      LinkMark("[", 0-1)
      LinkMark("]", 5-6)
      LinkMark("(", 6-7)
      URL("/uri")
      LinkTitle("\"title\"")
      LinkMark(")", 19-20)
    }
  }
}
`)
  });

  it("Links (example 482)", () => {
    ist(parse("[link](/uri)\n"), r`Document {
  Paragraph {
    Link {
      LinkMark("[", 0-1)
      LinkMark("]", 5-6)
      LinkMark("(", 6-7)
      URL("/uri")
      LinkMark(")", 11-12)
    }
  }
}
`)
  });

  it("Links (example 483)", () => {
    ist(parse("[link]()\n"), r`Document {
  Paragraph {
    Link {
      LinkMark("[", 0-1)
      LinkMark("]", 5-6)
      LinkMark("(", 6-7)
      LinkMark(")", 7-8)
    }
  }
}
`)
  });

  it("Links (example 484)", () => {
    ist(parse("[link](<>)\n"), r`Document {
  Paragraph {
    Link {
      LinkMark("[", 0-1)
      LinkMark("]", 5-6)
      LinkMark("(", 6-7)
      URL("<>")
      LinkMark(")", 9-10)
    }
  }
}
`)
  });

  it("Links (example 485)", () => {
    ist(parse("[link](/my uri)\n"), r`Document {
  Paragraph {
    Link {
      LinkMark("[", 0-1)
      LinkMark("]", 5-6)
    }
  }
}
`)
  });

  it("Links (example 486)", () => {
    ist(parse("[link](</my uri>)\n"), r`Document {
  Paragraph {
    Link {
      LinkMark("[", 0-1)
      LinkMark("]", 5-6)
      LinkMark("(", 6-7)
      URL("</my uri>")
      LinkMark(")", 16-17)
    }
  }
}
`)
  });

  it("Links (example 487)", () => {
    ist(parse("[link](foo\nbar)\n"), r`Document {
  Paragraph {
    Link {
      LinkMark("[", 0-1)
      LinkMark("]", 5-6)
    }
  }
}
`)
  });

  it("Links (example 488)", () => {
    ist(parse("[link](<foo\nbar>)\n"), r`Document {
  Paragraph {
    Link {
      LinkMark("[", 0-1)
      LinkMark("]", 5-6)
    }
    HTMLTag("<foo\nbar>")
  }
}
`)
  });

  it("Links (example 489)", () => {
    ist(parse("[a](<b)c>)\n"), r`Document {
  Paragraph {
    Link {
      LinkMark("[", 0-1)
      LinkMark("]", 2-3)
      LinkMark("(", 3-4)
      URL("<b)c>")
      LinkMark(")", 9-10)
    }
  }
}
`)
  });

  it("Links (example 490)", () => {
    ist(parse("[link](<foo\\>)\n"), r`Document {
  Paragraph {
    Link {
      LinkMark("[", 0-1)
      LinkMark("]", 5-6)
      LinkMark("(", 6-7)
      URL("<foo\\>")
      LinkMark(")", 13-14)
    }
  }
}
`)
  });

  it("Links (example 491)", () => {
    ist(parse("[a](<b)c\n[a](<b)c>\n[a](<b>c)\n"), r`Document {
  Paragraph {
    Link {
      LinkMark("[", 0-1)
      LinkMark("]", 2-3)
    }
    Link {
      LinkMark("[", 9-10)
      LinkMark("]", 11-12)
    }
    Link {
      LinkMark("[", 19-20)
      LinkMark("]", 21-22)
    }
    HTMLTag("<b>")
  }
}
`)
  });

  it("Links (example 492)", () => {
    ist(parse("[link](\\(foo\\))\n"), r`Document {
  Paragraph {
    Link {
      LinkMark("[", 0-1)
      LinkMark("]", 5-6)
      LinkMark("(", 6-7)
      URL("\\(foo\\)")
      LinkMark(")", 14-15)
    }
  }
}
`)
  });

  it("Links (example 493)", () => {
    ist(parse("[link](foo(and(bar)))\n"), r`Document {
  Paragraph {
    Link {
      LinkMark("[", 0-1)
      LinkMark("]", 5-6)
      LinkMark("(", 6-7)
      URL("foo(and(bar))")
      LinkMark(")", 20-21)
    }
  }
}
`)
  });

  it("Links (example 494)", () => {
    ist(parse("[link](foo\\(and\\(bar\\))\n"), r`Document {
  Paragraph {
    Link {
      LinkMark("[", 0-1)
      LinkMark("]", 5-6)
      LinkMark("(", 6-7)
      URL("foo\\(and\\(bar\\)")
      LinkMark(")", 22-23)
    }
  }
}
`)
  });

  it("Links (example 495)", () => {
    ist(parse("[link](<foo(and(bar)>)\n"), r`Document {
  Paragraph {
    Link {
      LinkMark("[", 0-1)
      LinkMark("]", 5-6)
      LinkMark("(", 6-7)
      URL("<foo(and(bar)>")
      LinkMark(")", 21-22)
    }
  }
}
`)
  });

  it("Links (example 496)", () => {
    ist(parse("[link](foo\\)\\:)\n"), r`Document {
  Paragraph {
    Link {
      LinkMark("[", 0-1)
      LinkMark("]", 5-6)
      LinkMark("(", 6-7)
      URL("foo\\)\\:")
      LinkMark(")", 14-15)
    }
  }
}
`)
  });

  it("Links (example 497)", () => {
    ist(parse("[link](#fragment)\n\n[link](http://example.com#fragment)\n\n[link](http://example.com?foo=3#frag)\n"), r`Document {
  Paragraph {
    Link {
      LinkMark("[", 0-1)
      LinkMark("]", 5-6)
      LinkMark("(", 6-7)
      URL("#fragment")
      LinkMark(")", 16-17)
    }
  }
  Paragraph {
    Link {
      LinkMark("[", 19-20)
      LinkMark("]", 24-25)
      LinkMark("(", 25-26)
      URL("http://example.com#fragment")
      LinkMark(")", 53-54)
    }
  }
  Paragraph {
    Link {
      LinkMark("[", 56-57)
      LinkMark("]", 61-62)
      LinkMark("(", 62-63)
      URL("http://example.com?foo=3#frag")
      LinkMark(")", 92-93)
    }
  }
}
`)
  });

  it("Links (example 498)", () => {
    ist(parse("[link](foo\\bar)\n"), r`Document {
  Paragraph {
    Link {
      LinkMark("[", 0-1)
      LinkMark("]", 5-6)
      LinkMark("(", 6-7)
      URL("foo\\bar")
      LinkMark(")", 14-15)
    }
  }
}
`)
  });

  it("Links (example 499)", () => {
    ist(parse("[link](foo%20b&auml;)\n"), r`Document {
  Paragraph {
    Link {
      LinkMark("[", 0-1)
      LinkMark("]", 5-6)
      LinkMark("(", 6-7)
      URL("foo%20b&auml;")
      LinkMark(")", 20-21)
    }
  }
}
`)
  });

  it("Links (example 500)", () => {
    ist(parse("[link](\"title\")\n"), r`Document {
  Paragraph {
    Link {
      LinkMark("[", 0-1)
      LinkMark("]", 5-6)
      LinkMark("(", 6-7)
      URL("\"title\"")
      LinkMark(")", 14-15)
    }
  }
}
`)
  });

  it("Links (example 501)", () => {
    ist(parse("[link](/url \"title\")\n[link](/url 'title')\n[link](/url (title))\n"), r`Document {
  Paragraph {
    Link {
      LinkMark("[", 0-1)
      LinkMark("]", 5-6)
      LinkMark("(", 6-7)
      URL("/url")
      LinkTitle("\"title\"")
      LinkMark(")", 19-20)
    }
    Link {
      LinkMark("[", 21-22)
      LinkMark("]", 26-27)
      LinkMark("(", 27-28)
      URL("/url")
      LinkTitle("'title'")
      LinkMark(")", 40-41)
    }
    Link {
      LinkMark("[", 42-43)
      LinkMark("]", 47-48)
      LinkMark("(", 48-49)
      URL("/url")
      LinkTitle("(title)")
      LinkMark(")", 61-62)
    }
  }
}
`)
  });

  it("Links (example 502)", () => {
    ist(parse("[link](/url \"title \\\"&quot;\")\n"), r`Document {
  Paragraph {
    Link {
      LinkMark("[", 0-1)
      LinkMark("]", 5-6)
      LinkMark("(", 6-7)
      URL("/url")
      LinkTitle("\"title \\\"&quot;\"")
      LinkMark(")", 28-29)
    }
  }
}
`)
  });

  it("Links (example 503)", () => {
    ist(parse("[link](/url \"title\")\n"), r`Document {
  Paragraph {
    Link {
      LinkMark("[", 0-1)
      LinkMark("]", 5-6)
      LinkMark("(", 6-7)
      URL("/url \"title\"")
      LinkMark(")", 19-20)
    }
  }
}
`)
  });

  it("Links (example 504)", () => {
    ist(parse("[link](/url \"title \"and\" title\")\n"), r`Document {
  Paragraph {
    Link {
      LinkMark("[", 0-1)
      LinkMark("]", 5-6)
    }
  }
}
`)
  });

  it("Links (example 505)", () => {
    ist(parse("[link](/url 'title \"and\" title')\n"), r`Document {
  Paragraph {
    Link {
      LinkMark("[", 0-1)
      LinkMark("]", 5-6)
      LinkMark("(", 6-7)
      URL("/url")
      LinkTitle("'title \"and\" title'")
      LinkMark(")", 31-32)
    }
  }
}
`)
  });

  it("Links (example 506)", () => {
    ist(parse("[link](   /uri\n  \"title\"  )\n"), r`Document {
  Paragraph {
    Link {
      LinkMark("[", 0-1)
      LinkMark("]", 5-6)
      LinkMark("(", 6-7)
      URL("/uri")
      LinkTitle("\"title\"")
      LinkMark(")", 26-27)
    }
  }
}
`)
  });

  it("Links (example 507)", () => {
    ist(parse("[link] (/uri)\n"), r`Document {
  Paragraph {
    Link {
      LinkMark("[", 0-1)
      LinkMark("]", 5-6)
    }
  }
}
`)
  });

  it("Links (example 508)", () => {
    ist(parse("[link [foo [bar]]](/uri)\n"), r`Document {
  Paragraph {
    Link {
      LinkMark("[", 11-12)
      LinkMark("]", 15-16)
    }
  }
}
`)
  });

  it("Links (example 509)", () => {
    ist(parse("[link] bar](/uri)\n"), r`Document {
  Paragraph {
    Link {
      LinkMark("[", 0-1)
      LinkMark("]", 5-6)
    }
  }
}
`)
  });

  it("Links (example 510)", () => {
    ist(parse("[link [bar](/uri)\n"), r`Document {
  Paragraph {
    Link {
      LinkMark("[", 6-7)
      LinkMark("]", 10-11)
      LinkMark("(", 11-12)
      URL("/uri")
      LinkMark(")", 16-17)
    }
  }
}
`)
  });

  it("Links (example 511)", () => {
    ist(parse("[link \\[bar](/uri)\n"), r`Document {
  Paragraph {
    Link {
      LinkMark("[", 0-1)
      Escape("\\[")
      LinkMark("]", 11-12)
      LinkMark("(", 12-13)
      URL("/uri")
      LinkMark(")", 17-18)
    }
  }
}
`)
  });

  it("Links (example 512)", () => {
    ist(parse("[link *foo **bar** `#`*](/uri)\n"), r`Document {
  Paragraph {
    Link {
      LinkMark("[", 0-1)
      Emphasis {
        EmphasisMark("*", 6-7)
        StrongEmphasis {
          EmphasisMark("**", 11-13)
          EmphasisMark("**", 16-18)
        }
        InlineCode {
          CodeMark("‘", 19-20)
          CodeMark("‘", 21-22)
        }
        EmphasisMark("*", 22-23)
      }
      LinkMark("]", 23-24)
      LinkMark("(", 24-25)
      URL("/uri")
      LinkMark(")", 29-30)
    }
  }
}
`)
  });

  it("Links (example 513)", () => {
    ist(parse("[![moon](moon.jpg)](/uri)\n"), r`Document {
  Paragraph {
    Link {
      LinkMark("[", 0-1)
      Image {
        LinkMark("![", 1-3)
        LinkMark("]", 7-8)
        LinkMark("(", 8-9)
        URL("moon.jpg")
        LinkMark(")", 17-18)
      }
      LinkMark("]", 18-19)
      LinkMark("(", 19-20)
      URL("/uri")
      LinkMark(")", 24-25)
    }
  }
}
`)
  });

  it("Links (example 514)", () => {
    ist(parse("[foo [bar](/uri)](/uri)\n"), r`Document {
  Paragraph {
    Link {
      LinkMark("[", 5-6)
      LinkMark("]", 9-10)
      LinkMark("(", 10-11)
      URL("/uri")
      LinkMark(")", 15-16)
    }
  }
}
`)
  });

  it("Links (example 515)", () => {
    ist(parse("[foo *[bar [baz](/uri)](/uri)*](/uri)\n"), r`Document {
  Paragraph {
    Emphasis {
      EmphasisMark("*", 5-6)
      Link {
        LinkMark("[", 11-12)
        LinkMark("]", 15-16)
        LinkMark("(", 16-17)
        URL("/uri")
        LinkMark(")", 21-22)
      }
      EmphasisMark("*", 29-30)
    }
  }
}
`)
  });

  it("Links (example 516)", () => {
    ist(parse("![[[foo](uri1)](uri2)](uri3)\n"), r`Document {
  Paragraph {
    Image {
      LinkMark("![", 0-2)
      Link {
        LinkMark("[", 3-4)
        LinkMark("]", 7-8)
        LinkMark("(", 8-9)
        URL("uri1")
        LinkMark(")", 13-14)
      }
      LinkMark("]", 21-22)
      LinkMark("(", 22-23)
      URL("uri3")
      LinkMark(")", 27-28)
    }
  }
}
`)
  });

  it("Links (example 517)", () => {
    ist(parse("*[foo*](/uri)\n"), r`Document {
  Paragraph {
    Link {
      LinkMark("[", 1-2)
      LinkMark("]", 6-7)
      LinkMark("(", 7-8)
      URL("/uri")
      LinkMark(")", 12-13)
    }
  }
}
`)
  });

  it("Links (example 518)", () => {
    ist(parse("[foo *bar](baz*)\n"), r`Document {
  Paragraph {
    Link {
      LinkMark("[", 0-1)
      LinkMark("]", 9-10)
      LinkMark("(", 10-11)
      URL("baz*")
      LinkMark(")", 15-16)
    }
  }
}
`)
  });

  it("Links (example 519)", () => {
    ist(parse("*foo [bar* baz]\n"), r`Document {
  Paragraph {
    Link {
      LinkMark("[", 5-6)
      LinkMark("]", 14-15)
    }
  }
}
`)
  });

  it("Links (example 520)", () => {
    ist(parse("[foo <bar attr=\"](baz)\">\n"), r`Document {
  Paragraph {
    HTMLTag("<bar attr=\"](baz)\">")
  }
}
`)
  });

  it("Links (example 521)", () => {
    ist(parse("[foo`](/uri)`\n"), r`Document {
  Paragraph {
    InlineCode {
      CodeMark("‘", 4-5)
      CodeMark("‘", 12-13)
    }
  }
}
`)
  });

  it("Links (example 522)", () => {
    ist(parse("[foo<http://example.com/?search=](uri)>\n"), r`Document {
  Paragraph {
    Autolink {
      LinkMark("<", 4-5)
      URL("http://example.com/?search=](uri)")
      LinkMark(">", 38-39)
    }
  }
}
`)
  });

  it("Links (example 523)", () => {
    ist(parse("[foo][bar]\n\n[bar]: /url \"title\"\n"), r`Document {
  Paragraph {
    Link {
      LinkMark("[", 0-1)
      LinkMark("]", 4-5)
      LinkLabel("[bar]")
    }
  }
  LinkReference {
    LinkLabel("[bar]")
    LinkMark(":", 17-18)
    URL("/url")
    LinkTitle("\"title\"")
  }
}
`)
  });

  it("Links (example 524)", () => {
    ist(parse("[link [foo [bar]]][ref]\n\n[ref]: /uri\n"), r`Document {
  Paragraph {
    Link {
      LinkMark("[", 11-12)
      LinkMark("]", 15-16)
    }
    Link {
      LinkMark("[", 18-19)
      LinkMark("]", 22-23)
    }
  }
  LinkReference {
    LinkLabel("[ref]")
    LinkMark(":", 30-31)
    URL("/uri")
  }
}
`)
  });

  it("Links (example 525)", () => {
    ist(parse("[link \\[bar][ref]\n\n[ref]: /uri\n"), r`Document {
  Paragraph {
    Link {
      LinkMark("[", 0-1)
      Escape("\\[")
      LinkMark("]", 11-12)
      LinkLabel("[ref]")
    }
  }
  LinkReference {
    LinkLabel("[ref]")
    LinkMark(":", 24-25)
    URL("/uri")
  }
}
`)
  });

  it("Links (example 526)", () => {
    ist(parse("[link *foo **bar** `#`*][ref]\n\n[ref]: /uri\n"), r`Document {
  Paragraph {
    Link {
      LinkMark("[", 0-1)
      Emphasis {
        EmphasisMark("*", 6-7)
        StrongEmphasis {
          EmphasisMark("**", 11-13)
          EmphasisMark("**", 16-18)
        }
        InlineCode {
          CodeMark("‘", 19-20)
          CodeMark("‘", 21-22)
        }
        EmphasisMark("*", 22-23)
      }
      LinkMark("]", 23-24)
      LinkLabel("[ref]")
    }
  }
  LinkReference {
    LinkLabel("[ref]")
    LinkMark(":", 36-37)
    URL("/uri")
  }
}
`)
  });

  it("Links (example 527)", () => {
    ist(parse("[![moon](moon.jpg)][ref]\n\n[ref]: /uri\n"), r`Document {
  Paragraph {
    Link {
      LinkMark("[", 0-1)
      Image {
        LinkMark("![", 1-3)
        LinkMark("]", 7-8)
        LinkMark("(", 8-9)
        URL("moon.jpg")
        LinkMark(")", 17-18)
      }
      LinkMark("]", 18-19)
      LinkLabel("[ref]")
    }
  }
  LinkReference {
    LinkLabel("[ref]")
    LinkMark(":", 31-32)
    URL("/uri")
  }
}
`)
  });

  it("Links (example 528)", () => {
    ist(parse("[foo [bar](/uri)][ref]\n\n[ref]: /uri\n"), r`Document {
  Paragraph {
    Link {
      LinkMark("[", 5-6)
      LinkMark("]", 9-10)
      LinkMark("(", 10-11)
      URL("/uri")
      LinkMark(")", 15-16)
    }
    Link {
      LinkMark("[", 17-18)
      LinkMark("]", 21-22)
    }
  }
  LinkReference {
    LinkLabel("[ref]")
    LinkMark(":", 29-30)
    URL("/uri")
  }
}
`)
  });

  it("Links (example 529)", () => {
    ist(parse("[foo *bar [baz][ref]*][ref]\n\n[ref]: /uri\n"), r`Document {
  Paragraph {
    Emphasis {
      EmphasisMark("*", 5-6)
      Link {
        LinkMark("[", 10-11)
        LinkMark("]", 14-15)
        LinkLabel("[ref]")
      }
      EmphasisMark("*", 20-21)
    }
    Link {
      LinkMark("[", 22-23)
      LinkMark("]", 26-27)
    }
  }
  LinkReference {
    LinkLabel("[ref]")
    LinkMark(":", 34-35)
    URL("/uri")
  }
}
`)
  });

  it("Links (example 530)", () => {
    ist(parse("*[foo*][ref]\n\n[ref]: /uri\n"), r`Document {
  Paragraph {
    Link {
      LinkMark("[", 1-2)
      LinkMark("]", 6-7)
      LinkLabel("[ref]")
    }
  }
  LinkReference {
    LinkLabel("[ref]")
    LinkMark(":", 19-20)
    URL("/uri")
  }
}
`)
  });

  it("Links (example 531)", () => {
    ist(parse("[foo *bar][ref]\n\n[ref]: /uri\n"), r`Document {
  Paragraph {
    Link {
      LinkMark("[", 0-1)
      LinkMark("]", 9-10)
      LinkLabel("[ref]")
    }
  }
  LinkReference {
    LinkLabel("[ref]")
    LinkMark(":", 22-23)
    URL("/uri")
  }
}
`)
  });

  it("Links (example 532)", () => {
    ist(parse("[foo <bar attr=\"][ref]\">\n\n[ref]: /uri\n"), r`Document {
  Paragraph {
    HTMLTag("<bar attr=\"][ref]\">")
  }
  LinkReference {
    LinkLabel("[ref]")
    LinkMark(":", 31-32)
    URL("/uri")
  }
}
`)
  });

  it("Links (example 533)", () => {
    ist(parse("[foo`][ref]`\n\n[ref]: /uri\n"), r`Document {
  Paragraph {
    InlineCode {
      CodeMark("‘", 4-5)
      CodeMark("‘", 11-12)
    }
  }
  LinkReference {
    LinkLabel("[ref]")
    LinkMark(":", 19-20)
    URL("/uri")
  }
}
`)
  });

  it("Links (example 534)", () => {
    ist(parse("[foo<http://example.com/?search=][ref]>\n\n[ref]: /uri\n"), r`Document {
  Paragraph {
    Autolink {
      LinkMark("<", 4-5)
      URL("http://example.com/?search=][ref]")
      LinkMark(">", 38-39)
    }
  }
  LinkReference {
    LinkLabel("[ref]")
    LinkMark(":", 46-47)
    URL("/uri")
  }
}
`)
  });

  it("Links (example 535)", () => {
    ist(parse("[foo][BaR]\n\n[bar]: /url \"title\"\n"), r`Document {
  Paragraph {
    Link {
      LinkMark("[", 0-1)
      LinkMark("]", 4-5)
      LinkLabel("[BaR]")
    }
  }
  LinkReference {
    LinkLabel("[bar]")
    LinkMark(":", 17-18)
    URL("/url")
    LinkTitle("\"title\"")
  }
}
`)
  });

  it("Links (example 536)", () => {
    ist(parse("[Толпой][Толпой] is a Russian word.\n\n[ТОЛПОЙ]: /url\n"), r`Document {
  Paragraph {
    Link {
      LinkMark("[", 0-1)
      LinkMark("]", 7-8)
      LinkLabel("[Толпой]")
    }
  }
  LinkReference {
    LinkLabel("[ТОЛПОЙ]")
    LinkMark(":", 45-46)
    URL("/url")
  }
}
`)
  });

  it("Links (example 537)", () => {
    ist(parse("[Foo\n  bar]: /url\n\n[Baz][Foo bar]\n"), r`Document {
  LinkReference {
    LinkLabel("[Foo\n  bar]")
    LinkMark(":", 11-12)
    URL("/url")
  }
  Paragraph {
    Link {
      LinkMark("[", 19-20)
      LinkMark("]", 23-24)
      LinkLabel("[Foo bar]")
    }
  }
}
`)
  });

  it("Links (example 538)", () => {
    ist(parse("[foo] [bar]\n\n[bar]: /url \"title\"\n"), r`Document {
  Paragraph {
    Link {
      LinkMark("[", 0-1)
      LinkMark("]", 4-5)
    }
    Link {
      LinkMark("[", 6-7)
      LinkMark("]", 10-11)
    }
  }
  LinkReference {
    LinkLabel("[bar]")
    LinkMark(":", 18-19)
    URL("/url")
    LinkTitle("\"title\"")
  }
}
`)
  });

  it("Links (example 539)", () => {
    ist(parse("[foo]\n[bar]\n\n[bar]: /url \"title\"\n"), r`Document {
  Paragraph {
    Link {
      LinkMark("[", 0-1)
      LinkMark("]", 4-5)
    }
    Link {
      LinkMark("[", 6-7)
      LinkMark("]", 10-11)
    }
  }
  LinkReference {
    LinkLabel("[bar]")
    LinkMark(":", 18-19)
    URL("/url")
    LinkTitle("\"title\"")
  }
}
`)
  });

  it("Links (example 540)", () => {
    ist(parse("[foo]: /url1\n\n[foo]: /url2\n\n[bar][foo]\n"), r`Document {
  LinkReference {
    LinkLabel("[foo]")
    LinkMark(":", 5-6)
    URL("/url1")
  }
  LinkReference {
    LinkLabel("[foo]")
    LinkMark(":", 19-20)
    URL("/url2")
  }
  Paragraph {
    Link {
      LinkMark("[", 28-29)
      LinkMark("]", 32-33)
      LinkLabel("[foo]")
    }
  }
}
`)
  });

  it("Links (example 541)", () => {
    ist(parse("[bar][foo\\!]\n\n[foo!]: /url\n"), r`Document {
  Paragraph {
    Link {
      LinkMark("[", 0-1)
      LinkMark("]", 4-5)
      LinkLabel("[foo\\!]")
    }
  }
  LinkReference {
    LinkLabel("[foo!]")
    LinkMark(":", 20-21)
    URL("/url")
  }
}
`)
  });

  it("Links (example 542)", () => {
    ist(parse("[foo][ref[]\n\n[ref[]: /uri\n"), r`Document {
  Paragraph {
    Link {
      LinkMark("[", 0-1)
      LinkMark("]", 4-5)
    }
  }
  Paragraph("[ref[]: /uri")
}
`)
  });

  it("Links (example 543)", () => {
    ist(parse("[foo][ref[bar]]\n\n[ref[bar]]: /uri\n"), r`Document {
  Paragraph {
    Link {
      LinkMark("[", 0-1)
      LinkMark("]", 4-5)
    }
    Link {
      LinkMark("[", 9-10)
      LinkMark("]", 13-14)
    }
  }
  Paragraph {
    Link {
      LinkMark("[", 21-22)
      LinkMark("]", 25-26)
    }
  }
}
`)
  });

  it("Links (example 544)", () => {
    ist(parse("[[[foo]]]\n\n[[[foo]]]: /url\n"), r`Document {
  Paragraph {
    Link {
      LinkMark("[", 2-3)
      LinkMark("]", 6-7)
    }
  }
  Paragraph {
    Link {
      LinkMark("[", 13-14)
      LinkMark("]", 17-18)
    }
  }
}
`)
  });

  it("Links (example 545)", () => {
    ist(parse("[foo][ref\\[]\n\n[ref\\[]: /uri\n"), r`Document {
  Paragraph {
    Link {
      LinkMark("[", 0-1)
      LinkMark("]", 4-5)
      LinkLabel("[ref\\[]")
    }
  }
  LinkReference {
    LinkLabel("[ref\\[]")
    LinkMark(":", 21-22)
    URL("/uri")
  }
}
`)
  });

  it("Links (example 546)", () => {
    ist(parse("[bar\\\\]: /uri\n\n[bar\\\\]\n"), r`Document {
  LinkReference {
    LinkLabel("[bar\\\\]")
    LinkMark(":", 7-8)
    URL("/uri")
  }
  Paragraph {
    Link {
      LinkMark("[", 15-16)
      Escape("\\\\")
      LinkMark("]", 21-22)
    }
  }
}
`)
  });

  it("Links (example 547)", () => {
    ist(parse("[]\n\n[]: /uri\n"), r`Document {
  Paragraph("[]")
  Paragraph("[]: /uri")
}
`)
  });

  it("Links (example 548)", () => {
    ist(parse("[\n ]\n\n[\n ]: /uri\n"), r`Document {
  Paragraph("[\n ]")
  Paragraph("[\n ]: /uri")
}
`)
  });

  it("Links (example 549)", () => {
    ist(parse("[foo][]\n\n[foo]: /url \"title\"\n"), r`Document {
  Paragraph {
    Link {
      LinkMark("[", 0-1)
      LinkMark("]", 4-5)
      LinkLabel("[]")
    }
  }
  LinkReference {
    LinkLabel("[foo]")
    LinkMark(":", 14-15)
    URL("/url")
    LinkTitle("\"title\"")
  }
}
`)
  });

  it("Links (example 550)", () => {
    ist(parse("[*foo* bar][]\n\n[*foo* bar]: /url \"title\"\n"), r`Document {
  Paragraph {
    Link {
      LinkMark("[", 0-1)
      Emphasis {
        EmphasisMark("*", 1-2)
        EmphasisMark("*", 5-6)
      }
      LinkMark("]", 10-11)
      LinkLabel("[]")
    }
  }
  LinkReference {
    LinkLabel("[*foo* bar]")
    LinkMark(":", 26-27)
    URL("/url")
    LinkTitle("\"title\"")
  }
}
`)
  });

  it("Links (example 551)", () => {
    ist(parse("[Foo][]\n\n[foo]: /url \"title\"\n"), r`Document {
  Paragraph {
    Link {
      LinkMark("[", 0-1)
      LinkMark("]", 4-5)
      LinkLabel("[]")
    }
  }
  LinkReference {
    LinkLabel("[foo]")
    LinkMark(":", 14-15)
    URL("/url")
    LinkTitle("\"title\"")
  }
}
`)
  });

  it("Links (example 552)", () => {
    ist(parse("[foo] \n[]\n\n[foo]: /url \"title\"\n"), r`Document {
  Paragraph {
    Link {
      LinkMark("[", 0-1)
      LinkMark("]", 4-5)
    }
  }
  LinkReference {
    LinkLabel("[foo]")
    LinkMark(":", 16-17)
    URL("/url")
    LinkTitle("\"title\"")
  }
}
`)
  });

  it("Links (example 553)", () => {
    ist(parse("[foo]\n\n[foo]: /url \"title\"\n"), r`Document {
  Paragraph {
    Link {
      LinkMark("[", 0-1)
      LinkMark("]", 4-5)
    }
  }
  LinkReference {
    LinkLabel("[foo]")
    LinkMark(":", 12-13)
    URL("/url")
    LinkTitle("\"title\"")
  }
}
`)
  });

  it("Links (example 554)", () => {
    ist(parse("[*foo* bar]\n\n[*foo* bar]: /url \"title\"\n"), r`Document {
  Paragraph {
    Link {
      LinkMark("[", 0-1)
      Emphasis {
        EmphasisMark("*", 1-2)
        EmphasisMark("*", 5-6)
      }
      LinkMark("]", 10-11)
    }
  }
  LinkReference {
    LinkLabel("[*foo* bar]")
    LinkMark(":", 24-25)
    URL("/url")
    LinkTitle("\"title\"")
  }
}
`)
  });

  it("Links (example 555)", () => {
    ist(parse("[[*foo* bar]]\n\n[*foo* bar]: /url \"title\"\n"), r`Document {
  Paragraph {
    Link {
      LinkMark("[", 1-2)
      Emphasis {
        EmphasisMark("*", 2-3)
        EmphasisMark("*", 6-7)
      }
      LinkMark("]", 11-12)
    }
  }
  LinkReference {
    LinkLabel("[*foo* bar]")
    LinkMark(":", 26-27)
    URL("/url")
    LinkTitle("\"title\"")
  }
}
`)
  });

  it("Links (example 556)", () => {
    ist(parse("[[bar [foo]\n\n[foo]: /url\n"), r`Document {
  Paragraph {
    Link {
      LinkMark("[", 6-7)
      LinkMark("]", 10-11)
    }
  }
  LinkReference {
    LinkLabel("[foo]")
    LinkMark(":", 18-19)
    URL("/url")
  }
}
`)
  });

  it("Links (example 557)", () => {
    ist(parse("[Foo]\n\n[foo]: /url \"title\"\n"), r`Document {
  Paragraph {
    Link {
      LinkMark("[", 0-1)
      LinkMark("]", 4-5)
    }
  }
  LinkReference {
    LinkLabel("[foo]")
    LinkMark(":", 12-13)
    URL("/url")
    LinkTitle("\"title\"")
  }
}
`)
  });

  it("Links (example 558)", () => {
    ist(parse("[foo] bar\n\n[foo]: /url\n"), r`Document {
  Paragraph {
    Link {
      LinkMark("[", 0-1)
      LinkMark("]", 4-5)
    }
  }
  LinkReference {
    LinkLabel("[foo]")
    LinkMark(":", 16-17)
    URL("/url")
  }
}
`)
  });

  it("Links (example 559)", () => {
    ist(parse("\\[foo]\n\n[foo]: /url \"title\"\n"), r`Document {
  Paragraph {
    Escape("\\[")
  }
  LinkReference {
    LinkLabel("[foo]")
    LinkMark(":", 13-14)
    URL("/url")
    LinkTitle("\"title\"")
  }
}
`)
  });

  it("Links (example 560)", () => {
    ist(parse("[foo*]: /url\n\n*[foo*]\n"), r`Document {
  LinkReference {
    LinkLabel("[foo*]")
    LinkMark(":", 6-7)
    URL("/url")
  }
  Paragraph {
    Link {
      LinkMark("[", 15-16)
      LinkMark("]", 20-21)
    }
  }
}
`)
  });

  it("Links (example 561)", () => {
    ist(parse("[foo][bar]\n\n[foo]: /url1\n[bar]: /url2\n"), r`Document {
  Paragraph {
    Link {
      LinkMark("[", 0-1)
      LinkMark("]", 4-5)
      LinkLabel("[bar]")
    }
  }
  LinkReference {
    LinkLabel("[foo]")
    LinkMark(":", 17-18)
    URL("/url1")
  }
  LinkReference {
    LinkLabel("[bar]")
    LinkMark(":", 30-31)
    URL("/url2")
  }
}
`)
  });

  it("Links (example 562)", () => {
    ist(parse("[foo][]\n\n[foo]: /url1\n"), r`Document {
  Paragraph {
    Link {
      LinkMark("[", 0-1)
      LinkMark("]", 4-5)
      LinkLabel("[]")
    }
  }
  LinkReference {
    LinkLabel("[foo]")
    LinkMark(":", 14-15)
    URL("/url1")
  }
}
`)
  });

  it("Links (example 563)", () => {
    ist(parse("[foo]()\n\n[foo]: /url1\n"), r`Document {
  Paragraph {
    Link {
      LinkMark("[", 0-1)
      LinkMark("]", 4-5)
      LinkMark("(", 5-6)
      LinkMark(")", 6-7)
    }
  }
  LinkReference {
    LinkLabel("[foo]")
    LinkMark(":", 14-15)
    URL("/url1")
  }
}
`)
  });

  it("Links (example 564)", () => {
    ist(parse("[foo](not a link)\n\n[foo]: /url1\n"), r`Document {
  Paragraph {
    Link {
      LinkMark("[", 0-1)
      LinkMark("]", 4-5)
    }
  }
  LinkReference {
    LinkLabel("[foo]")
    LinkMark(":", 24-25)
    URL("/url1")
  }
}
`)
  });

  it("Links (example 565)", () => {
    ist(parse("[foo][bar][baz]\n\n[baz]: /url\n"), r`Document {
  Paragraph {
    Link {
      LinkMark("[", 0-1)
      LinkMark("]", 4-5)
      LinkLabel("[bar]")
    }
    Link {
      LinkMark("[", 10-11)
      LinkMark("]", 14-15)
    }
  }
  LinkReference {
    LinkLabel("[baz]")
    LinkMark(":", 22-23)
    URL("/url")
  }
}
`)
  });

  it("Links (example 566)", () => {
    ist(parse("[foo][bar][baz]\n\n[baz]: /url1\n[bar]: /url2\n"), r`Document {
  Paragraph {
    Link {
      LinkMark("[", 0-1)
      LinkMark("]", 4-5)
      LinkLabel("[bar]")
    }
    Link {
      LinkMark("[", 10-11)
      LinkMark("]", 14-15)
    }
  }
  LinkReference {
    LinkLabel("[baz]")
    LinkMark(":", 22-23)
    URL("/url1")
  }
  LinkReference {
    LinkLabel("[bar]")
    LinkMark(":", 35-36)
    URL("/url2")
  }
}
`)
  });

  it("Links (example 567)", () => {
    ist(parse("[foo][bar][baz]\n\n[baz]: /url1\n[foo]: /url2\n"), r`Document {
  Paragraph {
    Link {
      LinkMark("[", 0-1)
      LinkMark("]", 4-5)
      LinkLabel("[bar]")
    }
    Link {
      LinkMark("[", 10-11)
      LinkMark("]", 14-15)
    }
  }
  LinkReference {
    LinkLabel("[baz]")
    LinkMark(":", 22-23)
    URL("/url1")
  }
  LinkReference {
    LinkLabel("[foo]")
    LinkMark(":", 35-36)
    URL("/url2")
  }
}
`)
  });

  it("Images (example 568)", () => {
    ist(parse("![foo](/url \"title\")\n"), r`Document {
  Paragraph {
    Image {
      LinkMark("![", 0-2)
      LinkMark("]", 5-6)
      LinkMark("(", 6-7)
      URL("/url")
      LinkTitle("\"title\"")
      LinkMark(")", 19-20)
    }
  }
}
`)
  });

  it("Images (example 569)", () => {
    ist(parse("![foo *bar*]\n\n[foo *bar*]: train.jpg \"train & tracks\"\n"), r`Document {
  Paragraph {
    Image {
      LinkMark("![", 0-2)
      Emphasis {
        EmphasisMark("*", 6-7)
        EmphasisMark("*", 10-11)
      }
      LinkMark("]", 11-12)
    }
  }
  LinkReference {
    LinkLabel("[foo *bar*]")
    LinkMark(":", 25-26)
    URL("train.jpg")
    LinkTitle("\"train & tracks\"")
  }
}
`)
  });

  it("Images (example 570)", () => {
    ist(parse("![foo ![bar](/url)](/url2)\n"), r`Document {
  Paragraph {
    Image {
      LinkMark("![", 0-2)
      Image {
        LinkMark("![", 6-8)
        LinkMark("]", 11-12)
        LinkMark("(", 12-13)
        URL("/url")
        LinkMark(")", 17-18)
      }
      LinkMark("]", 18-19)
      LinkMark("(", 19-20)
      URL("/url2")
      LinkMark(")", 25-26)
    }
  }
}
`)
  });

  it("Images (example 571)", () => {
    ist(parse("![foo [bar](/url)](/url2)\n"), r`Document {
  Paragraph {
    Image {
      LinkMark("![", 0-2)
      Link {
        LinkMark("[", 6-7)
        LinkMark("]", 10-11)
        LinkMark("(", 11-12)
        URL("/url")
        LinkMark(")", 16-17)
      }
      LinkMark("]", 17-18)
      LinkMark("(", 18-19)
      URL("/url2")
      LinkMark(")", 24-25)
    }
  }
}
`)
  });

  it("Images (example 572)", () => {
    ist(parse("![foo *bar*][]\n\n[foo *bar*]: train.jpg \"train & tracks\"\n"), r`Document {
  Paragraph {
    Image {
      LinkMark("![", 0-2)
      Emphasis {
        EmphasisMark("*", 6-7)
        EmphasisMark("*", 10-11)
      }
      LinkMark("]", 11-12)
      LinkLabel("[]")
    }
  }
  LinkReference {
    LinkLabel("[foo *bar*]")
    LinkMark(":", 27-28)
    URL("train.jpg")
    LinkTitle("\"train & tracks\"")
  }
}
`)
  });

  it("Images (example 573)", () => {
    ist(parse("![foo *bar*][foobar]\n\n[FOOBAR]: train.jpg \"train & tracks\"\n"), r`Document {
  Paragraph {
    Image {
      LinkMark("![", 0-2)
      Emphasis {
        EmphasisMark("*", 6-7)
        EmphasisMark("*", 10-11)
      }
      LinkMark("]", 11-12)
      LinkLabel("[foobar]")
    }
  }
  LinkReference {
    LinkLabel("[FOOBAR]")
    LinkMark(":", 30-31)
    URL("train.jpg")
    LinkTitle("\"train & tracks\"")
  }
}
`)
  });

  it("Images (example 574)", () => {
    ist(parse("![foo](train.jpg)\n"), r`Document {
  Paragraph {
    Image {
      LinkMark("![", 0-2)
      LinkMark("]", 5-6)
      LinkMark("(", 6-7)
      URL("train.jpg")
      LinkMark(")", 16-17)
    }
  }
}
`)
  });

  it("Images (example 575)", () => {
    ist(parse("My ![foo bar](/path/to/train.jpg  \"title\"   )\n"), r`Document {
  Paragraph {
    Image {
      LinkMark("![", 3-5)
      LinkMark("]", 12-13)
      LinkMark("(", 13-14)
      URL("/path/to/train.jpg")
      LinkTitle("\"title\"")
      LinkMark(")", 44-45)
    }
  }
}
`)
  });

  it("Images (example 576)", () => {
    ist(parse("![foo](<url>)\n"), r`Document {
  Paragraph {
    Image {
      LinkMark("![", 0-2)
      LinkMark("]", 5-6)
      LinkMark("(", 6-7)
      URL("<url>")
      LinkMark(")", 12-13)
    }
  }
}
`)
  });

  it("Images (example 577)", () => {
    ist(parse("![](/url)\n"), r`Document {
  Paragraph {
    Image {
      LinkMark("![", 0-2)
      LinkMark("]", 2-3)
      LinkMark("(", 3-4)
      URL("/url")
      LinkMark(")", 8-9)
    }
  }
}
`)
  });

  it("Images (example 578)", () => {
    ist(parse("![foo][bar]\n\n[bar]: /url\n"), r`Document {
  Paragraph {
    Image {
      LinkMark("![", 0-2)
      LinkMark("]", 5-6)
      LinkLabel("[bar]")
    }
  }
  LinkReference {
    LinkLabel("[bar]")
    LinkMark(":", 18-19)
    URL("/url")
  }
}
`)
  });

  it("Images (example 579)", () => {
    ist(parse("![foo][bar]\n\n[BAR]: /url\n"), r`Document {
  Paragraph {
    Image {
      LinkMark("![", 0-2)
      LinkMark("]", 5-6)
      LinkLabel("[bar]")
    }
  }
  LinkReference {
    LinkLabel("[BAR]")
    LinkMark(":", 18-19)
    URL("/url")
  }
}
`)
  });

  it("Images (example 580)", () => {
    ist(parse("![foo][]\n\n[foo]: /url \"title\"\n"), r`Document {
  Paragraph {
    Image {
      LinkMark("![", 0-2)
      LinkMark("]", 5-6)
      LinkLabel("[]")
    }
  }
  LinkReference {
    LinkLabel("[foo]")
    LinkMark(":", 15-16)
    URL("/url")
    LinkTitle("\"title\"")
  }
}
`)
  });

  it("Images (example 581)", () => {
    ist(parse("![*foo* bar][]\n\n[*foo* bar]: /url \"title\"\n"), r`Document {
  Paragraph {
    Image {
      LinkMark("![", 0-2)
      Emphasis {
        EmphasisMark("*", 2-3)
        EmphasisMark("*", 6-7)
      }
      LinkMark("]", 11-12)
      LinkLabel("[]")
    }
  }
  LinkReference {
    LinkLabel("[*foo* bar]")
    LinkMark(":", 27-28)
    URL("/url")
    LinkTitle("\"title\"")
  }
}
`)
  });

  it("Images (example 582)", () => {
    ist(parse("![Foo][]\n\n[foo]: /url \"title\"\n"), r`Document {
  Paragraph {
    Image {
      LinkMark("![", 0-2)
      LinkMark("]", 5-6)
      LinkLabel("[]")
    }
  }
  LinkReference {
    LinkLabel("[foo]")
    LinkMark(":", 15-16)
    URL("/url")
    LinkTitle("\"title\"")
  }
}
`)
  });

  it("Images (example 583)", () => {
    ist(parse("![foo] \n[]\n\n[foo]: /url \"title\"\n"), r`Document {
  Paragraph {
    Image {
      LinkMark("![", 0-2)
      LinkMark("]", 5-6)
    }
  }
  LinkReference {
    LinkLabel("[foo]")
    LinkMark(":", 17-18)
    URL("/url")
    LinkTitle("\"title\"")
  }
}
`)
  });

  it("Images (example 584)", () => {
    ist(parse("![foo]\n\n[foo]: /url \"title\"\n"), r`Document {
  Paragraph {
    Image {
      LinkMark("![", 0-2)
      LinkMark("]", 5-6)
    }
  }
  LinkReference {
    LinkLabel("[foo]")
    LinkMark(":", 13-14)
    URL("/url")
    LinkTitle("\"title\"")
  }
}
`)
  });

  it("Images (example 585)", () => {
    ist(parse("![*foo* bar]\n\n[*foo* bar]: /url \"title\"\n"), r`Document {
  Paragraph {
    Image {
      LinkMark("![", 0-2)
      Emphasis {
        EmphasisMark("*", 2-3)
        EmphasisMark("*", 6-7)
      }
      LinkMark("]", 11-12)
    }
  }
  LinkReference {
    LinkLabel("[*foo* bar]")
    LinkMark(":", 25-26)
    URL("/url")
    LinkTitle("\"title\"")
  }
}
`)
  });

  it("Images (example 586)", () => {
    ist(parse("![[foo]]\n\n[[foo]]: /url \"title\"\n"), r`Document {
  Paragraph {
    Image {
      LinkMark("![", 0-2)
      Link {
        LinkMark("[", 2-3)
        LinkMark("]", 6-7)
      }
      LinkMark("]", 7-8)
    }
  }
  Paragraph {
    Link {
      LinkMark("[", 11-12)
      LinkMark("]", 15-16)
    }
  }
}
`)
  });

  it("Images (example 587)", () => {
    ist(parse("![Foo]\n\n[foo]: /url \"title\"\n"), r`Document {
  Paragraph {
    Image {
      LinkMark("![", 0-2)
      LinkMark("]", 5-6)
    }
  }
  LinkReference {
    LinkLabel("[foo]")
    LinkMark(":", 13-14)
    URL("/url")
    LinkTitle("\"title\"")
  }
}
`)
  });

  it("Images (example 588)", () => {
    ist(parse("!\\[foo]\n\n[foo]: /url \"title\"\n"), r`Document {
  Paragraph {
    Escape("\\[")
  }
  LinkReference {
    LinkLabel("[foo]")
    LinkMark(":", 14-15)
    URL("/url")
    LinkTitle("\"title\"")
  }
}
`)
  });

  it("Images (example 589)", () => {
    ist(parse("\\![foo]\n\n[foo]: /url \"title\"\n"), r`Document {
  Paragraph {
    Escape("\\!")
    Link {
      LinkMark("[", 2-3)
      LinkMark("]", 6-7)
    }
  }
  LinkReference {
    LinkLabel("[foo]")
    LinkMark(":", 14-15)
    URL("/url")
    LinkTitle("\"title\"")
  }
}
`)
  });

  it("Autolinks (example 590)", () => {
    ist(parse("<http://foo.bar.baz>\n"), r`Document {
  Paragraph {
    Autolink {
      LinkMark("<", 0-1)
      URL("http://foo.bar.baz")
      LinkMark(">", 19-20)
    }
  }
}
`)
  });

  it("Autolinks (example 591)", () => {
    ist(parse("<http://foo.bar.baz/test?q=hello&id=22&boolean>\n"), r`Document {
  Paragraph {
    Autolink {
      LinkMark("<", 0-1)
      URL("http://foo.bar.baz/test?q=hello&id=22&boolean")
      LinkMark(">", 46-47)
    }
  }
}
`)
  });

  it("Autolinks (example 592)", () => {
    ist(parse("<irc://foo.bar:2233/baz>\n"), r`Document {
  Paragraph {
    Autolink {
      LinkMark("<", 0-1)
      URL("irc://foo.bar:2233/baz")
      LinkMark(">", 23-24)
    }
  }
}
`)
  });

  it("Autolinks (example 593)", () => {
    ist(parse("<MAILTO:FOO@BAR.BAZ>\n"), r`Document {
  Paragraph {
    Autolink {
      LinkMark("<", 0-1)
      URL("MAILTO:FOO@BAR.BAZ")
      LinkMark(">", 19-20)
    }
  }
}
`)
  });

  it("Autolinks (example 594)", () => {
    ist(parse("<a+b+c:d>\n"), r`Document {
  Paragraph {
    Autolink {
      LinkMark("<", 0-1)
      URL("a+b+c:d")
      LinkMark(">", 8-9)
    }
  }
}
`)
  });

  it("Autolinks (example 595)", () => {
    ist(parse("<made-up-scheme://foo,bar>\n"), r`Document {
  Paragraph {
    Autolink {
      LinkMark("<", 0-1)
      URL("made-up-scheme://foo,bar")
      LinkMark(">", 25-26)
    }
  }
}
`)
  });

  it("Autolinks (example 596)", () => {
    ist(parse("<http://../>\n"), r`Document {
  Paragraph {
    Autolink {
      LinkMark("<", 0-1)
      URL("http://../")
      LinkMark(">", 11-12)
    }
  }
}
`)
  });

  it("Autolinks (example 597)", () => {
    ist(parse("<localhost:5001/foo>\n"), r`Document {
  Paragraph {
    Autolink {
      LinkMark("<", 0-1)
      URL("localhost:5001/foo")
      LinkMark(">", 19-20)
    }
  }
}
`)
  });

  it("Autolinks (example 598)", () => {
    ist(parse("<http://foo.bar/baz bim>\n"), r`Document {
  Paragraph("<http://foo.bar/baz bim>")
}
`)
  });

  it("Autolinks (example 599)", () => {
    ist(parse("<http://example.com/\\[\\>\n"), r`Document {
  Paragraph {
    Autolink {
      LinkMark("<", 0-1)
      URL("http://example.com/\\[\\")
      LinkMark(">", 23-24)
    }
  }
}
`)
  });

  it("Autolinks (example 600)", () => {
    ist(parse("<foo@bar.example.com>\n"), r`Document {
  Paragraph {
    Autolink {
      LinkMark("<", 0-1)
      URL("foo@bar.example.com")
      LinkMark(">", 20-21)
    }
  }
}
`)
  });

  it("Autolinks (example 601)", () => {
    ist(parse("<foo+special@Bar.baz-bar0.com>\n"), r`Document {
  Paragraph {
    Autolink {
      LinkMark("<", 0-1)
      URL("foo+special@Bar.baz-bar0.com")
      LinkMark(">", 29-30)
    }
  }
}
`)
  });

  it("Autolinks (example 602)", () => {
    ist(parse("<foo\\+@bar.example.com>\n"), r`Document {
  Paragraph {
    Escape("\\+")
  }
}
`)
  });

  it("Autolinks (example 603)", () => {
    ist(parse("<>\n"), r`Document {
  Paragraph("<>")
}
`)
  });

  it("Autolinks (example 604)", () => {
    ist(parse("< http://foo.bar >\n"), r`Document {
  Paragraph("< http://foo.bar >")
}
`)
  });

  it("Autolinks (example 605)", () => {
    ist(parse("<m:abc>\n"), r`Document {
  Paragraph("<m:abc>")
}
`)
  });

  it("Autolinks (example 606)", () => {
    ist(parse("<foo.bar.baz>\n"), r`Document {
  Paragraph("<foo.bar.baz>")
}
`)
  });

  it("Autolinks (example 607)", () => {
    ist(parse("http://example.com\n"), r`Document {
  Paragraph("http://example.com")
}
`)
  });

  it("Autolinks (example 608)", () => {
    ist(parse("foo@bar.example.com\n"), r`Document {
  Paragraph("foo@bar.example.com")
}
`)
  });

  it("Raw HTML (example 609)", () => {
    ist(parse("<a><bab><c2c>\n"), r`Document {
  Paragraph {
    HTMLTag("<a>")
    HTMLTag("<bab>")
    HTMLTag("<c2c>")
  }
}
`)
  });

  it("Raw HTML (example 610)", () => {
    ist(parse("<a/><b2/>\n"), r`Document {
  Paragraph {
    HTMLTag("<a/>")
    HTMLTag("<b2/>")
  }
}
`)
  });

  it("Raw HTML (example 611)", () => {
    ist(parse("<a  /><b2\ndata=\"foo\" >\n"), r`Document {
  Paragraph {
    HTMLTag("<a  />")
    HTMLTag("<b2\ndata=\"foo\" >")
  }
}
`)
  });

  it("Raw HTML (example 612)", () => {
    ist(parse("<a foo=\"bar\" bam = 'baz <em>\"</em>'\n_boolean zoop:33=zoop:33 />\n"), r`Document {
  Paragraph {
    HTMLTag("<a foo=\"bar\" bam = 'baz <em>\"</em>'\n_boolean zoop:33=zoop:33 />")
  }
}
`)
  });

  it("Raw HTML (example 613)", () => {
    ist(parse("Foo <responsive-image src=\"foo.jpg\" />\n"), r`Document {
  Paragraph {
    HTMLTag("<responsive-image src=\"foo.jpg\" />")
  }
}
`)
  });

  it("Raw HTML (example 614)", () => {
    ist(parse("<33> <__>\n"), r`Document {
  Paragraph("<33> <__>")
}
`)
  });

  it("Raw HTML (example 615)", () => {
    ist(parse("<a h*#ref=\"hi\">\n"), r`Document {
  Paragraph("<a h*#ref=\"hi\">")
}
`)
  });

  it("Raw HTML (example 616)", () => {
    ist(parse("<a href=\"hi'> <a href=hi'>\n"), r`Document {
  Paragraph("<a href=\"hi'> <a href=hi'>")
}
`)
  });

  it("Raw HTML (example 617)", () => {
    ist(parse("< a><\nfoo><bar/ >\n<foo bar=baz\nbim!bop />\n"), r`Document {
  Paragraph {
    HTMLTag("< a>")
    HTMLTag("<\nfoo>")
    HTMLTag("<bar/ >")
  }
}
`)
  });

  it("Raw HTML (example 618)", () => {
    ist(parse("<a href='bar'title=title>\n"), r`Document {
  Paragraph("<a href='bar'title=title>")
}
`)
  });

  it("Raw HTML (example 619)", () => {
    ist(parse("</a></foo >\n"), r`Document {
  Paragraph {
    HTMLTag("</a>")
    HTMLTag("</foo >")
  }
}
`)
  });

  it("Raw HTML (example 620)", () => {
    ist(parse("</a href=\"foo\">\n"), r`Document {
  Paragraph("</a href=\"foo\">")
}
`)
  });

  it("Raw HTML (example 621)", () => {
    ist(parse("foo <!-- this is a\ncomment - with hyphen -->\n"), r`Document {
  Paragraph {
    Comment("<!-- this is a\ncomment - with hyphen -->")
  }
}
`)
  });

  it("Raw HTML (example 622)", () => {
    ist(parse("foo <!-- not a comment -- two hyphens -->\n"), r`Document {
  Paragraph("foo <!-- not a comment -- two hyphens -->")
}
`)
  });

  it("Raw HTML (example 623)", () => {
    ist(parse("foo <!--> foo -->\n\nfoo <!-- foo--->\n"), r`Document {
  Paragraph("foo <!--> foo -->")
  Paragraph("foo <!-- foo--->")
}
`)
  });

  it("Raw HTML (example 624)", () => {
    ist(parse("foo <?php echo $a; ?>\n"), r`Document {
  Paragraph {
    ProcessingInstruction("<?php echo $a; ?>")
  }
}
`)
  });

  it("Raw HTML (example 625)", () => {
    ist(parse("foo <!ELEMENT br EMPTY>\n"), r`Document {
  Paragraph {
    HTMLTag("<!ELEMENT br EMPTY>")
  }
}
`)
  });

  it("Raw HTML (example 626)", () => {
    ist(parse("foo <![CDATA[>&<]]>\n"), r`Document {
  Paragraph {
    HTMLTag("<![CDATA[>&<]]>")
  }
}
`)
  });

  it("Raw HTML (example 627)", () => {
    ist(parse("foo <a href=\"&ouml;\">\n"), r`Document {
  Paragraph {
    HTMLTag("<a href=\"&ouml;\">")
  }
}
`)
  });

  it("Raw HTML (example 628)", () => {
    ist(parse("foo <a href=\"\\*\">\n"), r`Document {
  Paragraph {
    HTMLTag("<a href=\"\\*\">")
  }
}
`)
  });

  it("Raw HTML (example 629)", () => {
    ist(parse("<a href=\"\\\"\">\n"), r`Document {
  Paragraph {
    Escape("\\\"")
  }
}
`)
  });

  it("Hard line breaks (example 630)", () => {
    ist(parse("foo  \nbaz\n"), r`Document {
  Paragraph {
    HardBreak("  \n")
  }
}
`)
  });

  it("Hard line breaks (example 631)", () => {
    ist(parse("foo\\\nbaz\n"), r`Document {
  Paragraph {
    HardBreak("\\\n")
  }
}
`)
  });

  it("Hard line breaks (example 632)", () => {
    ist(parse("foo       \nbaz\n"), r`Document {
  Paragraph {
    HardBreak("       \n")
  }
}
`)
  });

  it("Hard line breaks (example 633)", () => {
    ist(parse("foo  \n     bar\n"), r`Document {
  Paragraph {
    HardBreak("  \n")
  }
}
`)
  });

  it("Hard line breaks (example 634)", () => {
    ist(parse("foo\\\n     bar\n"), r`Document {
  Paragraph {
    HardBreak("\\\n")
  }
}
`)
  });

  it("Hard line breaks (example 635)", () => {
    ist(parse("*foo  \nbar*\n"), r`Document {
  Paragraph {
    Emphasis {
      EmphasisMark("*", 0-1)
      HardBreak("  \n")
      EmphasisMark("*", 10-11)
    }
  }
}
`)
  });

  it("Hard line breaks (example 636)", () => {
    ist(parse("*foo\\\nbar*\n"), r`Document {
  Paragraph {
    Emphasis {
      EmphasisMark("*", 0-1)
      HardBreak("\\\n")
      EmphasisMark("*", 9-10)
    }
  }
}
`)
  });

  it("Hard line breaks (example 637)", () => {
    ist(parse("`code \nspan`\n"), r`Document {
  Paragraph {
    InlineCode {
      CodeMark("‘", 0-1)
      CodeMark("‘", 11-12)
    }
  }
}
`)
  });

  it("Hard line breaks (example 638)", () => {
    ist(parse("`code\\\nspan`\n"), r`Document {
  Paragraph {
    InlineCode {
      CodeMark("‘", 0-1)
      CodeMark("‘", 11-12)
    }
  }
}
`)
  });

  it("Hard line breaks (example 639)", () => {
    ist(parse("<a href=\"foo  \nbar\">\n"), r`Document {
  Paragraph {
    HTMLTag("<a href=\"foo  \nbar\">")
  }
}
`)
  });

  it("Hard line breaks (example 640)", () => {
    ist(parse("<a href=\"foo\\\nbar\">\n"), r`Document {
  Paragraph {
    HTMLTag("<a href=\"foo\\\nbar\">")
  }
}
`)
  });

  it("Hard line breaks (example 641)", () => {
    ist(parse("foo\\\n"), r`Document {
  Paragraph("foo\\")
}
`)
  });

  it("Hard line breaks (example 642)", () => {
    ist(parse("foo  \n"), r`Document {
  Paragraph("foo  ")
}
`)
  });

  it("Hard line breaks (example 643)", () => {
    ist(parse("### foo\\\n"), r`Document {
  ATXHeading3 {
    HeaderMark("###", 0-3)
  }
}
`)
  });

  it("Hard line breaks (example 644)", () => {
    ist(parse("### foo  \n"), r`Document {
  ATXHeading3 {
    HeaderMark("###", 0-3)
  }
}
`)
  });

  it("Soft line breaks (example 645)", () => {
    ist(parse("foo\nbaz\n"), r`Document {
  Paragraph("foo\nbaz")
}
`)
  });

  it("Soft line breaks (example 646)", () => {
    ist(parse("foo \n baz\n"), r`Document {
  Paragraph("foo \n baz")
}
`)
  });

  it("Textual content (example 647)", () => {
    ist(parse("hello $.;'there\n"), r`Document {
  Paragraph("hello $.;'there")
}
`)
  });

  it("Textual content (example 648)", () => {
    ist(parse("Foo χρῆν\n"), r`Document {
  Paragraph("Foo χρῆν")
}
`)
  });

  it("Textual content (example 649)", () => {
    ist(parse("Multiple     spaces\n"), r`Document {
  Paragraph("Multiple     spaces")
}
`)
  });

})

describe("Custom Markdown tests", () => {
  // (Not ideal that the 3rd mark is inside the previous item, but
  // this'd require quite a big overhaul to fix.)
  it("Quote markers don't end up inside inner list items", () => {
    ist(parse(`
> - Hello
> - Two
>
> - Three`), `Document {
  Blockquote {
    QuoteMark(">", 1-2)
    BulletList {
      ListItem {
        ListMark("-", 3-4)
        Paragraph("Hello")
      }
      QuoteMark(">", 11-12)
      ListItem {
        ListMark("-", 13-14)
        Paragraph("Two")
        QuoteMark(">", 19-20)
      }
      QuoteMark(">", 21-22)
      ListItem {
        ListMark("-", 23-24)
        Paragraph("Three")
      }
    }
  }
}
`);
  });

  it("Nested bullet lists don't break ordered list parsing", () => {
    ist(parse(`1. A
     * A1
     * A2
  2. B`), `Document {
  OrderedList {
    ListItem {
      ListMark("1.", 0-2)
      Paragraph("A")
      BulletList {
        ListItem {
          ListMark("*", 10-11)
          Paragraph("A1")
        }
        ListItem {
          ListMark("*", 20-21)
          Paragraph("A2")
        }
      }
    }
    ListItem {
      ListMark("2.", 27-29)
      Paragraph("B")
    }
  }
}
`);
  });

  it("Doesn't get confused by tabs indenting a list item", () => {
    let doc = ` - a\n\t\tb`
    if (parser.parse(doc).length > doc.length) throw new RangeError("Wrong tree length")
  })

  it("Parses horizontal rules when setext headers are disabled", () => {
    let tree = parser.configure({remove: ["SetextHeading"]}).parse(`abc\n---`)
    if (tree.toString() != "Document(Paragraph,HorizontalRule)")
      throw new Error("Unexpected tree: " + tree)
  })
})
