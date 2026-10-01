import { useEffect, useRef, useState } from 'preact/hooks';

interface PipelineFields {
  name: string;
  role: string;
  location: string;
  headline: string;
}

interface Props {
  fields: PipelineFields;
}

const OCR_START = 700;
const EXTRACT_START = 1700;
const RENDER_START = 3500;
const TOTAL_MS = 4200;
const BOX_STAGGER_MS = 220;
const FADE_MS = 150;
const HEADLINE_FLASH_MS = 1600;

const STAGES = [
  { label: 'preprocess', start: 0 },
  { label: 'ocr', start: OCR_START },
  { label: 'extract', start: EXTRACT_START },
  { label: 'render', start: RENDER_START },
];

const TEXT_LINES = [
  { x: 24, y: 24, width: 110, height: 10 },
  { x: 24, y: 46, width: 80, height: 6 },
  { x: 24, y: 62, width: 64, height: 6 },
  { x: 24, y: 84, width: 260, height: 5 },
  { x: 24, y: 96, width: 236, height: 5 },
  { x: 24, y: 108, width: 250, height: 5 },
  { x: 24, y: 120, width: 140, height: 5 },
];

const OCR_BOXES = [
  { key: 'name', score: '0.99', x: 20, y: 20, width: 118, height: 18 },
  { key: 'role', score: '0.98', x: 20, y: 42, width: 88, height: 14 },
  { key: 'location', score: '0.97', x: 20, y: 58, width: 72, height: 14 },
  { key: 'headline', score: '0.96', x: 20, y: 80, width: 268, height: 26 },
];

function progress(elapsed: number, start: number, duration: number): number {
  return Math.min(Math.max((elapsed - start) / duration, 0), 1);
}

function flashHeadline() {
  const headline = document.getElementById('hero-title');
  if (!headline) return;
  headline.setAttribute('data-detected', '');
  window.setTimeout(() => headline.removeAttribute('data-detected'), HEADLINE_FLASH_MS);
}

export default function InferencePipeline({ fields }: Props) {
  const [elapsed, setElapsed] = useState(TOTAL_MS);
  const [isHydrated, setIsHydrated] = useState(false);
  const frameRef = useRef(0);
  const flashedRef = useRef(false);

  const stop = () => cancelAnimationFrame(frameRef.current);

  const play = () => {
    stop();
    flashedRef.current = false;
    setElapsed(0);
    const startedAt = performance.now();
    const tick = (now: number) => {
      const next = Math.min(now - startedAt, TOTAL_MS);
      setElapsed(next);
      if (!flashedRef.current && next >= RENDER_START) {
        flashedRef.current = true;
        flashHeadline();
      }
      if (next < TOTAL_MS) frameRef.current = requestAnimationFrame(tick);
    };
    frameRef.current = requestAnimationFrame(tick);
  };

  const skip = () => {
    stop();
    setElapsed(TOTAL_MS);
  };

  useEffect(() => {
    setIsHydrated(true);
    if (document.documentElement.dataset.intro === 'pending') play();
    return stop;
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    if (root.dataset.intro === 'pending' && elapsed < TOTAL_MS) root.dataset.intro = 'played';
  }, [elapsed]);

  const isDone = elapsed >= TOTAL_MS;
  const isRendering = elapsed >= RENDER_START;
  const isExtracting = elapsed >= EXTRACT_START && !isRendering;
  const deskew = progress(elapsed, 0, OCR_START);
  const rotation = (1 - deskew) * -3;
  const scanY = 8 + deskew * 128;

  const json = JSON.stringify(fields, null, 2);
  const jsonLines = json.split('\n');
  const lineStarts = jsonLines.map((_, index) =>
    jsonLines.slice(0, index).reduce((total, line) => total + line.length + 1, 0),
  );
  const typedCount = Math.floor(progress(elapsed, EXTRACT_START, RENDER_START - EXTRACT_START) * json.length);

  return (
    <figure
      aria-label="Animated illustration: a scanned document goes through OCR and VLM extraction into structured JSON."
      class="min-w-0 rounded-md border border-line bg-surface"
    >
      <div class="flex items-center justify-between gap-3 border-b border-line px-4 py-2.5 font-mono text-xs text-muted">
        <span aria-hidden="true">inference_run.log</span>
        <div class="flex items-center gap-3">
          <span aria-hidden="true" class="tabular-nums">
            {isDone ? 'done' : 'running'} · {(elapsed / 1000).toFixed(1)}s
          </span>
          <button
            type="button"
            hidden={!isHydrated}
            onClick={isDone ? play : skip}
            aria-label={isDone ? 'Replay the pipeline animation' : 'Skip the pipeline animation'}
            class="min-h-8 rounded border border-line px-2.5 font-mono text-xs uppercase tracking-wider text-fg transition-colors hover:border-accent hover:text-accent"
          >
            {isDone ? 'Replay' : 'Skip'}
          </button>
        </div>
      </div>

      <div data-pipeline-body aria-hidden="true" class="p-4 sm:p-5">
        <ol class="flex flex-wrap gap-x-4 gap-y-1 font-mono text-[11px] uppercase tracking-wider">
          {STAGES.map((stage, index) => {
            const nextStart = STAGES[index + 1]?.start ?? TOTAL_MS;
            const stateClass =
              elapsed >= nextStart ? 'text-fg' : elapsed >= stage.start ? 'text-accent' : 'text-muted/60';
            return (
              <li key={stage.label} class={stateClass}>
                <span class="text-muted">{String(index + 1).padStart(2, '0')}</span> {stage.label}
              </li>
            );
          })}
        </ol>

        <svg viewBox="0 0 320 144" class="mt-4 block h-auto w-full">
          <g transform={`rotate(${rotation.toFixed(2)} 160 72)`}>
            <rect x="8" y="8" width="304" height="128" rx="3" class="fill-bg stroke-line" />
            {TEXT_LINES.map((line, index) => (
              <rect
                key={index}
                x={line.x}
                y={line.y}
                width={line.width}
                height={line.height}
                rx="1"
                opacity={0.25 + deskew * 0.3}
                class="fill-muted"
              />
            ))}
            {OCR_BOXES.map((box, index) => {
              const label = `${box.key} ${box.score}`;
              const labelWidth = label.length * 5.2 + 8;
              const labelAbove = box.key === 'headline';
              const labelX = labelAbove ? box.x + box.width - labelWidth : box.x + box.width + 4;
              const labelY = labelAbove ? box.y - 12 : box.y;
              const highlighted = isRendering && box.key === 'headline';
              return (
                <g key={box.key} opacity={progress(elapsed, OCR_START + index * BOX_STAGGER_MS, FADE_MS)}>
                  <rect
                    x={box.x}
                    y={box.y}
                    width={box.width}
                    height={box.height}
                    stroke-width="1.25"
                    class={highlighted ? 'fill-accent/15 stroke-accent' : 'fill-none stroke-accent'}
                  />
                  <rect x={labelX} y={labelY} width={labelWidth} height="11" class="fill-accent" />
                  <text x={labelX + 4} y={labelY + 8.5} font-size="8.5" class="fill-accent-fg font-mono">
                    {label}
                  </text>
                </g>
              );
            })}
            {elapsed < OCR_START && (
              <line x1="8" x2="312" y1={scanY} y2={scanY} stroke-width="1.5" opacity="0.7" class="stroke-accent" />
            )}
          </g>
        </svg>

        <pre class="mt-4 overflow-hidden whitespace-pre-wrap rounded border border-line bg-bg p-3 font-mono text-[11px] leading-relaxed text-fg [overflow-wrap:anywhere] sm:text-xs">
          {jsonLines.map((line, index) => {
            const lineStart = lineStarts[index] ?? 0;
            const typedInLine = Math.min(Math.max(typedCount - lineStart, 0), line.length);
            const hasCaret = isExtracting && typedCount >= lineStart && typedCount <= lineStart + line.length;
            const isHeadlineLine = line.trimStart().startsWith('"headline"');
            return (
              <span key={index} class={isRendering && isHeadlineLine ? 'bg-accent/15' : undefined}>
                {line.slice(0, typedInLine)}
                {hasCaret && (
                  <span class="relative">
                    <span class="absolute left-0 top-0 h-[1.2em] w-[0.55em] bg-accent" />
                  </span>
                )}
                <span class="invisible">{line.slice(typedInLine)}</span>
                {index < jsonLines.length - 1 ? '\n' : null}
              </span>
            );
          })}
        </pre>
      </div>
    </figure>
  );
}
