<script lang="ts">
	import { SITE_NAME } from '$lib/theme/brand';
</script>

<div class="labfocus-site-brand">
	<div class="min-w-0">
		<div class="labfocus-site-name">{SITE_NAME}</div>
	</div>
</div>

<style>
	.labfocus-site-brand {
		display: flex;
		align-items: center;
		gap: 7px;
		min-width: 0;
	}
	.labfocus-site-name {
		color: var(--dsh-text);
		font-size: 19px;
		font-weight: 600;
		letter-spacing: -0.03em;
		line-height: 1.2;
	}
</style>
