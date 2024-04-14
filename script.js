import * as THREE from 'https://unpkg.com/three@0.138.0/build/three.module.js';
import { OrbitControls } from 'https://unpkg.com/three@0.138.0/examples/jsm/controls/OrbitControls.js';
import { EffectComposer } from 'https://unpkg.com/three@0.138.0/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'https://unpkg.com/three@0.138.0/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'https://unpkg.com/three@0.138.0/examples/jsm/postprocessing/UnrealBloomPass.js';

let focusedPlanet = null;

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 50000); 
camera.position.z = 2500;
camera.position.y = 800;

const renderer = new THREE.WebGLRenderer({ antialias: true }); 
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
document.body.appendChild(renderer.domElement);

const renderScene = new RenderPass(scene, camera);
const bloomPass = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 1.5, 0.4, 0.85);
bloomPass.threshold = 0.6; // Brightness threshold - lower values mean more glow
bloomPass.strength = 1.1; // Glow strength - higher values produce more glow
bloomPass.radius = 0.1; // Glow radius - higher values produce a larger glow
const composer = new EffectComposer(renderer);
composer.addPass(renderScene);
composer.addPass(bloomPass); 

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableZoom = true;

const sunlight = new THREE.PointLight(0xffffff, 1, 10500);
sunlight.position.set(0, 0, 0);
scene.add(sunlight);

const sunGeometry = new THREE.SphereGeometry(300, 200, 200);
const sunMaterial = new THREE.MeshBasicMaterial({ color: 0xFFA500 });
const sun = new THREE.Mesh(sunGeometry, sunMaterial);
scene.add(sun);


const solarSystemPlanets = [
    { name: "Mercúrio", color: 0x909090, size: 2.9 * 3, distance: 35 * 2, orbitalSpeed: 0.004 },
    { name: "Vénus", color: 0xFFE4B5, size: 3 * 3, distance: 42 * 2, orbitalSpeed: 0.003 },
    { name: "Terra", color: 0x0000FF, size: 4 * 3, distance: 54 * 2, orbitalSpeed: 0.0025 },
    { name: "Marte", color: 0xDB5313, size: 2.8 * 3, distance: 63 * 2, orbitalSpeed: 0.002 },
    { name: "Júpiter", color: 0xFFA500, size: 11 * 3, distance: 70 * 2, orbitalSpeed: 0.001 },
    { name: "Saturno", color: 0xDAA520, size: 9.45 * 3, distance: 80 * 2, orbitalSpeed: 0.0009 },
    { name: "Urano", color: 0x0D98BA, size: 5 * 3, distance: 90 * 2, orbitalSpeed: 0.0008 },
    { name: "Neptuno", color: 0x1E90FF, size: 5 * 3, distance: 100 * 2, orbitalSpeed: 0.0007 }
];

const planets = solarSystemPlanets.map(createPlanet);

function createPlanet(planet) {
    const scaledSize = planet.size * 1.5; 
    const planetGeometry = new THREE.SphereGeometry(scaledSize, 100, 100);
    const planetMaterial = new THREE.MeshLambertMaterial({ color: planet.color });
    const planetMesh = new THREE.Mesh(planetGeometry, planetMaterial);

    planetMesh.orbitalRadius = planet.distance * 7;
    planetMesh.orbitalSpeed = planet.orbitalSpeed / 3;
    planetMesh.angle = Math.random() * Math.PI * 2;
    planetMesh.name = planet.name;

     // Initial position of the planet on its orbit
     planetMesh.position.x = Math.cos(planetMesh.angle) * planetMesh.orbitalRadius;
     planetMesh.position.z = Math.sin(planetMesh.angle) * planetMesh.orbitalRadius;

    createOrbitPath(planetMesh.orbitalRadius);

    scene.add(planetMesh);
    return planetMesh;
}

function createOrbitPath(orbitalRadius) {
    const orbitPoints = [];
    
    for (let i = 0; i <= 1000; i++) {
        const theta = (i / 1000) * 2 * Math.PI;
        orbitPoints.push(new THREE.Vector3(Math.cos(theta) * orbitalRadius, 0, Math.sin(theta) * orbitalRadius));
    }

    const orbitGeometry = new THREE.BufferGeometry().setFromPoints(orbitPoints);
    
    const orbit = new THREE.LineLoop(orbitGeometry, new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.1, antialias: true }));
    scene.add(orbit);
}

function focusOnPlanet(planetName) {
    const planet = planets.find(p => p.name === planetName);


    focusedPlanet = planet;

    // Orbiting around the planet
    const orbitDistance = 10; // Distance from the planet's center
    const orbitHeight = 7; // Altura ao nível do equador
    const time = Date.now() * 0.001; // Continuous time variable for orbit calculation
    
    // Calculate new camera position for orbiting
    const x = focusedPlanet.position.x + orbitDistance * Math.sin(time);
    const z = focusedPlanet.position.z + orbitDistance * Math.cos(time);
    const y = focusedPlanet.position.y + orbitHeight;
    
    camera.position.set(x, y, z);
}

document.querySelectorAll('#planetButtons button').forEach(button => {
    button.addEventListener('click', event => {
        const planetName = event.target.textContent.trim();
        focusOnPlanet(planetName);
    });
});

function animate() {
    requestAnimationFrame(animate); 

    if (focusedPlanet) {
        
        // Dynamically set orbit distance based on the size of the focused planet
        const orbitDistance = 5 * focusedPlanet.geometry.parameters.radius; // Adjusted to use the planet's radius
        
        const orbitHeight = 7; // Height above or below the planet's equator
        const time = Date.now() * 0.0007; // Continuous time variable for orbit calculation
        
        // Calculate new camera position for orbiting
        const x = focusedPlanet.position.x + orbitDistance * Math.sin(time);
        const z = focusedPlanet.position.z + orbitDistance * Math.cos(time);
        const y = focusedPlanet.position.y + orbitHeight;
        
        camera.position.set(x, y, z);
            
        camera.lookAt(focusedPlanet.position);
        controls.target.copy(focusedPlanet.position);
    }

    planets.forEach(planet => {
        planet.angle += planet.orbitalSpeed;
        planet.position.x = Math.cos(planet.angle) * planet.orbitalRadius;
        planet.position.z = Math.sin(planet.angle) * planet.orbitalRadius;
    });

    controls.update();
    composer.render(scene, camera);
}

animate();
