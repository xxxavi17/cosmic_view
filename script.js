import * as THREE from 'https://unpkg.com/three@0.138.0/build/three.module.js';
import { OrbitControls } from 'https://unpkg.com/three@0.138.0/examples/jsm/controls/OrbitControls.js';
import { EffectComposer } from 'https://unpkg.com/three@0.138.0/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'https://unpkg.com/three@0.138.0/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'https://unpkg.com/three@0.138.0/examples/jsm/postprocessing/UnrealBloomPass.js';
import { GLTFLoader } from 'https://unpkg.com/three@0.138.0/examples/jsm/loaders/GLTFLoader.js';


let focusedPlanet = null;
let orbitEnabled = true;

document.addEventListener('keydown', function(event) {
    if (event.code === 'Space') {
        orbitEnabled = !orbitEnabled;
    }
});

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 50000); // Adjusted far plane
camera.position.z = 1000;
camera.position.y = 200;

const renderer = new THREE.WebGLRenderer({ antialias: true }); // Enabled anti-aliasing
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




//////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////// BACKGROUND ///////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////





function createSkybox() {
    // The size of the skybox should be large enough to encompass your entire scene.
    const skyboxSize = 50000;
    const skyboxGeometry = new THREE.BoxGeometry(skyboxSize, skyboxSize, skyboxSize);

    // Load the textures for each side of the skybox.
    const loader = new THREE.TextureLoader();
    const materialArray = [
        new THREE.MeshBasicMaterial({ map: loader.load('img/front.webp'), side: THREE.BackSide }), // right
        new THREE.MeshBasicMaterial({ map: loader.load('img/front.webp'), side: THREE.BackSide }), // left
        new THREE.MeshBasicMaterial({ map: loader.load('img/front.webp'), side: THREE.BackSide }), // top
        new THREE.MeshBasicMaterial({ map: loader.load('img/front.webp'), side: THREE.BackSide }), // bottom
        new THREE.MeshBasicMaterial({ map: loader.load('img/front.webp'), side: THREE.BackSide }), // front
        new THREE.MeshBasicMaterial({ map: loader.load('img/front.webp'), side: THREE.BackSide }), // back
    ];

    const skybox = new THREE.Mesh(skyboxGeometry, materialArray);
    scene.add(skybox);
}
// Remember to call the createSkybox function in your initialization code.
createSkybox();




//////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////// LUZ //////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////




const sunlight = new THREE.PointLight(0xffffff, 1, 10500);
sunlight.position.set(0, 0, 0);
scene.add(sunlight);

const sunGeometry = new THREE.SphereGeometry(300, 200, 200);
const sunMaterial = new THREE.MeshBasicMaterial({ color: 0xFFA500 });
const sun = new THREE.Mesh(sunGeometry, sunMaterial);
scene.add(sun);




//////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////// PLANETAS /////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////




const solarSystemPlanets = [
    { name: "Mercury", color: 0x909090, size: 2.9 * 3, distance: 35 * 2, orbitalSpeed: 0.004 },
    { name: "Venus", color: 0xD3754A, size: 3 * 3, distance: 42 * 2, orbitalSpeed: 0.003 },
    { name: "Earth", color: 0x137ADB, size: 4 * 3, distance: 54 * 2, orbitalSpeed: 0.0025 },
    { name: "Mars", color: 0xCB4100, size: 2.8 * 3, distance: 63 * 2, orbitalSpeed: 0.002 },
    { name: "Jupiter", color: 0xD37131, size: 11 * 3, distance: 75 * 2, orbitalSpeed: 0.001 },
    { name: "Saturn", color: 0xDAA520, size: 9.45 * 3, distance: 85 * 2, orbitalSpeed: 0.0009 },
    { name: "Uranus", color: 0x0D98BA, size: 5 * 3, distance: 95 * 2, orbitalSpeed: 0.0008 },
    { name: "Neptune", color: 0x1E90FF, size: 5 * 3, distance: 110 * 2, orbitalSpeed: 0.0007 }
];

const planetModels = {
    "Mercury": "models/mercury.glb",  // replace with actual paths
    "Venus": "models/venus.glb",
    "Earth": "models/earth.glb",
    "Mars": "models/mars.glb",
    "Jupiter": "models/jupiter.glb",
    "Saturn": "models/saturn.glb",
    "Uranus": "models/uranus.glb",
    "Neptune": "models/neptune.glb"
};

const planets = solarSystemPlanets.map(createPlanet);


function createPlanet(planet) {
    const scaledSize = planet.size * 1.5; // Assuming your size scaling is correct
    const planetGeometry = new THREE.SphereGeometry(scaledSize, 200, 200);
    const planetMaterial = new THREE.MeshLambertMaterial({ color: planet.color });
    const planetMesh = new THREE.Mesh(planetGeometry, planetMaterial);

    planetMesh.orbitalRadius = planet.distance * 7;
    planetMesh.orbitalSpeed = planet.orbitalSpeed / 3;
    planetMesh.angle = Math.random() * Math.PI * 2;
    planetMesh.name = planet.name;

     // Initial position of the planet on its orbit
     planetMesh.position.x = Math.cos(planetMesh.angle) * planetMesh.orbitalRadius;
     planetMesh.position.z = Math.sin(planetMesh.angle) * planetMesh.orbitalRadius;

    // Create orbit path
    createOrbitPath(planetMesh.orbitalRadius);

    scene.add(planetMesh);
    return planetMesh;
}




//////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////// ANEIS DE SATURNO /////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////




let saturnRingsGroup; // Global reference to the rings group

function createSaturnRings(saturn) {
    const ringCount = 5000; // The number of asteroids
    const innerRadius = saturn.geometry.parameters.radius * 1.2;
    const outerRadius = saturn.geometry.parameters.radius * 2;
    const ringWidth = outerRadius - innerRadius;
    const tiltAngle = 0.5; // Tilt angle in radians for the rings

    saturnRingsGroup = new THREE.Object3D(); // Initialize the group for all ring components

    for (let i = 0; i < ringCount; i++) {
        const theta = Math.random() * Math.PI * 2;
        const distanceFromPlanet = innerRadius + Math.random() * ringWidth;
        const particleSize = (Math.random() * 0.2 + 0.1) * 3; // Adjust particle size if needed

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
        color: 0xffae00,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.1
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






//////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////// ANEIS DE ORBITAS /////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////




function createOrbitPath(orbitalRadius) {
    const orbitPoints = [];
    for (let i = 0; i <= 5000; i++) {
        const theta = (i / 5000) * 2 * Math.PI;
        orbitPoints.push(new THREE.Vector3(Math.cos(theta) * orbitalRadius, 0, Math.sin(theta) * orbitalRadius));
    }

    const orbitGeometry = new THREE.BufferGeometry().setFromPoints(orbitPoints);
    
    const orbit = new THREE.LineLoop(orbitGeometry, new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.3, antialias: true }));
    scene.add(orbit);
}




//////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////// VARIAÇÃO DE CAMARA ///////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////




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



//////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////// ANIMAÇÃO /////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////




document.querySelectorAll('#planetButtons button').forEach(button => {
    button.addEventListener('click', event => {
        const planetName = event.target.textContent.trim();
        focusOnPlanet(planetName);
    });
});

function animate() {
    requestAnimationFrame(animate);

    // Rotate each asteroid
    scene.children.forEach(child => {
        if (child instanceof THREE.Mesh && child.geometry instanceof THREE.DodecahedronGeometry) {
            child.rotation.x += 0.005;
            child.rotation.y += 0.005;
        }
    });

    if (focusedPlanet) {
        if (orbitEnabled) {
            // Dynamically set orbit distance based on the size of the focused planet
            const orbitDistance = 5 * focusedPlanet.geometry.parameters.radius; // Adjusted to use the planet's radius
            
            const orbitHeight = 7; // Height above or below the planet's equator
            const time = Date.now() * 0.0007; // Continuous time variable for orbit calculation
            
            // Calculate new camera position for orbiting
            const x = focusedPlanet.position.x + orbitDistance * Math.sin(time);
            const z = focusedPlanet.position.z + orbitDistance * Math.cos(time);
            const y = focusedPlanet.position.y + orbitHeight;
            
            camera.position.set(x, y, z);
            
        } else {
            // Move with the planet's orbit around the sun without changing the relative position to the planet
            const relativeCameraPosition = new THREE.Vector3().subVectors(camera.position, focusedPlanet.position);
            const planetOrbitPosition = new THREE.Vector3(
                Math.cos(focusedPlanet.angle) * focusedPlanet.orbitalRadius,
                0,
                Math.sin(focusedPlanet.angle) * focusedPlanet.orbitalRadius
            );

            camera.position.copy(planetOrbitPosition.add(relativeCameraPosition));
        }
        
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