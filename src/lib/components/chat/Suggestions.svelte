<script lang="ts">
	import Fuse from 'fuse.js';
	import Bolt from '$lib/components/icons/Bolt.svelte';
	import { getContext } from 'svelte';
	import { settings, WEBUI_NAME } from '$lib/stores';
	import { WEBUI_VERSION } from '$lib/constants';

	const i18n: any = getContext('i18n');
	type PromptSuggestion = { id?: string; title?: string[]; content: string };
	export let suggestionPrompts: PromptSuggestion[] = [];
	export let className = '';
	export let compact = false;
	export let inputValue = '';
	export let onSelect = (_value: { type: string; data: string }) => {};

	let sortedPrompts: PromptSuggestion[] = [];
	let filteredPrompts: PromptSuggestion[] = [];
	let fuse: Fuse<PromptSuggestion>;
	const arraysEqual = (a: PromptSuggestion[], b: PromptSuggestion[]) => a.length === b.length && a.every((item, i) => item === b[i]);
	const getFilteredPrompts = (inputValue: string) => {
		const next =
			inputValue.length > 500
				? []
				: inputValue.trim() && fuse
					? fuse.search(inputValue.trim()).map((result) => result.item)
					: sortedPrompts;
		if (!arraysEqual(filteredPrompts, next)) filteredPrompts = next;
	};
	$: if (suggestionPrompts)
		sortedPrompts = [...(suggestionPrompts ?? [])].sort(() => Math.random() - 0.5);
	$: fuse = new Fuse(sortedPrompts, { keys: ['content', 'title'], threshold: 0.5 });
	$: if (fuse) getFilteredPrompts(inputValue);
</script>

<div class:compact>
	<div class="mb-1 flex gap-1 text-xs font-normal items-center text-gray-600 dark:text-gray-400">
		{#if filteredPrompts.length > 0}
			{#if !compact}<Bolt />{/if}
			<h3 id="suggestions-heading" class:sr-only={compact}>{$i18n.t('Suggested')}</h3>
		{:else}
			<div
				class="flex w-full {$settings?.landingPageMode === 'chat'
					? '-mt-1'
					: 'text-center items-center justify-center'} self-start text-gray-600 dark:text-gray-400"
			>
				<!-- LICENSE covers this Open WebUI footer identifier.
				Do not alter, remove, obscure, or replace it except as LICENSE permits:
				https://docs.openwebui.com/license. -->
				{$WEBUI_NAME} ‧ v{WEBUI_VERSION}
			</div>
		{/if}
	</div>
	<div class={compact ? '' : 'h-36 w-full'}>
		{#if filteredPrompts.length > 0}
			<div
				role="list"
				aria-labelledby="suggestions-heading"
				class={compact
					? `compact-prompts ${className}`
					: `max-h-36 overflow-auto scrollbar-none items-start ${className}`}
			>
				{#each filteredPrompts as prompt, idx (prompt.id || `${prompt.content}-${idx}`)}
					<div role="listitem" class="contents">
						<button
							type="button"
							class={compact
								? 'prompt-pill'
								: 'waterfall flex flex-col flex-1 shrink-0 w-full justify-between px-2.5 py-1.5 rounded-lg bg-transparent transition-colors hover:text-gray-950 dark:hover:text-white group'}
							style={compact ? '' : `animation-delay: ${idx * 45}ms`}
							title={prompt.content}
							on:click={() => onSelect({ type: 'prompt', data: prompt.content })}
						>
							{#if compact}
								<span>{prompt.title?.[0] || prompt.content}</span>
							{:else}
								<div class="flex flex-col text-left leading-snug">
									{#if prompt.title && prompt.title[0] !== ''}
										<div
											class="text-sm font-normal group-hover:text-gray-950 dark:text-gray-300 dark:group-hover:text-white transition line-clamp-1"
										>
											{prompt.title[0]}
										</div>
										<div
											class="text-xs text-gray-600 group-hover:text-gray-900 dark:text-gray-400 dark:group-hover:text-gray-100 font-normal line-clamp-1"
										>
											{prompt.title[1]}
										</div>
									{:else}
										<div
											class="text-sm font-normal group-hover:text-gray-950 dark:text-gray-300 dark:group-hover:text-white transition line-clamp-1"
										>
											{prompt.content}
										</div>
										<div
											class="text-xs text-gray-600 group-hover:text-gray-900 dark:text-gray-400 dark:group-hover:text-gray-100 font-normal line-clamp-1"
										>
											{$i18n.t('Prompt')}
										</div>
									{/if}
								</div>
							{/if}
						</button>
					</div>
				{/each}
			</div>
		{/if}
	</div>
</div>

<style>
	.compact-prompts {
		display: flex;
		flex-wrap: wrap;
		justify-content: center;
		gap: 8px;
	}
	.prompt-pill {
		max-width: 100%;
		padding: 8px 12px;
		border: 1px solid var(--dsh-border-strong);
		border-radius: 18px;
		background: var(--dsh-bg, #fff);
		color: var(--dsh-text-secondary);
		font-size: 12px;
		font-weight: 400;
		line-height: 1.6;
		text-align: left;
	}
	.prompt-pill span {
		display: -webkit-box;
		-webkit-line-clamp: 1;
		line-clamp: 1;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}
	.prompt-pill:hover {
		background: var(--dsh-brand-softer);
		border-color: var(--dsh-text-muted);
	}
	@keyframes fadeInUp {
		from {
			opacity: 0;
			transform: translateY(6px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}
	.waterfall {
		opacity: 0;
		animation: fadeInUp 200ms ease forwards;
	}
	@media (prefers-reduced-motion: reduce) {
		.waterfall {
			animation: none;
			opacity: 1;
		}
	}
</style>
