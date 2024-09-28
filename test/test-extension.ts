import ist from 'ist';
import {parser as cmParser, GFM, Subscript, Superscript, Emoji} from "../dist/index.js"
import {formatNode} from "./format-node.js"

const parser = cmParser.configure([GFM, Subscript, Superscript, Emoji])

function parse(spec: string, p=parser) {
  return formatNode(spec, p.parse(spec).topNode, 0);
}
const r = String.raw;

describe("Extension", () => {
  it("Tables (example 198)", () => {
    ist(parse(`
| foo | bar |
| --- | --- |
| baz | bim |`), r`Document {
  Table {
    TableHeader {
      TableDelimiter("|", 1-2)
      TableCell("foo")
      TableDelimiter("|", 7-8)
      TableCell("bar")
      TableDelimiter("|", 13-14)
    }
    TableDelimiter("| --- | --- |", 15-28)
    TableRow {
      TableDelimiter("|", 29-30)
      TableCell("baz")
      TableDelimiter("|", 35-36)
      TableCell("bim")
      TableDelimiter("|", 41-42)
    }
  }
}
`)
  });

  it("Tables (example 199)", () => {
    ist(parse(`
| abc | defghi |
:-: | -----------:
bar | baz`), r`Document {
  Table {
    TableHeader {
      TableDelimiter("|", 1-2)
      TableCell("abc")
      TableDelimiter("|", 7-8)
      TableCell("defghi")
      TableDelimiter("|", 16-17)
    }
    TableDelimiter(":-: | -----------:", 18-36)
    TableRow {
      TableCell("bar")
      TableDelimiter("|", 41-42)
      TableCell("baz")
    }
  }
}
`)
  });

  it("Tables (example 200)", () => {
    ist(parse('\n\
| f\\|oo  |\n\
| ------ |\n\
| b `\\|` az |\n\
| b **\\|** im |'), r`Document {
  Table {
    TableHeader {
      TableDelimiter("|", 1-2)
      TableCell {
        Escape("\\|")
      }
      TableDelimiter("|", 10-11)
    }
    TableDelimiter("| ------ |", 12-22)
    TableRow {
      TableDelimiter("|", 23-24)
      TableCell {
        InlineCode {
          CodeMark("‘", 27-28)
          CodeMark("‘", 30-31)
        }
      }
      TableDelimiter("|", 35-36)
    }
    TableRow {
      TableDelimiter("|", 37-38)
      TableCell {
        StrongEmphasis {
          EmphasisMark("**", 41-43)
          Escape("\\|")
          EmphasisMark("**", 45-47)
        }
      }
      TableDelimiter("|", 51-52)
    }
  }
}
`)
  });

  it("Tables (example 201)", () => {
    ist(parse(`
| abc | def |
| --- | --- |
| bar | baz |
> bar`), r`Document {
  Table {
    TableHeader {
      TableDelimiter("|", 1-2)
      TableCell("abc")
      TableDelimiter("|", 7-8)
      TableCell("def")
      TableDelimiter("|", 13-14)
    }
    TableDelimiter("| --- | --- |", 15-28)
    TableRow {
      TableDelimiter("|", 29-30)
      TableCell("bar")
      TableDelimiter("|", 35-36)
      TableCell("baz")
      TableDelimiter("|", 41-42)
    }
  }
  Blockquote {
    QuoteMark(">", 43-44)
    Paragraph("bar")
  }
}
`)
  });

  it("Tables (example 202)", () => {
    ist(parse(`
| abc | def |
| --- | --- |
| bar | baz |
bar

bar`), r`Document {
  Table {
    TableHeader {
      TableDelimiter("|", 1-2)
      TableCell("abc")
      TableDelimiter("|", 7-8)
      TableCell("def")
      TableDelimiter("|", 13-14)
    }
    TableDelimiter("| --- | --- |", 15-28)
    TableRow {
      TableDelimiter("|", 29-30)
      TableCell("bar")
      TableDelimiter("|", 35-36)
      TableCell("baz")
      TableDelimiter("|", 41-42)
    }
    TableRow {
      TableCell("bar")
    }
  }
  Paragraph("bar")
}
`)
  });

  it("Tables (example 203)", () => {
    ist(parse(`| abc | def |
| --- |
| bar |`), r`Document {
  Paragraph("| abc | def |\n| --- |\n| bar |")
}
`)
  });

  it("Tables (example 204)", () => {
    ist(parse(`
| abc | def |
| --- | --- |
| bar |
| bar | baz | boo |`), r`Document {
  Table {
    TableHeader {
      TableDelimiter("|", 1-2)
      TableCell("abc")
      TableDelimiter("|", 7-8)
      TableCell("def")
      TableDelimiter("|", 13-14)
    }
    TableDelimiter("| --- | --- |", 15-28)
    TableRow {
      TableDelimiter("|", 29-30)
      TableCell("bar")
      TableDelimiter("|", 35-36)
    }
    TableRow {
      TableDelimiter("|", 37-38)
      TableCell("bar")
      TableDelimiter("|", 43-44)
      TableCell("baz")
      TableDelimiter("|", 49-50)
      TableCell("boo")
      TableDelimiter("|", 55-56)
    }
  }
}
`)
  });

  it("Tables (example 205)", () => {
    ist(parse(`
| abc | def |
| --- | --- |`), r`Document {
  Table {
    TableHeader {
      TableDelimiter("|", 1-2)
      TableCell("abc")
      TableDelimiter("|", 7-8)
      TableCell("def")
      TableDelimiter("|", 13-14)
    }
    TableDelimiter("| --- | --- |", 15-28)
  }
}
`)
  });

  it("Tables (in blockquote)", () => {
    ist(parse(`
> | one | two |
> | --- | --- |
> | 123 | 456 |
>
> Okay`), r`Document {
  Blockquote {
    QuoteMark(">", 1-2)
    Table {
      TableHeader {
        TableDelimiter("|", 3-4)
        TableCell("one")
        TableDelimiter("|", 9-10)
        TableCell("two")
        TableDelimiter("|", 15-16)
      }
      QuoteMark(">", 17-18)
      TableDelimiter("| --- | --- |", 19-32)
      QuoteMark(">", 33-34)
      TableRow {
        TableDelimiter("|", 35-36)
        TableCell("123")
        TableDelimiter("|", 41-42)
        TableCell("456")
        TableDelimiter("|", 47-48)
      }
    }
    QuoteMark(">", 49-50)
    QuoteMark(">", 51-52)
    Paragraph("Okay")
  }
}
`)
  });

  it("Tables (empty header)", () => {
    ist(parse(`
| | |
| :-: | :-: |
| One | Two |`), r`Document {
  Table {
    TableHeader {
      TableDelimiter("|", 1-2)
      TableDelimiter("|", 3-4)
      TableDelimiter("|", 5-6)
    }
    TableDelimiter("| :-: | :-: |", 7-20)
    TableRow {
      TableDelimiter("|", 21-22)
      TableCell("One")
      TableDelimiter("|", 27-28)
      TableCell("Two")
      TableDelimiter("|", 33-34)
    }
  }
}
`)
  });

  it("Tables (end paragraph)", () => {
    ist(parse(`
Hello
| foo | bar |
| --- | --- |
| baz | bim |`), r`Document {
  Paragraph("Hello")
  Table {
    TableHeader {
      TableDelimiter("|", 7-8)
      TableCell("foo")
      TableDelimiter("|", 13-14)
      TableCell("bar")
      TableDelimiter("|", 19-20)
    }
    TableDelimiter("| --- | --- |", 21-34)
    TableRow {
      TableDelimiter("|", 35-36)
      TableCell("baz")
      TableDelimiter("|", 41-42)
      TableCell("bim")
      TableDelimiter("|", 47-48)
    }
  }
}
`)
  });

  it("Tables (invalid tables don't end paragraph)", () => {
    ist(parse(`Hello
| abc | def |
| --- |
| bar |`), r`Document {
  Paragraph("Hello\n| abc | def |\n| --- |\n| bar |")
}
`)
  });

  it("Task list (example 279)", () => {
    ist(parse(`
- [ ] foo
- [x] bar`), r`Document {
  BulletList {
    ListItem {
      ListMark("-", 1-2)
      Task {
        TaskMarker("[ ]")
      }
    }
    ListItem {
      ListMark("-", 11-12)
      Task {
        TaskMarker("[x]")
      }
    }
  }
}
`)
  });

  it("Task list (example 280)", () => {
    ist(parse(`
- [x] foo
  - [ ] bar
  - [x] baz
- [ ] bim`), r`Document {
  BulletList {
    ListItem {
      ListMark("-", 1-2)
      Task {
        TaskMarker("[x]")
      }
      BulletList {
        ListItem {
          ListMark("-", 13-14)
          Task {
            TaskMarker("[ ]")
          }
        }
        ListItem {
          ListMark("-", 25-26)
          Task {
            TaskMarker("[x]")
          }
        }
      }
    }
    ListItem {
      ListMark("-", 35-36)
      Task {
        TaskMarker("[ ]")
      }
    }
  }
}
`)
  });

  it("Autolink (example 622)", () => {
    ist(parse(`www.commonmark.org`), r`Document {
  Paragraph {
    URL("www.commonmark.org")
  }
}
`)
  });

  it("Autolink (example 623)", () => {
    ist(parse(`Visit www.commonmark.org/help for more information.`), r`Document {
  Paragraph {
    URL("www.commonmark.org/help")
  }
}
`)
  });

  it("Autolink (example 624)", () => {
    ist(parse(`Visit www.commonmark.org.

Visit www.commonmark.org/a.b.`), r`Document {
  Paragraph {
    URL("www.commonmark.org")
  }
  Paragraph {
    URL("www.commonmark.org/a.b")
  }
}
`)
  });

  it("Autolink (example 625)", () => {
    ist(parse(`www.google.com/search?q=Markup+(business)

www.google.com/search?q=Markup+(business)))

(www.google.com/search?q=Markup+(business))

(www.google.com/search?q=Markup+(business)`), r`Document {
  Paragraph {
    URL("www.google.com/search?q=Markup+(business)")
  }
  Paragraph {
    URL("www.google.com/search?q=Markup+(business)")
  }
  Paragraph {
    URL("www.google.com/search?q=Markup+(business)")
  }
  Paragraph {
    URL("www.google.com/search?q=Markup+(business)")
  }
}
`)
  });

  it("Autolink (example 626)", () => {
    ist(parse(`www.google.com/search?q=(business))+ok`), r`Document {
  Paragraph {
    URL("www.google.com/search?q=(business))+ok")
  }
}
`)
  });

  it("Autolink (example 627)", () => {
    ist(parse(`www.google.com/search?q=commonmark&hl=en

www.google.com/search?q=commonmark&hl;`), r`Document {
  Paragraph {
    URL("www.google.com/search?q=commonmark&hl=en")
  }
  Paragraph {
    URL("www.google.com/search?q=commonmark")
    Entity("&hl;")
  }
}
`)
  });

  it("Autolink (example 628)", () => {
    ist(parse(`www.commonmark.org/he<lp`), r`Document {
  Paragraph {
    URL("www.commonmark.org/he")
  }
}
`)
  });

  it("Autolink (example 629)", () => {
    ist(parse(`http://commonmark.org

(Visit https://encrypted.google.com/search?q=Markup+(business))`), r`Document {
  Paragraph {
    URL("http://commonmark.org")
  }
  Paragraph {
    URL("https://encrypted.google.com/search?q=Markup+(business)")
  }
}
`)
  });

  it("Autolink (example 630)", () => {
    ist(parse(`foo@bar.baz`), r`Document {
  Paragraph {
    URL("foo@bar.baz")
  }
}
`)
  });

  it("Autolink (example 631)", () => {
    ist(parse(`hello@mail+xyz.example isn't valid, but hello+xyz@mail.example is.`), r`Document {
  Paragraph {
    URL("hello+xyz@mail.example")
  }
}
`)
  });

  it("Autolink (example 632)", () => {
    ist(parse(`a.b-c_d@a.b

a.b-c_d@a.b.

a.b-c_d@a.b-

a.b-c_d@a.b_`), r`Document {
  Paragraph {
    URL("a.b-c_d@a.b")
  }
  Paragraph {
    URL("a.b-c_d@a.b")
  }
  Paragraph("a.b-c_d@a.b-")
  Paragraph("a.b-c_d@a.b_")
}
`)
  });

  it("Autolink (example 633)", () => {
    ist(parse(`mailto:foo@bar.baz

mailto:a.b-c_d@a.b

mailto:a.b-c_d@a.b.

mailto:a.b-c_d@a.b/

mailto:a.b-c_d@a.b-

mailto:a.b-c_d@a.b_

xmpp:foo@bar.baz

xmpp:foo@bar.baz.`), r`Document {
  Paragraph {
    URL("mailto:foo@bar.baz")
  }
  Paragraph {
    URL("mailto:a.b-c_d@a.b")
  }
  Paragraph {
    URL("mailto:a.b-c_d@a.b")
  }
  Paragraph {
    URL("mailto:a.b-c_d@a.b")
  }
  Paragraph("mailto:a.b-c_d@a.b-")
  Paragraph("mailto:a.b-c_d@a.b_")
  Paragraph {
    URL("xmpp:foo@bar.baz")
  }
  Paragraph {
    URL("xmpp:foo@bar.baz")
  }
}
`)
  });

  it("Autolink (example 634)", () => {
    ist(parse(`xmpp:foo@bar.baz/txt

xmpp:foo@bar.baz/txt@bin

xmpp:foo@bar.baz/txt@bin.com`), r`Document {
  Paragraph {
    URL("xmpp:foo@bar.baz/txt")
  }
  Paragraph {
    URL("xmpp:foo@bar.baz/txt@bin")
  }
  Paragraph {
    URL("xmpp:foo@bar.baz/txt@bin.com")
  }
}
`)
  });

  it("Autolink (example 635)", () => {
    ist(parse(`xmpp:foo@bar.baz/txt/bin`), r`Document {
  Paragraph {
    URL("xmpp:foo@bar.baz/txt")
  }
}
`)
  });

  it("Task list (in ordered list)", () => {
    ist(parse(`
1. [X] Okay`), r`Document {
  OrderedList {
    ListItem {
      ListMark("1.", 1-3)
      Task {
        TaskMarker("[X]")
      }
    }
  }
}
`)
  });

  it("Task list (versus table)", () => {
    ist(parse(`
- [ ] foo | bar
  --- | ---`), r`Document {
  BulletList {
    ListItem {
      ListMark("-", 1-2)
      Table {
        TableHeader {
          TableCell("[ ] foo")
          TableDelimiter("|", 11-12)
          TableCell("bar")
        }
        TableDelimiter("--- | ---", 19-28)
      }
    }
  }
}
`)
  });

  it("Task list (versus setext header)", () => {
    ist(parse(`
1. [X] foo
   ===`), r`Document {
  OrderedList {
    ListItem {
      ListMark("1.", 1-3)
      SetextHeading1 {
        Link {
          LinkMark("[", 4-5)
          LinkMark("]", 6-7)
        }
        HeaderMark("===", 15-18)
      }
    }
  }
}
`)
  });

  it("Strikethrough (example 491)", () => {
    ist(parse(`
~~Hi~~ Hello, world!`), r`Document {
  Paragraph {
    Strikethrough {
      StrikethroughMark("~~", 1-3)
      StrikethroughMark("~~", 5-7)
    }
  }
}
`)
  });

  it("Strikethrough (example 492)", () => {
    ist(parse(`This ~~has a

new paragraph~~.`), r`Document {
  Paragraph("This ~~has a")
  Paragraph("new paragraph~~.")
}
`)
  });

  it("Strikethrough (nested)", () => {
    ist(parse(`
Nesting **with ~~emphasis~~**.`), r`Document {
  Paragraph {
    StrongEmphasis {
      EmphasisMark("**", 9-11)
      Strikethrough {
        StrikethroughMark("~~", 16-18)
        StrikethroughMark("~~", 26-28)
      }
      EmphasisMark("**", 28-30)
    }
  }
}
`)
  });

  it("Strikethrough (overlapping)", () => {
    ist(parse(`
One **two ~~three** four~~

One ~~two **three~~ four**`), r`Document {
  Paragraph {
    StrongEmphasis {
      EmphasisMark("**", 5-7)
      EmphasisMark("**", 18-20)
    }
  }
  Paragraph {
    Strikethrough {
      StrikethroughMark("~~", 33-35)
      StrikethroughMark("~~", 46-48)
    }
  }
}
`)
  });

  it("Strikethrough (escaped)", () => {
    ist(parse(r`A \~~b c~~`), r`Document {
  Paragraph {
    Escape("\\~")
  }
}
`)
  });

  it("Strikethrough around spaces", () => {
    ist(parse(`
One ~~ two~~ three ~~.foo.~~ a~~.foo.~~a ~~blah~~.`), r`Document {
  Paragraph {
    Strikethrough {
      StrikethroughMark("~~", 20-22)
      StrikethroughMark("~~", 27-29)
    }
    Strikethrough {
      StrikethroughMark("~~", 42-44)
      StrikethroughMark("~~", 48-50)
    }
  }
}
`)
  });

  it("Subscript", () => {
    ist(parse(`
One ~two~ *one ~two~*`), r`Document {
  Paragraph {
    Subscript {
      SubscriptMark("~", 5-6)
      SubscriptMark("~", 9-10)
    }
    Emphasis {
      EmphasisMark("*", 11-12)
      Subscript {
        SubscriptMark("~", 16-17)
        SubscriptMark("~", 20-21)
      }
      EmphasisMark("*", 21-22)
    }
  }
}
`)
  });

  it("Subscript (no spaces)", () => {
    ist(parse(`One ~two three~`), r`Document {
  Paragraph("One ~two three~")
}
`)
  });

  it("Subscript (escapes)", () => {
    ist(parse(r`
One ~two\ th\~ree~`), r`Document {
  Paragraph {
    Subscript {
      SubscriptMark("~", 5-6)
      Escape("\\ ")
      Escape("\\~")
      SubscriptMark("~", 18-19)
    }
  }
}
`)
  });

  it("Superscript", () => {
    ist(parse(`
One ^two^ *one ^two^*`), r`Document {
  Paragraph {
    Superscript {
      SuperscriptMark("^", 5-6)
      SuperscriptMark("^", 9-10)
    }
    Emphasis {
      EmphasisMark("*", 11-12)
      Superscript {
        SuperscriptMark("^", 16-17)
        SuperscriptMark("^", 20-21)
      }
      EmphasisMark("*", 21-22)
    }
  }
}
`)
  });

  it("Superscript (no spaces)", () => {
    ist(parse(`One ^two three^`), r`Document {
  Paragraph("One ^two three^")
}
`)
  });

  it("Superscript (escapes)", () => {
    ist(parse(r`
One ^two\ th\^ree^`), r`Document {
  Paragraph {
    Superscript {
      SuperscriptMark("^", 5-6)
      Escape("\\ ")
      Escape("\\^")
      SuperscriptMark("^", 18-19)
    }
  }
}
`)
  });

  it("Emoji", () => {
    ist(parse(`Hello :smile: :100:`), r`Document {
  Paragraph {
    Emoji(":smile:")
    Emoji(":100:")
  }
}
`)
  });

  it("Emoji (format)", () => {
    ist(parse(`Hello :smi le: :1.00: ::`), r`Document {
  Paragraph("Hello :smi le: :1.00: ::")
}
`)
  });

  it("Disable syntax", () => {
    ist(parse(`
- List still *works*

> No quote, no ^sup^

No setext either
===`, parser.configure({remove: ["Superscript", "Blockquote", "SetextHeading"]})), r`Document {
  BulletList {
    ListItem {
      ListMark("-", 1-2)
      Paragraph {
        Emphasis {
          EmphasisMark("*", 14-15)
          EmphasisMark("*", 20-21)
        }
      }
    }
  }
  Paragraph("> No quote, no ^sup^")
  Paragraph("No setext either\n===")
}
`)
  });

  it("Autolink (.co.uk)", () => {
    ist(parse(`www.blah.co.uk/path`), r`Document {
  Paragraph {
    URL("www.blah.co.uk/path")
  }
}
`)
  });

  it("Autolink (email .co.uk)", () => {
    ist(parse(`foo@bar.co.uk`), r`Document {
  Paragraph {
    URL("foo@bar.co.uk")
  }
}
`)
  });

  it("Autolink (http://www.foo-bar.com/)", () => {
    ist(parse(`http://www.foo-bar.com/`), r`Document {
  Paragraph {
    URL("http://www.foo-bar.com/")
  }
}
`)
  });

  it("Autolink (exclude underscores)", () => {
    ist(parse(`http://www.foo_/ http://foo_.com`), r`Document {
  Paragraph("http://www.foo_/ http://foo_.com")
}
`)
  });

  it("Autolink (in image)", () => {
    ist(parse(`
![Link: http://foo.com/](x.jpg)`), r`Document {
  Paragraph {
    Image {
      LinkMark("![", 1-3)
      URL("http://foo.com/")
      LinkMark("]", 24-25)
      LinkMark("(", 25-26)
      URL("x.jpg")
      LinkMark(")", 31-32)
    }
  }
}
`)
  });
})
