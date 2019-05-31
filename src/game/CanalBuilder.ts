import {Engine} from "@babylonjs/core/Engines/engine";
import {Scene} from "@babylonjs/core/scene";
import {Color3, Color4, Vector3} from "@babylonjs/core/Maths/math";
import {ArcRotateCamera} from "@babylonjs/core/Cameras/arcRotateCamera";
import {Mesh} from "@babylonjs/core/Meshes/mesh";
import {
    Axis,
    AbstractMesh,
    AssetsManager,
    HemisphericLight,
    ShadowGenerator,
    SpotLight,
    Space,
    StandardMaterial
} from "@babylonjs/core";

import {AdvancedDynamicTexture, Button} from "@babylonjs/gui";
import {Tools} from "./Tools";

import "@babylonjs/core/Meshes/meshBuilder";
import "@babylonjs/core/Debug/debugLayer";
import "@babylonjs/inspector";

export class CanalBuilder {

    readonly canvas: HTMLCanvasElement;
    readonly engine: Engine;
    readonly scene: Scene;

    private plane: Mesh;
    private camera: ArcRotateCamera;

    private tileRandomPrototypes: Array<Mesh>;
    private tilePrototypes: Array<Mesh>;
    private tiles: Array<any>;

    private assetsManager: AssetsManager;
    private shadowGenerator: ShadowGenerator;

    private startingPoint: Vector3;
    private currentMesh: AbstractMesh;
    private newTile: AbstractMesh;

    constructor(id: string) {
        this.canvas = document.getElementById(id) as HTMLCanvasElement;
        this.engine = new Engine(this.canvas);

        this.scene = new Scene(this.engine);
        this.scene.clearColor = new Color4(0.3, 0.35, 0.4, 1.0);
        this.scene.debugLayer.show();

        this.assetsManager = new AssetsManager(this.scene);
        this.plane = null;

        this.currentMesh = null;
        this.startingPoint = null;

        this.tilePrototypes = [];
        this.tileRandomPrototypes = [];

        this.tiles = [];

        this.canvas.addEventListener("pointerdown", (event: PointerEvent) => this.onPointerDown(event), false);
        this.canvas.addEventListener("pointerup", (event: PointerEvent) => this.onPointerUp(event), false);
        this.canvas.addEventListener("pointermove", (event: PointerEvent) => this.onPointerMove(event), false);
    }

    public buildScene() {
        this.addCamera();
        this.loadMesh();
    }

    public addScene() {
        this.addPlane();
        this.addButton();
        this.addLights();
        this.addStartGoal();
    }

    public resize() {
        this.engine.resize();
    }

    public runRenderLoop() {
        this.engine.runRenderLoop(() => {
            this.scene.render();
        });
    }

    private loadMesh() {
        let meshTask = this.assetsManager.addMeshTask("meshTask", "", "/assets/", "tiles.babylon");

        this.tilePrototypes = [];
        this.tileRandomPrototypes = [];

        meshTask.onSuccess = (task) => {
            task.loadedMeshes.forEach((mesh) => {
                if (mesh.name === "Tile D") {
                    mesh.position = new Vector3(-9, 9, 0);
                    mesh.rotation = new Vector3(Math.PI / -2, 0, 0);
                    mesh.isVisible = false;
                } else {
                    mesh.position = new Vector3(0, 0, 0);
                    mesh.rotation = new Vector3(Math.PI / -2, 0, 0);
                    mesh.isVisible = false;
                    this.tileRandomPrototypes.push(<Mesh>mesh);
                }
                this.tilePrototypes.push(<Mesh>mesh);
            });

            this.addScene();
        };
        this.assetsManager.load();
    }

    private addCamera() {
        this.camera = new ArcRotateCamera("camera", Math.PI * 1.5, 2, 25, new Vector3(0, -2, 0), this.scene);
        this.camera.lowerAlphaLimit = Math.PI * 1.5;
        this.camera.upperAlphaLimit = Math.PI * 1.5;
        this.camera.lowerBetaLimit = 2;
        this.camera.upperBetaLimit = 2;
        this.camera.lowerRadiusLimit = 25;
        this.camera.upperRadiusLimit = 25;
        this.camera.attachControl(this.canvas, true);
    }

    private addLights() {
        let spotLight = new SpotLight("spotLight", new Vector3(-5, 5, -20), new Vector3(0, -0.25, 1), Math.PI / 2, 2, this.scene);
        spotLight.intensity = 0.5;

        let ambientLight = new HemisphericLight("ambientLight", new Vector3(0, 0, -10), this.scene);
        ambientLight.intensity = 0.5;

        this.shadowGenerator = new ShadowGenerator(1024, spotLight);
        this.shadowGenerator.useBlurExponentialShadowMap = true;
    }

    private addButton() {
        let advancedTexture = AdvancedDynamicTexture.CreateFullscreenUI("UI");

        let addButton = Button.CreateSimpleButton("addButton", "Add new tile");
        addButton.width = "150px";
        addButton.height = "40px";
        addButton.color = "white";
        addButton.cornerRadius = 0;
        addButton.background = "black";
        addButton.horizontalAlignment = 0;
        addButton.verticalAlignment = 0;
        addButton.onPointerUpObservable.add(() => this.getRandomTile());
        advancedTexture.addControl(addButton);

        let rotateButton = Button.CreateSimpleButton("rotateButton", "Rotate");
        rotateButton.width = "150px";
        rotateButton.height = "40px";
        rotateButton.color = "white";
        rotateButton.cornerRadius = 0;
        rotateButton.background = "black";
        rotateButton.horizontalAlignment = 0;
        rotateButton.verticalAlignment = 0;
        rotateButton.top = 50;
        rotateButton.onPointerUpObservable.add(() => this.rotateTile());
        advancedTexture.addControl(rotateButton);
    }

    private addPlane() {
        this.plane = Mesh.CreatePlane("plane", 20, this.scene);
        this.plane.position = Vector3.Zero();
        this.plane.receiveShadows = true;
        this.plane.material = this.getMaterial();
    }

    private addStartGoal() {
        let tile_d = this.tilePrototypes.find(e => e.name === 'Tile D');

        let start = tile_d.createInstance("tile_start");
        start.parent = this.plane;
        start.position = new Vector3(-9, 9, 0);
        this.shadowGenerator.getShadowMap().renderList.push(start);
        this.tiles.push(start);

        let goal = tile_d.createInstance("tile_goal");
        goal.parent = this.plane;
        goal.position = new Vector3(9, -9, 0);
        goal.rotation = new Vector3(Math.PI / 2, 0, Math.PI);
        this.shadowGenerator.getShadowMap().renderList.push(goal);
        this.tiles.push(goal);
    }

    private getRandomTile() {
        let tile = this.tileRandomPrototypes[Tools.getRandomIntInclusive(0, 1)].createInstance("tile_" + this.tiles.length);
        tile.parent = this.plane;
        tile.position = new Vector3(0, 0, -0.5);
        this.shadowGenerator.getShadowMap().renderList.push(tile);
        this.tiles.push(tile);
        this.newTile = tile;
    }

    private getMaterial() {
        let material = new StandardMaterial("plane", this.scene);
        material.diffuseColor = new Color3(0.7, 0.7, 0.7);
        material.specularColor = new Color3(0.7, 0.7, 0.7);
        material.ambientColor = new Color3(0, 0, 0);
        return material;
    }

    private getGroundPosition() {
        let pickInfo = this.scene.pick(this.scene.pointerX, this.scene.pointerY, (mesh) => {
            return mesh == this.plane;
        });

        if (pickInfo.hit) {
            let position = pickInfo.pickedPoint;
            position.x = Math.round(position.x);
            position.y = Math.round(position.y);
            position.z = 0;
            return position;
        }

        return null;
    }

    private rotateTile() {
        this.newTile.rotate(Axis.Z, Math.PI / 2, Space.WORLD);
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
            this.currentMesh.position.z = -0.5;
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
            this.currentMesh.position.z = 0;
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
        this.currentMesh.position.z = -0.5;
        this.startingPoint = current;
    }
}
