import {Engine} from "@babylonjs/core/Engines/engine";
import {Scene} from "@babylonjs/core/scene";
import {Color3, Color4, Vector3} from "@babylonjs/core/Maths/math";
import {ArcRotateCamera} from "@babylonjs/core/Cameras/arcRotateCamera";
import {HemisphericLight} from "@babylonjs/core/Lights/hemisphericLight";
import {GridMaterial} from "@babylonjs/materials/grid";
import {AssetsManager} from "@babylonjs/core";

import "@babylonjs/core/Meshes/meshBuilder";

export class CanalBuilder {

    readonly canvas: HTMLCanvasElement;
    readonly engine: Engine;
    readonly scene: Scene;

    protected assetsManager: AssetsManager;

    constructor(id: string) {
        this.canvas = document.getElementById(id) as HTMLCanvasElement;
        this.engine = new Engine(this.canvas);
        this.scene = new Scene(this.engine);
        this.scene.clearColor = new Color4(0.5, 0.8, 0.5, 1.0);
        this.assetsManager = new AssetsManager(this.scene);
    }

    public buildScene() {
        let camera = new ArcRotateCamera("Camera", Math.PI, -Math.PI, 50, new Vector3(0, 0, 0), this.scene);
        camera.attachControl(this.canvas, true);

        let light = new HemisphericLight("light1", new Vector3(0, 100, 0), this.scene);
        light.intensity = 0.5;

        this.loadMesh();
    }

    public loadMesh() {
        let meshTask = this.assetsManager.addMeshTask("Tile Task", "", "/assets/", "tile_a.babylon");
        meshTask.onSuccess = (task) => {
            let material = new GridMaterial("grid", this.scene);
            material.gridRatio = .5;
            material.mainColor = new Color3(0.2, 0.2, 0.2);
            material.lineColor = new Color3(0.9, 0.9, 0.9);
            task.loadedMeshes[0].position = Vector3.Zero();
            task.loadedMeshes[0].material = material;
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
}
