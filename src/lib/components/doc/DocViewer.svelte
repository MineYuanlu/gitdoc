<script lang="ts">
	import { marked } from 'marked';

	let { content }: { content: string } = $props();

	let html = $derived(marked(content));
</script>

<div class="prose max-w-none prose-gray">
	{@html html}
</div>
