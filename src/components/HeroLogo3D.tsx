"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";

const CYCLE_DURATION = 13;
const ASSEMBLE_DURATION = 1.3;
const HOLD_DURATION = 5;
const MORPH_DURATION = 1.3;
const DISPERSE_DURATION = 0.4;

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = src;
  });
}

function sampleImagePoints(
  image: HTMLImageElement,
  options: { step: number; threshold: number; scale: number },
) {
  const canvas = document.createElement("canvas");
  canvas.width = image.width;
  canvas.height = image.height;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Canvas 2D is unavailable");
  context.drawImage(image, 0, 0);
  const { data, width, height } = context.getImageData(
    0,
    0,
    canvas.width,
    canvas.height,
  );
  const points: THREE.Vector3[] = [];
  const colors: THREE.Color[] = [];
  const blue = new THREE.Color("#3b82f6");
  const red = new THREE.Color("#ef4444");

  for (let y = 0; y < height; y += options.step) {
    for (let x = 0; x < width; x += options.step) {
      const offset = (y * width + x) * 4;
      if (data[offset + 3] <= options.threshold) continue;
      points.push(
        new THREE.Vector3(
          ((x - width / 2) / width) * options.scale,
          ((height / 2 - y) / height) * options.scale,
          0,
        ),
      );
      const [r, g, b] = [data[offset], data[offset + 1], data[offset + 2]];
      colors.push(r > b && r > g * 0.9 ? red : blue);
    }
  }
  return { points, colors };
}

function repeatPoints(points: THREE.Vector3[], count: number) {
  return Array.from({ length: count }, (_, index) =>
    points[index % points.length].clone(),
  );
}

function repeatColors(colors: THREE.Color[], count: number) {
  return Array.from(
    { length: count },
    (_, index) => colors[index % colors.length],
  );
}

function centerPoints(points: THREE.Vector3[]) {
  const center = new THREE.Vector3();
  for (const point of points) center.add(point);
  center.multiplyScalar(1 / points.length);
  for (const point of points) point.sub(center);
  return points;
}

function buildRandomPoints(count: number) {
  return Array.from({ length: count }, () => {
    const radius = 0.9 + Math.random() * 0.5;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    return new THREE.Vector3(
      radius * Math.sin(phi) * Math.cos(theta),
      radius * Math.sin(phi) * Math.sin(theta),
      radius * Math.cos(phi),
    );
  });
}

export default function HeroLogo3D() {
  const mountRef = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount || window.matchMedia("(prefers-reduced-motion: reduce)").matches)
      return;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    } catch {
      return;
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.domElement.setAttribute("aria-hidden", "true");
    mount.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 100);
    camera.position.set(0, 0, 8.2);
    const geometry = new THREE.BufferGeometry();
    const material = new THREE.PointsMaterial({
      color: new THREE.Color("#e2e8f0"),
      size: 0.02,
      sizeAttenuation: true,
      transparent: true,
      opacity: 1,
      depthWrite: false,
      vertexColors: true,
      blending: THREE.AdditiveBlending,
    });
    const particles = new THREE.Points(geometry, material);
    scene.add(particles);
    const glow = new THREE.PointLight(0x38bdf8, 1.2, 8);
    glow.position.set(1.2, 1.2, 2.5);
    scene.add(glow, new THREE.AmbientLight(0xffffff, 0.9));

    let disposed = false;
    let frame = 0;
    let revealTimer = 0;
    let positionsA: THREE.Vector3[] = [];
    let positionsB: THREE.Vector3[] = [];
    let colorsA: THREE.Color[] = [];
    let colorsB: THREE.Color[] = [];
    let randomPositions: THREE.Vector3[] = [];
    let delays = new Float32Array();
    let startTime = 0;
    const neutral = new THREE.Color("#cbd5f5");
    const blue = new THREE.Color("#60a5fa");
    const cyan = new THREE.Color("#38bdf8");
    const red = new THREE.Color("#f43f5e");
    const rose = new THREE.Color("#fb7185");
    const white = new THREE.Color("#e2e8f0");

    const resize = () => {
      const { width, height } = mount.getBoundingClientRect();
      if (!width || !height) return;
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    };
    const observer = new ResizeObserver(resize);
    observer.observe(mount);

    const animate = () => {
      if (disposed) return;
      frame = requestAnimationFrame(animate);
      if (document.hidden || !positionsA.length) return;

      const time = ((performance.now() - startTime) / 1000) % CYCLE_DURATION;
      let from = randomPositions;
      let to = positionsA;
      let progress = 0;
      let size = 0.02;
      let tint = blue;

      if (time < ASSEMBLE_DURATION) {
        progress = time / ASSEMBLE_DURATION;
        size = 0.024;
      } else if (time < ASSEMBLE_DURATION + HOLD_DURATION) {
        from = positionsA;
        progress = 1;
        tint = cyan;
      } else if (time < ASSEMBLE_DURATION + HOLD_DURATION + MORPH_DURATION) {
        from = positionsA;
        to = positionsB;
        progress = (time - ASSEMBLE_DURATION - HOLD_DURATION) / MORPH_DURATION;
        size = 0.022;
        tint = red;
      } else if (
        time <
        ASSEMBLE_DURATION + HOLD_DURATION + MORPH_DURATION + HOLD_DURATION
      ) {
        from = positionsB;
        to = positionsB;
        progress = 1;
        tint = rose;
      } else {
        from = positionsB;
        to = randomPositions;
        progress =
          (time -
            (ASSEMBLE_DURATION +
              HOLD_DURATION +
              MORPH_DURATION +
              HOLD_DURATION)) /
          DISPERSE_DURATION;
        size = 0.018;
        tint = white;
      }

      const positionAttribute = geometry.getAttribute(
        "position",
      ) as THREE.BufferAttribute;
      const colorAttribute = geometry.getAttribute(
        "color",
      ) as THREE.BufferAttribute;
      const positions = positionAttribute.array as Float32Array;
      const colors = colorAttribute.array as Float32Array;
      for (let index = 0; index < positionsA.length; index++) {
        const local = Math.min(
          1,
          Math.max(0, (progress - delays[index]) / (1 - delays[index])),
        );
        const eased =
          local < 0.5 ? 2 * local * local : 1 - Math.pow(-2 * local + 2, 2) / 2;
        const base = index * 3;
        positions[base] = THREE.MathUtils.lerp(
          from[index].x,
          to[index].x,
          eased,
        );
        positions[base + 1] = THREE.MathUtils.lerp(
          from[index].y,
          to[index].y,
          eased,
        );
        positions[base + 2] = THREE.MathUtils.lerp(
          from[index].z,
          to[index].z,
          eased,
        );
        const fromColor =
          from === positionsA
            ? colorsA[index]
            : from === positionsB
              ? colorsB[index]
              : neutral;
        const toColor =
          to === positionsA
            ? colorsA[index]
            : to === positionsB
              ? colorsB[index]
              : neutral;
        colors[base] = THREE.MathUtils.lerp(fromColor.r, toColor.r, eased);
        colors[base + 1] = THREE.MathUtils.lerp(fromColor.g, toColor.g, eased);
        colors[base + 2] = THREE.MathUtils.lerp(fromColor.b, toColor.b, eased);
      }
      positionAttribute.needsUpdate = true;
      colorAttribute.needsUpdate = true;
      material.size = size;
      material.color = tint;
      particles.rotation.y += 0.003;
      renderer.render(scene, camera);
    };

    const setup = async () => {
      try {
        const [bertImage, arcImage] = await Promise.all([
          loadImage("/bert-logo.png"),
          loadImage("/arc-logo.png"),
        ]);
        if (disposed) return;
        const bert = sampleImagePoints(bertImage, {
          step: 2,
          threshold: 30,
          scale: 6.3,
        });
        const arc = sampleImagePoints(arcImage, {
          step: 4,
          threshold: 30,
          scale: 6.3,
        });
        const count = Math.max(bert.points.length, arc.points.length);
        if (!bert.points.length || !arc.points.length) return;
        positionsA = centerPoints(repeatPoints(bert.points, count));
        positionsB = centerPoints(repeatPoints(arc.points, count));
        colorsA = repeatColors(bert.colors, count);
        colorsB = repeatColors(arc.colors, count);
        randomPositions = centerPoints(buildRandomPoints(count));
        delays = Float32Array.from(
          { length: count },
          () => Math.random() * 0.35,
        );
        const positions = new Float32Array(count * 3);
        const colors = new Float32Array(count * 3);
        for (let index = 0; index < count; index++) {
          const base = index * 3;
          positions[base] = randomPositions[index].x;
          positions[base + 1] = randomPositions[index].y;
          positions[base + 2] = randomPositions[index].z;
          colors[base] = colorsA[index].r;
          colors[base + 1] = colorsA[index].g;
          colors[base + 2] = colorsA[index].b;
        }
        geometry.setAttribute(
          "position",
          new THREE.BufferAttribute(positions, 3),
        );
        geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
        geometry.computeBoundingSphere();
        startTime = performance.now();
        resize();
        animate();
        revealTimer = window.setTimeout(() => {
          if (!disposed) setReady(true);
        }, 950);
      } catch {
        // The static logo remains visible if images or WebGL are unavailable.
      }
    };
    void setup();

    return () => {
      disposed = true;
      cancelAnimationFrame(frame);
      window.clearTimeout(revealTimer);
      observer.disconnect();
      geometry.dispose();
      material.dispose();
      renderer.dispose();
      mount.removeChild(renderer.domElement);
    };
  }, []);

  return (
    <div className="hero-logo-stage">
      <div className="hero-logo-glow" />
      <div className={`hero-logo-fallback${ready ? " is-hidden" : ""}`} />
      <div className="hero-logo-canvas" ref={mountRef} />
    </div>
  );
}
