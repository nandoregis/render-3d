import * as THREE from '../build/three.module.js';
import {OrbitControls} from '../jsm/OrbitControls.js';
import {GLTFLoader} from '../jsm/GLTFLoader.js';
import {RGBELoader} from '../jsm/RGBELoader.js';
import {DRACOLoader} from '../jsm/DRACOLoader.js';

export default class Viewer 
{

    constructor(el, modelUrl) {

        this.el = el; // elemento html;

        this.model;
        this.allMesh = [];
        this.modelUrl = modelUrl;

        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(45, el.clientWidth / el.clientHeight, 0.1, 1000);
        this.scene.background = new THREE.Color(0x404040);

        // CONFIGURAÇÃO DO RENDERER
        this.renderer = new THREE.WebGLRenderer({ 
            antialias: true, 
            // alpha: true 
        });
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.setSize(el.clientWidth, el.clientHeight);
        this.renderer.outputEncoding = THREE.sRGBEncoding;
        this.renderer.toneMapping = THREE.ACESFilmingToneMapping;
        this.el.appendChild(this.renderer.domElement); // adicionando o renderer no elemento DOM
        //---------------------------------------------------------

        
        // LOADER E DRACOLOADER E RGBELOADER
        this.loader = new GLTFLoader();
        this.hdrLoader = new RGBELoader();
        this.dracoLoader = new DRACOLoader();
        this.dracoLoader.setDecoderPath('https://www.gstatic.com/draco/v1/decoders/'); // decoders do draco
        this.loader.setDRACOLoader( this.dracoLoader );
        //--------------------------------------------------------

        // CONFIGURAÇÃO CONTROLS 
        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;
        //---------------------------------------------------------------

        // STATUS DO MODELO 3D
        this.statusModel = {
            avatar: {
                color: '#000000'
            },
            shirt: {
                color: '#000000'
            }
        }

        // STATUS DO AMBIENTE GERAL
        this.state = {
            bgColor: '#909090',
            bgActive: true,
        }


        window.onresize = () => {
            this.camera.aspect = el.clientWidth / el.clientHeight;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(el.clientWidth , el.clientHeight);

        }

        this.#run();
    }

    /**
     * METODO PARA CARREGAR O MODELO 3D 
     * @param {string} url 
     * @returns gltf
     */
    #loadModel(url) {
        return new Promise((resolve, reject) => {
            this.loader.load(url, (gltf) => {

                const scene = gltf.scene || gltf.scenes[0];
				// const clips = gltf.animations || [];

                this.#listMesh(scene.children);

                if (!scene) {
                    // Valid, but not supported by this viewer.
                    throw new Error(
                        'Nâo contem cena' +
                            ' - Verificar o modelo se é gltf ou glb',
                    );
                }

                // this.#setContent(scene, clips);

                resolve(gltf);
            }, undefined, (error) => {
                reject(error);
            });
        });
    }

    /**
     * METODO PARA CARRECA O HDR
     * @returns true
     */
    #loadHDR() {
        return new Promise( (resolve, reject) => {
            this.hdrLoader
            .setPath('./')
            .load('neon_photostudio_2k.hdr', (texture) => {

                texture.mapping = THREE.EquirectangularReflectionMapping;
                this.scene.environment = texture;

                resolve(true);
            }, undefined, (error) => {
                reject(error)
            }); 
        })
    }

    /**
     * METÓDO PARA LISTAR TODAS AS MESH PARA PODER MODIFICAR COMO NECESSARIO
     * @param {Array} children 
     * @returns 
     */
    #listMesh(children) {
        // Object3D
        // Mesh
        let child;
        let count = children.length;
        
        if(count === 0) {return Array() ;}

        for (let i = 0; i < count; i++ ) {

            child = children[i];

            if( child.type === 'Mesh' ) {
                this.allMesh.push(child);
                child.children.splice(i,1);
            }

            if(child.children) {
                this.#listMesh(child.children);
            }

        }
    }

    getMesh() {
        return this.allMesh;
    }

    /**
     * METODO ASSINCRONO PARA ESPERAR O CARREGAMENTO DO MODELO 3D
     * @param {String} urlPath 
     * @return {Boolean}
     */
    async load(urlPath) {                           //<-------------------

        const gltf = await this.#loadModel(urlPath);
        const scene = gltf.scene || gltf.scenes[0];
		const clips = gltf.animations || [];
        this.#setContent(scene, clips);
        return await this.#loadHDR();

    }

    /**
     * MODELO PARA ADICIONAR A CENA DO MODELO 3D
     * @param {Object} model 
     * @param {Object} clips 
     */
    #setContent(model, clips) {
        model.updateMatrixWorld();

        var box = new THREE.Box3().setFromObject(model);
        var size = box.getSize(new THREE.Vector3(0,0,0));
        var center = box.getCenter(new THREE.Vector3());
        
        model.position.x += center.x;
		model.position.y -= center.y;
		model.position.z -= center.z;

        console.log(this.controls);
        this.controls.minDistance = size.x * 1.5;
        this.controls.maxDistance = size.x * 3;

        this.camera.position.z = size.length() * 1.2;

        this.model = model;
        
        this.scene.add(model);

    }

    /**
     * METÓDO PARA RENDERIZAR TODA A CENA E CAMERA
     */
    #render() {
        requestAnimationFrame(this.render);
        
        if(this.controls) {
            this.controls.update();
        }

        this.renderer.render(this.scene, this.camera);
    }

    add(modelUrl) {
       this.modelUrl = modelUrl; 
    }

    async #run() {
        
        await this.load(this.modelUrl);

        this.render = this.#render.bind(this);
        requestAnimationFrame(this.render);
    }

}