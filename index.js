import Viewer from "./classes/viewer.js";

const main = document.querySelector('.modelo');

const inputColor = document.getElementById('color');
const manequimColors = document.querySelectorAll('.manequim .cor');

const btnGerarImagem = document.getElementById('gerarImagem');

const divDownload = document.querySelector('.download-img');
const imgDownload = document.getElementById('imagemBaixar');

const colors = ['#808080', '#101010', '#C9A346'];

const view = new Viewer( main , './models/manequim2.glb');
const mesh = view.getMesh();

inputColor.addEventListener('change', (e) => {
    view.setColorMesh(mesh[1], e.target.value);
})

manequimColors.forEach( (el, i) => {
    el.setAttribute('cor', colors[i]);
    el.style.background = colors[i];
    
    el.addEventListener('click', () => {
        // view.setColorMesh(mesh[0], el.getAttribute('cor'));
        view.modelTransparent(mesh[0], el.getAttribute('cor'));

    });
});

btnGerarImagem.addEventListener('click', () => {
    let urlImg = view.captureImage();

    if(urlImg) {
        
        const downloadLink = document.createElement('a');
        downloadLink.href = urlImg;
        downloadLink.download = 'manequim_00.png';
        downloadLink.click();
        
    }
    
});


