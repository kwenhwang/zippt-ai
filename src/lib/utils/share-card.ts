/**
 * @module share-card
 * AI 답변을 이미지 카드로 생성 (Canvas 2D API)
 * 패키지 의존성 없음 - 브라우저 네이티브 Canvas 사용
 */

interface ShareCardOptions {
  question: string;   // 사용자 질문
  answer: string;     // AI 답변
}

/**
 * 텍스트를 주어진 너비에 맞게 줄바꿈
 */
function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  maxLines: number
): string[] {
  // 마크다운 기호 제거 (**, *, #, ` 등)
  const clean = text
    .replace(/#{1,6}\s/g, '')
    .replace(/\*\*/g, '')
    .replace(/\*/g, '')
    .replace(/`/g, '')
    .replace(/\n/g, ' ')
    .trim();

  const words = clean.split(' ');
  const lines: string[] = [];
  let current = '';

  for (const word of words) {
    const test = current ? `${current} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && current) {
      lines.push(current);
      current = word;
      if (lines.length >= maxLines) break;
    } else {
      current = test;
    }
  }
  if (current && lines.length < maxLines) {
    // 마지막 줄이 너무 길면 말줄임표
    if (ctx.measureText(current).width > maxWidth) {
      while (ctx.measureText(current + '...').width > maxWidth) {
        current = current.slice(0, -1);
      }
      lines.push(current + '...');
    } else {
      lines.push(current);
    }
  }
  return lines;
}

/**
 * 둥근 모서리 사각형 그리기
 */
function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number, y: number,
  w: number, h: number,
  r: number
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.arcTo(x + w, y, x + w, y + r, r);
  ctx.lineTo(x + w, y + h - r);
  ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
  ctx.lineTo(x + r, y + h);
  ctx.arcTo(x, y + h, x, y + h - r, r);
  ctx.lineTo(x, y + r);
  ctx.arcTo(x, y, x + r, y, r);
  ctx.closePath();
}

/**
 * AI 답변 공유 카드 생성 (1080x1080 정사각형)
 * @returns PNG Blob (공유/다운로드용)
 */
export async function generateShareCard({ question, answer }: ShareCardOptions): Promise<Blob> {
  const SIZE = 1080;
  const PADDING = 64;

  const canvas = document.createElement('canvas');
  canvas.width = SIZE;
  canvas.height = SIZE;
  const ctx = canvas.getContext('2d')!;

  // ── 배경 그라디언트 ──────────────────────────────
  const bg = ctx.createLinearGradient(0, 0, SIZE, SIZE);
  bg.addColorStop(0, '#0f0f0f');
  bg.addColorStop(1, '#1a1a2e');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, SIZE, SIZE);

  // ── 배경 오렌지 글로우 ────────────────────────────
  const glow = ctx.createRadialGradient(200, 180, 0, 200, 180, 300);
  glow.addColorStop(0, 'rgba(249,115,22,0.12)');
  glow.addColorStop(1, 'rgba(249,115,22,0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, SIZE, SIZE);

  // ── 헤더 영역 ─────────────────────────────────────
  const headerH = 120;
  const headerGrad = ctx.createLinearGradient(0, 0, SIZE, 0);
  headerGrad.addColorStop(0, '#ea580c');
  headerGrad.addColorStop(1, '#f97316');
  ctx.fillStyle = headerGrad;
  roundRect(ctx, 0, 0, SIZE, headerH, 0);
  ctx.fill();

  // 헤더 브랜드
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 44px -apple-system, Arial, sans-serif';
  ctx.fillText('Zippt AI', PADDING, 76);

  ctx.fillStyle = 'rgba(255,255,255,0.7)';
  ctx.font = '28px -apple-system, Arial, sans-serif';
  ctx.fillText('집피티 · AI 부동산 전문가', PADDING + 220, 76);

  // ── 질문 카드 ─────────────────────────────────────
  const qY = headerH + 56;
  const qW = SIZE - PADDING * 2;

  ctx.fillStyle = 'rgba(255,255,255,0.06)';
  roundRect(ctx, PADDING, qY, qW, 120, 20);
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.12)';
  ctx.lineWidth = 1;
  ctx.stroke();

  // Q 레이블
  ctx.fillStyle = '#f97316';
  ctx.font = 'bold 26px -apple-system, Arial, sans-serif';
  ctx.fillText('Q.', PADDING + 24, qY + 50);

  // 질문 텍스트
  ctx.fillStyle = '#e5e7eb';
  ctx.font = '30px -apple-system, Arial, sans-serif';
  const qLines = wrapText(ctx, question, qW - 100, 2);
  qLines.forEach((line, i) => {
    ctx.fillText(line, PADDING + 68, qY + 50 + i * 40);
  });

  // ── 답변 카드 ─────────────────────────────────────
  const aY = qY + 148;
  const aH = 420;

  ctx.fillStyle = 'rgba(249,115,22,0.08)';
  roundRect(ctx, PADDING, aY, qW, aH, 20);
  ctx.fill();
  ctx.strokeStyle = 'rgba(249,115,22,0.25)';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // A 레이블
  ctx.fillStyle = '#f97316';
  ctx.font = 'bold 26px -apple-system, Arial, sans-serif';
  ctx.fillText('A.', PADDING + 24, aY + 52);

  // 답변 텍스트
  ctx.fillStyle = '#ffffff';
  ctx.font = '30px -apple-system, Arial, sans-serif';
  const aLines = wrapText(ctx, answer, qW - 100, 8);
  aLines.slice(0, 8).forEach((line, i) => {
    ctx.fillStyle = i === 0 ? '#ffffff' : 'rgba(255,255,255,0.85)';
    ctx.fillText(line, PADDING + 68, aY + 52 + i * 48);
  });

  // ── 구분선 ────────────────────────────────────────
  const divY = aY + aH + 48;
  ctx.strokeStyle = 'rgba(255,255,255,0.08)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(PADDING, divY);
  ctx.lineTo(SIZE - PADDING, divY);
  ctx.stroke();

  // ── 푸터 ──────────────────────────────────────────
  ctx.fillStyle = '#6b7280';
  ctx.font = '26px -apple-system, Arial, sans-serif';
  ctx.fillText('zippt-ai.vercel.app', PADDING, divY + 52);

  ctx.fillStyle = 'rgba(249,115,22,0.6)';
  ctx.font = '24px -apple-system, Arial, sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText('실거래가 10.7M건 데이터 기반', SIZE - PADDING, divY + 52);
  ctx.textAlign = 'left';

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => blob ? resolve(blob) : reject(new Error('Canvas toBlob failed')),
      'image/png'
    );
  });
}
