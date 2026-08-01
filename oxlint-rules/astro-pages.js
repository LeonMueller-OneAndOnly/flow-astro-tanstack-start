import { readFileSync } from "node:fs";

const routeFilePattern = /(?:^|[/\\])src[/\\]pages[/\\].+\.(?:astro|[cm]?[jt]sx?)$/;
const astroFilePattern = /\.astro$/;
/** The leading `---` fence and everything up to the closing one. */
const frontmatterPattern = /^---\r?\n([\s\S]*?)\r?\n?---/;

const requirePrerenderExport = {
  meta: {
    type: "problem",
    docs: {
      description: "Require Astro route files to explicitly export a prerender mode.",
    },
    messages: {
      missing:
        "Route files in src/pages must explicitly export `prerender` as either `true` or `false`.",
    },
    schema: [],
  },
  create(context) {
    const filename = context.filename ?? context.getFilename?.() ?? "";

    return {
      Program(node) {
        if (!routeFilePattern.test(filename)) return;
        if (astroFilePattern.test(filename) && !isAstroFrontmatter(filename, context)) return;

        const hasPrerenderExport = node.body.some((statement) => {
          if (statement.type !== "ExportNamedDeclaration") return false;

          const declaration = statement.declaration;
          if (declaration?.type !== "VariableDeclaration" || declaration.kind !== "const") {
            return false;
          }

          return declaration.declarations.some((declarator) => {
            const id = declarator.id;
            const init = declarator.init;

            return (
              id?.type === "Identifier" &&
              id.name === "prerender" &&
              init?.type === "Literal" &&
              typeof init.value === "boolean"
            );
          });
        });

        if (!hasPrerenderExport) {
          context.report({
            node,
            messageId: "missing",
          });
        }
      },
    };
  },
};

/**
 * Whether the program currently being visited is the file's frontmatter rather
 * than one of its `<script>` blocks.
 *
 * oxlint hands a JS plugin one `Program` per script block of an `.astro` file,
 * and every one of them looks like a module: `context.sourceCode.text` is the
 * block's own source, and `node.loc` counts lines from the start of that block,
 * so both the frontmatter and a client script report line 1. There is nothing
 * on the node to tell them apart — the previous heuristic ("contains an import
 * or export") therefore also matched any client script with a top-level import,
 * and demanded a `prerender` export inside a browser bundle.
 *
 * So the file is read from disk and its frontmatter compared against the block
 * source. Deliberately uncached: `.astro` files under `src/pages` are a handful,
 * a cache would go stale in watch mode, and a stale hit here silently disables
 * the rule for that file.
 */
function isAstroFrontmatter(filename, context) {
  const source = context.sourceCode?.text;
  if (typeof source !== "string") return false;

  let file;
  try {
    file = readFileSync(filename, "utf8");
  } catch {
    // Unreadable (deleted mid-run, virtual file): fall back to letting the block
    // through. Missing a violation beats reporting one that cannot be fixed.
    return false;
  }

  const frontmatter = frontmatterPattern.exec(file);
  return frontmatter !== null && frontmatter[1].trim() === source.trim();
}

export default {
  meta: {
    name: "omnis",
  },
  rules: {
    "require-prerender-export": requirePrerenderExport,
  },
};
