import * as THREE from 'https://unpkg.com/three@0.138.0/build/three.module.js';
import { OrbitControls } from 'https://unpkg.com/three@0.138.0/examples/jsm/controls/OrbitControls.js';
import { EffectComposer } from 'https://unpkg.com/three@0.138.0/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'https://unpkg.com/three@0.138.0/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'https://unpkg.com/three@0.138.0/examples/jsm/postprocessing/UnrealBloomPass.js';
import { GLTFLoader } from 'https://unpkg.com/three@0.138.0/examples/jsm/loaders/GLTFLoader.js';

let focusedPlanet = null;
let orbitEnabled = true;
let earthModel = null; // Keep track of the Earth model

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 50000);
camera.position.z = 1000;
camera.position.y = 200;

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
document.body.appendChild(renderer.domElement);

const renderScene = new RenderPass(scene, camera);
const bloomPass = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 1.5, 0.4, 0.85);
bloomPass.threshold = 0.6;
bloomPass.strength = 1.1;
bloomPass.radius = 0.1;
const composer = new EffectComposer(renderer);
composer.addPass(renderScene);
composer.addPass(bloomPass);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableZoom = true;

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

const sunlight = new THREE.PointLight(0xffffff, 1, 10500);
sunlight.position.set(0, 0, 0);
scene.add(sunlight);

const sunGeometry = new THREE.SphereGeometry(800, 200, 200);
const sunMaterial = new THREE.MeshBasicMaterial({ color: 0xFFA500 });
const sun = new THREE.Mesh(sunGeometry, sunMaterial);
scene.add(sun);

const solarSystemPlanets = [
    { name: "Mercury", color: 0x909090, size: 2.9 * 5, distance: 35 * 6, orbitalSpeed: 0.004, modelScale: 2.2 },
    { name: "Venus", color: 0xD3754A, size: 3 * 5, distance: 42 * 6, orbitalSpeed: 0.003, modelScale: 25 },
    { name: "Earth", color: 0x137ADB, size: 4 * 5, distance: 54 * 6, orbitalSpeed: 0.0025, modelScale: 0.6},
    { name: "Mars", color: 0xCB4100, size: 2.8 * 5, distance: 63 * 6, orbitalSpeed: 0.002, modelScale: 5},
    { name: "Jupiter", color: 0xD37131, size: 11 * 5, distance: 75 * 6, orbitalSpeed: 0.001, modelScale: 1.3 },
    { name: "Saturn", color: 0xCA8E3B, size: 9.45 * 5, distance: 85 * 6.5, orbitalSpeed: 0.0009, modelScale: 50 },
    { name: "Uranus", color: 0x0D98BA, size: 5 * 5, distance: 95 * 7.3, orbitalSpeed: 0.0008, modelScale: 0.2 },
    { name: "Neptune", color: 0x1E90FF, size: 5 * 5, distance: 110 * 7.5, orbitalSpeed: 0.0007, modelScale: 0.2 }
];



const planetModels = {
    "Earth": "models/earth.glb",
    "Mars": "models/mars.glb",
    "Mercury": "models/mercury.glb",
    "Venus": "models/venus.glb",
    "Jupiter": "models/jupiter.glb",
    "Saturn": "models/saturn.glb"
};

const planets = [];

solarSystemPlanets.forEach(planetData => {
    const planet = createPlanet(planetData);
    if (planetData.name === "Earth") {
        loadModelAbovePlanet(planetData, planet);
    }
    planets.push(planet);
});

function createPlanet(planetData) {
    const scaledSize = planetData.size * 1.5;
    const planetGeometry = new THREE.SphereGeometry(scaledSize, 200, 200);
    const planetMaterial = new THREE.MeshLambertMaterial({ color: planetData.color });
    const planetMesh = new THREE.Mesh(planetGeometry, planetMaterial);

    planetMesh.orbitalRadius = planetData.distance * 7;
    planetMesh.orbitalSpeed = planetData.orbitalSpeed / 3;
    planetMesh.angle = Math.random() * Math.PI * 2;
    planetMesh.name = planetData.name;
    planetMesh.position.x = Math.cos(planetMesh.angle) * planetMesh.orbitalRadius;
    planetMesh.position.z = Math.sin(planetMesh.angle) * planetMesh.orbitalRadius;
    scene.add(planetMesh);

    // Check if the current planet has a model to load
    if (planetModels[planetData.name]) {
        loadModelAbovePlanet(planetData, planetMesh);
    }

    createOrbitPath(planetMesh.orbitalRadius);
    return planetMesh;
}


function loadModelAbovePlanet(planetData, planetMesh) {
    const loader = new GLTFLoader();
    loader.load(planetModels[planetData.name], (gltf) => {
        if (planetMesh.model) {
            scene.remove(planetMesh.model); // Prevent duplicates
        }
        const model = gltf.scene;
        const scale = planetData.modelScale; // Use predefined scale
        model.scale.set(scale, scale, scale);

        // Compute the bounding sphere manually
        model.traverse(function (node) {
            if (node.isMesh) {
                node.geometry.computeBoundingSphere();
            }
        });

        // Adjust model's position to center it correctly
        if (planetData.name === "Saturn") {
            const center = model.geometry.boundingSphere.center.clone().multiplyScalar(scale);
            model.position.set(
                planetMesh.position.x - center.x,
                planetMesh.position.y - center.y,
                planetMesh.position.z - center.z
            );
        } else {
            model.position.copy(planetMesh.position);
        }

        scene.add(model);
        planetMesh.model = model; // Attach model to the mesh
        console.log(`${planetData.name} model loaded and adjusted.`);
    }, undefined, (error) => {
        console.error(`Error loading model for ${planetData.name}:`, error);
    });
}




function adjustEarthMaterial(earthModel) {
    earthModel.traverse((child) => {
        if (child.isMesh) {
            child.material = new THREE.MeshPhysicalMaterial({
                map: child.material.map, // Reuse existing texture maps
                metalness: 0.1,
                roughness: 0.3,
                clearcoat: 1.0,
                clearcoatRoughness: 0.05,
                reflectivity: 0.5,
            });
        }
    });
}

let saturnRingsGroup; // Global reference to the rings group

function createSaturnRings(saturn) {
    const ringCount = 2000; // The number of asteroids
    const innerRadius = saturn.geometry.parameters.radius * 1.2;
    const outerRadius = saturn.geometry.parameters.radius * 2;
    const ringWidth = outerRadius - innerRadius;
    const tiltAngle = 0.5; // Tilt angle in radians for the rings

    saturnRingsGroup = new THREE.Object3D(); // Initialize the group for all ring components

    for (let i = 0; i < ringCount; i++) {
        const theta = Math.random() * Math.PI * 2;
        const distanceFromPlanet = innerRadius + Math.random() * ringWidth;
        const particleSize = (Math.random() * 0.2 + 0.1) * 6; // Adjust particle size if needed

        const asteroidGeometry = new THREE.DodecahedronGeometry(particleSize, 0);
        const asteroidMaterial = new THREE.MeshLambertMaterial({ color: 0xaaaaaa });
        const asteroid = new THREE.Mesh(asteroidGeometry, asteroidMaterial);
        
        asteroid.position.x = Math.cos(theta) * distanceFromPlanet;
        asteroid.position.z = Math.sin(theta) * distanceFromPlanet;
        asteroid.position.y = (Math.random() - 0.5) * particleSize * 2; // Scaled by particle size to avoid thickness

        asteroid.rotation.x = Math.random() * 2 * Math.PI;
        asteroid.rotation.y = Math.random() * 2 * Math.PI;
        asteroid.rotation.z = Math.random() * 2 * Math.PI;

        saturnRingsGroup.add(asteroid); // Add each asteroid to the group
    }

    const ringPlane = createSaturnRingPlane(innerRadius, outerRadius, tiltAngle);
    saturnRingsGroup.add(ringPlane); // Add the transparent ring to the group

    saturnRingsGroup.rotation.x = tiltAngle; // Rotate the entire ring group
    saturn.add(saturnRingsGroup); // Add the group to Saturn
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
    ringMesh.rotation.x = Math.PI / 2; // Rotate the ring plane by 90 degrees on the X-axis

    return ringMesh;
}




// Assuming Saturn is already created and added to the scene
const saturn = planets.find(p => p.name === 'Saturn');
if (saturn) {
    createSaturnRings(saturn);
}

function createOrbitPath(orbitalRadius) {
    const orbitPoints = [];
    for (let i = 0; i <= 5000; i++) {
        const theta = (i / 5000) * 2 * Math.PI;
        orbitPoints.push(new THREE.Vector3(Math.cos(theta) * orbitalRadius, 0, Math.sin(theta) * orbitalRadius));
    }
    const orbitGeometry = new THREE.BufferGeometry().setFromPoints(orbitPoints);
    const orbit = new THREE.LineLoop(orbitGeometry, new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.3 }));
    scene.add(orbit);
}



function focusOnPlanet(planetName) {
    const planet = planets.find(p => p.name === planetName);
    if (!planet) {
        console.error("Planet not found:", planetName);
        // Hide the orbit message if the planet is not found
        document.getElementById('orbitMessage').style.display = 'block';
        return;
    }

    focusedPlanet = planet;
    // Adjust the camera's position and controls' target as per your existing logic...
    
    if (orbitEnabled) {
                // Orbiting around the planet
                const orbitDistance = 10; // Distance from the planet's center
                const orbitHeight = 7; // Altura ao nível do equador
                const time = Date.now() * 0.001; // Continuous time variable for orbit calculation
                
                // Calculate new camera position for orbiting
                const x = focusedPlanet.position.x + orbitDistance * Math.sin(time);
                const z = focusedPlanet.position.z + orbitDistance * Math.cos(time);
                const y = focusedPlanet.position.y + orbitHeight;
                
                camera.position.set(x, y, z);
            } else {
                // Move with the planet's orbit around the sun without changing the relative position to the planet
                // Essentially, just lock the camera's relative position to the planet
                const relativeCameraPosition = new THREE.Vector3().subVectors(camera.position, focusedPlanet.position);
                const planetOrbitPosition = new THREE.Vector3(
                    Math.cos(focusedPlanet.angle) * focusedPlanet.orbitalRadius,
                    0, // Assuming planets orbit in a 2D plane, adjust if your setup is different
                    Math.sin(focusedPlanet.angle) * focusedPlanet.orbitalRadius
                );

                camera.position.copy(planetOrbitPosition.add(relativeCameraPosition));
            }

    // Show the orbit message when a planet is focused
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

        // Ensure the Earth model, if it exists, follows the sphere
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