import './assets/css/style.css';
import {CanalBuilder} from './game/CanalBuilder';

let canalBuilder = new CanalBuilder('canal-builder');
canalBuilder.buildScene();
canalBuilder.runRenderLoop();

window.addEventListener("resize", () => {
    canalBuilder.resize();
});