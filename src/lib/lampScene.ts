import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import type { BaseId, FinishId, SizeId } from "./catalog";
import { makeBaseTexture, makeGlowTexture, VOLUME_STOPS } from "./lampTextures";

/**
 * The Aubade lamp, built entirely in code: travertine plinth, brass stem,
 * opal glass globe with a light source inside. Framework-free so the React
 * wrapper stays thin and the scene can be reused by any section.
 */

const FINISH_MATERIALS: Record<FinishId, { color: string; roughness: number }> = {
  brass: { color: "#d6b07a", roughness: 0.3 },
  bronze: { color: "#3d3128", roughness: 0.46 },
  nickel: { color: "#c8ccce", roughness: 0.24 },
};
const BASE_ROUGHNESS: Record<BaseId, number> = { travertine: 0.88, marble: 0.2, oak: 0.62 };
const SIZE_SCALE: Record<SizeId, number> = { petite: 0.86, grand: 1 };

const BASE_RADIUS = 0.95;
const BASE_HEIGHT = 0.16;
const STEM_HEIGHT = 1.5;
const CUP_HEIGHT = 0.12;
const GLOBE_RADIUS = 0.8;
const GLOBE_Y = BASE_HEIGHT + STEM_HEIGHT + CUP_HEIGHT + GLOBE_RADIUS * 0.9;
const LAMP_HEIGHT = GLOBE_Y + GLOBE_RADIUS;
const LAMP_WIDTH = BASE_RADIUS * 2.2;

/** How quickly the light eases toward its target, per second. */
const LIGHT_EASE_RATE = 5;
const POINTER_EASE_RATE = 3;
const IDLE_SPIN_SPEED = 0.12;
/** Full retina sharpness; brass edges and the stone texture visibly soften below 2x. */
const MAX_PIXEL_RATIO = 2;
/** The opal globe is frosted, so its refraction pass can render at half resolution. */
const TRANSMISSION_SCALE = 0.5;

export type LampSceneOptions = {
  readonly finish: FinishId;
  readonly base: BaseId;
  readonly size: SizeId;
  readonly light: string;
  readonly intensity: number;
  /** Additive halo. Looks right on dark backgrounds only. */
  readonly halo: boolean;
  /** Breathing room around the lamp; 1 means touching the frame. */
  readonly framing: number;
};

export type LampScene = {
  setLight(hex: string, intensity: number, immediate?: boolean): void;
  setFinish(finish: FinishId): void;
  setBase(base: BaseId): void;
  setSize(size: SizeId): void;
  setPointer(x: number, y: number): void;
  resize(width: number, height: number): void;
  frame(deltaSeconds: number, spin: boolean): void;
  dispose(): void;
};

const ease = (rate: number, dt: number) => 1 - Math.exp(-rate * dt);
const GLASS_WHITE = new THREE.Color("#fbf6ee");
const WHITE_HOT = new THREE.Color("#fff8ee");
/** How strongly the globe's surface is tinted by its light (0 = white glass). */
const GLASS_TINT = 0.18;

function createMaterials(options: LampSceneOptions) {
  const metal = new THREE.MeshStandardMaterial({ metalness: 1, ...FINISH_MATERIALS[options.finish] });
  const base = new THREE.MeshStandardMaterial({
    map: makeBaseTexture(options.base),
    roughness: BASE_ROUGHNESS[options.base],
    metalness: 0,
  });
  const glass = new THREE.MeshPhysicalMaterial({
    color: "#fbf6ee",
    roughness: 0.66, // frosted enough that the source inside is never a visible point
    metalness: 0,
    transmission: 0.78,
    thickness: 1.2,
    ior: 1.45,
    clearcoat: 1,
    clearcoatRoughness: 0.12,
    emissive: new THREE.Color(options.light),
    emissiveIntensity: 0.6,
  });
  const core = new THREE.MeshBasicMaterial({ color: new THREE.Color(options.light) });
  return { metal, base, glass, core };
}

function buildLamp(materials: ReturnType<typeof createMaterials>) {
  const group = new THREE.Group();
  const add = (geometry: THREE.BufferGeometry, material: THREE.Material, y: number) => {
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.y = y;
    group.add(mesh);
    return mesh;
  };

  add(new THREE.CylinderGeometry(BASE_RADIUS, BASE_RADIUS * 1.02, BASE_HEIGHT, 128), materials.base, BASE_HEIGHT / 2);
  add(new THREE.CylinderGeometry(0.17, 0.21, 0.05, 64), materials.metal, BASE_HEIGHT + 0.025);
  add(new THREE.CylinderGeometry(0.032, 0.042, STEM_HEIGHT, 32), materials.metal, BASE_HEIGHT + STEM_HEIGHT / 2);
  add(new THREE.CylinderGeometry(0.24, 0.08, CUP_HEIGHT, 64), materials.metal, BASE_HEIGHT + STEM_HEIGHT + CUP_HEIGHT / 2);
  add(new THREE.TorusGeometry(0.24, 0.012, 16, 96), materials.metal, BASE_HEIGHT + STEM_HEIGHT + CUP_HEIGHT).rotation.x =
    Math.PI / 2;
  add(new THREE.SphereGeometry(GLOBE_RADIUS, 96, 64), materials.glass, GLOBE_Y);
  add(new THREE.SphereGeometry(GLOBE_RADIUS * 0.55, 48, 32), materials.core, GLOBE_Y);
  return group;
}

function makeFlatGlow(texture: THREE.Texture, color: string, blending: THREE.Blending, size: number) {
  const material = new THREE.MeshBasicMaterial({
    map: texture,
    color: new THREE.Color(color),
    transparent: true,
    depthWrite: false,
    blending,
  });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(size, size), material);
  mesh.rotation.x = -Math.PI / 2;
  return { mesh, material };
}

export function createLampScene(canvas: HTMLCanvasElement, options: LampSceneOptions): LampScene {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: "high-performance" });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, MAX_PIXEL_RATIO));
  renderer.transmissionResolutionScale = TRANSMISSION_SCALE;
  // Neutral (Khronos PBR) keeps hue in bright highlights; ACES bleaches a warm globe to white.
  renderer.toneMapping = THREE.NeutralToneMapping;
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  const room = new RoomEnvironment();
  const environmentTarget = pmrem.fromScene(room, 0.04);
  room.dispose();
  scene.environment = environmentTarget.texture;
  scene.environmentIntensity = 0.32;

  const camera = new THREE.PerspectiveCamera(26, 1, 0.1, 100);
  const materials = createMaterials(options);
  const lamp = buildLamp(materials);
  scene.add(lamp);

  const bulb = new THREE.PointLight(options.light, 10, 0, 2);
  bulb.position.y = GLOBE_Y;
  lamp.add(bulb);

  const rim = new THREE.DirectionalLight("#ffffff", 0.7);
  rim.position.set(-4, 5, -5);
  scene.add(rim);

  const glowTexture = makeGlowTexture();
  const halo = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: glowTexture,
      color: new THREE.Color(options.light),
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    }),
  );
  halo.visible = options.halo;
  scene.add(halo);

  // Hot centre: a camera-facing glow just in front of the globe, so the glass reads as lit
  // from inside (bright middle, richer rim) rather than as a painted ball.
  const volumeTexture = makeGlowTexture(VOLUME_STOPS);
  const innerGlow = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: volumeTexture,
      color: new THREE.Color(options.light),
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    }),
  );
  scene.add(innerGlow);
  const toCamera = new THREE.Vector3();
  const hotColor = new THREE.Color();

  const pool = makeFlatGlow(glowTexture, options.light, THREE.AdditiveBlending, 7);
  pool.mesh.position.y = 0.003;
  pool.mesh.visible = options.halo;
  scene.add(pool.mesh);

  const shadow = makeFlatGlow(glowTexture, "#000000", THREE.NormalBlending, BASE_RADIUS * 3.4);
  shadow.mesh.position.y = 0.001;
  shadow.material.opacity = 0.55;
  scene.add(shadow.mesh);

  const target = { color: new THREE.Color(options.light), intensity: options.intensity };
  const current = { color: target.color.clone(), intensity: options.intensity };
  const pointer = { x: 0, y: 0, easedX: 0, easedY: 0 };
  let scale = SIZE_SCALE[options.size];
  let targetScale = scale;
  let spinAngle = 0;
  let cameraDistance = 10;
  let breath = 0;

  const applyLight = () => {
    const i = current.intensity;
    // Opal glass takes on the colour of the light inside it.
    // Unlit opal is grey-white; as the light dims the glass darkens toward an ember.
    materials.glass.color.copy(GLASS_WHITE).lerp(current.color, GLASS_TINT).multiplyScalar(0.3 + 0.7 * i);
    materials.glass.emissive.copy(current.color);
    // Dim surface glow plus a hot core seen through frosted glass: bright centre, richer edges.
    materials.glass.emissiveIntensity = 0.16 + 0.36 * i;
    materials.core.color.copy(current.color).multiplyScalar(1.2 + 1.4 * i);
    bulb.color.copy(current.color);
    bulb.intensity = (3 + 34 * i) * scale * scale;
    halo.material.color.copy(current.color);
    halo.material.opacity = 0.45 + 0.45 * i;
    innerGlow.material.color.copy(hotColor.copy(current.color).lerp(WHITE_HOT, 0.35));
    innerGlow.material.opacity = 0.5 + 0.25 * i;
    pool.material.color.copy(current.color);
    pool.material.opacity = 0.12 + 0.3 * i;
  };

  const placeHalo = () => {
    const size = (3 + 2.4 * current.intensity) * scale;
    halo.scale.set(size, size, 1);
    halo.position.set(0, GLOBE_Y * scale, -0.2);

    const globeCenterY = GLOBE_Y * scale;
    toCamera.set(camera.position.x, camera.position.y - globeCenterY, camera.position.z).normalize();
    const inFront = GLOBE_RADIUS * scale * 1.02;
    innerGlow.position.set(toCamera.x * inFront, globeCenterY + toCamera.y * inFront, toCamera.z * inFront);
    const glowSize = GLOBE_RADIUS * scale * 2.1;
    innerGlow.scale.set(glowSize, glowSize, 1);
  };

  const fit = (aspect: number) => {
    const halfFov = THREE.MathUtils.degToRad(camera.fov / 2);
    const byHeight = (LAMP_HEIGHT * options.framing) / (2 * Math.tan(halfFov));
    const byWidth = (LAMP_WIDTH * options.framing) / (2 * Math.tan(halfFov) * aspect);
    cameraDistance = Math.max(byHeight, byWidth);
  };

  const placeCamera = () => {
    const centerY = LAMP_HEIGHT / 2;
    camera.position.set(pointer.easedX * 0.5, centerY + 0.45 + pointer.easedY * 0.25, cameraDistance);
    camera.lookAt(0, centerY - 0.05, 0);
  };

  applyLight();
  lamp.scale.setScalar(scale);

  return {
    setLight(hex, intensity, immediate = false) {
      target.color.set(hex);
      target.intensity = THREE.MathUtils.clamp(intensity, 0, 1);
      if (immediate) {
        current.color.copy(target.color);
        current.intensity = target.intensity;
        applyLight();
      }
    },
    setFinish(finish) {
      const { color, roughness } = FINISH_MATERIALS[finish];
      materials.metal.color.set(color);
      materials.metal.roughness = roughness;
    },
    setBase(base) {
      materials.base.map?.dispose();
      materials.base.map = makeBaseTexture(base);
      materials.base.roughness = BASE_ROUGHNESS[base];
      materials.base.needsUpdate = true;
    },
    setSize(size) {
      targetScale = SIZE_SCALE[size];
    },
    setPointer(x, y) {
      pointer.x = THREE.MathUtils.clamp(x, -1, 1);
      pointer.y = THREE.MathUtils.clamp(y, -1, 1);
    },
    resize(width, height) {
      if (width === 0 || height === 0) return;
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      fit(camera.aspect);
    },
    frame(dt, spin) {
      const k = ease(LIGHT_EASE_RATE, dt);
      current.color.lerp(target.color, k);
      breath += dt;
      const breathing = spin ? Math.sin(breath * 1.1) * 0.015 : 0;
      current.intensity += (target.intensity + breathing - current.intensity) * k;
      scale += (targetScale - scale) * ease(LIGHT_EASE_RATE, dt);
      lamp.scale.setScalar(scale);
      applyLight();

      const kp = ease(POINTER_EASE_RATE, dt);
      pointer.easedX += (pointer.x - pointer.easedX) * kp;
      pointer.easedY += (pointer.y - pointer.easedY) * kp;
      if (spin) spinAngle += dt * IDLE_SPIN_SPEED;
      lamp.rotation.y = spinAngle + pointer.easedX * 0.4;
      placeCamera();
      placeHalo();
      renderer.render(scene, camera);
    },
    dispose() {
      scene.traverse((object) => {
        if (object instanceof THREE.Mesh || object instanceof THREE.Sprite) {
          object.geometry.dispose();
          const list = Array.isArray(object.material) ? object.material : [object.material];
          list.forEach((material: THREE.Material & { map?: THREE.Texture | null }) => {
            material.map?.dispose();
            material.dispose();
          });
        }
      });
      glowTexture.dispose();
      volumeTexture.dispose();
      environmentTarget.dispose();
      pmrem.dispose();
      renderer.dispose();
    },
  };
}

/** Maps outdoor lux (≈3 at night to ≈1000 at noon, indoors) onto a 0..1 lamp intensity. */
export function intensityFromLux(lux: number): number {
  const min = Math.log(3);
  const max = Math.log(1000);
  return THREE.MathUtils.clamp(0.3 + ((Math.log(Math.max(lux, 1)) - min) / (max - min)) * 0.7, 0, 1);
}
