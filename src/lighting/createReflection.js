import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js'
import * as THREE from 'three/webgpu'

export const createReflection = ({ scene, renderer }) => {
    const pmremGenerator = new THREE.PMREMGenerator(renderer)
    const environment = pmremGenerator.fromScene(
        new RoomEnvironment(),
        0.0001, Math.PI * 0.35
    ).texture

    return scene.environment = environment
}
