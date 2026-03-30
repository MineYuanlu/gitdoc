<script lang="ts">
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
</script>

<svelte:head>
	<title>错误 - GitDoc</title>
</svelte:head>

<div class="mx-auto max-w-lg py-16 text-center">
	<p class="text-6xl font-bold text-gray-300">{page.status}</p>
	<p class="mt-4 text-lg text-gray-600">{page.error?.message || '发生了未知错误'}</p>
	<a href={resolve('/doc')} class="mt-6 inline-block text-sm text-gray-500 hover:text-gray-700">返回文档首页</a>
</div>
