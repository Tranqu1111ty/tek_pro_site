"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { useEffect, useRef, useState } from "react";
import type { Group } from "three";
import { useMediaQuery } from "../../hooks/useMediaQuery";

const rotorPositions: [number, number, number][] = [
  [1.42, 0.08, 1.05],
  [-1.42, 0.08, 1.05],
  [1.42, 0.08, -1.05],
  [-1.42, 0.08, -1.05],
];

function Rotor({ position }: { position: [number, number, number] }) {
  const rotor = useRef<Group>(null);

  useFrame((_, delta) => {
    if (rotor.current) rotor.current.rotation.y += delta * 15;
  });

  return (
    <group position={position}>
      <mesh position={[0, 0.05, 0]}>
        <cylinderGeometry args={[0.12, 0.14, 0.18, 18]} />
        <meshStandardMaterial color="#101820" metalness={0.82} roughness={0.28} />
      </mesh>
      <group ref={rotor} position={[0, 0.16, 0]}>
        <mesh>
          <boxGeometry args={[1.15, 0.025, 0.08]} />
          <meshStandardMaterial color="#a9b6c2" metalness={0.85} roughness={0.3} />
        </mesh>
        <mesh rotation={[0, Math.PI / 2, 0]}>
          <boxGeometry args={[0.8, 0.018, 0.055]} />
          <meshStandardMaterial color="#6d7b87" metalness={0.8} roughness={0.34} />
        </mesh>
      </group>
    </group>
  );
}

function Quadcopter({ pointer }: { pointer: { x: number; y: number } }) {
  const drone = useRef<Group>(null);

  useFrame(({ clock }) => {
    if (!drone.current) return;
    const time = clock.getElapsedTime();
    drone.current.position.y = Math.sin(time * 1.2) * 0.07;
    drone.current.rotation.y += (pointer.x * 0.28 - drone.current.rotation.y) * 0.025;
    drone.current.rotation.x += (-pointer.y * 0.08 - drone.current.rotation.x) * 0.025;
    drone.current.rotation.z = Math.sin(time * 0.7) * 0.012;
  });

  return (
    <group ref={drone} rotation={[0.04, -0.38, 0]}>
      <mesh scale={[1.1, 0.34, 0.78]}>
        <boxGeometry args={[1.35, 0.72, 1.25]} />
        <meshStandardMaterial color="#182633" metalness={0.78} roughness={0.3} />
      </mesh>
      <mesh position={[0, 0.23, 0]} scale={[0.72, 0.18, 0.48]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color="#d9e5ee" metalness={0.65} roughness={0.32} />
      </mesh>
      <mesh position={[0, -0.54, 0.45]}>
        <cylinderGeometry args={[0.24, 0.19, 0.32, 20]} />
        <meshStandardMaterial color="#0b1117" metalness={0.72} roughness={0.22} />
      </mesh>
      <mesh position={[0, -0.72, 0.46]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.13, 0.16, 0.16, 20]} />
        <meshStandardMaterial color="#7eb1d2" emissive="#12324a" emissiveIntensity={0.55} />
      </mesh>
      {rotorPositions.map((position, index) => (
        <group key={index}>
          <mesh position={[position[0] * 0.52, 0, position[2] * 0.52]} rotation={[0, Math.atan2(position[2], position[0]), 0]}>
            <boxGeometry args={[1.35, 0.11, 0.12]} />
            <meshStandardMaterial color="#263948" metalness={0.72} roughness={0.33} />
          </mesh>
          <Rotor position={position} />
        </group>
      ))}
      <mesh position={[0.5, 0.05, -0.66]}>
        <sphereGeometry args={[0.045, 12, 12]} />
        <meshStandardMaterial color="#dceaf5" emissive="#bcd8ed" emissiveIntensity={2} />
      </mesh>
      <mesh position={[-0.5, 0.05, -0.66]}>
        <sphereGeometry args={[0.045, 12, 12]} />
        <meshStandardMaterial color="#dceaf5" emissive="#bcd8ed" emissiveIntensity={2} />
      </mesh>
    </group>
  );
}

export function DroneScene() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(true);
  const [pointer, setPointer] = useState({ x: 0, y: 0 });
  const reducedMotion = useMediaQuery("(prefers-reduced-motion: reduce)");
  const mobile = useMediaQuery("(max-width: 800px)");

  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => setActive(entry.isIntersecting),
      { rootMargin: "120px" },
    );
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={containerRef}
      className="drone-scene"
      onPointerMove={(event) => {
        if (mobile || reducedMotion) return;
        const rect = event.currentTarget.getBoundingClientRect();
        setPointer({
          x: ((event.clientX - rect.left) / rect.width - 0.5) * 2,
          y: ((event.clientY - rect.top) / rect.height - 0.5) * 2,
        });
      }}
      onPointerLeave={() => setPointer({ x: 0, y: 0 })}
    >
      <Canvas
        aria-label="Интерактивная трехмерная модель промышленного квадрокоптера"
        dpr={mobile ? 1 : [1, 1.5]}
        camera={{ position: [4.6, 2.6, 5.5], fov: 38 }}
        frameloop={active && !reducedMotion ? "always" : "demand"}
        gl={{ antialias: !mobile, alpha: true, powerPreference: "high-performance" }}
      >
        <ambientLight intensity={0.65} />
        <directionalLight position={[4, 6, 3]} intensity={3.2} color="#eef7ff" />
        <directionalLight position={[-5, 1, -2]} intensity={1.6} color="#5a93ba" />
        <pointLight position={[0, -1, 3]} intensity={8} color="#163d59" />
        <Quadcopter pointer={pointer} />
      </Canvas>
      <div className="drone-hud" aria-hidden="true">
        <span>SCENE / 2025</span>
        <i />
        <b>IT / AI</b>
      </div>
    </div>
  );
}
