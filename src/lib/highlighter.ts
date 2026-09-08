import type { HighlighterCore, ThemedToken } from "shiki/core";

export type HighlightedCode = {
  tokens: ThemedToken[][];
  language: string;
  plainText: boolean;
};

let highlighterPromise: Promise<HighlighterCore> | undefined;
const languageLoads = new Map<string, Promise<void>>();
const themeLoads = new Map<string, Promise<void>>();
const plainLanguages: Record<string, true> = {
  "": true,
  text: true,
  txt: true,
  plain: true,
  plaintext: true,
};

function getHighlighter() {
  // Static imports would load the engine on empty library routes; this is an explicit lazy boundary.
  highlighterPromise ??= Promise.all([
    import("shiki/core"),
    import("shiki/engine/oniguruma"),
  ])
    .then(([{ createHighlighterCore }, { createOnigurumaEngine }]) =>
      createHighlighterCore({
        langs: [],
        themes: [],
        engine: createOnigurumaEngine(import("shiki/wasm")),
      }),
    )
    .catch((error: unknown) => {
      highlighterPromise = undefined;
      throw error;
    });
  return highlighterPromise;
}

function loadOnce(
  loads: Map<string, Promise<void>>,
  key: string,
  load: () => Promise<void>,
) {
  let pending = loads.get(key);
  if (!pending) {
    pending = load().catch((error: unknown) => {
      loads.delete(key);
      throw error;
    });
    loads.set(key, pending);
  }
  return pending;
}

export function plainCode(code: string): ThemedToken[][] {
  let offset = 0;
  return code.split(/\r\n|\r|\n/).map((content) => {
    const token = { content, offset };
    offset += content.length + 1;
    return [token];
  });
}
/** The language manifest contains lazy import functions, not eagerly bundled grammars. */
export async function highlightCode(
  code: string,
  language: string,
  dark: boolean,
): Promise<HighlightedCode> {
  const requested = language.trim().toLowerCase();
  if (Object.hasOwn(plainLanguages, requested)) {
    return { tokens: plainCode(code), language: "text", plainText: true };
  }

  const { bundledLanguagesInfo } = await import("shiki/langs");
  const grammar = bundledLanguagesInfo.find(
    (entry) =>
      entry.id === requested ||
      entry.aliases?.includes(requested) ||
      entry.name.toLowerCase() === requested,
  );
  if (!grammar) {
    return { tokens: plainCode(code), language: "text", plainText: true };
  }

  const highlighter = await getHighlighter();
  const theme = dark ? "github-dark" : "github-light";
  await Promise.all([
    loadOnce(languageLoads, grammar.id, () =>
      highlighter.loadLanguage(grammar.import()),
    ),
    loadOnce(themeLoads, theme, () =>
      highlighter.loadTheme(
        dark
          ? import("shiki/themes/github-dark.mjs")
          : import("shiki/themes/github-light.mjs"),
      ),
    ),
  ]);

  return {
    tokens: highlighter.codeToTokens(code, { lang: grammar.id, theme }).tokens,
    language: grammar.id,
    plainText: false,
  };
}
