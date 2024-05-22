import * as THREE from 'three';
import { EffectComposer } from 'https://unpkg.com/three@0.138.0/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'https://unpkg.com/three@0.138.0/examples/jsm/postprocessing/RenderPass.js';
import { ShaderPass } from 'https://unpkg.com/three@0.138.0/examples/jsm/postprocessing/ShaderPass.js';
import { UnrealBloomPass } from 'https://unpkg.com/three@0.138.0/examples/jsm/postprocessing/UnrealBloomPass.js';
import { GLTFLoader } from 'https://unpkg.com/three@0.138.0/examples/jsm/loaders/GLTFLoader.js';
import { FontLoader } from 'https://unpkg.com/three@0.138.0/examples/jsm/loaders/FontLoader.js';
import { TextGeometry } from 'https://unpkg.com/three@0.138.0/examples/jsm/geometries/TextGeometry.js';

let loadingComplete = false;
let cockpit, spaceship, cameraPivot, throttle = 0, speed = 0;
let increasingThrottle = false, decreasingThrottle = false, braking = false;
let velocity = new THREE.Vector3();
let acceleration = new THREE.Vector3();
let pitchVelocity = 0;
let rollVelocity = 0;
let modelsLoaded = 0;
let totalModels = 0;

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 50000);
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
composer.addPass(renderScene);
composer.addPass(bloomPass);

const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, 0.17);
hemiLight.position.set(0, 100, 0);
scene.add(hemiLight);
const ambientLight = new THREE.AmbientLight(0x404040, 0.01);
scene.add(ambientLight);
const sun = new THREE.Mesh(new THREE.SphereGeometry(500, 200, 200), new THREE.MeshBasicMaterial({ color: 0xFFA500 }));
scene.add(sun);
const sunlight = new THREE.PointLight(0xffffff, 1);
sunlight.position.set(0, 0, 0);
scene.add(sunlight);

function createSphereSkybox() {
    const skyboxRadius = 3500000; // Adjust size as necessary
    const skyboxGeometry = new THREE.SphereGeometry(skyboxRadius, 64, 64);
    const loader = new THREE.TextureLoader();
    const skyboxMaterial = new THREE.MeshBasicMaterial({
        map: loader.load('img/a.jpg'), // Your texture path
        side: THREE.BackSide
    });

    // Ensure texture is set to repeat
    skyboxMaterial.map.wrapS = THREE.RepeatWrapping;
    skyboxMaterial.map.wrapT = THREE.RepeatWrapping;
    skyboxMaterial.map.repeat.set(1, 1);

    const skybox = new THREE.Mesh(skyboxGeometry, skyboxMaterial);
    scene.add(skybox);
}

// Call the new function to create the sphere skybox
createSphereSkybox();

// Adjust camera's near and far planes to handle larger scales better
camera.near = 0.1;
camera.far = 500000;
camera.updateProjectionMatrix();

const solarSystemPlanets = [
    { name: "Mercury", color: 0x909090, size: 2.9 * 5, distance: 80000, orbitalSpeed: 0.0004, modelScale: 1.5 * 500 },
    { name: "Venus", color: 0xD3754A, size: 3 * 5, distance: 130000, orbitalSpeed: 0.0003, modelScale: 3 * 500 },
    { name: "Earth", color: 0x137ADB, size: 4 * 5, distance: 170000, orbitalSpeed: 0.00025, modelScale: 60 * 500 },
    { name: "Mars", color: 0xCB4100, size: 2.8 * 5, distance: 200000, orbitalSpeed: 0.0002, modelScale: 55 * 500 },
    { name: "Jupiter", color: 0xD37131, size: 11 * 5, distance: 280000, orbitalSpeed: 0.0001, modelScale: 1.5 * 500 },
    { name: "Saturn", color: 0xCA8E3B, size: 6000 * 5, distance: 340000, orbitalSpeed: 0.00009, modelScale: 0 * 400 },
    { name: "Uranus", color: 0x0D98BA, size: 5 * 5, distance: 400000, orbitalSpeed: 0.00008, modelScale: 0.11 * 500 },
    { name: "Neptune", color: 0x1E90FF, size: 5 * 5, distance: 460000, orbitalSpeed: 0.00007, modelScale: 0.3 * 500 }
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
    totalModels++; // Increase the total number of models to load
    const planet = createPlanet(planetData);
    planets.push(planet);
});

const sunLoader = new GLTFLoader();
totalModels++; // Increase the total number of models to load
sunLoader.load('models/sun.glb', function (gltf) {
    const sunModel = gltf.scene;
    sunModel.position.set(0, 0, 0);
    sunModel.scale.set(15000, 15000, 15000);
    scene.add(sunModel);
    sunlight.target = sunModel;
    modelLoaded(); // Call modelLoaded when the model is successfully loaded
}, undefined, function (error) {
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
        modelLoaded(); // Call modelLoaded when the model is successfully loaded
    }, undefined, (error) => {
        console.error(`Error loading model for ${planetData.name}:`, error);
    });
}

function createSaturnRings(saturn) {
    saturnRingsGroup = new THREE.Object3D();
    const ringCount = 500;
    const innerRadius = saturn.geometry.parameters.radius * 1.2;
    const outerRadius = saturn.geometry.parameters.radius * 2;
    const ringWidth = outerRadius - innerRadius;
    const tiltAngle = 0.5;

    for (let i = 0; i < ringCount; i++) {
        const theta = Math.random() * Math.PI * 2;
        const distanceFromPlanet = innerRadius + Math.random() * ringWidth;
        const particleSize = (Math.random() * 0.2 + 0.1) * 1500;

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

const keyboard = {
    pitchUp: false,
    pitchDown: false,
    rollLeft: false,
    rollRight: false,
    throttleUp: false,
    throttleDown: false,
    braking: false
};

document.addEventListener('keydown', (event) => {
    switch (event.code) {
        case 'KeyW':
        case 'ArrowUp':
            keyboard.pitchDown = true;
            break;
        case 'KeyS':
        case 'ArrowDown':
            keyboard.pitchUp = true;
            break;
        case 'KeyA':
        case 'ArrowLeft':
            keyboard.rollLeft = true;
            break;
        case 'KeyD':
        case 'ArrowRight':
            keyboard.rollRight = true;
            break;
        case 'ShiftLeft':
            increasingThrottle = true;
            break;
        case 'Space':
            decreasingThrottle = true; // Decrease throttle if game is already started
            break;
        case 'Enter':
            if (loadingComplete) startGame();
            break;
        case 'KeyB':
            keyboard.braking = true;
            break;
    }
});

document.addEventListener('keyup', (event) => {
    switch (event.code) {
        case 'KeyW':
        case 'ArrowUp':
            keyboard.pitchDown = false;
            break;
        case 'KeyS':
        case 'ArrowDown':
            keyboard.pitchUp = false;
            break;
        case 'KeyA':
        case 'ArrowLeft':
            keyboard.rollLeft = false;
            break;
        case 'KeyD':
        case 'ArrowRight':
            keyboard.rollRight = false;
            break;
        case 'ShiftLeft':
            increasingThrottle = false;
            break;
        case 'Space':
            decreasingThrottle = false;
            break;
        case 'KeyB':
            keyboard.braking = false;
            break;
    }
});

const cockpitLoader = new GLTFLoader();
totalModels++; // Increase the total number of models to load
cockpitLoader.load('models/cockpit2.glb', (gltf) => {
    cockpit = gltf.scene;
    cockpit.scale.set(20, 20, 20);
    cockpit.rotation.y = Math.PI;

    cameraPivot = new THREE.Object3D();
    cockpit.add(cameraPivot);
    cameraPivot.add(camera);
    camera.position.set(0, 0, -5); // Position the camera inside the cockpit

    const greenLight = new THREE.PointLight(0x00ff00, 2, 2); // Adjust intensity and distance as needed
    greenLight.position.set(0, 1, 0); // Position the light slightly above the camera
    cameraPivot.add(greenLight); // Attach the light to the cameraPivot

    // Set the initial position of the cockpit above the sun
    cockpit.position.set(1450000, 2555000, 960000); // Adjust the height as necessary to position above the sun
    
    scene.add(cockpit);

    fontLoader.load('https://threejs.org/examples/fonts/helvetiker_regular.typeface.json', function (loadedFont) {
        font = loadedFont;
        createHUD();
        modelLoaded(); // Call modelLoaded when the cockpit and HUD are successfully loaded
    });

    // Load the spaceship model
    const spaceshipLoader = new GLTFLoader();
    totalModels++; // Increase the total number of models to load
    spaceshipLoader.load('models/spaceship.glb', (gltf) => {
        spaceship = gltf.scene;
        spaceship.scale.set(15250, 15250, 15250); // Adjust the scale as necessary
        spaceship.position.set(1500000, 2600000, 1050000); // Place the spaceship at a fixed position
        spaceship.rotation.set(0.5, 0.5, 0.5); // Adjust the rotation as necessary
        scene.add(spaceship);
        modelLoaded(); // Call modelLoaded when the spaceship is successfully loaded
    }, undefined, function (error) {
        console.error('An error happened loading the spaceship model:', error);
    });
});

let fontLoader = new FontLoader();
let font;
let throttleTextMesh, speedTextMesh;

function createHUD() {
    if (!cockpit) return; // Ensure cockpit is loaded

    let textMaterial = new THREE.MeshBasicMaterial({ color: 0xC2FFC3 });

    // Create Throttle Text
    let throttleTextGeometry = new TextGeometry(`Throttle:\n\n      0%`, {
        font: font,
        size: 0.022,  // Adjust size here
        height: 0.001,  // Adjust height to be very thin
    });
    throttleTextMesh = new THREE.Mesh(throttleTextGeometry, textMaterial);
    throttleTextMesh.position.set(-0.45, -0.265, -0.765); // Adjust position as needed
    throttleTextMesh.rotation.x = -0.75; // Slightly inclined to match the screen
    cockpit.add(throttleTextMesh);

    // Create Speed Text
    let speedTextGeometry = new TextGeometry(`    Speed:\n\n0 km/h`, {
        font: font,
        size: 0.03,  // Adjust size here
        height: 0.001,  // Adjust height to be very thin
    });
    speedTextMesh = new THREE.Mesh(speedTextGeometry, textMaterial);
    speedTextMesh.position.set(-0.112, -0.25, -0.77); // Adjust position as needed
    speedTextMesh.rotation.x = -0.7; // Slightly inclined to match the screen
    cockpit.add(speedTextMesh);
}

function updateCockpitMovement() {
    if (!cockpit) return;

    const deltaTime = 1 / 60; // Assuming 60 FPS
    const pitchAcceleration = 0.02;
    const rollAcceleration = 0.03;
    const maxPitchVelocity = 0.009;
    const maxRollVelocity = 0.015;
    const pitchDamping = 0.99;
    const rollDamping = 0.99;

    if (keyboard.pitchUp) {
        pitchVelocity = Math.min(maxPitchVelocity, pitchVelocity + pitchAcceleration * deltaTime);
    } else if (keyboard.pitchDown) {
        pitchVelocity = Math.max(-maxPitchVelocity, pitchVelocity - pitchAcceleration * deltaTime);
    } else {
        pitchVelocity *= pitchDamping;
    }

    if (keyboard.rollLeft) {
        rollVelocity = Math.min(maxRollVelocity, rollVelocity + rollAcceleration * deltaTime);
    } else if (keyboard.rollRight) {
        rollVelocity = Math.max(-maxRollVelocity, rollVelocity - rollAcceleration * deltaTime);
    } else {
        rollVelocity *= rollDamping;
    }

    cockpit.rotateX(pitchVelocity);
    cockpit.rotateZ(rollVelocity);

    // Update throttle
    const throttleChangeSpeed = 10; // Adjusted throttle change speed
    const brakeDeceleration = 50000; // Increased brake deceleration
    const turnDeceleration = 100; // Deceleration when turning or pitching

    if (increasingThrottle) {
        throttle = Math.min(100, throttle + throttleChangeSpeed * deltaTime);
    }
    if (decreasingThrottle) {
        throttle = Math.max(0, throttle - throttleChangeSpeed * deltaTime);
    }
    if (keyboard.braking) {
        speed = Math.max(0, speed - brakeDeceleration * deltaTime);
    }

    // Calculate speed based on throttle
    const maxSpeed = 599999; // Maximum speed in km/h
    if (!keyboard.braking) {
        speed += 0.05 * (throttle / 100) * maxSpeed * deltaTime;
    }
    speed = Math.min(maxSpeed, speed); // Clamp speed to max speed

    // Reduce speed when turning or pitching
    const turnSpeedReduction = 1 - 0.04 * (Math.abs(pitchVelocity) + 0.2 * Math.abs(rollVelocity));
    speed *= turnSpeedReduction;

    // Update 3D Text
    if (throttleTextMesh && speedTextMesh) {
        throttleTextMesh.geometry.dispose();
        speedTextMesh.geometry.dispose();
        throttleTextMesh.geometry = new TextGeometry(`  Throttle:\n\n     ${Math.round(throttle)} %`, {
            font: font,
            size: 0.022,  // Ensure size matches the HUD creation
            height: 0.001,  // Ensure height matches the HUD creation
        });
        throttleTextMesh.rotation.x = -0.75; // Ensure rotation matches the HUD creation

        // Scale speed for display
        const displaySpeed = (speed / maxSpeed) * 9999;
        speedTextMesh.geometry = new TextGeometry(`    Speed:\n\n${Math.round(displaySpeed)}  km/h`, {
            font: font,
            size: 0.03,  // Ensure size matches the HUD creation
            height: 0.001,  // Ensure height matches the HUD creation
        });
        speedTextMesh.rotation.x = -0.75; // Ensure rotation matches the HUD creation
    }

    // Move cockpit forward based on speed
    acceleration.set(0, 0, -speed * 0.003); // Adjust acceleration as needed
    acceleration.applyQuaternion(cockpit.quaternion);
    velocity.add(acceleration.multiplyScalar(deltaTime));
    velocity.multiplyScalar(0.99); // Apply damping
    cockpit.position.add(velocity);

    // Camera shake effect within a limit
    const shakeIntensity = 0.008; // Reduce shake intensity
    const shakeLimit = 0.03; // Define shake limit

    const shakeX = (Math.random() - 0.5) * shakeIntensity * (throttle / 100);
    const shakeY = (Math.random() - 0.5) * shakeIntensity * (throttle / 100);

    camera.position.x = THREE.MathUtils.clamp(camera.position.x + shakeX, -shakeLimit, shakeLimit);
    camera.position.y = THREE.MathUtils.clamp(camera.position.y + shakeY, -shakeLimit, shakeLimit);

    // Implementing exponential camera inertia for acceleration
    const inertiaIntensity = 0.1; // Adjust the intensity of the inertia effect
    const exponentialFactor = 0.02; // Exponential factor for the inertia effect

    if (throttle > 0 && !keyboard.braking) {
        camera.position.z = THREE.MathUtils.lerp(camera.position.z, inertiaIntensity * (Math.exp(exponentialFactor * throttle) - 1) / 3, 0.1);
    } else if (keyboard.braking && speed > 0) {
        camera.position.z = THREE.MathUtils.lerp(camera.position.z, -inertiaIntensity, 0.1);
    } else {
        camera.position.z = THREE.MathUtils.lerp(camera.position.z, 0, 0.1);
    }

    // Implementing camera movement based on pitch velocity
    const pitchInertiaIntensity = 0.005; // Adjust the intensity of the pitch inertia effect
    camera.position.y = THREE.MathUtils.lerp(camera.position.y, -pitchVelocity * pitchInertiaIntensity * speed / 150, 0.1);
}

let mouseX = 0;
let mouseY = 0;

document.addEventListener('mousemove', (event) => {
    mouseX = (event.clientX / window.innerWidth) * 2 - 1;
    mouseY = -(event.clientY / window.innerHeight) * 2 + 1;
});

function updateCameraLook() {
    if (!cameraPivot) return; // Ensure cameraPivot is defined
    const lookSpeed = 0.04;
    cameraPivot.rotation.y = THREE.MathUtils.lerp(cameraPivot.rotation.y, -mouseX * Math.PI / 3, lookSpeed);
    cameraPivot.rotation.x = THREE.MathUtils.lerp(cameraPivot.rotation.x, mouseY * Math.PI / 3, lookSpeed);
}

// Model loaded callback
function modelLoaded() {
    modelsLoaded++;
    updateLoadingProgress();
}

const loadingBar = document.getElementById('loading-bar');
const continueText = document.getElementById('continue-text');
const loadingText = document.getElementById('loading-text');
const subtitle = document.getElementById('subtitle');

// Function to update the loading progress
function updateLoadingProgress() {
    const progress = modelsLoaded / totalModels;
    loadingBar.style.width = `${progress * 100}%`;

    if (modelsLoaded === totalModels) {
        loadingComplete = true; // Set loadingComplete to true when all models are loaded
        // All models loaded
        setTimeout(() => {
            loadingText.style.display = 'none'; // Hide loading text
            continueText.style.display = 'block'; // Show continue text
        }, 500);
    }
}

function startGame() {
    const loadingScreen = document.getElementById('loading-screen');
    loadingScreen.classList.add('fade-out');
    setTimeout(() => {
        loadingScreen.style.display = 'none';
        animate();
    }, 1000); // 1-second fade-out transition
}

document.addEventListener('DOMContentLoaded', (event) => {
    showSubtitles();
});

// Animation loop
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

    updateCockpitMovement();
    updateCameraLook();

    composer.render();
}

renderer.setAnimationLoop(null);



