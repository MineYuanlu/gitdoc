<script lang="ts">
	import { invalidateAll } from '$app/navigation';

	let {
		section,
		docName,
		replyTo,
		onSuccess,
	}: { section: string; docName: string; replyTo?: string; onSuccess?: () => void } = $props();

	let content = $state('');
	let submitting = $state(false);
	let errorMsg = $state('');

	async function submit() {
		if (!content.trim()) {
			errorMsg = '评论内容不能为空';
			return;
		}
		submitting = true;
		errorMsg = '';
		try {
			const res = await fetch(`/doc/${section}/${docName}/comment`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ content: content.trim(), replyTo }),
			});
			if (!res.ok) {
				const data = await res.json().catch(() => null);
				errorMsg = data?.message || '提交失败';
				return;
			}
			content = '';
			await invalidateAll();
			onSuccess?.();
		} catch {
			errorMsg = '网络错误，请重试';
		} finally {
			submitting = false;
		}
	}
</script>

<div class="mt-2">
	<textarea
		bind:value={content}
		rows="3"
		class="w-full rounded-lg border border-gray-300 p-3 text-sm focus:border-gray-500 focus:outline-none"
		placeholder="输入评论（支持 Markdown）..."
		disabled={submitting}
	></textarea>
	{#if errorMsg}
		<p class="mt-1 text-sm text-red-600">{errorMsg}</p>
	{/if}
	<button
		onclick={submit}
		disabled={submitting}
		class="mt-2 rounded-md bg-gray-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-gray-700 disabled:opacity-50"
	>
		{submitting ? '提交中...' : '提交评论'}
	</button>
</div>
