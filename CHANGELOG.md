## 1.0.3 (2023-06-22)

### Bug fixes

Only parse list items as tasks when there is whitespace after the checkbox brackets. Remove an unnecessary regexp operator

Fix a crash doing an incremental parse on input ranges with gaps between them.

## 1.0.2 (2022-09-21)

### Bug fixes

In the stikethrough extension, ignore opening marks with a space after and closing marks with a space before them.

## 1.0.1 (2022-06-29)

### Bug fixes

Fix a crash that could occur when there were gaps in the parseable ranges right at the start of a line.

## 1.0.0 (2022-06-06)

### New features

First stable version.

## 0.16.1 (2022-05-20)

### Bug fixes

Fix a bug that prevented style tags from built-in extensions from being applied.

## 0.16.0 (2022-04-20)

### New features

This package now attached highlighting information to its syntax tree.

It is now possible to include highlighting information when defining nodes in extensions via `NodeSpec.style`.

## 0.15.6 (2022-03-18)

### Bug fixes

Fix a bug where GFM tables occuring directly below a paragraph weren't recognized.

## 0.15.5 (2022-02-18)

### New features

The `BlockContext` type now has a `depth` property providing the amount of parent nodes, and a `parentType` method allowing code to inspect the type of those nodes.

## 0.15.4 (2022-02-02)

### Bug fixes

Fix compatibility fallback for engines with RegExp `\p` support.

## 0.15.3 (2021-12-13)

### Bug fixes

Fix a bug where, if there were multiple extensions passed to the editor, the `wrap` option got dropped from the resulting configuration.

## 0.15.2 (2021-11-08)

### Bug fixes

Fix a bug where an ordered list item after a nested bullet list would get treated as part of the bullet list item.

## 0.15.1 (2021-10-11)

### Bug fixes

Fix a bug that caused `endLeafBlock` configuration to be ignored by the parser.

## 0.15.0 (2021-08-11)

### Breaking changes

The module name has changed from `lezer-markdown` to `@lezer/markdown`.

`MarkdownParser` now extends `Parser` and follows its interface.

The Markdown parser no longer has its own support for nested parsing (but can be wrapped with `parseCode` to get a similar effect).

### New features

The new `parseCode` function can be used to set up a mixed-language parser for Markdown.

## 0.14.5 (2021-05-12)

### Bug fixes

Fix an issue were continued paragraph lines starting with tabs could cause the parser to create a tree with invalid node positions.

## 0.14.4 (2021-03-09)

### Bug fixes

Fix a bug where an unterminated nested code block could call a nested parser with a start position beyond the end of the document.

Fix a bug where the parser could return an invalid tree when `forceFinish` was called during a nested parse.

## 0.14.3 (2021-02-22)

### Breaking changes

`parseInline` has been moved to `MarkdownParser` so that it can also be called from an inline context.

### New features

Heading nodes now have different types based on their level.

The `elt` helper method can now be called with a `Tree` to wrap the result of a nested parse in an element.

The `startNested` method is now exported.

## 0.14.2 (2021-02-12)

### Bug fixes

`BlockParser.parse`'s exported type was missing an argument.

Fix a bug that would cause incorrect offsets for children nested two deep in an element passed to `BlockContext.addElement`.

## 0.14.1 (2021-02-11)

### Bug fixes

Fix table parsing when header cells are empty.

## 0.14.0 (2021-02-10)

### New features

Add an extension interface. The `configure` method now takes more options, allowing client code to define new syntax node types and parse logic.

Add extensions for subscript, superscript, strikethrough, tables, and task lists to the distribution.

## 0.13.0 (2020-12-04)

### Breaking changes

First numbered release.
