<script lang="ts">
	import { resolve } from '$app/paths';
	import DocMeta from '$lib/components/doc/DocMeta.svelte';
	import DocViewer from '$lib/components/doc/DocViewer.svelte';
	import CommentList from '$lib/components/comment/CommentList.svelte';

	let { data } = $props();
</script>

<svelte:head>
	<title>{data.doc.title} - GitDoc</title>
</svelte:head>

<DocMeta
	title={data.doc.title}
	author={data.doc.author}
	createdAt={data.doc.createdAt}
	updatedAt={data.doc.updatedAt}
/>

{#if data.canEdit}
	<a
		href={resolve(`/doc/${data.section}/${data.docName}/edit`)}
		class="mb-4 inline-block rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
	>
		编辑
	</a>
{/if}

<DocViewer content={data.doc.body} />

<CommentList comments={data.comments} canComment={data.canComment} section={data.section} docName={data.docName} />
