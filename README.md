# lezer-markdown

This is an incremental Markdown
([CommonMark](https://commonmark.org/), in fact) parser that
integrates will with the [Lezer](https://lezer.codemirror.net/) parser
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
