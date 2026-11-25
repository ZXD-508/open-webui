<script lang="ts">
	import { getContext, onMount, tick } from 'svelte';
	import { WEBUI_BASE_URL } from '$lib/constants';
	import {
		COMPANION_STATES,
		companionState,
		companionFrame,
		clampCompanion,
		type CompanionState
	} from './companion';

	export let busy = false;
	export let prompt = '';
	export let responseComplete = false;
	export let active = true;

	const i18n: any = getContext('i18n');
	const atlas = `${WEBUI_BASE_URL}/static/labfocus/fish-companion-pillow-v2.webp`;
	let layer: HTMLDivElement;
	let widget: HTMLDivElement;
	let trigger: HTMLButtonElement;
	let menu: HTMLDivElement;
	let restore: HTMLButtonElement;
	let image: HTMLImageElement | null = null;
	let loadTimer: ReturnType<typeof setTimeout>;
	let ready = false;
	let mounted = false;
	let visible = true;
	let inView = false;
	let pageVisible = true;
	let reducedMotion = false;
	let menuOpen = false;
	let resting = false;
	let typing = false;
	let dragging = false;
	let moved = false;
	let transient: CompanionState | null = null;
	let state: CompanionState = 'idle';
	let frame = 0;
	let startedAt = 0;
	let frameTimer: ReturnType<typeof setTimeout>;
	let actionTimer: ReturnType<typeof setTimeout>;
	let typingTimer: ReturnType<typeof setTimeout>;
	let previousBusy = busy;
	let previousPrompt = prompt;
	let width = 0;
	let height = 0;
	let size = 132;
	let x = 0;
	let y = 0;
	let positioned = false;
	let ignoreClickUntil = 0;
	let pointer: { id: number; x: number; y: number; startX: number; startY: number } | null = null;

	$: zh = ($i18n?.language ?? 'zh').toLowerCase().startsWith('zh');
	$: copy = zh
		? {
				name: '大肥鱼',
				hint: '拖动换个位置 · 点击打招呼',
				hello: '咕噜，我在这里。',
				description: '拖动我换个位置；方向键也可以移动，Home 回到原位。',
				greet: '挥挥手',
				think: '想一想',
				happy: '庆祝',
				rest: '休息',
				wake: '叫醒',
				reset: '回到原位',
				hide: '暂时收起伙伴',
				show: '显示大肥鱼',
				close: '关闭伙伴菜单',
				thinking: '让我想一想…',
				sleeping: '趴在鲸鱼抱枕上睡一会儿',
				drag: '换个位置陪你',
				done: '好啦，接住！',
				fallback: '动画未加载，显示静态伙伴'
			}
		: {
				name: 'Big Fish',
				hint: 'Drag to move · Click to say hello',
				hello: 'I am here.',
				description: 'Drag or use arrow keys to move me. Home resets my position.',
				greet: 'Wave',
				think: 'Think',
				happy: 'Celebrate',
				rest: 'Rest',
				wake: 'Wake up',
				reset: 'Reset position',
				hide: 'Hide companion',
				show: 'Show Big Fish',
				close: 'Close companion menu',
				thinking: 'Thinking…',
				sleeping: 'Sleeping on the whale pillow',
				drag: 'Moving with you',
				done: 'All done!',
				fallback: 'Animation unavailable; showing a still pose'
			};
	$: description = !ready
		? copy.fallback
		: state === 'thinking'
			? copy.thinking
			: state === 'sleep'
				? copy.sleeping
				: state === 'drag'
					? copy.drag
					: state === 'happy'
						? copy.done
						: state === 'greeting'
							? copy.hello
							: copy.hint;
	$: row = COMPANION_STATES.indexOf(state);
	$: menuWidth = Math.min(232, Math.max(160, width - 16));
	$: menuLeft = Math.max(8 - x, Math.min(0, width - x - menuWidth - 8));
	$: menuBelow = y < 210;
	$: observeInput(busy, prompt, responseComplete);
	$: updateState(companionState({ dragging, busy, typing, resting, transient }));
	$: if (mounted) scheduleFrames(active, visible, ready, inView, pageVisible, reducedMotion);
	$: if (mounted) scheduleAtlas(active, visible, inView, pageVisible, reducedMotion);
	$: if (!active) menuOpen = false;

	function scheduleAtlas(
		enabled: boolean,
		shown: boolean,
		seen: boolean,
		page: boolean,
		reduced: boolean
	) {
		clearTimeout(loadTimer);
		if (image || !enabled || !shown || !seen || !page || reduced) return;
		loadTimer = setTimeout(() => {
			image = new Image();
			image.onload = () => {
				ready = true;
			};
			image.src = atlas;
		}, 300);
	}

	function observeInput(nextBusy: boolean, nextPrompt: string, completed: boolean) {
		if (!mounted) return;
		if (nextBusy !== previousBusy) {
			const wasBusy = previousBusy;
			previousBusy = nextBusy;
			clearTimeout(actionTimer);
			transient = null;
			if (nextBusy) resting = false;
			else if (wasBusy && completed) play('happy', 1400);
		}
		if (nextPrompt !== previousPrompt) {
			previousPrompt = nextPrompt;
			clearTimeout(typingTimer);
			typing = Boolean(nextPrompt.trim());
			if (typing)
				typingTimer = setTimeout(() => {
					typing = false;
				}, 1600);
		}
	}

	function updateState(next: CompanionState) {
		if (state === next) return;
		state = next;
		startedAt = performance.now();
		frame = 0;
		if (mounted) scheduleFrames(active, visible, ready, inView, pageVisible, reducedMotion);
	}

	function scheduleFrames(
		enabled: boolean,
		shown: boolean,
		loaded: boolean,
		seen: boolean,
		page: boolean,
		reduced: boolean
	) {
		clearTimeout(frameTimer);
		if (reduced) {
			frame = 0;
			return;
		}
		if (!mounted || !enabled || !shown || !loaded || !seen || !page) return;
		animate();
	}

	function animate() {
		frame = companionFrame(state, performance.now() - startedAt, reducedMotion);
		if ((state === 'greeting' || state === 'happy') && frame === 7) return;
		frameTimer = setTimeout(animate, state === 'idle' || state === 'sleep' ? 250 : 1000 / 9);
	}

	function play(next: CompanionState, duration = 2200) {
		clearTimeout(actionTimer);
		resting = false;
		transient = next;
		// Restart a repeated action, even if the row did not change.
		startedAt = performance.now();
		frame = 0;
		if (state === next) scheduleFrames(active, visible, ready, inView, pageVisible, reducedMotion);
		actionTimer = setTimeout(() => {
			transient = null;
		}, duration);
	}

	function toggleRest() {
		clearTimeout(actionTimer);
		clearTimeout(typingTimer);
		typing = false;
		transient = null;
		resting = !resting;
	}

	function measure(reset = false) {
		if (!layer) return;
		const measuredWidth = layer.clientWidth;
		const measuredHeight = layer.clientHeight;
		// Hidden panes report zero dimensions; keep the last usable bounds and position.
		if (!measuredWidth || !measuredHeight) return;
		width = measuredWidth;
		height = measuredHeight;
		size = width < 600 ? 86 : width < 950 ? 106 : 132;
		if (height < 550) size = Math.min(size, 86);
		if (!positioned || reset) {
			x = width - size - Math.max(22, (width - 720) / 2 - 105);
			y = height / 2 - size - (width < 600 ? 85 : 35);
			positioned = true;
		}
		({ x, y } = clampCompanion(x, y, width, height, size));
	}

	function pointerDown(event: PointerEvent) {
		if (event.button !== 0 || !event.isPrimary) return;
		pointer = { id: event.pointerId, x: event.clientX, y: event.clientY, startX: x, startY: y };
		moved = false;
		trigger.setPointerCapture(event.pointerId);
	}

	function pointerMove(event: PointerEvent) {
		if (!pointer || event.pointerId !== pointer.id) return;
		const dx = event.clientX - pointer.x;
		const dy = event.clientY - pointer.y;
		if (!moved && Math.hypot(dx, dy) <= 6) return;
		moved = true;
		dragging = true;
		menuOpen = false;
		({ x, y } = clampCompanion(pointer.startX + dx, pointer.startY + dy, width, height, size));
	}

	function pointerEnd(event: PointerEvent) {
		if (!pointer || pointer.id !== event.pointerId) return;
		pointer = null;
		dragging = false;
		if (moved) ignoreClickUntil = performance.now() + 300;
		if (trigger.hasPointerCapture(event.pointerId)) trigger.releasePointerCapture(event.pointerId);
	}

	async function greet() {
		if (performance.now() < ignoreClickUntil) return;
		if (menuOpen) {
			closeMenu();
			return;
		}
		menuOpen = true;
		play('greeting');
		await tick();
		menu?.querySelector<HTMLButtonElement>('button')?.focus();
	}

	function closeMenu() {
		menuOpen = false;
		trigger?.focus();
	}

	function menuKeyDown(event: KeyboardEvent) {
		if (!menuOpen || !widget?.contains(event.target as Node) || event.key !== 'Escape') return;
		event.preventDefault();
		event.stopPropagation();
		closeMenu();
	}

	function keyDown(event: KeyboardEvent) {
		if (event.key === 'Escape') {
			closeMenu();
			return;
		}
		if (event.key === 'Home') {
			event.preventDefault();
			measure(true);
			return;
		}
		const direction = {
			ArrowLeft: [-1, 0],
			ArrowRight: [1, 0],
			ArrowUp: [0, -1],
			ArrowDown: [0, 1]
		}[event.key];
		if (!direction) return;
		event.preventDefault();
		const step = event.shiftKey ? 48 : 16;
		({ x, y } = clampCompanion(
			x + direction[0] * step,
			y + direction[1] * step,
			width,
			height,
			size
		));
		play('drag', 600);
	}

	async function hide() {
		visible = false;
		menuOpen = false;
		clearTimeout(actionTimer);
		clearTimeout(typingTimer);
		transient = null;
		typing = false;
		await tick();
		restore?.focus();
	}

	async function show() {
		visible = true;
		await tick();
		measure(true);
		trigger?.focus();
	}

	onMount(() => {
		mounted = true;
		previousBusy = busy;
		previousPrompt = prompt;
		startedAt = performance.now();
		measure();
		const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
		const updateMotion = () => {
			reducedMotion = motion.matches;
		};
		const updateVisibility = () => {
			pageVisible = !document.hidden;
		};
		const dismissMenu = (event: PointerEvent) => {
			if (!widget?.contains(event.target as Node)) menuOpen = false;
		};
		updateMotion();
		updateVisibility();
		motion.addEventListener('change', updateMotion);
		document.addEventListener('visibilitychange', updateVisibility);
		document.addEventListener('pointerdown', dismissMenu);
		const resize = new ResizeObserver(() => measure());
		resize.observe(layer);
		const intersection = new IntersectionObserver(([entry]) => {
			inView = entry.isIntersecting;
		});
		intersection.observe(layer);
		return () => {
			mounted = false;
			clearTimeout(frameTimer);
			clearTimeout(actionTimer);
			clearTimeout(typingTimer);
			clearTimeout(loadTimer);
			if (image) image.onload = null;
			motion.removeEventListener('change', updateMotion);
			document.removeEventListener('visibilitychange', updateVisibility);
			document.removeEventListener('pointerdown', dismissMenu);
			resize.disconnect();
			intersection.disconnect();
		};
	});
</script>

<svelte:window on:keydown={menuKeyDown} />

<div class="companion-layer" bind:this={layer} class:inactive={!active}>
	{#if visible}
		<div
			class="companion-widget"
			bind:this={widget}
			class:dragging
			data-companion-state={state}
			style={`left:${x}px;top:${y}px;width:${size}px;height:${size}px`}
		>
			<button
				type="button"
				class="companion-trigger"
				bind:this={trigger}
				aria-label={`${copy.name} · ${copy.hint}`}
				aria-expanded={menuOpen}
				on:pointerdown={pointerDown}
				on:pointermove={pointerMove}
				on:pointerup={pointerEnd}
				on:pointercancel={pointerEnd}
				on:lostpointercapture={pointerEnd}
				on:click={greet}
				on:keydown={keyDown}
			>
				{#if ready}
					<span
						class="companion-sprite"
						aria-hidden="true"
						data-frame={frame}
						style={`background-image:url('${atlas}');background-position:${(frame / 7) * 100}% ${(row / 5) * 100}%`}
					></span>
				{:else}
					<img src={`${WEBUI_BASE_URL}/static/labfocus/fish-idle.png`} alt="" draggable="false" />
				{/if}
			</button>
			<span class="companion-hint" aria-hidden="true">{description}</span>
			{#if menuOpen}
				<div
					class="companion-menu"
					bind:this={menu}
					role="group"
					aria-label={copy.name}
					style={`left:${menuLeft}px;width:${menuWidth}px;${menuBelow ? 'top:calc(100% + 12px)' : 'bottom:calc(100% + 12px)'}`}
				>
					<div class="companion-menu-title">
						<strong>{copy.hello}</strong>
						<button type="button" aria-label={copy.close} on:click={closeMenu}>×</button>
					</div>
					<p>{copy.description}</p>
					<div class="companion-actions">
						<button type="button" on:click={() => play('greeting')}>{copy.greet}</button>
						<button type="button" on:click={() => play('thinking', 3000)}>{copy.think}</button>
						<button type="button" on:click={() => play('happy')}>{copy.happy}</button>
						<button type="button" on:click={toggleRest} aria-pressed={resting}
							>{resting ? copy.wake : copy.rest}</button
						>
						<button type="button" on:click={() => measure(true)}>{copy.reset}</button>
					</div>
					<button type="button" class="companion-hide" on:click={hide}>{copy.hide}</button>
				</div>
			{/if}
		</div>
	{:else}
		<button type="button" class="companion-restore" bind:this={restore} on:click={show}
			>{copy.show}</button
		>
	{/if}
</div>

<style>
	.companion-layer {
		position: absolute;
		inset: 0;
		z-index: 20;
		pointer-events: none;
		overflow: visible;
	}
	.inactive {
		display: none;
	}
	.companion-widget {
		position: absolute;
		pointer-events: auto;
	}
	.companion-trigger {
		display: block;
		width: 100%;
		height: 100%;
		padding: 0;
		border: 0;
		border-radius: 14px;
		background: transparent;
		cursor: grab;
		touch-action: none;
		user-select: none;
	}
	.dragging .companion-trigger {
		cursor: grabbing;
	}
	.companion-trigger:focus-visible {
		outline: 2px solid var(--dsh-brand);
		outline-offset: 4px;
	}
	.companion-trigger img {
		width: 100%;
		height: 100%;
		object-fit: contain;
	}
	.companion-sprite {
		display: block;
		width: 100%;
		height: 100%;
		background-size: 800% 600%;
		background-repeat: no-repeat;
		filter: drop-shadow(0 5px 5px #26365b14);
	}
	.companion-hint {
		position: absolute;
		top: 100%;
		left: 50%;
		transform: translateX(-50%);
		width: 190px;
		text-align: center;
		font-size: 10px;
		color: var(--dsh-text-muted);
		opacity: 0;
		pointer-events: none;
	}
	.companion-widget:hover .companion-hint,
	.companion-widget:focus-within .companion-hint {
		opacity: 1;
	}
	.companion-menu {
		position: absolute;
		padding: 13px;
		border: 1px solid var(--dsh-border-strong);
		border-radius: 14px;
		background: var(--dsh-bg, #fff);
		color: var(--dsh-text);
		box-shadow: 0 8px 30px #26365b12;
		text-align: left;
	}
	.companion-menu-title {
		display: flex;
		align-items: center;
		justify-content: space-between;
	}
	.companion-menu-title strong {
		font-size: 12px;
		font-weight: 500;
	}
	.companion-menu-title button {
		width: 24px;
		height: 24px;
		font-size: 18px;
		color: var(--dsh-text-muted);
	}
	.companion-menu p {
		margin: 6px 0 10px;
		font-size: 11px;
		line-height: 1.7;
		color: var(--dsh-text-muted);
	}
	.companion-actions {
		display: flex;
		gap: 5px;
		flex-wrap: wrap;
		margin-bottom: 9px;
	}
	.companion-actions button {
		padding: 6px 9px;
		border: 1px solid var(--dsh-border-strong);
		border-radius: 8px;
		font-size: 11px;
		color: var(--dsh-text-secondary);
	}
	.companion-actions button:hover,
	.companion-actions button[aria-pressed='true'] {
		background: var(--dsh-brand-softer);
	}
	.companion-hide {
		font-size: 11px;
		color: var(--dsh-text-muted);
	}
	.companion-restore {
		pointer-events: auto;
		position: absolute;
		right: 16px;
		bottom: 8px;
		font-size: 11px;
		color: var(--dsh-text-muted);
		border-radius: 8px;
		padding: 6px 9px;
		background: var(--dsh-bg);
	}
</style>
