import {
    BoxGeometry,
    Group,
    Mesh,
    MeshNormalMaterial,
    PerspectiveCamera,
    Scene,
    WebGLRenderer,
} from 'https://unpkg.com/three@0.143.0/build/three.module.js';

import gsap from 'https://unpkg.com/gsap@3.10.4/index.js';

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
    }

    static resize = () => {
        this.renderer.setSize( window.innerWidth, window.innerHeight );
    };

    static update = ( time ) => {
        this.renderer.render( this.scene, this.camera );
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
        gsap.ticker.add(this.onUpdate);
    }

    static onResize = () => {
        WorldController.resize();
        this.view.resize();
        RenderManager.resize();
    };

    static onUpdate = (time, delta, frame) => {
        WorldController.update(time, delta, frame);
        this.view.update(time, delta, frame);
        RenderManager.update(time, delta, frame);
    };
}

App.init();
