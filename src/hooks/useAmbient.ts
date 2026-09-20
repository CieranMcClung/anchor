import { useEffect, useRef } from 'react';

/**
 * Soft low oscillator ambient — OFF by default.
 * No external assets; Web Audio API only.
 */
export function useAmbient(enabled: boolean) {
  const ctxRef = useRef<AudioContext | null>(null);
  const nodesRef = useRef<{ osc: OscillatorNode; gain: GainNode } | null>(null);

  useEffect(() => {
    if (!enabled) {
      if (nodesRef.current) {
        try {
          nodesRef.current.gain.gain.exponentialRampToValueAtTime(
            0.0001,
            ctxRef.current!.currentTime + 0.4
          );
          window.setTimeout(() => {
            nodesRef.current?.osc.stop();
            nodesRef.current = null;
            ctxRef.current?.close();
            ctxRef.current = null;
          }, 500);
        } catch {
          nodesRef.current = null;
          ctxRef.current = null;
        }
      }
      return;
    }

    let cancelled = false;
    const start = async () => {
      try {
        const ctx = new AudioContext();
        ctxRef.current = ctx;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.value = 110;
        gain.gain.value = 0.0001;
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        gain.gain.exponentialRampToValueAtTime(0.015, ctx.currentTime + 1.2);
        nodesRef.current = { osc, gain };
        if (cancelled) {
          osc.stop();
          await ctx.close();
        }
      } catch {
        // autoplay policy — ignore
      }
    };
    void start();

    return () => {
      cancelled = true;
      if (nodesRef.current && ctxRef.current) {
        try {
          nodesRef.current.osc.stop();
          void ctxRef.current.close();
        } catch {
          /* */
        }
        nodesRef.current = null;
        ctxRef.current = null;
      }
    };
  }, [enabled]);
}
