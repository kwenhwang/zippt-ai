/**
 * Haptic 피드백 유틸리티
 * Apple HIG 권장: 터치 인터랙션에 촉각 피드백 제공
 */

export type HapticPattern = 'light' | 'medium' | 'heavy';

const patterns: Record<HapticPattern, number[]> = {
	light: [10],
	medium: [20],
	heavy: [30, 50, 30]
};

/**
 * 햅틱 피드백 트리거
 * @param pattern - 피드백 강도 (light, medium, heavy)
 */
export function triggerHaptic(pattern: HapticPattern = 'light'): void {
	// 브라우저 호환성 체크
	if (typeof navigator !== 'undefined' && navigator.vibrate) {
		navigator.vibrate(patterns[pattern]);
	}
}
