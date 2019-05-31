import {Engine} from "@babylonjs/core/Engines/engine";
import {Scene} from "@babylonjs/core/scene";
import {Color3, Color4, Vector3} from "@babylonjs/core/Maths/math";
import {ArcRotateCamera} from "@babylonjs/core/Cameras/arcRotateCamera";
import {Mesh} from "@babylonjs/core/Meshes/mesh";
import {
    AbstractMesh,
    AssetsManager,
    HemisphericLight,
    ShadowGenerator,
    SpotLight,
    StandardMaterial
} from "@babylonjs/core";

import "@babylonjs/core/Meshes/meshBuilder";
import "@babylonjs/core/Debug/debugLayer";
import "@babylonjs/inspector";

export class CanalBuilder {

    readonly canvas: HTMLCanvasElement;
    readonly engine: Engine;
    readonly scene: Scene;

    private plane: Mesh;
    private camera: ArcRotateCamera;

    private assetsManager: AssetsManager;
    private shadowGenerator: ShadowGenerator;

    private startingPoint: Vector3;
    private currentMesh: AbstractMesh;

    constructor(id: string) {
        this.canvas = document.getElementById(id) as HTMLCanvasElement;
        this.engine = new Engine(this.canvas);

        this.scene = new Scene(this.engine);
        this.scene.clearColor = new Color4(0.3, 0.35, 0.4, 1.0);
        //this.scene.debugLayer.show();

        this.assetsManager = new AssetsManager(this.scene);
        this.plane = null;

        this.currentMesh = null;
        this.startingPoint = null;

        this.canvas.addEventListener("pointerdown", (event: PointerEvent) => this.onPointerDown(event), false);
        this.canvas.addEventListener("pointerup", (event: PointerEvent) => this.onPointerUp(event), false);
        this.canvas.addEventListener("pointermove", (event: PointerEvent) => this.onPointerMove(event), false);
    }

    public buildScene() {
        let spotLight = new SpotLight("spotLight", new Vector3(-5, 5, -20), new Vector3(0, -0.25, 1), Math.PI / 2, 2, this.scene);
        spotLight.intensity = 0.5;

        let ambientLight = new HemisphericLight("ambientLight", new Vector3(0, 0, -10), this.scene);
        ambientLight.intensity = 0.5;

        this.shadowGenerator = new ShadowGenerator(1024, spotLight);
        this.shadowGenerator.useBlurExponentialShadowMap = true;

        this.camera = new ArcRotateCamera("camera", Math.PI * 1.5, 2, 25, new Vector3(0, -2, 0), this.scene);
        this.camera.lowerAlphaLimit = Math.PI * 1.5;
        this.camera.upperAlphaLimit = Math.PI * 1.5;
        this.camera.lowerBetaLimit = 2;
        this.camera.upperBetaLimit = 2;
        this.camera.lowerRadiusLimit = 25;
        this.camera.upperRadiusLimit = 25;
        this.camera.attachControl(this.canvas, true);

        this.plane = Mesh.CreatePlane("plane", 20, this.scene);
        this.plane.position = Vector3.Zero();
        this.plane.receiveShadows = true;
        this.plane.material = this.getMaterial();

        this.loadMesh();
    }

    public loadMesh() {
        let meshTask = this.assetsManager.addMeshTask("meshTask", "", "/assets/", "tile_a/tile_a.babylon");
        meshTask.onSuccess = (task) => {
            let ground = task.loadedMeshes.find((mesh) => mesh.name === 'Ground');
            ground.parent = this.plane;
            ground.position = new Vector3(0, 0, 0);
            this.shadowGenerator.getShadowMap().renderList.push(ground);
        };

        this.assetsManager.load();
    }

    public runRenderLoop() {
        this.engine.runRenderLoop(() => {
            this.scene.render();
        });
    }

    public resize() {
        this.engine.resize();
    }

    public getMaterial() {
        let material = new StandardMaterial("plane", this.scene);
        material.diffuseColor = new Color3(0.7, 0.7, 0.7);
        material.specularColor = new Color3(0.7, 0.7, 0.7);
        material.ambientColor = new Color3(0, 0, 0);
        return material;
    }

    private onPointerDown(event: PointerEvent) {
        if (event.button !== 0) {
            return;
        }

        let pickInfo = this.scene.pick(this.scene.pointerX, this.scene.pointerY, (mesh) => {
            return mesh !== this.plane;
        });

        if (pickInfo.hit) {
            this.startingPoint = this.getGroundPosition();
            this.currentMesh = pickInfo.pickedMesh;
            if (this.startingPoint) {
                setTimeout(() => {
                    this.camera.detachControl(this.canvas);
                }, 0);
            }
        }
    }

    private onPointerUp(event: PointerEvent) {
        if (this.startingPoint) {
            this.camera.attachControl(this.canvas, true);
            this.currentMesh = null;
            this.startingPoint = null;
        }
    }

    private onPointerMove(event: PointerEvent) {
        if (this.startingPoint === null && this.currentMesh === null) {
            return;
        }
        let current = this.getGroundPosition();
        if (!current) {
            return;
        }
        let newPosition = current.subtract(this.startingPoint);

        this.currentMesh.position.addInPlace(newPosition);
        this.startingPoint = current;
    }

    private getGroundPosition() {
        let pickInfo = this.scene.pick(this.scene.pointerX, this.scene.pointerY, (mesh) => {
            return mesh == this.plane;
        });

        if (pickInfo.hit) {
            return pickInfo.pickedPoint;
        }

        return null;
    }

}
