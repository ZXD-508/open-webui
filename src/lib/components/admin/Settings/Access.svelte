<script lang="ts">
	import { onMount, getContext } from 'svelte';
	import { toast } from 'svelte-sonner';

	import { getBackendConfig } from '$lib/apis';
	import { getAdminConfig, updateAdminConfig } from '$lib/apis/auths';
	import { config } from '$lib/stores';
	import Switch from '$lib/components/common/Switch.svelte';
	import AdminSettingRow from './AdminSettingRow.svelte';
	import AdminSettingSection from './AdminSettingSection.svelte';
	import AdminSettingSaveButton from './AdminSettingSaveButton.svelte';

	const i18n: any = getContext('i18n');

	export let saveHandler: Function;

	let adminConfig: any = null;
	let savedConfig: Record<string, any> | null = null;
	let saving = false;

	$: settings = adminConfig ?? {};
	$: adminKeyShared = Boolean(adminConfig?.ENABLE_ADMIN_KEY_SHARING);
	$: freeChat = Boolean(adminConfig?.ENABLE_FREE_CHAT);
	$: freeChatEffective = adminKeyShared && freeChat;

	const updateHandler = async () => {
		if (!adminConfig || saving) return;

		saving = true;
		try {
			const res = await updateAdminConfig(localStorage.token, adminConfig);
			if (!res) throw new Error($i18n.t('Failed to update settings'));

			adminConfig = { ...adminConfig, ...res };
			savedConfig = structuredClone(adminConfig);
			await config.set(await getBackendConfig());
			saveHandler();
		} catch (error) {
			toast.error(
				error instanceof Error
					? error.message
					: Array.isArray(error)
						? error.map((entry) => entry.msg).join('\n')
						: String(error)
			);
		} finally {
			saving = false;
		}
	};

	onMount(async () => {
		adminConfig = await getAdminConfig(localStorage.token);
		savedConfig = structuredClone(adminConfig);
	});
</script>

<form
	class="flex h-full flex-col justify-between text-sm"
	on:submit|preventDefault={async () => {
		updateHandler();
	}}
>
	<h2 class="text-sm font-medium text-gray-900 dark:text-white mb-4">
		{$i18n.t('Access & billing')}
	</h2>

	<div class="flex-1 min-h-0 overflow-y-auto scrollbar-hover pr-1.5">
		{#if adminConfig}
			<AdminSettingSection title={$i18n.t('Admin API key')} first>
				<AdminSettingRow
					label={$i18n.t('Allow users to use the admin key')}
					description={$i18n.t(
						'When on, normal users can use the model connections and API key configured here. When off, they can only use their own connections.'
					)}
					let:labelId
				>
					<Switch
						bind:state={adminConfig.ENABLE_ADMIN_KEY_SHARING}
						ariaLabelledbyId={labelId}
					/>
				</AdminSettingRow>

				<AdminSettingRow
					label={$i18n.t('Free chat')}
					description={$i18n.t(
						'When on, normal users can chat without entering their own key. When off, they must use their own key.'
					)}
					let:labelId
				>
					<Switch bind:state={adminConfig.ENABLE_FREE_CHAT} ariaLabelledbyId={labelId} />
				</AdminSettingRow>
			</AdminSettingSection>

			<div
				class="mt-4 flex items-start gap-2 rounded-xl border border-gray-100 bg-gray-50/60 px-3 py-2.5 text-xs text-gray-600 dark:border-gray-850 dark:bg-gray-900/40 dark:text-gray-300"
			>
				<span
					class="mt-1 size-2 shrink-0 rounded-full {freeChatEffective
						? 'bg-emerald-500'
						: 'bg-gray-400 dark:bg-gray-600'}"
					aria-hidden="true"
				></span>
				<div>
					{#if freeChatEffective}
						{$i18n.t('Normal users can chat for free using the admin key.')}
					{:else}
						{$i18n.t('Normal users must use their own key to chat.')}
					{/if}
				</div>
			</div>
		{/if}
	</div>

	<div class="flex justify-end pt-6 text-sm font-normal">
		<AdminSettingSaveButton
			{settings}
			{savedConfig}
			labels={{
				ENABLE_ADMIN_KEY_SHARING: $i18n.t('Allow users to use the admin key'),
				ENABLE_FREE_CHAT: $i18n.t('Free chat')
			}}
			disabled={saving || !adminConfig}
		/>
	</div>
</form>
