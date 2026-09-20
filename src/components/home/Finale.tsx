"use client";
import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { COPY } from "@/config/site";

/**
 * Three.js finale after the portal opens:
 *  1. a gold particle nebula drifts in from the door light,
 *  2. the particles condense into the LEVEL UP wordmark,
 *  3. taglines rise one by one,
 *  4. a light-speed warp through gold streaks, then hand-off to the destination URL.
 */
const FINALE = COPY.finale;
const GOLD = new THREE.Color("#e7c98a");
const BLUE = new THREE.Color("#2563eb");
const IVORY = new THREE.Color("#fff3d6");

const T_GATHER = 3.4; // seconds until the word is formed
const T_HOLD = 4.6; // taglines shown while the word floats
const T_WARP = 2.4; // warp-out length
const TOTAL = T_GATHER + T_HOLD + T_WARP;

function sampleWord(word: string, count: number): Float32Array {
  const c = document.createElement("canvas");
  const W = 1400;
  const H = 320;
  c.width = W;
  c.height = H;
  const ctx = c.getContext("2d", { willReadFrequently: true })!;
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = "#fff";
  ctx.font = "600 200px Poppins, Montserrat, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(word, W / 2, H / 2 + 8);
  const { data } = ctx.getImageData(0, 0, W, H);
  const pts: number[] = [];
  for (let y = 0; y < H; y += 3) for (let x = 0; x < W; x += 3) if (data[(y * W + x) * 4] > 128) pts.push(x, y);
  const out = new Float32Array(count * 3);
  const n = pts.length / 2;
  for (let i = 0; i < count; i++) {
    const k = Math.floor(Math.random() * n);
    out[i * 3] = ((pts[k * 2] - W / 2) / W) * 22 + (Math.random() - 0.5) * 0.05;
    out[i * 3 + 1] = (-(pts[k * 2 + 1] - H / 2) / W) * 22 + (Math.random() - 0.5) * 0.05;
    out[i * 3 + 2] = (Math.random() - 0.5) * 0.35;
  }
  return out;
}

export function Finale({ onDone, portrait }: { onDone: () => void; portrait: boolean }) {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const [stage, setStage] = useState<"gather" | "hold" | "warp">("gather");
  const doneRef = useRef(false);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;
    const W = mount.clientWidth;
    const H = mount.clientHeight;
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(W, H);
    mount.appendChild(renderer.domElement);
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(portrait ? 62 : 48, W / H, 0.1, 400);
    camera.position.set(0, 0, portrait ? 30 : 24);

    // --- particles -------------------------------------------------------
    const COUNT = portrait ? 9000 : 16000;
    const word = document.fonts ? Promise.race([document.fonts.load("600 200px Poppins"), new Promise((r) => setTimeout(r, 800))]) : Promise.resolve();
    const target = new Float32Array(COUNT * 3);
    const start = new Float32Array(COUNT * 3);
    const seed = new Float32Array(COUNT);
    for (let i = 0; i < COUNT; i++) {
      // nebula: a swirl that starts far down the z axis (coming out of the door light)
      const r = 2 + Math.random() * 14;
      const a = Math.random() * Math.PI * 2;
      start[i * 3] = Math.cos(a) * r * (portrait ? 0.6 : 1);
      start[i * 3 + 1] = Math.sin(a) * r * 0.55;
      start[i * 3 + 2] = -40 - Math.random() * 60;
      seed[i] = Math.random();
    }
    const geo = new THREE.BufferGeometry();
    const pos = new Float32Array(COUNT * 3);
    pos.set(start);
    geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    const colors = new Float32Array(COUNT * 3);
    for (let i = 0; i < COUNT; i++) {
      const c = seed[i] < 0.8 ? GOLD : seed[i] < 0.93 ? IVORY : BLUE;
      colors[i * 3] = c.r;
      colors[i * 3 + 1] = c.g;
      colors[i * 3 + 2] = c.b;
    }
    geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    const sprite = (() => {
      const s = document.createElement("canvas");
      s.width = s.height = 64;
      const g = s.getContext("2d")!;
      const grd = g.createRadialGradient(32, 32, 0, 32, 32, 32);
      grd.addColorStop(0, "rgba(255,255,255,1)");
      grd.addColorStop(0.35, "rgba(255,255,255,0.55)");
      grd.addColorStop(1, "rgba(255,255,255,0)");
      g.fillStyle = grd;
      g.fillRect(0, 0, 64, 64);
      const t = new THREE.CanvasTexture(s);
      t.colorSpace = THREE.SRGBColorSpace;
      return t;
    })();
    const mat = new THREE.PointsMaterial({ size: portrait ? 0.16 : 0.13, map: sprite, vertexColors: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0.95 });
    const points = new THREE.Points(geo, mat);
    scene.add(points);

    // --- warp streaks -----------------------------------------------------
    const STREAKS = 900;
    const sGeo = new THREE.BufferGeometry();
    const sPos = new Float32Array(STREAKS * 6);
    const sCol = new Float32Array(STREAKS * 6);
    for (let i = 0; i < STREAKS; i++) {
      const r = 3 + Math.random() * 30;
      const a = Math.random() * Math.PI * 2;
      const x = Math.cos(a) * r;
      const y = Math.sin(a) * r * 0.7;
      const z = -20 - Math.random() * 120;
      sPos.set([x, y, z, x, y, z - 2 - Math.random() * 6], i * 6);
      const c = Math.random() < 0.85 ? GOLD : IVORY;
      sCol.set([c.r, c.g, c.b, c.r * 0.2, c.g * 0.2, c.b * 0.2], i * 6);
    }
    sGeo.setAttribute("position", new THREE.BufferAttribute(sPos, 3));
    sGeo.setAttribute("color", new THREE.BufferAttribute(sCol, 3));
    const sMat = new THREE.LineBasicMaterial({ vertexColors: true, transparent: true, opacity: 0, blending: THREE.AdditiveBlending });
    const streaks = new THREE.LineSegments(sGeo, sMat);
    scene.add(streaks);

    // --- glow disc behind the word -----------------------------------------
    const glow = new THREE.Mesh(new THREE.PlaneGeometry(portrait ? 26 : 40, portrait ? 12 : 16), new THREE.ShaderMaterial({
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
      uniforms: { uT: { value: 0 }, uA: { value: 0 } },
      vertexShader: "varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }",
      fragmentShader: "uniform float uA; varying vec2 vUv; void main(){ vec2 p = vUv - 0.5; float d = length(vec2(p.x*2.2, p.y*1.2)); float a = smoothstep(0.75, 0.0, d) * uA; gl_FragColor = vec4(0.91, 0.79, 0.54, a * 0.35); }",
    }));
    glow.position.z = -1.5;
    scene.add(glow);

    let raf = 0;
    const t0 = performance.now();
    let ready = false;
    word.then(() => {
      const t = sampleWord("LEVEL UP", COUNT);
      // Portrait phones: shrink the wordmark so it fits the narrow view
      if (portrait) for (let i = 0; i < t.length; i++) t[i] *= 0.62;
      target.set(t);
      ready = true;
    });

    const ease = (x: number) => 1 - Math.pow(1 - Math.min(1, Math.max(0, x)), 3);
    const tick = () => {
      const t = (performance.now() - t0) / 1000;
      const p = geo.attributes.position as THREE.BufferAttribute;
      const arr = p.array as Float32Array;
      if (t < T_GATHER + T_HOLD) {
        const g = ease((t - 0.3) / (T_GATHER - 0.3));
        for (let i = 0; i < COUNT; i++) {
          const k = ready ? Math.min(1, g * (0.85 + seed[i] * 0.3)) : 0;
          const ix = i * 3;
          const wob = Math.sin(t * 1.4 + seed[i] * 12) * 0.06 * (1 - k * 0.7);
          arr[ix] = start[ix] + (target[ix] - start[ix]) * k + wob;
          arr[ix + 1] = start[ix + 1] + (target[ix + 1] - start[ix + 1]) * k + Math.cos(t * 1.1 + seed[i] * 9) * 0.05;
          arr[ix + 2] = start[ix + 2] + (target[ix + 2] - start[ix + 2]) * k;
        }
        (glow.material as THREE.ShaderMaterial).uniforms.uA.value = ease((t - T_GATHER + 0.8) / 1.4);
        points.rotation.y = Math.sin(t * 0.25) * 0.06;
        camera.position.z = (portrait ? 30 : 24) - ease(t / T_GATHER) * 2;
      } else {
        // warp: word explodes forward, streaks stream past the camera
        const w = (t - T_GATHER - T_HOLD) / T_WARP;
        const acc = w * w;
        for (let i = 0; i < COUNT; i++) {
          const ix = i * 3;
          arr[ix + 2] += (0.35 + seed[i] * 0.6) * acc * 3;
          arr[ix] *= 1 + acc * 0.02;
          arr[ix + 1] *= 1 + acc * 0.02;
        }
        sMat.opacity = Math.min(1, w * 2);
        const sp = sGeo.attributes.position as THREE.BufferAttribute;
        const sa = sp.array as Float32Array;
        const speed = 1.5 + acc * 14;
        for (let i = 0; i < STREAKS; i++) {
          sa[i * 6 + 2] += speed;
          sa[i * 6 + 5] += speed;
          sa[i * 6 + 5] = sa[i * 6 + 2] - (2 + acc * 30);
          if (sa[i * 6 + 2] > 30) { sa[i * 6 + 2] = -140; sa[i * 6 + 5] = -146; }
        }
        sp.needsUpdate = true;
        (glow.material as THREE.ShaderMaterial).uniforms.uA.value = 1 + w * 2;
        camera.fov = (portrait ? 62 : 48) + acc * 40;
        camera.updateProjectionMatrix();
        mat.opacity = Math.max(0, 0.95 - w * 0.6);
      }
      p.needsUpdate = true;
      renderer.render(scene, camera);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    const s1 = window.setTimeout(() => setStage("hold"), T_GATHER * 1000);
    const s2 = window.setTimeout(() => setStage("warp"), (T_GATHER + T_HOLD) * 1000);
    const s3 = window.setTimeout(() => { if (!doneRef.current) { doneRef.current = true; onDone(); } }, TOTAL * 1000);

    const onResize = () => {
      const w = mount.clientWidth;
      const h = mount.clientHeight;
      renderer.setSize(w, h);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };
    window.addEventListener("resize", onResize);
    return () => {
      cancelAnimationFrame(raf);
      window.clearTimeout(s1); window.clearTimeout(s2); window.clearTimeout(s3);
      window.removeEventListener("resize", onResize);
      renderer.dispose(); geo.dispose(); sGeo.dispose(); mat.dispose(); sMat.dispose(); sprite.dispose();
      mount.removeChild(renderer.domElement);
    };
  }, [onDone, portrait]);

  return (
    <div className="absolute inset-0 z-[90] overflow-hidden" style={{ background: "radial-gradient(ellipse at 50% 55%, #1a1408 0%, #0a0805 45%, #030203 100%)", animation: "eventsRoomIn 0.9s ease-out both", fontFamily: "Poppins, Montserrat, sans-serif" }} role="status" aria-live="polite">
      <div ref={mountRef} className="absolute inset-0" />
      {/* vignette + fine gold dust */}
      <div className="pointer-events-none absolute inset-0" style={{ background: "radial-gradient(ellipse 70% 60% at 50% 50%, transparent 40%, rgba(0,0,0,0.75) 100%)" }} aria-hidden />
      {/* copy */}
      <div className="pointer-events-none absolute inset-x-0 flex flex-col items-center text-center px-6" style={{ top: portrait ? "62%" : "64%" }}>
        <p className="font-semibold uppercase" style={{ fontSize: portrait ? 10 : 12, letterSpacing: "0.5em", color: "#e7c98a", opacity: stage === "gather" ? 0 : stage === "warp" ? 0 : 1, transition: "opacity 900ms ease" }}>{FINALE.eyebrow}</p>
        {FINALE.lines.map((l, i) => (
          <p key={l} className="text-[#fff3d6]" style={{ marginTop: i === 0 ? 14 : 8, fontSize: i === 0 ? (portrait ? "clamp(20px,6vw,30px)" : "clamp(22px,2.4vw,40px)") : portrait ? 13.5 : 16, fontWeight: i === 0 ? 600 : 400, letterSpacing: i === 0 ? "-0.01em" : "0.12em", textTransform: i === 0 ? undefined : "uppercase", lineHeight: 1.2, maxWidth: "26ch", textShadow: "0 2px 30px rgba(231,201,138,0.35)", opacity: stage === "hold" ? 1 : 0, transform: stage === "hold" ? "translateY(0)" : "translateY(14px)", transition: `opacity 800ms ease ${i * 450}ms, transform 800ms ease ${i * 450}ms` }}>{l}</p>
        ))}
        <p className="uppercase" style={{ marginTop: 22, fontSize: 10.5, letterSpacing: "0.36em", color: "rgba(231,201,138,0.85)", opacity: stage === "warp" ? 1 : 0, transition: "opacity 500ms ease" }}>{FINALE.cta} →</p>
      </div>
      {/* white-out at the very end */}
      <div className="pointer-events-none absolute inset-0" style={{ background: "#fff8e8", opacity: stage === "warp" ? 1 : 0, transition: `opacity ${T_WARP * 1000}ms cubic-bezier(0.7, 0, 1, 1)` }} aria-hidden />
    </div>
  );
}
