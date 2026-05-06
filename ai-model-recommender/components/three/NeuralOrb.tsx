'use client';

import { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Sphere, MeshDistortMaterial } from '@react-three/drei';
import * as THREE from 'three';

function Orb() {
  const meshRef = useRef<THREE.Mesh>(null);
  const innerRef = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    if (meshRef.current) {
      meshRef.current.rotation.y = clock.getElapsedTime() * 0.3;
      meshRef.current.rotation.x = Math.sin(clock.getElapsedTime() * 0.2) * 0.2;
    }
    if (innerRef.current) {
      innerRef.current.rotation.y = -clock.getElapsedTime() * 0.5;
    }
  });

  return (
    <group>
      {/* Outer distort sphere */}
      <Sphere ref={meshRef} args={[1.4, 64, 64]}>
        <MeshDistortMaterial
          color="#8b5cf6"
          attach="material"
          distort={0.45}
          speed={2}
          roughness={0}
          metalness={0.8}
          transparent
          opacity={0.35}
        />
      </Sphere>
      {/* Inner glowing core */}
      <Sphere ref={innerRef} args={[0.9, 32, 32]}>
        <MeshDistortMaterial
          color="#22d3ee"
          attach="material"
          distort={0.3}
          speed={3}
          roughness={0}
          metalness={1}
          transparent
          opacity={0.6}
        />
      </Sphere>
      {/* Point lights for glow */}
      <pointLight color="#8b5cf6" intensity={3} distance={5} />
      <pointLight color="#22d3ee" intensity={2} distance={4} position={[1, 0, 0]} />
    </group>
  );
}

function Particles() {
  const count = 150;
  const positions = useMemo(() => {
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const r = 2.5 + Math.random() * 1.5;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      arr[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      arr[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      arr[i * 3 + 2] = r * Math.cos(phi);
    }
    return arr;
  }, []);

  const pointsRef = useRef<THREE.Points>(null);
  useFrame(({ clock }) => {
    if (pointsRef.current) {
      pointsRef.current.rotation.y = clock.getElapsedTime() * 0.1;
      pointsRef.current.rotation.x = clock.getElapsedTime() * 0.05;
    }
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute args={[positions, 3]} attach="attributes-position" />
      </bufferGeometry>
      <pointsMaterial color="#c4b5fd" size={0.04} transparent opacity={0.7} sizeAttenuation />
    </points>
  );
}

export default function NeuralOrb() {
  return (
    <div className="w-full h-full">
      <Canvas camera={{ position: [0, 0, 5], fov: 45 }} gl={{ antialias: true, alpha: true }}>
        <ambientLight intensity={0.2} />
        <Orb />
        <Particles />
      </Canvas>
    </div>
  );
}
