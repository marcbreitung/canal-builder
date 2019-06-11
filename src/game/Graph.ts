import {Mesh, Vector2, Vector3} from "@babylonjs/core";

export class Graph {

    private tiles: Map<string, Array<Number>>;

    constructor() {
        this.tiles = new Map();
        this.tiles.set('Start', [2, 2, 2, 2, 1, 2, 2, 1, 2]);
        this.tiles.set('Goal', [2, 1, 2, 2, 1, 2, 2, 2, 2]);
        this.tiles.set('Tile_A', [2, 1, 2, 2, 1, 1, 2, 1, 2]);
        this.tiles.set('Tile_B', [2, 1, 2, 2, 1, 2, 2, 1, 2]);
        this.tiles.set('Tile_C', [2, 1, 2, 2, 1, 1, 2, 2, 2]);
        this.tiles.set('Tile_A', [2, 2, 2, 2, 1, 2, 2, 1, 2]);
    }

    public buildGraph(ground: Mesh, size: Vector2) {
        ground.getChildren().forEach((mesh: Mesh) => {
            let type = mesh.name.split('.');
            let path = this.tiles.get(type[0]);
            let position = mesh.getAbsolutePosition().add(new Vector3(9, 0, -9));
            console.log(mesh.name, Math.abs(position.x), Math.abs(position.z), path);
        });
    }
}