<script lang="ts">
	import { resolve } from '$app/paths';
	import LoginButton from '$lib/components/auth/LoginButton.svelte';

	let { data } = $props();
</script>

<svelte:head>
	<title>GitDoc</title>
</svelte:head>

<div class="mx-auto max-w-2xl px-4 py-16 text-center">
	<h1 class="text-4xl font-bold text-gray-900">GitDoc</h1>
	<p class="mt-4 text-lg text-gray-600">基于 Git + Markdown 的团队文档管理工具</p>

	{#if !data.repoConfigured}
		<div class="mt-8 rounded-lg border border-amber-200 bg-amber-50 p-6">
			<p class="text-sm text-amber-800">尚未配置文档仓库，请先完成初始设置。</p>
			<a
				href={resolve('/setup')}
				class="mt-4 inline-block rounded-md bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-500"
			>
				开始配置
			</a>
		</div>
	{:else if data.user}
		<div class="mt-8">
			<a
				href={resolve('/doc')}
				class="inline-block rounded-md bg-gray-900 px-6 py-2.5 text-sm font-medium text-white hover:bg-gray-700"
			>
				浏览文档
			</a>
		</div>
	{:else}
		<div class="mt-8">
			<LoginButton />
		</div>
	{/if}
</div>
