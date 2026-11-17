import test from 'node:test';
import assert from 'node:assert/strict';
import { TASK_LADDER_PROGRAMS } from '../data/ladderNetworks.ts';
import { evaluateRungFlow, formatLadderAsText } from './ladderEvaluator.ts';
import { LivePLCState } from '../types.ts';

function makeState(overrides: Partial<LivePLCState> = {}): LivePLCState {
  return {
    voltage: 5.0,
    rawIW64: 13824,
    normPct: 0.5,
    scaleV: 5.0,
    engFilt: 50.0,
    hiAlm: false,
    loAlm: false,
    tankLevel: 50.0,
    pumpCmd: false,
    temperature: 22.0,
    qCold: false,
    qNormal: true,
    qHot: false,
    roc: 0,
    shockAlm: false,
    sampleTimeMs: 10,
    ...overrides,
  };
}

test('Every task 1..10 has a complete TIA Portal Ladder program and formatted LAD text', () => {
  for (let id = 1; id <= 10; id++) {
    const prog = TASK_LADDER_PROGRAMS[id];
    assert.ok(prog, `Task ${id} must have a Ladder program`);
    assert.ok(prog.networks.length >= 1, `Task ${id} must have at least 1 Ladder network`);
    const ascii = formatLadderAsText(prog);
    assert.ok(ascii.includes(`TASK ${id}`), `Formatted LAD text for Task ${id} includes header`);
    assert.ok(ascii.includes('Network 1'), `Formatted LAD text for Task ${id} includes Network 1`);
  }
});

test('Task 6 Cleanroom SR Ladder rungs reflect HiAlm and LoAlm states', () => {
  const prog = TASK_LADDER_PROGRAMS[6];
  const hiRung = prog.networks[1].rungs[0];
  const loRung = prog.networks[2].rungs[0];

  const hiState = makeState({ engFilt: 85.0, hiAlm: true });
  assert.equal(evaluateRungFlow(hiRung, hiState), true);
  assert.equal(evaluateRungFlow(loRung, hiState), false);

  const loState = makeState({ engFilt: 15.0, loAlm: true });
  assert.equal(evaluateRungFlow(hiRung, loState), false);
  assert.equal(evaluateRungFlow(loRung, loState), true);
});

test('Task 7 Seal-in Latch Ladder rung maintains Pump_CMD inside [30%, 70%] deadband', () => {
  const sealInRung = TASK_LADDER_PROGRAMS[7].networks[1].rungs[0];

  // At 25% -> Pump turns ON regardless of prior state
  assert.equal(evaluateRungFlow(sealInRung, makeState({ tankLevel: 25, pumpCmd: false })), true);

  // At 55% with Pump_CMD latched ON -> remains energized
  assert.equal(evaluateRungFlow(sealInRung, makeState({ tankLevel: 55, pumpCmd: true })), true);

  // At 55% with Pump_CMD OFF -> remains de-energized
  assert.equal(evaluateRungFlow(sealInRung, makeState({ tankLevel: 55, pumpCmd: false })), false);

  // At 75% -> breaks seal-in circuit even if Pump_CMD was true
  assert.equal(evaluateRungFlow(sealInRung, makeState({ tankLevel: 75, pumpCmd: true })), false);
});

test('Task 9 Temperature comparators energize mutually exclusive rungs at 10C, 22C, 35C', () => {
  const prog = TASK_LADDER_PROGRAMS[9];
  const coldRung = prog.networks[0].rungs[0];
  const normRung = prog.networks[1].rungs[0];
  const hotRung = prog.networks[2].rungs[0];

  const s10 = makeState({ temperature: 10, qCold: true, qNormal: false, qHot: false });
  assert.equal(evaluateRungFlow(coldRung, s10), true);
  assert.equal(evaluateRungFlow(normRung, s10), false);
  assert.equal(evaluateRungFlow(hotRung, s10), false);

  const s22 = makeState({ temperature: 22, qCold: false, qNormal: true, qHot: false });
  assert.equal(evaluateRungFlow(coldRung, s22), false);
  assert.equal(evaluateRungFlow(normRung, s22), true);
  assert.equal(evaluateRungFlow(hotRung, s22), false);

  const s35 = makeState({ temperature: 35, qCold: false, qNormal: false, qHot: true });
  assert.equal(evaluateRungFlow(coldRung, s35), false);
  assert.equal(evaluateRungFlow(normRung, s35), false);
  assert.equal(evaluateRungFlow(hotRung, s35), true);
});

test('Task 10 OB30 Ladder DIV denominator adapts to Ts=20ms and ShockAlm energizes > 30%/s', () => {
  const prog = TASK_LADDER_PROGRAMS[10];
  const divBox = prog.networks[1].rungs[0][0];
  assert.equal(divBox.kind, 'box');
  if (divBox.kind === 'box') {
    const tsPin = divBox.inputs.find((p) => p.pin === 'IN2');
    assert.ok(tsPin?.liveValue);
    assert.equal(tsPin.liveValue(makeState({ sampleTimeMs: 10 })), '0.010');
    assert.equal(tsPin.liveValue(makeState({ sampleTimeMs: 20 })), '0.020');
  }

  const shockRung = prog.networks[2].rungs[0];
  assert.equal(evaluateRungFlow(shockRung, makeState({ roc: 5, shockAlm: false })), false);
  assert.equal(evaluateRungFlow(shockRung, makeState({ roc: -120, shockAlm: true })), true);
});
