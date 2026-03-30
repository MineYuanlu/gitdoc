<script lang="ts">
	import { enhance } from '$app/forms';

	let { form } = $props();
</script>

<svelte:head>
	<title>配置仓库 - GitDoc</title>
</svelte:head>

<div class="mx-auto max-w-lg px-4 py-16">
	<h1 class="text-2xl font-bold text-gray-900">配置文档仓库</h1>
	<p class="mt-2 text-sm text-gray-600">输入 Git 仓库地址以开始使用 GitDoc。</p>

	<form method="POST" use:enhance class="mt-8 space-y-4">
		<div>
			<label for="repoUrl" class="block text-sm font-medium text-gray-700">仓库地址</label>
			<input
				id="repoUrl"
				name="repoUrl"
				type="url"
				required
				placeholder="https://github.com/your-org/your-docs.git"
				class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-gray-500 focus:ring-gray-500 sm:text-sm"
			/>
		</div>

		{#if form?.error}
			<p class="text-sm text-red-600">{form.error}</p>
		{/if}

		<button
			type="submit"
			class="w-full rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700"
		>
			验证并配置
		</button>
	</form>
</div>
