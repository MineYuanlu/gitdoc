<script lang="ts">
	import Sidebar from '$lib/components/layout/Sidebar.svelte';

	let { data, children } = $props();
</script>

<div class="flex flex-1">
	<Sidebar sections={data.sections} />
	<div class="flex-1 p-6">
		{@render children()}
	</div>
</div>
