# lezer-markdown

This is an incremental Markdown
([CommonMark](https://commonmark.org/), in fact) parser that
integrates well with the [Lezer](https://lezer.codemirror.net/) parser
system. It does not in fact use the Lezer runtime (that runs LR
parsers, and Markdown can't really be parsed that way), but it
produces Lezer-style compact syntax trees and consumes fragments of
such trees for its incremental parsing.

Note that this only _parses_ the document, producing a data structure
that represents its syntactic form, and doesn't help with outputting
HTML. Also, in order to be single-pass and incremental, it doesn't do
some things that a conforming CommonMark parser is expected to
do—specifically, it doesn't validate link references, so it'll parse
`[a][b]` and similar as a link, even if no `[b]` reference is
declared.

The code is licensed under an MIT license.

## Interface

This module exports a `parser` object. It extends
[`IncrementalParser`](https://lezer.codemirror.net/docs/ref/#lezer.IncrementalParser).

 * **`startParse`**`(input: Input, startPos?: number, context?: ParseContext)`

   Create a Markdown parser. When the context contains an array of
   tree fragments (aligned with the input), they will be used for
   incremental parsing.

 * **`nodeSet`**`?: NodeSet`

   The set of node types used in the output.

 * **`configure`**`(config: Object)`

   Reconfigure the parser, returning a new parser. The following
   options are recognized:

   * **`props`**`?: readonly NodePropSource[]`\
     Node props to add to the parser's node set.

   * **`codeParser`**`?: (info: string) => null | InnerParser`\
     When provided, this will be used to parse the content of code
     blocks. `info` is the string after the opening ` ``` ` marker, or
     the empty string if there is no such info or this is an indented
     code block. If there is a parser available for the code, it
     should return an `InnerParser`.

   * **`htmlParser`**`?: InnerParser`\
     The parser used to parse HTML tags (both block and inline).

`interface `**`InnerParser`**` {`\
`  startParse(input: Input, startPos: number, context: ParseContext): PartialParse`\
`}`
