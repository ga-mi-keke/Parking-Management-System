import { error } from '@sveltejs/kit';
import { spotsEndpoint } from '$lib/api';
import type { PageLoad } from './$types';

type ParkingLot = {
	id: number;
	name: string;
	capacity: number;
	occupied: number;
	updatedAt: string;
};

export const load: PageLoad = async ({ fetch }) => {
	const res = await fetch(spotsEndpoint);

	if (!res.ok) {
		throw error(res.status, '駐車場データの取得に失敗しました');
	}

	const lots = (await res.json()) as ParkingLot[];

	return { lots };
};
