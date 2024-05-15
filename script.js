import * as THREE from 'https://unpkg.com/three@0.138.0/build/three.module.js';
import { OrbitControls } from 'https://unpkg.com/three@0.138.0/examples/jsm/controls/OrbitControls.js';
import { EffectComposer } from 'https://unpkg.com/three@0.138.0/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'https://unpkg.com/three@0.138.0/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'https://unpkg.com/three@0.138.0/examples/jsm/postprocessing/UnrealBloomPass.js';
import { GLTFLoader } from 'https://unpkg.com/three@0.138.0/examples/jsm/loaders/GLTFLoader.js';

let focusedPlanet = null;
let orbitEnabled = true;

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 50000);
camera.position.z = 7000;
camera.position.y = 2000;

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
document.body.appendChild(renderer.domElement);

const renderScene = new RenderPass(scene, camera);
const bloomPass = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 1.5, 0.4, 0.85);
bloomPass.threshold = 0.1;
bloomPass.strength = 0.3;
bloomPass.radius = 0.1;

const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));
composer.addPass(bloomPass);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableZoom = true;

const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, 0.17);
hemiLight.position.set(0, 100, 0);
scene.add(hemiLight);

const ambientLight = new THREE.AmbientLight(0x404040, 0.01);
scene.add(ambientLight);

const sunGeometry = new THREE.SphereGeometry(500, 200, 200);
const sunMaterial = new THREE.MeshBasicMaterial({ color: 0xFFA500 });
const sun = new THREE.Mesh(sunGeometry, sunMaterial);
scene.add(sun);

const sunlight = new THREE.PointLight(0xffffff, 1);
sunlight.position.set(0, 0, 0);
scene.add(sunlight);

function createSkybox() {
    const skyboxSize = 50000;
    const skyboxGeometry = new THREE.BoxGeometry(skyboxSize, skyboxSize, skyboxSize);
    const loader = new THREE.TextureLoader();
    const materialArray = [
        new THREE.MeshBasicMaterial({ map: loader.load('img/a.jpg'), side: THREE.BackSide }),
        new THREE.MeshBasicMaterial({ map: loader.load('img/a.jpg'), side: THREE.BackSide }),
        new THREE.MeshBasicMaterial({ map: loader.load('img/a.jpg'), side: THREE.BackSide }),
        new THREE.MeshBasicMaterial({ map: loader.load('img/a.jpg'), side: THREE.BackSide }),
        new THREE.MeshBasicMaterial({ map: loader.load('img/a.jpg'), side: THREE.BackSide }),
        new THREE.MeshBasicMaterial({ map: loader.load('img/a.jpg'), side: THREE.BackSide })
    ];
    const skybox = new THREE.Mesh(skyboxGeometry, materialArray);
    scene.add(skybox);
}
createSkybox();

const solarSystemPlanets = [
    { name: "Mercury", color: 0x909090, size: 2.9 * 5, distance: 35 * 6, orbitalSpeed: 0.004, modelScale: 2.2 },
    { name: "Venus", color: 0xD3754A, size: 3 * 5, distance: 42 * 6, orbitalSpeed: 0.003, modelScale: 25 },
    { name: "Earth", color: 0x137ADB, size: 4 * 5, distance: 54 * 6, orbitalSpeed: 0.0025, modelScale: 55 },
    { name: "Mars", color: 0xCB4100, size: 2.8 * 5, distance: 63 * 6, orbitalSpeed: 0.002, modelScale: 50 },
    { name: "Jupiter", color: 0xD37131, size: 11 * 5, distance: 75 * 6, orbitalSpeed: 0.001, modelScale: 1.3 },
    { name: "Saturn", color: 0xCA8E3B, size: 10 * 5, distance: 85 * 6.5, orbitalSpeed: 0.0009, modelScale: 1 },
    { name: "Uranus", color: 0x0D98BA, size: 5 * 5, distance: 95 * 7.3, orbitalSpeed: 0.0008, modelScale: 0.07 },
    { name: "Neptune", color: 0x1E90FF, size: 5 * 5, distance: 110 * 7.5, orbitalSpeed: 0.0007, modelScale: 0.15 }
];

const planetModels = {
    "Earth": "models/earth2.glb",
    "Mars": "models/mars2.glb",
    "Mercury": "models/mercury.glb",
    "Venus": "models/venus.glb",
    "Jupiter": "models/jupiter.glb",
    "Saturn": "models/saturn.glb",
    "Uranus": "models/uranus.glb",
    "Neptune": "models/neptune.glb"
};

const planets = [];
let saturnRingsGroup = null;

solarSystemPlanets.forEach(planetData => {
    const planet = createPlanet(planetData);
    planets.push(planet);
});

const sunLoader = new GLTFLoader();
sunLoader.load('models/sun.glb', function(gltf) {
    const sunModel = gltf.scene;
    sunModel.position.set(0, 0, 0);
    sunModel.scale.set(50, 50, 50);
    scene.add(sunModel);
    sunlight.target = sunModel;
}, undefined, function(error) {
    console.error('An error happened loading the sun model:', error);
});

function createPlanet(planetData) {
    const scaledSize = planetData.size * 1.5;
    const planetGeometry = new THREE.SphereGeometry(scaledSize, 32, 32);

    const material = new THREE.MeshStandardMaterial({
        color: planetData.color,
        metalness: 0,
        roughness: 0.9,
        emissive: 0x000000
    });

    const planetMesh = new THREE.Mesh(planetGeometry, material);
    planetMesh.orbitalRadius = planetData.distance * 7;
    planetMesh.orbitalSpeed = planetData.orbitalSpeed / 3;
    planetMesh.angle = Math.random() * Math.PI * 2;
    planetMesh.name = planetData.name;
    planetMesh.position.x = Math.cos(planetMesh.angle) * planetMesh.orbitalRadius;
    planetMesh.position.z = Math.sin(planetMesh.angle) * planetMesh.orbitalRadius;
    scene.add(planetMesh);

    if (planetModels[planetData.name]) {
        loadModelAbovePlanet(planetData, planetMesh);
    }

    if (planetData.name === "Saturn") {
        createSaturnRings(planetMesh);
    }

    createOrbitPath(planetMesh.orbitalRadius);
    return planetMesh;
}

function loadModelAbovePlanet(planetData, planetMesh) {
    const loader = new GLTFLoader();
    loader.load(planetModels[planetData.name], (gltf) => {
        if (planetMesh.model) {
            scene.remove(planetMesh.model);
        }
        const model = gltf.scene;
        const scale = planetData.modelScale;
        model.scale.set(scale, scale, scale);

        model.traverse(function (node) {
            if (node.isMesh) {
                if (node.geometry && node.geometry.boundingSphere === null) {
                    node.geometry.computeBoundingSphere();
                }
            }
        });

        if (planetData.name === "Saturn") {
            const boundingSphere = model.geometry && model.geometry.boundingSphere;
            if (boundingSphere) {
                const center = boundingSphere.center.clone().multiplyScalar(scale);
                model.position.set(
                    planetMesh.position.x - center.x,
                    planetMesh.position.y - center.y,
                    planetMesh.position.z - center.z
                );
            } else {
                model.position.copy(planetMesh.position);
            }
        } else {
            model.position.copy(planetMesh.position);
        }

        scene.add(model);
        planetMesh.model = model;
        console.log(`${planetData.name} model loaded and adjusted.`);
    }, undefined, (error) => {
        console.error(`Error loading model for ${planetData.name}:`, error);
    });
}

function createSaturnRings(saturn) {
    saturnRingsGroup = new THREE.Object3D();
    const ringCount = 1000;
    const innerRadius = saturn.geometry.parameters.radius * 1.2;
    const outerRadius = saturn.geometry.parameters.radius * 2;
    const ringWidth = outerRadius - innerRadius;
    const tiltAngle = 0.5;

    for (let i = 0; i < ringCount; i++) {
        const theta = Math.random() * Math.PI * 2;
        const distanceFromPlanet = innerRadius + Math.random() * ringWidth;
        const particleSize = (Math.random() * 0.2 + 0.1) * 5;

        const asteroidGeometry = new THREE.DodecahedronGeometry(particleSize, 0);
        const asteroidMaterial = new THREE.MeshLambertMaterial({ color: 0xaaaaaa });
        const asteroid = new THREE.Mesh(asteroidGeometry, asteroidMaterial);
        
        asteroid.position.x = Math.cos(theta) * distanceFromPlanet;
        asteroid.position.z = Math.sin(theta) * distanceFromPlanet;
        asteroid.position.y = (Math.random() - 0.5) * particleSize * 2;

        asteroid.rotation.x = Math.random() * 2 * Math.PI;
        asteroid.rotation.y = Math.random() * 2 * Math.PI;
        asteroid.rotation.z = Math.random() * 2 * Math.PI;

        saturnRingsGroup.add(asteroid);
    }

    const ringPlane = createSaturnRingPlane(innerRadius, outerRadius, tiltAngle);
    saturnRingsGroup.add(ringPlane);

    saturnRingsGroup.rotation.x = tiltAngle;
    saturn.add(saturnRingsGroup);
}

function createSaturnRingPlane(innerRadius, outerRadius, tiltAngle) {
    const ringGeometry = new THREE.RingGeometry(innerRadius, outerRadius, 64);
    const ringMaterial = new THREE.MeshBasicMaterial({
        color: 0x6F5B3F,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.4
    });
    const ringMesh = new THREE.Mesh(ringGeometry, ringMaterial);
    ringMesh.rotation.x = Math.PI / 2;

    return ringMesh;
}

function createOrbitPath(orbitalRadius) {
    const orbitPoints = [];
    for (let i = 0; i <= 5000; i++) {
        const theta = (i / 5000) * 2 * Math.PI;
        orbitPoints.push(new THREE.Vector3(Math.cos(theta) * orbitalRadius, 0, Math.sin(theta) * orbitalRadius));
    }
    const orbitGeometry = new THREE.BufferGeometry().setFromPoints(orbitPoints);
    const orbit = new THREE.LineLoop(orbitGeometry, new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.1 }));
    scene.add(orbit);
}

function focusOnPlanet(planetName) {
    const planet = planets.find(p => p.name === planetName);
    if (!planet) {
        console.error("Planet not found:", planetName);
        document.getElementById('orbitMessage').style.display = 'block';
        return;
    }

    focusedPlanet = planet;

    if (orbitEnabled) {
        const orbitDistance = 10;
        const orbitHeight = 7;
        const time = Date.now() * 0.001;

        const x = focusedPlanet.position.x + orbitDistance * Math.sin(time);
        const z = focusedPlanet.position.z + orbitDistance * Math.cos(time);
        const y = focusedPlanet.position.y + orbitHeight;

        camera.position.set(x, y, z);
    } else {
        const relativeCameraPosition = new THREE.Vector3().subVectors(camera.position, focusedPlanet.position);
        const planetOrbitPosition = new THREE.Vector3(
            Math.cos(focusedPlanet.angle) * focusedPlanet.orbitalRadius,
            0,
            Math.sin(focusedPlanet.angle) * focusedPlanet.orbitalRadius
        );

        camera.position.copy(planetOrbitPosition.add(relativeCameraPosition));
    }

    document.getElementById('orbitMessage').style.display = 'block';

    controls.target.copy(planet.position);
    controls.update();
}

document.querySelectorAll('#planetButtons button').forEach(button => {
    button.addEventListener('click', event => {
        const planetName = event.target.textContent.trim();
        focusOnPlanet(planetName);
    });
});

function animate() {
    requestAnimationFrame(animate);

    planets.forEach(planet => {
        planet.angle += planet.orbitalSpeed;
        planet.position.x = Math.cos(planet.angle) * planet.orbitalRadius;
        planet.position.z = Math.sin(planet.angle) * planet.orbitalRadius;

        if (planet.model) {
            planet.model.position.copy(planet.position);
        }
    });

    if (focusedPlanet) {
        const orbitDistance = 5 * focusedPlanet.geometry.parameters.radius;
        const orbitHeight = 7;
        const time = Date.now() * 0.0007;
        const x = focusedPlanet.position.x + orbitDistance * Math.sin(time);
        const z = focusedPlanet.position.z + orbitDistance * Math.cos(time);
        const y = focusedPlanet.position.y + orbitHeight;

        camera.position.set(x, y, z);
        camera.lookAt(focusedPlanet.position);
        controls.target.copy(focusedPlanet.position);
    }

    controls.update();
    composer.render();
}

animate();
