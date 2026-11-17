export interface AnalogPipelineResult {
  voltage: number;
  rawIW64: number;
  normPct: number;
  scaleV: number;
  engFilt: number;
}

export interface CleanroomAlarmState {
  hiAlm: boolean;
  loAlm: boolean;
}

export interface TemperatureZoneState {
  qCold: boolean;
  qNormal: boolean;
  qHot: boolean;
  zoneLabel: 'COLD' | 'NORMAL' | 'HOT';
}

export interface RoCResult {
  roc: number;
  absRoc: number;
  shockAlm: boolean;
}

export function clampVoltage(v: number): number {
  if (!Number.isFinite(v)) return 0;
  return Math.min(10.0, Math.max(0.0, v));
}

export function computeAnalogPipeline(voltageInput: number): AnalogPipelineResult {
  const voltage = clampVoltage(voltageInput);
  const rawIW64 = Math.round((voltage / 10.0) * 27648);
  const normPct = rawIW64 / 27648;
  const scaleV = normPct * 10.0;
  const engFilt = normPct * 100.0;
  return {
    voltage,
    rawIW64,
    normPct,
    scaleV,
    engFilt,
  };
}

export function rawCountsToVoltage(rawCounts: number): number {
  if (!Number.isFinite(rawCounts)) return 0;
  const clamped = Math.min(27648, Math.max(0, Math.round(rawCounts)));
  return Math.round(((clamped / 27648) * 10.0) * 1000) / 1000;
}

export function evaluateCleanroomHysteresis(
  engFilt: number,
  prevState: CleanroomAlarmState,
  hiSet = 80.0,
  loSet = 20.0,
  deadband = 2.0
): CleanroomAlarmState {
  let hiAlm = prevState.hiAlm;
  if (engFilt > hiSet) {
    hiAlm = true;
  } else if (engFilt < hiSet - deadband) {
    hiAlm = false;
  }

  let loAlm = prevState.loAlm;
  if (engFilt < loSet) {
    loAlm = true;
  } else if (engFilt > loSet + deadband) {
    loAlm = false;
  }

  return { hiAlm, loAlm };
}

export function evaluateTankPumpHysteresis(
  tankLevelPct: number,
  prevPumpCmd: boolean,
  lowLimit = 30.0,
  highLimit = 70.0
): boolean {
  if (tankLevelPct < lowLimit) return true;
  if (tankLevelPct > highLimit) return false;
  return prevPumpCmd;
}

export function evaluateTemperatureZone(tempC: number): TemperatureZoneState {
  const qCold = tempC < 15.0;
  const qNormal = tempC >= 15.0 && tempC <= 30.0;
  const qHot = tempC > 30.0;
  const zoneLabel = qCold ? 'COLD' : qNormal ? 'NORMAL' : 'HOT';
  return { qCold, qNormal, qHot, zoneLabel };
}

export function computeRoC(
  currentPct: number,
  prevPct: number,
  sampleTimeMs: number,
  threshold = 30.0
): RoCResult {
  const tsSec = Math.max(0.001, sampleTimeMs / 1000.0);
  const rawRoc = (currentPct - prevPct) / tsSec;
  const roc = Math.abs(rawRoc) < 0.2 ? 0 : rawRoc;
  const absRoc = Math.abs(roc);
  return {
    roc,
    absRoc,
    shockAlm: absRoc > threshold,
  };
}
