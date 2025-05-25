// src/index.ts
import { visit } from "ast-types"
import { AstPath, Doc, Options, Plugin } from "prettier"
import { parsers as babelParsers } from "prettier/parser-babel"

const defaultOrder: string[] = [
  "id",
  "key",
  "className",
  "href",
  "target",
  "rel",
  "src",
  "alt",
  "width",
  "height",
]

/**
 * Reorders one node's JSX attributes in-place:
 *  - Splits named attrs into segments between spreads
 *  - Sorts each segment by defaultOrder, then alphabetically
 *  - Re-emits spreads in their original positions
 */
function sortJSXAttributesOnNode(node: any): void {
  const order = defaultOrder
  const attrs: any[] = node.attributes
  const result: any[] = []
  let segment: any[] = []

  const flush = (): void => {
    if (!segment.length) return
    const byName = new Map<string, any[]>()
    for (const attr of segment) {
      const name = attr.name.name as string
      const bucket = byName.get(name) ?? []
      bucket.push(attr)
      byName.set(name, bucket)
    }
    const sortedSegment: any[] = []
    for (const key of order) {
      if (byName.has(key)) {
        sortedSegment.push(...byName.get(key)!)
        byName.delete(key)
      }
    }
    const rest = Array.from(byName.values()).flat()
    rest.sort((a, b) => (a.name.name as string).localeCompare(b.name.name))
    sortedSegment.push(...rest)

    result.push(...sortedSegment)
    segment = []
  }

  for (const attr of attrs) {
    if (attr.type === "JSXSpreadAttribute") {
      flush()
      result.push(attr)
    } else {
      segment.push(attr)
    }
  }
  flush()

  node.attributes = result
}

/**
 * Walk the AST and sort JSX element attributes on each opening element.
 */
function applySorting(ast: any): void {
  visit(ast, {
    visitJSXOpeningElement(path) {
      sortJSXAttributesOnNode(path.node)
      this.traverse(path)
    },
  })
}

const estreePlugin = require("prettier/plugins/estree") as any
const originalEstreePrinter = estreePlugin.printers.estree

// Create a new printer inheriting all original hooks and properties
const newEstreePrinter = Object.create(originalEstreePrinter)
newEstreePrinter.print = function (
  path: AstPath<any>,
  options: Options,
  print: (p: AstPath<any>) => Doc,
): Doc {
  const node = path.getValue()
  if (node && node.type === "Program") {
    applySorting(node)
  }
  // Delegate to original, preserving `this` and original properties
  return originalEstreePrinter.print.call(this, path, options, print)
}

const plugin: Plugin<Options> = {
  parsers: babelParsers,
  printers: {
    estree: newEstreePrinter,
  },
}

export default plugin
