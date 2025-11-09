// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
declare global {
	namespace App {
		// interface Error {}
		// interface Locals {}
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
	}
}

export {};

declare module '$env/static/public' {
	export const PUBLIC_API_URL: string | undefined;
}

declare module '$env/dynamic/public' {
	export const env: {
		PUBLIC_API_URL?: string;
	} & Record<string, string | undefined>;
}
