export interface PLCTag {
  name: string;
  dataType: string;
  address: string;
  comment: string;
}

export interface TaskEvaluationItem {
  id: string;
  label: string;
  passed: boolean;
  expectedCondition: string;
}

export interface TaskData {
  id: number;
  learningOutcome: string;
  title: string;
  titleVi: string;
  summary: string;
  category: 'hardware' | 'theory' | 'math' | 'control' | 'grafcet' | 'derivative';
  pdfPage: number;
  evaluationItems: TaskEvaluationItem[];
  ladDescription: string;
  sclCode: string;
  explanationVi: string;
  tiaPortalSteps: string[];
}

export interface ShockDataRecord {
  id: number;
  timestamp: string;
  elapsedMs: number;
  currentVal: number;
  prevVal: number;
  tsSec: number;
  roc: number;
  absRoc: number;
  shockAlm: boolean;
}

export interface LivePLCState {
  voltage: number;
  rawIW64: number;
  normPct: number;
  scaleV: number;
  engFilt: number;
  hiAlm: boolean;
  loAlm: boolean;
  tankLevel: number;
  pumpCmd: boolean;
  temperature: number;
  qCold: boolean;
  qNormal: boolean;
  qHot: boolean;
  roc: number;
  shockAlm: boolean;
  sampleTimeMs: number;
}

export interface LadderBoxPin {
  pin: string;
  label: string;
  liveValue?: (state: LivePLCState) => string;
}

export interface LadderContactElement {
  kind: 'contact';
  variant: 'NO' | 'NC';
  tag: string;
  address?: string;
  active: (state: LivePLCState) => boolean;
}

export interface LadderCompareElement {
  kind: 'compare';
  op: '<' | '<=' | '>' | '>=' | '==' | 'IN_RANGE';
  dataType: 'Int' | 'Real';
  in1: string;
  in2: string;
  in3?: string;
  liveReadout?: (state: LivePLCState) => string;
  active: (state: LivePLCState) => boolean;
}

export interface LadderCoilElement {
  kind: 'coil';
  variant: 'OUT' | 'SET' | 'RESET';
  tag: string;
  address?: string;
  active: (state: LivePLCState) => boolean;
}

export interface LadderBranchElement {
  kind: 'branch';
  branches: LadderElement[][];
}

export interface LadderBoxElement {
  kind: 'box';
  instruction: 'MOVE' | 'NORM_X' | 'SCALE_X' | 'SUB' | 'MUL' | 'DIV' | 'ABS' | 'SR';
  subLabel?: string;
  inputs: LadderBoxPin[];
  /** Extra rung inputs feeding pins like R (Reset) on SR flip-flops */
  auxInputs?: {
    pin: string;
    elements: LadderElement[];
  }[];
  outputs: LadderBoxPin[];
  active?: (state: LivePLCState) => boolean;
}

export type LadderElement =
  | LadderContactElement
  | LadderCompareElement
  | LadderCoilElement
  | LadderBranchElement
  | LadderBoxElement;

export interface LadderNetwork {
  id: string;
  title: string;
  comment: string;
  rungs: LadderElement[][];
}

export interface TaskLadderProgram {
  taskId: number;
  obBlock: string;
  networks: LadderNetwork[];
}
