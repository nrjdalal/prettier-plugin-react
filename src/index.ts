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

function sortJSXAttributesOnNode(node: any): void {
  const order = defaultOrder
  const attrs: any[] = node.attributes
  const result: any[] = []
  let segment: any[] = []

  const flush = (): void => {
    if (segment.length === 0) return
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
    rest.sort((a, b) => a.name.name.localeCompare(b.name.name))
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

function applySorting(ast: any): void {
  visit(ast, {
    visitJSXOpeningElement(path) {
      sortJSXAttributesOnNode(path.node)
      this.traverse(path)
    },
  })
}

const plugin: Plugin<Options> = {
  parsers: babelParsers,
  printers: {
    estree: {
      print(
        path: AstPath<any>,
        options: Options,
        print: (p: AstPath<any>) => Doc,
      ): Doc {
        const original = options.plugins
          ?.map((p: any) => p.printers)
          .filter(Boolean)
          .map((ps: any) => ps.estree)
          .find(Boolean)!
        const node = path.getNode()
        if (node.type === "Program") {
          applySorting(node)
        }
        return original.print(path, options, print)
      },
    },
  },
}

export default plugin
