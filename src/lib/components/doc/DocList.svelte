<script lang="ts">
	import { resolve } from '$app/paths';

	interface DocItem {
		name: string;
		title: string;
		updatedAt: string;
	}

	let { section, docs }: { section: string; docs: DocItem[] } = $props();
</script>

{#if docs.length === 0}
	<p class="py-8 text-center text-sm text-gray-500">该章节暂无文档</p>
{:else}
	<div class="grid gap-3">
		{#each docs as doc}
			<a
				href={resolve(`/doc/${section}/${doc.name}`)}
				class="block rounded-lg border border-gray-200 p-4 hover:border-gray-300 hover:bg-gray-50"
			>
				<p class="font-medium text-gray-900">{doc.title}</p>
				{#if doc.updatedAt}
					<p class="mt-1 text-xs text-gray-500">更新于 {new Date(doc.updatedAt).toLocaleString('zh-CN')}</p>
				{/if}
			</a>
		{/each}
	</div>
{/if}
