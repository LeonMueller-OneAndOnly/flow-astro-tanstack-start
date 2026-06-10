const routeFilePattern = /(?:^|[/\\])src[/\\]pages[/\\].+\.(?:astro|[cm]?[jt]sx?)$/;
const astroFilePattern = /\.astro$/;

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
        if (astroFilePattern.test(filename) && !isAstroFrontmatterProgram(node)) return;

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

function isAstroFrontmatterProgram(node) {
  return node.body.some(
    (statement) =>
      statement.type === "ImportDeclaration" ||
      statement.type === "ExportNamedDeclaration" ||
      statement.type === "ExportDefaultDeclaration" ||
      statement.type === "ExportAllDeclaration",
  );
}

export default {
  meta: {
    name: "omnis",
  },
  rules: {
    "require-prerender-export": requirePrerenderExport,
  },
};
