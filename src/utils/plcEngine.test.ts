import test from 'node:test';
import assert from 'node:assert/strict';
import {
  computeAnalogPipeline,
  rawCountsToVoltage,
  evaluateCleanroomHysteresis,
  evaluateTankPumpHysteresis,
  evaluateTemperatureZone,
  computeRoC,
} from './plcEngine';

test('Analog pipeline scales 0V, 5V, 10V accurately to S7-1200 standards', () => {
  const at0 = computeAnalogPipeline(0);
  assert.equal(at0.rawIW64, 0);
  assert.equal(at0.normPct, 0);
  assert.equal(at0.scaleV, 0);

  const at5 = computeAnalogPipeline(5);
  assert.equal(at5.rawIW64, 13824);
  assert.equal(at5.normPct, 0.5);
  assert.equal(at5.scaleV, 5.0);
  assert.equal(at5.engFilt, 50.0);

  const at10 = computeAnalogPipeline(10);
  assert.equal(at10.rawIW64, 27648);
  assert.equal(at10.normPct, 1.0);
  assert.equal(at10.scaleV, 10.0);
});

test('rawCountsToVoltage converts PLCSIM IW64 counts to voltage safely', () => {
  assert.equal(rawCountsToVoltage(0), 0);
  assert.equal(rawCountsToVoltage(13824), 5);
  assert.equal(rawCountsToVoltage(27648), 10);
  assert.equal(rawCountsToVoltage(32000), 10);
  assert.equal(rawCountsToVoltage(-500), 0);
});

test('Cleanroom hysteresis maintains latch state inside 2% deadband', () => {
  let state = { hiAlm: false, loAlm: false };

  // Drop below 20% -> LoAlm ON
  state = evaluateCleanroomHysteresis(19, state);
  assert.equal(state.loAlm, true);
  assert.equal(state.hiAlm, false);

  // Rise into deadband 21% -> LoAlm stays ON
  state = evaluateCleanroomHysteresis(21, state);
  assert.equal(state.loAlm, true);

  // Rise above 22% -> LoAlm OFF
  state = evaluateCleanroomHysteresis(23, state);
  assert.equal(state.loAlm, false);

  // Rise above 80% -> HiAlm ON
  state = evaluateCleanroomHysteresis(81, state);
  assert.equal(state.hiAlm, true);

  // Drop into deadband 79% -> HiAlm stays ON
  state = evaluateCleanroomHysteresis(79, state);
  assert.equal(state.hiAlm, true);

  // Drop below 78% -> HiAlm OFF
  state = evaluateCleanroomHysteresis(77, state);
  assert.equal(state.hiAlm, false);
});

test('Tank pump hysteresis obeys 30% ON, 70% OFF, and latches in [30%, 70%]', () => {
  assert.equal(evaluateTankPumpHysteresis(25, false), true);
  assert.equal(evaluateTankPumpHysteresis(50, true), true);
  assert.equal(evaluateTankPumpHysteresis(75, true), false);
  assert.equal(evaluateTankPumpHysteresis(50, false), false);
});

test('Temperature zone classification activates exactly one zone', () => {
  const cold = evaluateTemperatureZone(10);
  assert.deepEqual(cold, { qCold: true, qNormal: false, qHot: false, zoneLabel: 'COLD' });

  const boundaryLow = evaluateTemperatureZone(15);
  assert.deepEqual(boundaryLow, { qCold: false, qNormal: true, qHot: false, zoneLabel: 'NORMAL' });

  const normal = evaluateTemperatureZone(22);
  assert.deepEqual(normal, { qCold: false, qNormal: true, qHot: false, zoneLabel: 'NORMAL' });

  const boundaryHigh = evaluateTemperatureZone(30);
  assert.deepEqual(boundaryHigh, { qCold: false, qNormal: true, qHot: false, zoneLabel: 'NORMAL' });

  const hot = evaluateTemperatureZone(35);
  assert.deepEqual(hot, { qCold: false, qNormal: false, qHot: true, zoneLabel: 'HOT' });
});

test('RoC shock detection accounts for Ts=10ms and Ts=20ms', () => {
  // Change of 0.5% over 10ms = 50 %/s -> ShockAlm ON
  const fast10 = computeRoC(50.5, 50.0, 10);
  assert.equal(Math.round(fast10.roc), 50);
  assert.equal(fast10.shockAlm, true);

  // Same 0.5% change over 20ms = 25 %/s -> ShockAlm OFF
  const slow20 = computeRoC(50.5, 50.0, 20);
  assert.equal(Math.round(slow20.roc), 25);
  assert.equal(slow20.shockAlm, false);

  // Negative shock > 30 %/s
  const negFast = computeRoC(40.0, 41.0, 10);
  assert.equal(Math.round(negFast.roc), -100);
  assert.equal(negFast.absRoc, 100);
  assert.equal(negFast.shockAlm, true);
});
