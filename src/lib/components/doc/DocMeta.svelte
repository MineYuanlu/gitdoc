<script lang="ts">
	let { title, author, createdAt, updatedAt }: { title: string; author: string; createdAt: string; updatedAt: string } =
		$props();
</script>

<div class="mb-6">
	<h1 class="text-2xl font-bold text-gray-900">{title}</h1>
	<div class="mt-2 flex flex-wrap gap-3 text-sm text-gray-500">
		{#if author}
			<span>作者: {author}</span>
		{/if}
		{#if createdAt}
			<span>创建于 {new Date(createdAt).toLocaleString('zh-CN')}</span>
		{/if}
		{#if updatedAt && updatedAt !== createdAt}
			<span>更新于 {new Date(updatedAt).toLocaleString('zh-CN')}</span>
		{/if}
	</div>
</div>
