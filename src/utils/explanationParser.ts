export type FormulaToken =
  | { kind: 'text'; value: string }
  | { kind: 'fraction'; numerator: string; denominator: string };

export type ExplanationBlock =
  | { kind: 'title'; text: string }
  | { kind: 'heading'; text: string }
  | { kind: 'formula'; tokens: FormulaToken[] }
  | { kind: 'warning'; text: string }
  | { kind: 'bullet'; text: string }
  | { kind: 'subbullet'; text: string }
  | { kind: 'paragraph'; text: string };

/**
 * Parses a formula expression containing `{numerator} / {denominator}` patterns
 * into structured text and fraction tokens for clean mathematical rendering.
 */
export function parseFormulaTokens(expr: string): FormulaToken[] {
  const tokens: FormulaToken[] = [];
  const fractionRegex = /\{([^{}]+)\}\s*\/\s*\{([^{}]+)\}/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = fractionRegex.exec(expr)) !== null) {
    if (match.index > lastIndex) {
      tokens.push({ kind: 'text', value: expr.slice(lastIndex, match.index) });
    }
    tokens.push({
      kind: 'fraction',
      numerator: match[1].trim(),
      denominator: match[2].trim(),
    });
    lastIndex = fractionRegex.lastIndex;
  }

  if (lastIndex < expr.length) {
    tokens.push({ kind: 'text', value: expr.slice(lastIndex) });
  }

  return tokens.length > 0 ? tokens : [{ kind: 'text', value: expr }];
}

/**
 * Parses Vietnamese explanation prose into structured UI blocks
 * (headings, stacked math formula cards, warnings, bullets, paragraphs).
 */
export function parseExplanationBlocks(raw: string): ExplanationBlock[] {
  const lines = raw.split('\n');
  const blocks: ExplanationBlock[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    if (trimmed.startsWith('FORMULA:')) {
      const expr = trimmed.slice('FORMULA:'.length).trim();
      blocks.push({ kind: 'formula', tokens: parseFormulaTokens(expr) });
      continue;
    }

    if (trimmed.startsWith('⚠️')) {
      blocks.push({ kind: 'warning', text: trimmed.replace(/^⚠️\s*/, '') });
      continue;
    }

    if (/^\d+\.\s+[A-ZÀ-Ỹ0-9]/.test(trimmed)) {
      blocks.push({ kind: 'heading', text: trimmed });
      continue;
    }

    if (line.startsWith('  + ')) {
      blocks.push({ kind: 'subbullet', text: line.slice(4).trim() });
      continue;
    }

    if (trimmed.startsWith('- ')) {
      blocks.push({ kind: 'bullet', text: trimmed.slice(2).trim() });
      continue;
    }

    if (trimmed.endsWith(':') && trimmed === trimmed.toUpperCase()) {
      blocks.push({ kind: 'title', text: trimmed });
      continue;
    }

    blocks.push({ kind: 'paragraph', text: trimmed });
  }

  return blocks;
}
