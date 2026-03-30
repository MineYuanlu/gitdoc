<script lang="ts">
	import { enhance } from '$app/forms';
	import DocViewer from './DocViewer.svelte';

	let { initialContent }: { initialContent: string } = $props();

	let content = $state(initialContent); // eslint-disable-line svelte/reactivity/no-state-from-props
</script>

<form method="POST" use:enhance class="flex h-[calc(100vh-10rem)] flex-col">
	<div class="grid flex-1 grid-cols-2 gap-4 overflow-hidden">
		<textarea
			name="content"
			bind:value={content}
			class="resize-none rounded-lg border border-gray-300 p-4 font-mono text-sm focus:border-gray-500 focus:outline-none"
			placeholder="输入 Markdown 内容..."
		></textarea>
		<div class="overflow-y-auto rounded-lg border border-gray-200 bg-white p-4">
			<DocViewer {content} />
		</div>
	</div>
	<div class="mt-4 flex items-center gap-3">
		<button type="submit" class="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700">
			保存
		</button>
		<a href=".." class="text-sm text-gray-500 hover:text-gray-700">取消</a>
	</div>
</form>
