import {ILoadingScreen} from "@babylonjs/core";

export class LoadingScreen implements ILoadingScreen {

    loadingUIBackgroundColor: string;

    constructor(public loadingUIText: string) {}

    public displayLoadingUI() {
        console.log('displayLoadingUI');
    }

    public hideLoadingUI() {
        console.log('hideLoadingUI');
    }

}