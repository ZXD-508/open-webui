import { describe, expect, it } from 'vitest';
import { companionState, companionFrame, clampCompanion, COMPANION_STATES } from './companion';

const idle = { dragging: false, busy: false, typing: false, resting: false, transient: null };
describe('companion state and atlas', () => {
	it('keeps drag and real model work ahead of cosmetic actions', () => {
		expect(companionState(idle)).toBe('idle');
		expect(companionState({ ...idle, resting: true })).toBe('sleep');
		expect(companionState({ ...idle, busy: true, resting: true, transient: 'happy' })).toBe(
			'thinking'
		);
		expect(companionState({ ...idle, typing: true })).toBe('thinking');
		expect(companionState({ ...idle, dragging: true, busy: true })).toBe('drag');
		expect(companionState({ ...idle, transient: 'greeting' })).toBe('greeting');
	});
	it('maps all six rows and freezes reduced motion at frame zero', () => {
		expect(COMPANION_STATES).toEqual(['idle', 'greeting', 'thinking', 'happy', 'sleep', 'drag']);
		for (const state of COMPANION_STATES) expect(companionFrame(state, 10000, true)).toBe(0);
		expect(companionFrame('idle', 250)).toBe(1);
		expect(companionFrame('sleep', 2000)).toBe(0);
		expect(companionFrame('happy', 2000)).toBe(7);
		expect(companionFrame('greeting', 2000)).toBe(7);
	});
	it('clamps movement and remains square in small areas', () => {
		expect(clampCompanion(-200, -300, 800, 600, 132)).toEqual({ x: 8, y: 8 });
		expect(clampCompanion(900, 700, 800, 600, 132)).toEqual({ x: 660, y: 460 });
		expect(clampCompanion(900, 700, 40, 40, 86)).toEqual({ x: 8, y: 8 });
	});
});
