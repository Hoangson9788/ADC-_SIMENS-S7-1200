import { LadderElement, LivePLCState, TaskLadderProgram } from '../types';

/**
 * Evaluates whether a single Ladder element passes power flow (TRUE / energized)
 * given the current PLC state and incoming rail power.
 */
export function evaluateElementFlow(
  el: LadderElement,
  state: LivePLCState,
  powerIn: boolean
): boolean {
  if (!powerIn) return false;

  switch (el.kind) {
    case 'contact':
      return el.active(state);
    case 'compare':
      return el.active(state);
    case 'coil':
      return powerIn;
    case 'branch':
      return el.branches.some((branch) => evaluateRungFlow(branch, state, powerIn));
    case 'box':
      return el.active ? el.active(state) : powerIn;
  }
}

/**
 * Evaluates sequential power flow from left to right across a Ladder rung.
 */
export function evaluateRungFlow(
  elements: LadderElement[],
  state: LivePLCState,
  initialPower = true
): boolean {
  let power = initialPower;
  for (const el of elements) {
    power = evaluateElementFlow(el, state, power);
  }
  return power;
}

/**
 * Formats a TaskLadderProgram into readable ASCII Ladder notation for copying.
 */
export function formatLadderAsText(program: TaskLadderProgram): string {
  const lines: string[] = [
    `// ============================================================================`,
    `// TIA PORTAL LADDER LOGIC (LAD) - TASK ${program.taskId} (${program.obBlock})`,
    `// ============================================================================`,
    '',
  ];

  const renderEl = (el: LadderElement): string => {
    switch (el.kind) {
      case 'contact':
        return el.variant === 'NO'
          ? `[ ${el.tag}${el.address ? ` (${el.address})` : ''} ]`
          : `[/ ${el.tag}${el.address ? ` (${el.address})` : ''} ]`;
      case 'compare':
        return el.op === 'IN_RANGE'
          ? `[ IN_RANGE: ${el.in1} <= ${el.in2} <= ${el.in3} (${el.dataType}) ]`
          : `[ CMP ${el.op} (${el.dataType}): ${el.in1} ${el.op} ${el.in2} ]`;
      case 'coil': {
        const sym = el.variant === 'SET' ? '(S)' : el.variant === 'RESET' ? '(R)' : '( )';
        return `--${sym} "${el.tag}"${el.address ? ` (${el.address})` : ''}`;
      }
      case 'branch':
        return `(${el.branches.map((b) => b.map(renderEl).join(' -- ')).join('  ||  ')})`;
      case 'box': {
        const pins = el.inputs.map((i) => `${i.pin}:=${i.label}`).join(', ');
        const outs = el.outputs.map((o) => `${o.pin}=>${o.label}`).join(', ');
        const aux = el.auxInputs
          ? el.auxInputs.map((a) => `; ${a.pin}: ${a.elements.map(renderEl).join(' -- ')}`).join('')
          : '';
        return `[ ${el.instruction}${el.subLabel ? ` (${el.subLabel})` : ''} | ${pins}${aux} | ${outs} ]`;
      }
    }
  };

  for (const net of program.networks) {
    lines.push(`${net.title}`);
    if (net.comment) lines.push(`// ${net.comment}`);
    for (const rung of net.rungs) {
      lines.push(`|-- ${rung.map(renderEl).join(' -- ')} --|`);
    }
    lines.push('');
  }

  return lines.join('\n');
}
