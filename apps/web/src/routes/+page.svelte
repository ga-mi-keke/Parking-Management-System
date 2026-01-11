<script lang="ts">
import type { PageData } from './$types';
import parkingImageA from '$lib/assets/parkingimg.jpeg';
import parkingImageB from '$lib/assets/parkingimg2.jpg';
import parkingMapImage from '$lib/assets/parking map.jpg';
import { onDestroy, onMount } from 'svelte';
import { spotsEndpoint } from '$lib/api';

	let { data } = $props<PageData>();
	let lots = data.lots ?? [];
	let loading = false;
	let errorMessage = '';
	let refreshTimer: ReturnType<typeof setInterval> | undefined;

	const lotDefs = [
		{ name: '駐車場A', image: parkingImageA, label: '駐車場A' },
		{ name: '駐車場B', image: parkingImageB, label: '駐車場B' }
	];

	let totalCapacity = lots.reduce((sum, lot) => sum + lot.capacity, 0);
	let totalOccupied = lots.reduce((sum, lot) => sum + lot.occupied, 0);
	let totalAvailable = Math.max(totalCapacity - totalOccupied, 0);
	let filteredLots = lots.filter((lot) => lot.name !== '駐車場C');
	let viewLots = lotDefs.map((lotDef) => {
		const lot = lots.find((item) => item.name === lotDef.name);
		const occupancy = lot
			? Math.min(100, Math.round((lot.occupied / Math.max(lot.capacity, 1)) * 100))
			: 0;
		return { ...lotDef, lot, occupancy };
	});

	function recalc() {
		totalCapacity = lots.reduce((sum, lot) => sum + lot.capacity, 0);
		totalOccupied = lots.reduce((sum, lot) => sum + lot.occupied, 0);
		totalAvailable = Math.max(totalCapacity - totalOccupied, 0);
		filteredLots = lots.filter((lot) => lot.name !== '駐車場C');
		viewLots = lotDefs.map((lotDef) => {
			const lot = lots.find((item) => item.name === lotDef.name);
			const occupancy = lot
				? Math.min(100, Math.round((lot.occupied / Math.max(lot.capacity, 1)) * 100))
				: 0;
			return { ...lotDef, lot, occupancy };
		});
	}

	async function refreshLots() {
		loading = true;
		errorMessage = '';
		try {
			const res = await fetch(spotsEndpoint, { cache: 'no-store' });
			if (!res.ok) {
				throw new Error(`API error ${res.status}`);
			}
			lots = await res.json();
			recalc();
		} catch (err) {
			errorMessage = err instanceof Error ? err.message : 'データ取得に失敗しました';
		} finally {
			loading = false;
		}
	}

	onMount(() => {
		// 起動直後に最新データへ
		refreshLots();
		refreshTimer = setInterval(refreshLots, 10_000); // 10秒ごとに自動更新
		return () => {
			if (refreshTimer) clearInterval(refreshTimer);
		};
	});

	onDestroy(() => {
		if (refreshTimer) clearInterval(refreshTimer);
	});
</script>

<svelte:head>
	<title>中央公園駐車場</title>
	<link rel="preconnect" href="https://fonts.googleapis.com" />
	<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
	<link
		href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&display=swap"
		rel="stylesheet"
	/>
</svelte:head>

<main class="relative min-h-screen overflow-hidden bg-slate-100 text-slate-900">
	<div class="pointer-events-none absolute inset-0 -z-10">
		<div class="absolute -left-24 -top-24 h-64 w-64 rotate-12 rounded-full bg-cyan-200/50 blur-3xl" />
		<div class="absolute bottom-0 right-[-8rem] h-80 w-80 rounded-full bg-indigo-200/40 blur-3xl" />
		<div class="absolute inset-x-0 top-24 h-32 bg-cyan-200/40 blur-3xl" />
	</div>

	<section class="mx-auto flex max-w-6xl flex-col gap-10 px-6 pb-16 pt-16 md:pt-20">
		<header class="flex flex-col gap-3">
			<p class="text-sm uppercase tracking-[0.3em] text-cyan-700/80">Parking Status</p>
			<div class="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
				<h1
					class="text-4xl font-bold leading-tight text-slate-900 drop-shadow-sm md:text-5xl"
					style="font-family: 'Space Grotesk', 'Inter', system-ui, sans-serif"
				>
					<span>中央公園駐車場の</span>
					<span class="block pl-6">駐車場情報</span>
					<span
						class="mt-3 block h-1 w-full rounded-full bg-cyan-600/80 shadow-[0_4px_10px_rgba(8,145,178,0.25)]"
						aria-hidden="true"
					/>
				</h1>
				<div class="flex flex-col items-start gap-2 sm:flex-row sm:items-center sm:gap-3">
					<button
						class="rounded-full border border-slate-300/60 bg-white px-4 py-2 text-sm text-slate-700 shadow-sm transition hover:border-cyan-500/40 hover:bg-cyan-50 disabled:cursor-not-allowed disabled:opacity-60"
						onclick={refreshLots}
						disabled={loading}
					>
						{loading ? '更新中…' : '再読み込み'}
					</button>
					{#if errorMessage}
						<span class="text-xs text-red-600">{errorMessage}</span>
					{/if}
				</div>
			</div>
		</header>

		<section class="w-full">
			<div class="relative mx-auto h-[64rem] w-full sm:h-[88rem]">
				<img
					src={parkingMapImage}
					alt="Parking map"
					class="h-full w-full object-contain"
					loading="lazy"
				/>
			</div>
		</section>

		<section class="grid gap-4 lg:grid-cols-2">
			{#each viewLots as viewLot}
				{@const lotCode = viewLot.label.replace('駐車場', '')}
				<div class="overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-xl">
					<div class="relative h-64 w-full overflow-hidden sm:h-80">
						<img
							src={viewLot.image}
							alt={viewLot.label}
							class="h-full w-full object-contain bg-slate-100"
							loading="lazy"
						/>
						<div class="absolute inset-0 bg-white/50" />
						<div class="absolute left-4 top-4 flex h-11 w-11 items-center justify-center rounded-full bg-cyan-600 text-sm font-semibold text-white shadow-md">
							{lotCode}
						</div>
						<div class="absolute bottom-0 left-0 right-0 p-5">
							<p class="text-xs uppercase tracking-[0.3em] text-cyan-700/70">{viewLot.label}</p>
							<h2 class="mt-1 text-2xl font-semibold text-slate-900 drop-shadow">ライブビュー</h2>
						</div>
					</div>

					<div class="rounded-b-3xl border-t border-slate-200/80 bg-slate-50 p-6">
						{#if viewLot.lot}
							<div class="flex items-start justify-between gap-3">
								<div>
									<p class="text-sm uppercase tracking-[0.3em] text-cyan-700/70">{viewLot.label}</p>
									<h3 class="text-2xl font-semibold text-slate-900">現在の稼働状況</h3>
								</div>
								<span class="rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-700">
									更新 {new Date(viewLot.lot.updatedAt).toLocaleTimeString('ja-JP')}
								</span>
							</div>

							<div class="mt-5 grid grid-cols-3 gap-3 text-center text-sm text-slate-600">
								<div class="rounded-2xl border border-slate-200/80 bg-white px-3 py-4">
									<p class="text-xs text-slate-500">収容</p>
									<p class="mt-1 text-xl font-semibold text-cyan-700">
										{viewLot.lot.capacity.toLocaleString()} 台
									</p>
								</div>
								<div class="rounded-2xl border border-slate-200/80 bg-white px-3 py-4">
									<p class="text-xs text-slate-500">使用中</p>
									<p class="mt-1 text-xl font-semibold text-indigo-700">
										{viewLot.lot.occupied.toLocaleString()} 台
									</p>
								</div>
								<div class="rounded-2xl border border-slate-200/80 bg-white px-3 py-4">
									<p class="text-xs text-slate-500">空き</p>
									<p class="mt-1 text-xl font-semibold text-emerald-700">
										{Math.max(viewLot.lot.capacity - viewLot.lot.occupied, 0).toLocaleString()} 台
									</p>
								</div>
							</div>

							<div class="mt-5">
								<div class="flex items-center justify-between text-xs text-slate-500">
									<span>稼働率</span>
									<span>{viewLot.occupancy}%</span>
								</div>
								<div class="mt-2 h-3 rounded-full bg-slate-200">
									<div
										class="h-full rounded-full bg-cyan-500 transition-all"
										style={`width: ${viewLot.occupancy}%`}
									/>
								</div>
							</div>
						{:else}
							<div class="flex h-full items-center justify-center text-sm text-slate-500">
								{viewLot.label}のデータがまだありません。
							</div>
						{/if}
					</div>
				</div>
			{/each}
		</section>

		<section class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
			<div class="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
				<p class="text-sm text-slate-600">総収容台数</p>
				<p class="mt-3 text-3xl font-semibold text-cyan-700">{totalCapacity.toLocaleString()}</p>
			</div>
			<div class="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
				<p class="text-sm text-slate-600">使用中</p>
				<p class="mt-3 text-3xl font-semibold text-indigo-700">{totalOccupied.toLocaleString()}</p>
			</div>
			<div class="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
				<p class="text-sm text-slate-600">空き</p>
				<p class="mt-3 text-3xl font-semibold text-emerald-700">{totalAvailable.toLocaleString()}</p>
			</div>
		</section>

		<section class="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm">
			<div class="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
				<div>
					<h2 class="text-xl font-semibold text-slate-900">駐車場ごとの状況</h2>
					<p class="text-sm text-slate-600">各ロットの収容台数・稼働率・空き台数を表示します。</p>
				</div>
				<div class="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-700">
					{filteredLots.length} 箇所を監視中
				</div>
			</div>

			{#if filteredLots.length === 0}
				<p class="mt-6 text-sm text-slate-600">表示できる駐車場がありません。</p>
			{:else}
				<div class="mt-6 grid gap-4 sm:grid-cols-2">
					{#each filteredLots as lot}
						{#if lot.capacity > 0}
							{@const occupancy = Math.min(100, Math.round((lot.occupied / lot.capacity) * 100))}
							<div class="group rounded-2xl border border-slate-200/80 bg-slate-50 p-5 shadow-sm transition hover:-translate-y-1 hover:border-cyan-500/40 hover:bg-white">
								<div class="flex items-start justify-between gap-3">
									<div>
										<h3 class="text-lg font-semibold text-slate-900">{lot.name}</h3>
										<p class="text-xs uppercase tracking-[0.2em] text-cyan-700/70">
											容量 {lot.capacity.toLocaleString()} 台
										</p>
									</div>
									<span class="rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-700">
										空き {Math.max(lot.capacity - lot.occupied, 0).toLocaleString()} 台
									</span>
								</div>

								<div class="mt-4 h-2 rounded-full bg-slate-200">
									<div
										class="h-full rounded-full bg-cyan-500 transition-all"
										style={`width: ${occupancy}%`}
									/>
								</div>

								<div class="mt-3 flex items-center justify-between text-sm text-slate-600">
									<span>稼働率 {occupancy}%</span>
									<span>使用中 {lot.occupied.toLocaleString()} 台</span>
								</div>

								<p class="mt-3 text-xs text-slate-500">
									最終更新 {new Date(lot.updatedAt).toLocaleString('ja-JP')}
								</p>
							</div>
						{:else}
							<div class="rounded-2xl border border-red-300 bg-red-50 p-5 text-sm text-red-700">
								{lot.name} の容量が未設定です。
							</div>
						{/if}
					{/each}
				</div>
			{/if}
		</section>
	</section>
</main>
