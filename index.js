import Viewer from "./classes/viewer.js";

const main = document.querySelector('.modelo');

const view = new Viewer( main , './models/manequim2.glb');
// view.add('./models/manequim2.glb');