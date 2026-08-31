"use client";

import React from "react";

interface AiMarkdownRendererProps {
  content: string;
  className?: string;
}

// Formats inline markdown (bold, italic, code, links)
function renderInlineMarkdown(text: string): React.ReactNode[] {
  // Regex to split by bold (**...**), italic (*...* or _..._), inline code (`...`)
  const parts: React.ReactNode[] = [];
  let remaining = text;
  let key = 0;

  while (remaining.length > 0) {
    // 1. Bold: **text** or __text__
    const boldMatch = remaining.match(/^(\*\*|__)([\s\S]+?)\1/);
    if (boldMatch) {
      parts.push(
        <strong key={key++} className="font-bold text-white tracking-wide">
          {renderInlineMarkdown(boldMatch[2])}
        </strong>
      );
      remaining = remaining.slice(boldMatch[0].length);
      continue;
    }

    // 2. Inline Code: `text`
    const codeMatch = remaining.match(/^`([^`]+)`/);
    if (codeMatch) {
      parts.push(
        <code
          key={key++}
          className="rounded bg-slate-900 border border-slate-700/80 px-1.5 py-0.5 font-mono text-[11px] text-cyan-300 font-medium"
        >
          {codeMatch[1]}
        </code>
      );
      remaining = remaining.slice(codeMatch[0].length);
      continue;
    }

    // 3. Italic: *text* or _text_
    const italicMatch = remaining.match(/^(\*|_)([\s\S]+?)\1/);
    if (italicMatch && !italicMatch[2].startsWith("*") && !italicMatch[2].startsWith("_")) {
      parts.push(
        <em key={key++} className="italic text-slate-300">
          {renderInlineMarkdown(italicMatch[2])}
        </em>
      );
      remaining = remaining.slice(italicMatch[0].length);
      continue;
    }

    // 4. Plain text up to the next special char
    const nextSpecial = remaining.search(/[\*_`]/);
    if (nextSpecial === -1) {
      parts.push(remaining);
      break;
    } else if (nextSpecial === 0) {
      // Unmatched single delimiter
      parts.push(remaining[0]);
      remaining = remaining.slice(1);
    } else {
      parts.push(remaining.slice(0, nextSpecial));
      remaining = remaining.slice(nextSpecial);
    }
  }

  return parts;
}

export function AiMarkdownRenderer({ content, className = "" }: AiMarkdownRendererProps) {
  if (!content) return null;

  // Split into raw lines
  const lines = content.replace(/\r\n/g, "\n").split("\n");
  const elements: React.ReactNode[] = [];
  let index = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    // Empty Line
    if (!trimmed) {
      elements.push(<div key={`spacer-${index++}`} className="h-2" />);
      continue;
    }

    // Horizontal Rule: --- or ***
    if (/^(\-{3,}|\*{3,}|_{3,})$/.test(trimmed)) {
      elements.push(
        <hr key={`hr-${index++}`} className="my-3 border-slate-700/60" />
      );
      continue;
    }

    // Headings: #, ##, ###, ####
    if (trimmed.startsWith("### ")) {
      elements.push(
        <h4
          key={`h4-${index++}`}
          className="text-xs font-bold text-cyan-300 uppercase tracking-wider mt-3 mb-1.5 flex items-center gap-1.5"
        >
          {renderInlineMarkdown(trimmed.replace(/^###\s+/, ""))}
        </h4>
      );
      continue;
    }
    if (trimmed.startsWith("## ")) {
      elements.push(
        <h3
          key={`h3-${index++}`}
          className="text-sm font-bold text-white mt-3.5 mb-1.5 pb-1 border-b border-slate-700/50 flex items-center gap-2"
        >
          {renderInlineMarkdown(trimmed.replace(/^##\s+/, ""))}
        </h3>
      );
      continue;
    }
    if (trimmed.startsWith("# ")) {
      elements.push(
        <h2
          key={`h2-${index++}`}
          className="text-base font-extrabold text-white mt-4 mb-2 flex items-center gap-2"
        >
          {renderInlineMarkdown(trimmed.replace(/^#\s+/, ""))}
        </h2>
      );
      continue;
    }

    // Blockquote: > quote (used for mnemonics / callouts)
    if (trimmed.startsWith(">")) {
      const quoteLines: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith(">")) {
        quoteLines.push(lines[i].trim().replace(/^>\s?/, ""));
        i++;
      }
      i--; // Step back 1 for the loop
      elements.push(
        <div
          key={`quote-${index++}`}
          className="my-2.5 rounded-r-xl border-l-4 border-amber-400 bg-amber-500/10 p-3 text-xs text-amber-100 shadow-sm leading-relaxed"
        >
          <div className="flex items-start gap-2">
            <span className="text-amber-400 font-bold text-sm">💡</span>
            <div className="space-y-1">
              {quoteLines.map((ql, qidx) => (
                <div key={qidx}>{renderInlineMarkdown(ql)}</div>
              ))}
            </div>
          </div>
        </div>
      );
      continue;
    }

    // Markdown Table: lines with | ... |
    if (trimmed.startsWith("|") && trimmed.endsWith("|")) {
      const tableLines: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith("|") && lines[i].trim().endsWith("|")) {
        tableLines.push(lines[i].trim());
        i++;
      }
      i--; // Step back 1 for the loop

      if (tableLines.length >= 2) {
        const headerRow = tableLines[0]
          .split("|")
          .map((c) => c.trim())
          .filter((_, idx, arr) => idx > 0 && idx < arr.length - 1);

        // Check if second row is divider |---|---|
        const hasDivider = /^\|?[\s\-:|]+\|?$/.test(tableLines[1]);
        const dataRows = (hasDivider ? tableLines.slice(2) : tableLines.slice(1)).map((r) =>
          r
            .split("|")
            .map((c) => c.trim())
            .filter((_, idx, arr) => idx > 0 && idx < arr.length - 1)
        );

        elements.push(
          <div
            key={`table-${index++}`}
            className="my-3 overflow-x-auto rounded-xl border border-slate-700/70 bg-slate-900/90 shadow-sm"
          >
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-800/90 text-cyan-300 font-bold border-b border-slate-700">
                <tr>
                  {headerRow.map((h, hidx) => (
                    <th key={hidx} className="px-3 py-2 text-[11px] uppercase tracking-wider font-semibold">
                      {renderInlineMarkdown(h)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {dataRows.map((row, ridx) => (
                  <tr
                    key={ridx}
                    className={`hover:bg-slate-800/40 transition-colors ${
                      ridx % 2 === 0 ? "bg-slate-950/40" : "bg-slate-900/40"
                    }`}
                  >
                    {row.map((cell, cidx) => (
                      <td key={cidx} className="px-3 py-2 text-slate-200 leading-normal">
                        {renderInlineMarkdown(cell)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
        continue;
      }
    }

    // Numbered List: 1. Item
    if (/^\d+[\.\)]\s+/.test(trimmed)) {
      const numMatch = trimmed.match(/^(\d+)[\.\)]\s+(.*)/);
      if (numMatch) {
        elements.push(
          <div key={`num-${index++}`} className="flex items-start gap-2.5 my-1 text-xs">
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-cyan-500/20 text-[10px] font-bold text-cyan-300 border border-cyan-500/40 mt-0.5">
              {numMatch[1]}
            </span>
            <div className="flex-1 text-slate-200 leading-relaxed pt-0.5">
              {renderInlineMarkdown(numMatch[2])}
            </div>
          </div>
        );
        continue;
      }
    }

    // Bullet List: - Item or * Item or • Item
    if (/^[\-\*•]\s+/.test(trimmed)) {
      const itemText = trimmed.replace(/^[\-\*•]\s+/, "");
      elements.push(
        <div key={`bullet-${index++}`} className="flex items-start gap-2 my-1 text-xs">
          <span className="h-1.5 w-1.5 rounded-full bg-indigo-400 mt-2 shrink-0" />
          <div className="flex-1 text-slate-200 leading-relaxed">
            {renderInlineMarkdown(itemText)}
          </div>
        </div>
      );
      continue;
    }

    // Standard Paragraph
    elements.push(
      <p key={`p-${index++}`} className="text-xs text-slate-200 leading-relaxed my-1">
        {renderInlineMarkdown(trimmed)}
      </p>
    );
  }

  return <div className={`space-y-0.5 text-xs text-slate-200 ${className}`}>{elements}</div>;
}
