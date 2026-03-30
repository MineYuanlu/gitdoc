<script lang="ts">
	import { resolve } from '$app/paths';

	let { data } = $props();
</script>

<svelte:head>
	<title>文档 - GitDoc</title>
</svelte:head>

<h1 class="mb-6 text-2xl font-bold text-gray-900">文档总览</h1>

{#if data.sections.length === 0}
	<p class="text-sm text-gray-500">暂无章节</p>
{:else}
	<div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
		{#each data.sections as section}
			<a
				href={resolve(`/doc/${section.name}`)}
				class="rounded-lg border border-gray-200 p-5 hover:border-gray-300 hover:bg-gray-50"
			>
				<p class="text-lg font-medium text-gray-900">{section.name}</p>
				<p class="mt-1 text-sm text-gray-500">{section.docs.length} 篇文档</p>
			</a>
		{/each}
	</div>
{/if}
