import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('Haptic Feedback Module (TDD Red Phase)', () => {
  const hapticFilePath = path.resolve(__dirname, './haptic.ts');

  it('should have haptic.ts file', () => {
    // TDD Red: haptic.ts 파일 존재 확인
    const fileExists = fs.existsSync(hapticFilePath);
    expect(fileExists).toBe(true);
  });

  it('should export triggerHaptic function', () => {
    // TDD Red: triggerHaptic 함수가 export 되어 있는지 확인
    if (!fs.existsSync(hapticFilePath)) {
      expect.fail('haptic.ts file does not exist');
    }

    const fileContent = fs.readFileSync(hapticFilePath, 'utf-8');
    const hasTriggerHapticExport =
      /export\s+(function\s+triggerHaptic|const\s+triggerHaptic)/.test(fileContent);

    expect(hasTriggerHapticExport).toBe(true);
  });

  it('should define HapticPattern type with light, medium, heavy', () => {
    // TDD Red: HapticPattern 타입이 light, medium, heavy를 포함하는지 확인
    if (!fs.existsSync(hapticFilePath)) {
      expect.fail('haptic.ts file does not exist');
    }

    const fileContent = fs.readFileSync(hapticFilePath, 'utf-8');

    // HapticPattern 타입 정의 확인
    const hasHapticPatternType =
      /export\s+type\s+HapticPattern/.test(fileContent) ||
      /type\s+HapticPattern/.test(fileContent);

    expect(hasHapticPatternType).toBe(true);

    // light, medium, heavy 포함 확인
    const hasLight = /['"]light['"]/.test(fileContent);
    const hasMedium = /['"]medium['"]/.test(fileContent);
    const hasHeavy = /['"]heavy['"]/.test(fileContent);

    expect(hasLight).toBe(true);
    expect(hasMedium).toBe(true);
    expect(hasHeavy).toBe(true);
  });

  it('should have triggerHaptic function accept HapticPattern parameter', () => {
    // TDD Red: triggerHaptic 함수가 HapticPattern 타입의 파라미터를 받는지 확인
    if (!fs.existsSync(hapticFilePath)) {
      expect.fail('haptic.ts file does not exist');
    }

    const fileContent = fs.readFileSync(hapticFilePath, 'utf-8');

    // 함수 시그니처에 pattern: HapticPattern 또는 유사한 패턴 확인
    const hasFunctionSignature =
      /triggerHaptic\s*\(\s*pattern\s*:\s*HapticPattern/.test(fileContent) ||
      /triggerHaptic\s*=\s*\(\s*pattern\s*:\s*HapticPattern/.test(fileContent);

    expect(hasFunctionSignature).toBe(true);
  });

  it('should check for Vibration API usage in triggerHaptic', () => {
    // TDD Red: triggerHaptic 함수 내에서 navigator.vibrate 호출 확인
    if (!fs.existsSync(hapticFilePath)) {
      expect.fail('haptic.ts file does not exist');
    }

    const fileContent = fs.readFileSync(hapticFilePath, 'utf-8');

    // navigator.vibrate 호출 확인
    const hasVibrateCall = /navigator\.vibrate/.test(fileContent);

    expect(hasVibrateCall).toBe(true);
  });

  it('should handle browser compatibility (navigator.vibrate check)', () => {
    // TDD Red: 브라우저 호환성 체크 (navigator.vibrate 존재 여부 확인)
    if (!fs.existsSync(hapticFilePath)) {
      expect.fail('haptic.ts file does not exist');
    }

    const fileContent = fs.readFileSync(hapticFilePath, 'utf-8');

    // navigator.vibrate 존재 여부 확인 로직
    const hasCompatibilityCheck =
      /navigator\.vibrate/.test(fileContent) &&
      (/if\s*\(/.test(fileContent) || /\?/.test(fileContent));

    expect(hasCompatibilityCheck).toBe(true);
  });
});
