<script lang="ts">
	import { marked } from 'marked';
	import CommentForm from './CommentForm.svelte';

	interface CommentItem {
		id: string;
		author: string;
		createdAt: string;
		replyTo?: string;
		body: string;
	}

	let {
		comments,
		canComment,
		section,
		docName,
	}: { comments: CommentItem[]; canComment: boolean; section: string; docName: string } = $props();

	// Build tree from flat list
	interface TreeNode extends CommentItem {
		children: TreeNode[];
	}

	const tree = $derived.by(() => {
		const map = new Map<string, TreeNode>(); // eslint-disable-line svelte/prefer-svelte-reactivity
		const roots: TreeNode[] = [];
		for (const c of comments) {
			map.set(c.id, { ...c, children: [] });
		}
		for (const node of map.values()) {
			if (node.replyTo && map.has(node.replyTo)) {
				map.get(node.replyTo)!.children.push(node);
			} else {
				roots.push(node);
			}
		}
		return roots;
	});

	let replyingTo = $state<string | null>(null);
</script>

{#snippet commentNode(node: TreeNode, depth: number)}
	<div class="border-l-2 {depth > 0 ? 'border-gray-200' : 'border-transparent'} pl-4">
		<div class="py-3">
			<div class="flex items-center gap-2 text-sm text-gray-500">
				<span class="font-medium text-gray-700">{node.author}</span>
				<span>{new Date(node.createdAt).toLocaleString('zh-CN')}</span>
			</div>
			<div class="prose prose-sm mt-1 max-w-none prose-gray">
				{@html marked(node.body)}
			</div>
			{#if canComment}
				<button
					class="mt-1 text-xs text-gray-400 hover:text-gray-600"
					onclick={() => (replyingTo = replyingTo === node.id ? null : node.id)}
				>
					回复
				</button>
				{#if replyingTo === node.id}
					<CommentForm {section} {docName} replyTo={node.id} onSuccess={() => (replyingTo = null)} />
				{/if}
			{/if}
		</div>
		{#each node.children as child}
			{@render commentNode(child, depth + 1)}
		{/each}
	</div>
{/snippet}

<div class="mt-8 border-t border-gray-200 pt-6">
	<h2 class="text-lg font-semibold text-gray-900">评论</h2>
	{#if tree.length === 0}
		<p class="mt-4 text-sm text-gray-500">暂无评论</p>
	{:else}
		<div class="mt-4 space-y-1">
			{#each tree as node}
				{@render commentNode(node, 0)}
			{/each}
		</div>
	{/if}

	{#if canComment}
		<div class="mt-6">
			<CommentForm {section} {docName} />
		</div>
	{/if}
</div>
