#!/usr/bin/env node
import path from "node:path"
import { parseArgs } from "node:util"
import { author, name, version } from "~/package.json"
import { JsxAttributeLike, Project, SyntaxKind } from "ts-morph"

const helpMessage = `Version:
  ${name}@${version}

Usage:
  $ ${name} <command> [options]

Commands:
  test           Test command

Options:
  -v, --version  Display version
  -h, --help     Display help for <command>

Author:
  ${author.name} <${author.email}> (${author.url})`

const parse: typeof parseArgs = (config) => {
  try {
    return parseArgs(config)
  } catch (err: any) {
    throw new Error(`Error parsing arguments: ${err.message}`)
  }
}

const main = async () => {
  try {
    const { positionals, values } = parse({
      allowPositionals: true,
      options: {
        cwd: { type: "string", short: "c" },
        help: { type: "boolean", short: "h" },
        version: { type: "boolean", short: "v" },
      },
    })

    if (!positionals.length) {
      if (values.version) {
        console.log(`${name}@${version}`)
        process.exit(0)
      }
      if (values.help) {
        console.log(helpMessage)
        process.exit(0)
      }
    }

    const project = new Project()

    const cwd = path.resolve(values.cwd ?? process.cwd())

    const sourceFiles = project.addSourceFilesAtPaths([
      path.resolve(cwd, "**/*.jsx"),
      path.resolve(cwd, "**/*.tsx"),
    ])

    for (const sourceFile of sourceFiles) {
      const jsxElements = [
        ...sourceFile.getDescendantsOfKind(SyntaxKind.JsxOpeningElement),
        ...sourceFile.getDescendantsOfKind(SyntaxKind.JsxSelfClosingElement),
      ]

      for (const element of jsxElements) {
        const attributes = element.getAttributes()
        const attributeStructures = attributes.map((attr) =>
          attr.getStructure(),
        )

        const groupedAttributes: Array<
          Array<
            JsxAttributeLike["getStructure"] extends () => infer T ? T : never
          >
        > = []

        for (const [i, structure] of attributeStructures.entries()) {
          const kind = attributes[i].getKind()
          const lastGroup = groupedAttributes[groupedAttributes.length - 1]

          if (
            lastGroup &&
            attributes[groupedAttributes.flat().length - 1].getKind() === kind
          ) {
            lastGroup.push(structure)
          } else {
            groupedAttributes.push([structure])
          }
        }

        for (const group of groupedAttributes) {
          group.sort((a, b) => {
            const nameA =
              "name" in a && typeof a.name === "string" ? a.name : ""
            const nameB =
              "name" in b && typeof b.name === "string" ? b.name : ""
            return nameA.localeCompare(nameB)
          })
        }

        for (const attr of attributes) {
          attr.remove()
        }

        for (const group of groupedAttributes) {
          for (const structure of group) {
            element.addAttribute(structure)
          }
        }
      }

      sourceFile.saveSync()
    }

    process.exit(0)
  } catch (err: any) {
    console.error(helpMessage)
    console.error(`\n${err.message}\n`)
    process.exit(1)
  }
}

main()
