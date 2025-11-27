import { sveltekit } from '@sveltejs/kit/vite';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';
import { SvelteKitPWA } from '@vite-pwa/sveltekit';

export default defineConfig({
	plugins: [
		sveltekit(),
		tailwindcss(),
		SvelteKitPWA({
			manifest: {
				name: '집피티 - 부동산 AI 챗봇',
				short_name: '집피티',
				description: '부동산 전문 AI 챗봇 - 실거래가, 시세, 단지 정보 조회',
				start_url: '/',
				display: 'standalone',
				background_color: '#18181b',
				theme_color: '#18181b',
				icons: [
					{
						src: '/icon-192.png',
						sizes: '192x192',
						type: 'image/png'
					},
					{
						src: '/icon-512.png',
						sizes: '512x512',
						type: 'image/png'
					}
				]
			},
			registerType: 'autoUpdate',
			workbox: {
				globPatterns: ['**/*.{js,css,html,ico,png,svg}']
			}
		})
	]
});
