export const COMPANION_STATES = ['idle', 'greeting', 'thinking', 'happy', 'sleep', 'drag'] as const;
export type CompanionState = (typeof COMPANION_STATES)[number];
export const COMPANION_COLUMNS = 8;

export function companionState(context: {
	dragging: boolean;
	busy: boolean;
	typing: boolean;
	resting: boolean;
	transient: CompanionState | null;
}): CompanionState {
	if (context.dragging) return 'drag';
	if (context.busy || context.typing) return 'thinking';
	return context.transient ?? (context.resting ? 'sleep' : 'idle');
}

export function companionFrame(state: CompanionState, elapsed: number, reducedMotion = false) {
	if (reducedMotion) return 0;
	const fps = state === 'idle' || state === 'sleep' ? 4 : 9;
	const step = Math.floor((Math.max(0, elapsed) * fps) / 1000);
	return state === 'greeting' || state === 'happy'
		? Math.min(step, COMPANION_COLUMNS - 1)
		: step % COMPANION_COLUMNS;
}

export function clampCompanion(x: number, y: number, width: number, height: number, size: number) {
	const inset = 8;
	return {
		x: Math.min(Math.max(inset, x), Math.max(inset, width - size - inset)),
		y: Math.min(Math.max(inset, y), Math.max(inset, height - size - inset))
	};
}
