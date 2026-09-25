import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'

const TABLE_SCALE = 20
const TABLE_POSITION = [0, -22.5, -50]

const BOTTLE_SCALE = 3
const BOTTLE_POSITION = [0, -4.7, 0]

const TABLE_HEIGHT = -4.35

export const loadModels = async (scene) => {
    const dracoLoader = new DRACOLoader()
    dracoLoader.setDecoderPath('/draco/')

    const gltfLoader = new GLTFLoader()
    gltfLoader.setDRACOLoader(dracoLoader)

    try {
        const [tableGltf, bottleGltf] = await Promise.all([
            gltfLoader.loadAsync('/table_compressed.glb'),
            gltfLoader.loadAsync('/bottle_compressed.glb')
        ])

        const table = tableGltf.scene
        table.scale.setScalar(TABLE_SCALE)
        table.position.set(...TABLE_POSITION)
        scene.add(table)

        const bottle = bottleGltf.scene
        bottle.scale.set(BOTTLE_SCALE, BOTTLE_SCALE * 1.1, BOTTLE_SCALE)
        bottle.position.set(...BOTTLE_POSITION)
        bottle.position.y = Math.max(bottle.position.y, TABLE_HEIGHT)
        bottle.rotation.y = -Math.PI * 0.6
        scene.add(bottle)

        return {
            table,
            bottle,
            tableHeight: TABLE_HEIGHT
        }
    } finally {
        dracoLoader.dispose()
    }
}
