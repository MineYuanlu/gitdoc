<script lang="ts">
	import { resolve } from '$app/paths';

	let { user, repoConfigured }: { user: { username: string; avatar: string } | null; repoConfigured: boolean } =
		$props();
</script>

<nav class="border-b border-gray-200 bg-white">
	<div class="mx-auto flex h-14 max-w-7xl items-center justify-between px-4">
		<a href={resolve('/')} class="text-lg font-semibold text-gray-900">GitDoc</a>

		<div class="flex items-center gap-4">
			{#if repoConfigured}
				<a href={resolve('/doc')} class="text-sm text-gray-600 hover:text-gray-900">文档</a>
				<a href={resolve('/search')} class="text-sm text-gray-600 hover:text-gray-900">搜索</a>
			{/if}

			{#if user}
				<div class="flex items-center gap-2">
					<img src={user.avatar} alt={user.username} class="h-7 w-7 rounded-full" />
					<span class="text-sm text-gray-700">{user.username}</span>
					<form method="POST" action="/auth/logout">
						<button type="submit" class="text-sm text-gray-500 hover:text-gray-700">退出</button>
					</form>
				</div>
			{:else}
				<a
					href={resolve('/auth/login/github')}
					class="rounded-md bg-gray-900 px-3 py-1.5 text-sm text-white hover:bg-gray-700"
				>
					GitHub 登录
				</a>
			{/if}
		</div>
	</div>
</nav>
