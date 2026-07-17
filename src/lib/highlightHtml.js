/**
 * Minimal, dependency-free HTML syntax highlighter for display purposes.
 *
 * Safety: the raw input is fully HTML-escaped first (so literal `<`/`>`/`&`
 * can never re-enter the DOM as markup). Only *our own* literal `<span>`
 * wrapper strings are added afterwards, so the final output can never
 * contain attacker-controlled tags — it's safe to render with
 * dangerouslySetInnerHTML.
 */

function escapeHtml(str) {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

const TAG_OR_COMMENT_REGEX =
  /(&lt;!--[\s\S]*?--&gt;)|(&lt;\/?[a-zA-Z][a-zA-Z0-9-]*(?:\s+[a-zA-Z_:][a-zA-Z0-9_:.-]*(?:=(?:"[^"]*"|'[^']*'))?)*\s*\/?&gt;)/g;

const TAG_NAME_REGEX = /^(&lt;\/?)([a-zA-Z][a-zA-Z0-9-]*)/;
const ATTRIBUTE_REGEX = /([a-zA-Z_:][a-zA-Z0-9_:.-]*)(=)("[^"]*"|'[^']*')/g;

export function highlightHtml(rawHtml) {
  if (typeof rawHtml !== "string" || rawHtml.length === 0) return "";

  const escaped = escapeHtml(rawHtml);

  return escaped.replace(TAG_OR_COMMENT_REGEX, (match, comment, tag) => {
    if (comment) {
      return `<span class="text-slate-400 italic">${comment}</span>`;
    }

    let inner = tag.replace(
      TAG_NAME_REGEX,
      (_m, bracket, name) =>
        `${bracket}<span class="text-pink-600 font-semibold">${name}</span>`
    );

    inner = inner.replace(
      ATTRIBUTE_REGEX,
      (_m, name, eq, value) =>
        `<span class="text-sky-600">${name}</span>${eq}<span class="text-emerald-600">${value}</span>`
    );

    return inner;
  });
}
