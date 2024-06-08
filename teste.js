import * as THREE from './build/three.module.js';
import {OrbitControls} from './jsm/OrbitControls.js';
import {GLTFLoader} from './jsm/GLTFLoader.js';
import {RGBELoader} from './jsm/RGBELoader.js';

var camera, scene, renderer, controls, mixer, clock;

const meshs = [];

init();
render();

function init() {
    clock = new THREE.Clock();
    camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);

    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x404040);

    // CONFIG RENDERER
    renderer = new THREE.WebGLRenderer({
        antialias: true,
    });
    
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);

    renderer.outputEncoding = THREE.sRGBEncoding;
    renderer.toneMapping = THREE.ACESFilmingToneMapping;
    
    // renderer.shadowMap.enabled = true;
    // renderer.shadowMap.type = THREE.PCFShadowMap;
    // renderer.autoClear = false;

    //--------------------------------------------------

    document.body.appendChild(renderer.domElement);

    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;

    // ADD ILUMINAÇÃO

    const light = new THREE.AmbientLight(0x404040);
    // scene.add(light);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
    directionalLight.castShadow = true;
    directionalLight.shadow.bias = -0.0001;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    directionalLight.position.set(2,2,2);

    // scene.add(directionalLight);

    // ADICIONAR OBJETO 3D
    const loader = new GLTFLoader()
    .setPath('./models/')
    .load('manequim2.glb', (glb) => {
        const cena = glb.scene;
        const clips = glb.animations || [];

        cena.updateMatrixWorld(); 
        
        listarMesh(cena.children);

        console.log(meshs);

        scene.add(cena);

        var box = new THREE.Box3().setFromObject(glb.scene);
        var obj_size = box.getSize(new THREE.Vector3(0,0,0));

        camera.position.z = obj_size.length() * 1.2;

        controls.minDistance = obj_size.x * 1.5;
        controls.maxDistance = obj_size.x * 5;

        box.getCenter(controls.target);


        // isso é para sombras.

        // glb.scene.traverse( (child) => {
        //     child.receiveShadow = true;
        //     child.castShadow = true;
        // });

        // const geometry = new THREE.PlaneGeometry(6 , 6);
        // const material = new THREE.ShadowMaterial({ opacity: 0.05});
        // const plane = new THREE.Mesh(geometry, material);
        // plane.receiveShadow = true;
        // plane.rotation.x = - Math.PI / 2;
        // plane.position.y =  - obj_size.y / 2;
        // scene.add(plane);

         // Configurar o mixer de animação
         mixer = new THREE.AnimationMixer(cena);

         // Reproduzir todas as animações
         clips.forEach((clip) => {
             this.mixer.clipAction(clip).play();
         });

         
        console.log(cena);
    });

    new RGBELoader()
    .setPath('./')
    .load('neon_photostudio_2k.hdr', (texture) => {

        texture.mapping = THREE.EquirectangularReflectionMapping;
        scene.environment = texture;

    }); 

}

// function listChildren(children) {
    
//     for (let i = 0; i < children.length; i++) {
//         child = children[i];

//         // Calls this function again if the child has children
//         if (child.children) {
//             listChildren(child.children);
//         }
//         // Logs if this child last in recursion
//         else {
//             console.log('Reached bottom with: ', child);
//         }
//     }

// }

const listarMesh = (children) => {
    // Object3D
    // Mesh
    let child;
    let count = children.length;
    
    if(count === 0) {return Array() ;}

    for (let i = 0; i < count; i++ ) {

        child = children[i];

        if( child.type === 'Mesh' ) {
            meshs.push(child);
            child.children.splice(i,1);
        }

        if(child.children) {
            listarMesh(child.children);
        }

    }

}


window.onresize = () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize(window.innerWidth , window.innerHeight);

}

function render() {
    requestAnimationFrame(render);

    const delta = clock.getDelta(); // Para atualizar o mixer de animação
    if (mixer) mixer.update(delta);

    if(controls) {
        controls.update();
    }


    renderer.render(scene, camera);
}