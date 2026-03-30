<script lang="ts">
	import DocList from '$lib/components/doc/DocList.svelte';

	let { data } = $props();
</script>

<svelte:head>
	<title>{data.section} - GitDoc</title>
</svelte:head>

<h1 class="mb-6 text-2xl font-bold text-gray-900">{data.section}</h1>
<DocList section={data.section} docs={data.docs} />
