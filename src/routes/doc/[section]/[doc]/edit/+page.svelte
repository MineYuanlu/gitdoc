<script lang="ts">
	import DocEditor from '$lib/components/doc/DocEditor.svelte';

	let { data } = $props();
</script>

<svelte:head>
	<title>编辑 {data.doc.title} - GitDoc</title>
</svelte:head>

<h1 class="mb-4 text-xl font-bold text-gray-900">编辑: {data.doc.title}</h1>
<DocEditor initialContent={data.doc.body} />
