import * as THREE from 'three/webgpu'
import { bloom } from 'three/examples/jsm/tsl/display/BloomNode.js'
import { pass } from 'three/tsl'

export const createPostProcessing = ({ renderer, scene, camera, inspector }) => {
    const pipeline = new THREE.RenderPipeline(renderer)
    const scenePass = pass(scene, camera)
    const sceneColor = scenePass.getTextureNode('output')
    const bloomPass = bloom(sceneColor)

    bloomPass.threshold.value = 4
    bloomPass.strength.value = 0.32
    pipeline.outputNode = sceneColor.add(bloomPass)

    // const gui = inspector.createParameters('Bloom').close()
    // gui.add(bloomPass.threshold, 'value', 0, 2, 0.01).name('threshold')
    // gui.add(bloomPass.strength, 'value', 0, 2, 0.01).name('strength')

    return {
        render: () => pipeline.render(),
        pipeline,
        bloomPass
    }
}
