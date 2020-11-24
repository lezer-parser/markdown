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

 * **`startParse`**`(input: Input, options?: Object)`

   Create a Markdown parser. The following optional options are
   recognized:

   * **`startPos`**`: number`\
     The position at which to start parsing. Defaults to 0.

   * **`fragments`**`: TreeFragment[]`\
     A set of tree fragments (aligned with the input) to use for
     incremental parsing.

 * **`nodeSet`**`: NodeSet`

   The set of node types used in the output.

 * **`configure`**`(config: Object)`

   Reconfigure the parser, returning a new parser. The following
   options are recognized:

   * **`nodeSet`**`?: NodeSet`\
     The node set to use in this parse. Defaults to
     `MarkdownParser.nodeSet`. Can be used to pass a set with
     additional props added.

   * **`codeParser`**`?: (info: string) => null | IncrementalParser`\
     When provided, this will be used to parse the content of code
     blocks. `info` is the string after the opening ` ``` ` marker, or
     the empty string if there is no such info or this is an indented
     code block. If there is a parser available for the code, it
     should return an [incremental parser](#lezer.IncrementalParser).

   * **`htmlParser`**`?: IncrementalParser`\
     The parser used to parse HTML tags (both block and inline).
