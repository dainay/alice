import * as THREE from 'three/webgpu'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
// import { Inspector } from 'three/addons/inspector/Inspector.js'
import gsap from 'gsap'
import BackMusic from '../assets/back.mp3'

const MAX_PIXEL_RATIO = 2

export const createExperience = async (canvas) => {
    const scene = new THREE.Scene()

    const camera = new THREE.PerspectiveCamera(
        35,
        window.innerWidth / window.innerHeight,
        0.1,
        150
    )
    // camera.position.set(0, 9, 40)
    camera.position.set(-10, 15, 1)
    scene.add(camera)

    const controls = new OrbitControls(camera, canvas)
    controls.target.set(0, 0, 0)
    controls.enableDamping = true

    const renderer = new THREE.WebGPURenderer({
        canvas,
        antialias: true
    })

    const music = new Audio(BackMusic)
    music.loop = true
    music.volume = 0.2
    music.play()


    renderer.toneMapping = THREE.CineonToneMapping
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.PCFShadowMap
    renderer.setClearColor(0x111111)

    controls.enabled = false
    await renderer.init()

    gsap.to(camera.position, {
        x: 0,
        y: 9,
        z: 40,
        duration: 6,
        ease: 'easeInOut',
        onComplete: () => {
            controls.enabled = true
        }
    }, 3)

    // const inspector = new Inspector()
    // renderer.inspector = inspector

    const resize = () => {
        const width = window.innerWidth
        const height = window.innerHeight

        camera.aspect = width / height
        camera.updateProjectionMatrix()

        renderer.setSize(width, height)
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, MAX_PIXEL_RATIO))
    }

    resize()
    window.addEventListener('resize', resize)

    await renderer.init()

    return {
        scene,
        camera,
        controls,
        renderer,
        // inspector,
        dispose: () => {
            window.removeEventListener('resize', resize)
            controls.dispose()
            renderer.dispose()
        }
    }
}
