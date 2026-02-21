import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.158/build/three.module.js';
import { ARButton } from 'https://cdn.jsdelivr.net/npm/three@0.158/examples/jsm/webxr/ARButton.js';
import { GLTFLoader } from 'https://cdn.jsdelivr.net/npm/three@0.158/examples/jsm/loaders/GLTFLoader.js';

let camera, scene, renderer;
let controller;
let hitTestSource = null;
let hitTestSourceRequested = false;

const loader = new GLTFLoader();

init();
animate();

function init() {

  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera();

  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.xr.enabled = true;

  if (navigator.xr) {
  console.log("WebXR supported");
    } else {
  console.log("WebXR NOT supported");
    }

  document.body.appendChild(renderer.domElement);
  document.body.appendChild(
    ARButton.createButton(renderer, { requiredFeatures: ['hit-test'] })
  );

  const light = new THREE.HemisphereLight(0xffffff, 0xbbbbff, 1);
  scene.add(light);

  controller = renderer.xr.getController(0);
  scene.add(controller);
}

function animate() {
  renderer.setAnimationLoop(render);
}

function render(timestamp, frame) {

  if (frame) {

    const referenceSpace = renderer.xr.getReferenceSpace();
    const session = renderer.xr.getSession();

    if (!hitTestSourceRequested) {

      session.requestReferenceSpace('viewer').then(function (referenceSpace) {
        session.requestHitTestSource({ space: referenceSpace }).then(function (source) {
          hitTestSource = source;
        });
      });

      hitTestSourceRequested = true;
    }

    if (hitTestSource) {
      const hitTestResults = frame.getHitTestResults(hitTestSource);

      if (hitTestResults.length) {
        const hit = hitTestResults[0];
        const pose = hit.getPose(referenceSpace);
        window.hitMatrix = pose.transform.matrix;
      }
    }
  }

  renderer.render(scene, camera);
}

window.addModel = function(path) {

  if (!window.hitMatrix) {
    alert("Scan the floor first.");
    return;
  }

  loader.load(path, function(gltf) {

    const model = gltf.scene;

    model.position.setFromMatrixPosition(
      new THREE.Matrix4().fromArray(window.hitMatrix)
    );

    model.scale.set(0.5, 0.5, 0.5);

    scene.add(model);
  });

};