import test from 'node:test';
import assert from 'node:assert/strict';
import { LAB_TASKS } from '../data/labData.ts';
import { parseExplanationBlocks, parseFormulaTokens } from './explanationParser.ts';

test('All 10 tasks have zero raw LaTeX syntax or dollar delimiters in explanationVi', () => {
  const forbiddenPatterns = [
    /\$[^$]*\$/,
    /\\frac/,
    /\\text/,
    /\\approx/,
    /\\rightarrow/,
    /\\times/,
    /\\le/,
    /\\ge/,
    /`/,
  ];

  for (const task of LAB_TASKS) {
    for (const pattern of forbiddenPatterns) {
      assert.equal(
        pattern.test(task.explanationVi),
        false,
        `Task ${task.id} explanationVi still contains raw syntax matching ${pattern}`
      );
    }
    const blocks = parseExplanationBlocks(task.explanationVi);
    assert.ok(blocks.length > 0, `Task ${task.id} must produce parsed explanation blocks`);
  }
});

test('parseFormulaTokens converts {numerator} / {denominator} into fraction tokens', () => {
  const tokens = parseFormulaTokens('RoC(t) ≈ {d y(t)} / {d t} ≈ {y[k] - y[k - 1]} / {Ts}');
  const fractions = tokens.filter((t) => t.kind === 'fraction');
  assert.equal(fractions.length, 2);
  assert.deepEqual(fractions[0], {
    kind: 'fraction',
    numerator: 'd y(t)',
    denominator: 'd t',
  });
  assert.deepEqual(fractions[1], {
    kind: 'fraction',
    numerator: 'y[k] - y[k - 1]',
    denominator: 'Ts',
  });
});

test('Task 4 and Task 10 produce structured formula blocks', () => {
  const t4Formulas = parseExplanationBlocks(LAB_TASKS[3].explanationVi).filter(
    (b) => b.kind === 'formula'
  );
  assert.equal(t4Formulas.length, 2);

  const t10Formulas = parseExplanationBlocks(LAB_TASKS[9].explanationVi).filter(
    (b) => b.kind === 'formula'
  );
  assert.equal(t10Formulas.length, 4);
});
