import {
    BoxGeometry,
    Group,
    Mesh,
    MeshNormalMaterial,
    PerspectiveCamera,
    Scene,
    WebGLRenderer,
} from 'three';

import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';

import { RGBShiftShader } from 'three/examples/jsm/shaders/RGBShiftShader.js';
import { DotScreenShader } from 'three/examples/jsm/shaders/DotScreenShader.js';

import gsap from 'gsap';

class SceneView extends Group {
    constructor() {
        super();

        this.initMesh();
    }

    initMesh() {
        this.geometry = new BoxGeometry( 0.2, 0.2, 0.2 );
        this.material = new MeshNormalMaterial();

        this.mesh = new Mesh( this.geometry, this.material );
        this.add( this.mesh );
    }

    resize = () => {
    };

    update = ( time ) => {

        this.mesh.rotation.x = time / 2;
        this.mesh.rotation.y = time / 1;

    };
}

class RenderManager {
    static init(renderer, scene, camera) {
        this.renderer = renderer;
        this.scene = scene;
        this.camera = camera;

        this.initRenderer();
    }

    static initRenderer() {
        this.composer = new EffectComposer( this.renderer );
        this.composer.addPass( new RenderPass( this.scene, this.camera ) );

        this.effect1 = new ShaderPass( DotScreenShader );
        this.effect1.uniforms[ 'scale' ].value = 4;
        this.composer.addPass( this.effect1 );

        this.effect2 = new ShaderPass( RGBShiftShader );
        this.effect2.uniforms[ 'amount' ].value = 0.0015;
        this.composer.addPass( this.effect2 );
    }

    static resize = () => {
        this.renderer.setPixelRatio( window.devicePixelRatio );
        this.renderer.setSize( window.innerWidth, window.innerHeight );
        this.composer.setSize( window.innerWidth, window.innerHeight );
    };

    static update = ( time ) => {
        this.composer.render();
    };

    static animateIn = () => {
        gsap.to(this.effect2.uniforms[ 'amount' ], { value: 0.5 });
    };
}

class WorldController {
    static init() {
        this.initWorld();
    }

    static initWorld() {
        this.camera = new PerspectiveCamera( 70, window.innerWidth / window.innerHeight, 0.01, 10 );
        this.camera.position.z = 1;

        this.scene = new Scene();

        this.renderer = new WebGLRenderer( { antialias: true } );
        document.body.appendChild( this.renderer.domElement );
    }

    static resize = () => {

        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();

    };

    static update = ( time ) => {
    };
}

class App {
    static init() {
        this.initWorld();
        this.initViews();
        this.initControllers();

        this.addListeners();
        this.onResize();
    }

    static initWorld() {
        WorldController.init();
    }

    static initViews() {
        this.view = new SceneView();
        WorldController.scene.add( this.view );
    }

    static initControllers() {
        const { renderer, scene, camera } = WorldController;

        RenderManager.init(renderer, scene, camera);
    }

    static addListeners() {
        window.addEventListener( 'resize', this.onResize );
        window.addEventListener( 'click', this.onClick );
        gsap.ticker.add(this.onUpdate);
        // requestAnimationFrame(this.onUpdate);
    }

    static onResize = () => {
        WorldController.resize();
        this.view.resize();
        RenderManager.resize();
    };

    static onUpdate = (time, delta, frame) => {
        // requestAnimationFrame(this.onUpdate);

        // time = time * 0.001;

        WorldController.update(time, delta, frame);
        this.view.update(time, delta, frame);
        RenderManager.update(time, delta, frame);
    };

    static onClick = () => {
        RenderManager.animateIn();
    };
}

App.init();
