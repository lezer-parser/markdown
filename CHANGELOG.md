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
