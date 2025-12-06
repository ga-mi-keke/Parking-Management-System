<script lang="ts">
	import type { PageData } from './$types';

	let { data } = $props<PageData>();
	const lots = data.lots ?? [];

	const totalCapacity = lots.reduce((sum, lot) => sum + lot.capacity, 0);
	const totalOccupied = lots.reduce((sum, lot) => sum + lot.occupied, 0);
	const totalAvailable = Math.max(totalCapacity - totalOccupied, 0);
</script>

<svelte:head>
	<title>Parking Capacity Monitor</title>
	<link rel="preconnect" href="https://fonts.googleapis.com" />
	<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
	<link
		href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&display=swap"
		rel="stylesheet"
	/>
</svelte:head>

<main class="relative min-h-screen overflow-hidden bg-slate-950 text-slate-50">
	<div class="pointer-events-none absolute inset-0 -z-10">
		<div class="absolute -left-24 -top-24 h-64 w-64 rotate-12 rounded-full bg-cyan-500/20 blur-3xl" />
		<div class="absolute bottom-0 right-[-8rem] h-80 w-80 rounded-full bg-indigo-500/20 blur-3xl" />
		<div class="absolute inset-x-0 top-24 h-32 bg-gradient-to-r from-cyan-500/30 via-blue-500/20 to-indigo-500/30 blur-3xl" />
	</div>

	<section class="mx-auto flex max-w-6xl flex-col gap-10 px-6 pb-16 pt-16 md:pt-20">
		<header class="flex flex-col gap-3">
			<p class="text-sm uppercase tracking-[0.3em] text-cyan-200/80">Parking Status</p>
			<div class="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
				<h1
					class="text-4xl font-bold leading-tight text-slate-50 drop-shadow-sm md:text-5xl"
					style="font-family: 'Space Grotesk', 'Inter', system-ui, sans-serif"
				>
					駐車場の台数管理
				</h1>
			</div>
		</header>

		<section class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
			<div class="rounded-2xl border border-white/5 bg-white/5 p-5 shadow-xl backdrop-blur">
				<p class="text-sm text-slate-300">総収容台数</p>
				<p class="mt-3 text-3xl font-semibold text-cyan-200">{totalCapacity.toLocaleString()}</p>
			</div>
			<div class="rounded-2xl border border-white/5 bg-white/5 p-5 shadow-xl backdrop-blur">
				<p class="text-sm text-slate-300">使用中</p>
				<p class="mt-3 text-3xl font-semibold text-indigo-200">{totalOccupied.toLocaleString()}</p>
			</div>
			<div class="rounded-2xl border border-white/5 bg-white/5 p-5 shadow-xl backdrop-blur">
				<p class="text-sm text-slate-300">空き</p>
				<p class="mt-3 text-3xl font-semibold text-emerald-200">{totalAvailable.toLocaleString()}</p>
			</div>
		</section>

		<section class="rounded-3xl border border-white/10 bg-slate-900/60 p-6 shadow-2xl backdrop-blur">
			<div class="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
				<div>
					<h2 class="text-xl font-semibold text-slate-50">駐車場ごとの状況</h2>
					<p class="text-sm text-slate-400">各ロットの収容台数・稼働率・空き台数を表示します。</p>
				</div>
				<div class="rounded-full bg-white/5 px-3 py-1 text-xs text-slate-200">
					{lots.length} 箇所を監視中
				</div>
			</div>

			{#if lots.length === 0}
				<p class="mt-6 text-sm text-slate-400">表示できる駐車場がありません。</p>
			{:else}
				<div class="mt-6 grid gap-4 sm:grid-cols-2">
					{#each lots as lot}
						{#if lot.capacity > 0}
							{@const occupancy = Math.min(100, Math.round((lot.occupied / lot.capacity) * 100))}
							<div class="group rounded-2xl border border-white/5 bg-white/5 p-5 shadow-xl backdrop-blur transition hover:-translate-y-1 hover:border-cyan-300/40 hover:bg-white/10">
								<div class="flex items-start justify-between gap-3">
									<div>
										<h3 class="text-lg font-semibold text-slate-50">{lot.name}</h3>
										<p class="text-xs uppercase tracking-[0.2em] text-cyan-200/70">
											容量 {lot.capacity.toLocaleString()} 台
										</p>
									</div>
									<span class="rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-200">
										空き {Math.max(lot.capacity - lot.occupied, 0).toLocaleString()} 台
									</span>
								</div>

								<div class="mt-4 h-2 rounded-full bg-slate-800">
									<div
										class="h-full rounded-full bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-500 transition-all"
										style={`width: ${occupancy}%`}
									/>
								</div>

								<div class="mt-3 flex items-center justify-between text-sm text-slate-300">
									<span>稼働率 {occupancy}%</span>
									<span>使用中 {lot.occupied.toLocaleString()} 台</span>
								</div>

								<p class="mt-3 text-xs text-slate-400">
									最終更新 {new Date(lot.updatedAt).toLocaleString('ja-JP')}
								</p>
							</div>
						{:else}
							<div class="rounded-2xl border border-red-400/40 bg-red-500/10 p-5 text-sm text-red-100">
								{lot.name} の容量が未設定です。
							</div>
						{/if}
					{/each}
				</div>
			{/if}
		</section>
	</section>
</main>
