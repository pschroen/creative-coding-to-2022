import {
    BoxGeometry,
    BufferGeometry,
    Float32BufferAttribute,
    Group,
    Mesh,
    MeshNormalMaterial,
    OrthographicCamera,
    PerspectiveCamera,
    Scene,
    ShaderMaterial,
    Vector2,
    WebGLRenderer,
    WebGLRenderTarget,
} from 'three';

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

class DotScreenMaterial extends ShaderMaterial {
    constructor() {
        super({
            uniforms: {

                'tDiffuse': { value: null },
                'tSize': { value: new Vector2( 256, 256 ) },
                'center': { value: new Vector2( 0.5, 0.5 ) },
                'angle': { value: 1.57 },
                'scale': { value: 1.0 }

            },

            vertexShader: /* glsl */ `

                varying vec2 vUv;

                void main() {

                    vUv = uv;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );

                }
            `,

            fragmentShader: /* glsl */ `

                uniform vec2 center;
                uniform float angle;
                uniform float scale;
                uniform vec2 tSize;

                uniform sampler2D tDiffuse;

                varying vec2 vUv;

                float pattern() {

                    float s = sin( angle ), c = cos( angle );

                    vec2 tex = vUv * tSize - center;
                    vec2 point = vec2( c * tex.x - s * tex.y, s * tex.x + c * tex.y ) * scale;

                    return ( sin( point.x ) * sin( point.y ) ) * 4.0;

                }

                void main() {

                    vec4 color = texture2D( tDiffuse, vUv );

                    float average = ( color.r + color.g + color.b ) / 3.0;

                    gl_FragColor = vec4( vec3( average * 10.0 - 5.0 + pattern() ), color.a );

                }
            `
        });
    }
};

class RGBShiftMaterial extends ShaderMaterial {
    constructor() {
        super({

            uniforms: {

                'tDiffuse': { value: null },
                'amount': { value: 0.005 },
                'angle': { value: 0.0 }

            },

            vertexShader: /* glsl */ `

                varying vec2 vUv;

                void main() {

                    vUv = uv;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );

                }
            `,

            fragmentShader: /* glsl */ `

                uniform sampler2D tDiffuse;
                uniform float amount;
                uniform float angle;

                varying vec2 vUv;

                void main() {

                    vec2 offset = amount * vec2( cos(angle), sin(angle));
                    vec4 cr = texture2D(tDiffuse, vUv + offset);
                    vec4 cga = texture2D(tDiffuse, vUv);
                    vec4 cb = texture2D(tDiffuse, vUv - offset);
                    gl_FragColor = vec4(cr.r, cga.g, cb.b, cga.a);

                }
            `

        });
    }
};

class RenderManager {
    static init(renderer, scene, camera) {
        this.renderer = renderer;
        this.scene = scene;
        this.camera = camera;

        this.initRenderer();
    }

    static initRenderer() {
        // Fullscreen triangle
        this.screenCamera = new OrthographicCamera( - 1, 1, 1, - 1, 0, 1 );

        const screenGeometry = new BufferGeometry();
        screenGeometry.setAttribute( 'position', new Float32BufferAttribute( [ - 1, 3, 0, - 1, - 1, 0, 3, - 1, 0 ], 3 ) );
        screenGeometry.setAttribute( 'uv', new Float32BufferAttribute( [ 0, 2, 0, 0, 2, 0 ], 2 ) );

        this.screen = new Mesh( screenGeometry );

        // Render targets
        this.renderTargetA = new WebGLRenderTarget();
        this.renderTargetB = this.renderTargetA.clone();

        // Dot screen material
        this.dotMaterial = new DotScreenMaterial();
        // this.dotMaterial.uniforms.scale.value = 4;

        // RGB shift material
        this.rgbMaterial = new RGBShiftMaterial();
        // this.rgbMaterial.uniforms.amount.value = 0.0015;
    }

    static resize = () => {
        this.renderer.setPixelRatio( window.devicePixelRatio );
        this.renderer.setSize( window.innerWidth, window.innerHeight );

        const effectiveWidth = window.innerWidth * window.devicePixelRatio;
        const effectiveHeight = window.innerHeight * window.devicePixelRatio;

        this.renderTargetA.setSize( effectiveWidth, effectiveHeight );
        this.renderTargetB.setSize( effectiveWidth, effectiveHeight );
    };

    static update = ( time ) => {
        const renderer = this.renderer;
        const scene = this.scene;
        const camera = this.camera;

        const renderTargetA = this.renderTargetA;
        const renderTargetB = this.renderTargetB;

        // Scene pass
        renderer.setRenderTarget(renderTargetA);
        renderer.render(scene, camera);

        // Dot screen pass
        this.dotMaterial.uniforms.tDiffuse.value = renderTargetA.texture;
        this.screen.material = this.dotMaterial;
        renderer.setRenderTarget(renderTargetB);
        renderer.render(this.screen, this.screenCamera);

        // RGB shift pass (render to screen)
        this.rgbMaterial.uniforms.tDiffuse.value = renderTargetB.texture;
        this.screen.material = this.rgbMaterial;
        renderer.setRenderTarget(null);
        renderer.render(this.screen, this.screenCamera);
    };

    static animateIn = () => {
        gsap.to(this.rgbMaterial.uniforms.amount, { value: 0.5 });
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

    static onClick = () => {
        RenderManager.animateIn();
    };
}

App.init();
