import {Engine} from "@babylonjs/core/Engines/engine";
import {Scene} from "@babylonjs/core/scene";
import {Color4, Vector2, Vector3} from "@babylonjs/core/Maths/math";
import {ArcRotateCamera} from "@babylonjs/core/Cameras/arcRotateCamera";
import {Mesh} from "@babylonjs/core/Meshes/mesh";
import {
    Animation,
    Axis,
    AbstractMesh,
    AssetsManager,
    HemisphericLight,
    ShadowGenerator,
    SpotLight,
    Space, CircleEase, EasingFunction, SineEase, InstancedMesh,
} from "@babylonjs/core";

import {AdvancedDynamicTexture, Button} from "@babylonjs/gui";
import {Tools} from "./Tools";
import {Graph} from "./Graph";

import "@babylonjs/core/Meshes/meshBuilder";
import "@babylonjs/core/Debug/debugLayer";
import "@babylonjs/inspector";

export class CanalBuilder {

    readonly canvas: HTMLCanvasElement;
    readonly engine: Engine;
    readonly scene: Scene;

    private graph: Graph;

    private ground: Mesh;
    private camera: ArcRotateCamera;
    private tiles: Array<any> = [];

    private mashes: Map<String, any> = new Map();
    private tileMashes: Array<Mesh> = [];

    private assetsManager: AssetsManager;
    private shadowGenerator: ShadowGenerator;

    private startingPoint: Vector3;
    private currentMesh: AbstractMesh;
    private newTile: AbstractMesh;

    private increase: number = 0.5;

    constructor(id: string) {
        this.canvas = document.getElementById(id) as HTMLCanvasElement;
        this.engine = new Engine(this.canvas);

        this.scene = new Scene(this.engine);
        this.scene.clearColor = new Color4(0.3, 0.35, 0.4, 1.0);
        this.scene.debugLayer.show();

        this.assetsManager = new AssetsManager(this.scene);
        this.ground = null;

        this.currentMesh = null;
        this.startingPoint = null;

        this.tileMashes = [];

        this.tiles = [];
        this.graph = new Graph();

        this.canvas.addEventListener("pointerdown", (event: PointerEvent) => this.onPointerDown(event), false);
        this.canvas.addEventListener("pointerup", (event: PointerEvent) => this.onPointerUp(event), false);
        this.canvas.addEventListener("pointermove", (event: PointerEvent) => this.onPointerMove(event), false);
    }

    public buildScene() {
        this.addCamera();
        this.loadMesh();
    }

    public addScene() {
        this.addGround();
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
        meshTask.onSuccess = (task) => {
            task.loadedMeshes.forEach((mesh) => {
                mesh.isVisible = false;

                console.log(mesh.name);

                if (mesh.name === "Tile_A" || mesh.name === "Tile_B" || mesh.name === "Tile_C") {
                    this.tileMashes.push(<Mesh>mesh);
                }
                this.mashes.set(mesh.name, mesh);
            });

            this.addScene();
        };

        this.tileMashes = [];
        this.assetsManager.load();
    }

    private addCamera() {
        this.camera = new ArcRotateCamera("camera", Math.PI * 1.5, 0.5, 25, new Vector3(0, 0, -2), this.scene);
    }

    private addLights() {
        let spotLight = new SpotLight("spotLight", new Vector3(-10, 30, 10), new Vector3(Math.PI / 4, -Math.PI / 2, -Math.PI / 4), Math.PI / 2, 2, this.scene);
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

    private addGround() {
        this.ground = this.mashes.get("Ground");
        this.ground.position = Vector3.Zero();
        this.ground.receiveShadows = true;
        this.ground.isVisible = true;
    }

    private addStartGoal() {
        let tile_d = this.mashes.get("Tile_D");

        let start = tile_d.createInstance("Start");
        start.parent = this.ground;
        start.position = new Vector3(-9, 0, 9);

        this.tiles.push(start);

        let goal = tile_d.createInstance("Goal");
        goal.parent = this.ground;
        goal.position = new Vector3(9, 0, -9);
        goal.rotate(Axis.Y, Math.PI, Space.WORLD);
        this.shadowGenerator.getShadowMap().renderList.push(goal);
        this.tiles.push(goal);
    }

    private getRandomTile() {
        let tileAnimation = this.getTileAnimation(10, this.increase);
        let randomTile = this.tileMashes[Tools.getRandomIntInclusive(0, 2)];
        let tile: InstancedMesh = randomTile.createInstance(randomTile.name + '.' + this.tiles.length);
        tile.parent = this.ground;
        tile.position = new Vector3(0, 0, 0);
        tile.animations = [];
        tile.animations.push(tileAnimation);

        this.shadowGenerator.getShadowMap().renderList.push(tile);
        this.tiles.push(tile);
        this.newTile = tile;

        this.scene.beginAnimation(tile, 0, 10, false);
    }

    private getTileAnimation(from: number, to: number) {
        let easingFunction = new SineEase();
        easingFunction.setEasingMode(EasingFunction.EASINGMODE_EASEIN);

        let tileAnimation = new Animation("tileAnimation", "position.y", 30, Animation.ANIMATIONTYPE_FLOAT, Animation.ANIMATIONLOOPMODE_CYCLE);
        tileAnimation.setKeys([{frame: 0, value: from}, {frame: 10, value: to}]);
        tileAnimation.setEasingFunction(easingFunction);

        return tileAnimation;
    }

    private getGroundPosition() {
        let pickInfo = this.scene.pick(this.scene.pointerX, this.scene.pointerY, (mesh) => {
            return mesh == this.ground;
        });

        if (pickInfo.hit) {
            let position = pickInfo.pickedPoint;
            position.x = Math.round(position.x);
            position.y = 0;
            position.z = Math.round(position.z);
            return position;
        }

        return null;
    }

    private rotateTile() {
        this.newTile.rotate(Axis.Y, Math.PI / 2, Space.WORLD);
    }

    private onPointerDown(event: PointerEvent) {
        if (event.button !== 0) {
            return;
        }

        let pickInfo = this.scene.pick(this.scene.pointerX, this.scene.pointerY, (mesh) => {
            return mesh !== this.ground;
        });

        if (pickInfo.hit) {
            let tileAnimation = this.getTileAnimation(0, this.increase);

            this.startingPoint = this.getGroundPosition();
            this.currentMesh = pickInfo.pickedMesh;
            this.currentMesh.animations.push(tileAnimation);

            this.scene.beginAnimation(this.currentMesh, 0, 10, false);
        }
    }

    private onPointerUp(event: PointerEvent) {
        if (this.startingPoint) {
            let tileAnimation = this.getTileAnimation(this.increase, 0);

            this.currentMesh.animations.push(tileAnimation);
            this.scene.beginAnimation(this.currentMesh, 0, 10, false);

            this.graph.buildGraph(this.ground, new Vector2(20, 20));

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
        this.currentMesh.position.y = this.increase;
        this.startingPoint = current;
    }
}
