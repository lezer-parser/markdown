import {SyntaxNode} from "@lezer/common"

export function formatNode(s: string, node: SyntaxNode, level: number) {
  const indent = '  '.repeat(level);
  let repr = indent + node.type.name;
  if (node.firstChild) {
    repr += ' {\n';
    let child: SyntaxNode | null = node.firstChild;
    while (child) {
      repr += formatNode(s, child, level + 1);
      child = child.nextSibling;
    }
    repr += indent + '}';
  } else {
    repr += '(' + JSON.stringify(
      s.slice(node.from, node.to)
       .replace(/`/g, '\u2018')
       // Tests hard-code the output of this method in String.raw`` template literal string.
       // Since you cannot \-escape ` there and ${'`'} is ugly we instead replace
       // backticks with a similar looking unicode char.
    );
    if (node.type.name.match(/(Mark|Delimiter)$/)) {
      repr += `, ${node.from}-${node.to}`;
    }
    repr += ')';
  }
  return repr + '\n';
}
