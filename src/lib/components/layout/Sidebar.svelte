<script lang="ts">
	import { page } from '$app/state';
	import { resolve } from '$app/paths';

	interface SidebarDoc {
		name: string;
		title: string;
	}
	interface SidebarSection {
		name: string;
		docs: SidebarDoc[];
	}

	let { sections }: { sections: SidebarSection[] } = $props();

	let expanded = $state(new Set<string>());
	let mobileOpen = $state(false);

	// Auto-expand section containing current doc
	$effect(() => {
		const path = page.url.pathname;
		for (const section of sections) {
			if (path.includes(`/doc/${section.name}`)) {
				expanded.add(section.name);
			}
		}
	});

	function toggle(name: string) {
		if (expanded.has(name)) {
			expanded.delete(name);
		} else {
			expanded.add(name);
		}
		expanded = new Set(expanded);
	}

	function isActive(sectionName: string, docName?: string): boolean {
		const path = page.url.pathname;
		if (docName) return path.startsWith(`/doc/${sectionName}/${docName}`);
		return path === `/doc/${sectionName}`;
	}
</script>

<!-- Mobile toggle -->
<button
	class="fixed top-16 left-2 z-40 rounded-md bg-white p-2 shadow-md lg:hidden"
	onclick={() => (mobileOpen = !mobileOpen)}
	aria-label="切换侧边栏"
>
	<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
		<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
	</svg>
</button>

<!-- Backdrop -->
{#if mobileOpen}
	<button class="fixed inset-0 z-30 bg-black/30 lg:hidden" onclick={() => (mobileOpen = false)} aria-label="关闭侧边栏"
	></button>
{/if}

<!-- Sidebar -->
<aside
	class="fixed top-14 left-0 z-30 h-[calc(100vh-3.5rem)] w-64 overflow-y-auto border-r border-gray-200 bg-gray-50 p-4 transition-transform lg:static lg:translate-x-0"
	class:max-lg:-translate-x-full={!mobileOpen}
>
	<nav>
		{#each sections as section}
			<div class="mb-1">
				<button
					class="flex w-full items-center justify-between rounded px-2 py-1.5 text-left text-sm font-medium text-gray-700 hover:bg-gray-200"
					onclick={() => toggle(section.name)}
				>
					<a href={resolve(`/doc/${section.name}`)} class="flex-1" onclick={(e) => e.stopPropagation()}>
						{section.name}
					</a>
					<svg
						class="h-4 w-4 transition-transform"
						class:rotate-90={expanded.has(section.name)}
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
					>
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
					</svg>
				</button>

				{#if expanded.has(section.name)}
					<ul class="ml-2 border-l border-gray-200 pl-2">
						{#each section.docs as doc}
							<li>
								<a
									href={resolve(`/doc/${section.name}/${doc.name}`)}
									class="block rounded px-2 py-1 text-sm {isActive(section.name, doc.name)
										? 'bg-gray-200 font-medium text-gray-900'
										: 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'}"
								>
									{doc.title}
								</a>
							</li>
						{/each}
					</ul>
				{/if}
			</div>
		{/each}
	</nav>
</aside>
