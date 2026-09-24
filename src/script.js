import * as THREE from 'three/webgpu'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { Inspector } from 'three/addons/inspector/Inspector.js'
import { bloom } from 'three/examples/jsm/tsl/display/BloomNode.js'
import { pass, instancedArray, Fn, uniform, positionLocal, instanceIndex, hash, vec3, deltaTime, Loop, If, EPSILON, dot, oneMinus, color } from 'three/tsl'

/**
 * Base
 */
// Canvas
const canvas = document.querySelector('canvas.threejs')

// Scene
const scene = new THREE.Scene()

/**
 * Sizes
 */
const sizes = {
    width: window.innerWidth,
    height: window.innerHeight
}

window.addEventListener('resize', () => {
    // Update sizes
    sizes.width = window.innerWidth
    sizes.height = window.innerHeight

    // Update camera
    camera.aspect = sizes.width / sizes.height
    camera.updateProjectionMatrix()

    // Update renderer
    renderer.setSize(sizes.width, sizes.height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
})

/**
 * Camera
 */
// Base camera
const camera = new THREE.PerspectiveCamera(35, sizes.width / sizes.height, 0.1, 100)
camera.position.z = 16
scene.add(camera)

// Controls
const controls = new OrbitControls(camera, canvas)
controls.target.set(0, 0, 0)
controls.enableDamping = true

/**
 * Renderer
 */
const renderer = new THREE.WebGPURenderer({
    canvas: canvas,
    antialias: true
})
renderer.toneMapping = THREE.CineonToneMapping
renderer.shadowMap.enabled = true
renderer.shadowMap.type = THREE.PCFShadowMap
renderer.setSize(sizes.width, sizes.height)
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
renderer.setClearColor(0x252028)
renderer.inspector = new Inspector()
await renderer.init()




/**
 * Spheres particles
 */

const count = 100
const gravityDirection = vec3(0, -1, 0)

// Buffers
const positionsBuffer = instancedArray(count, 'vec3')
const velocitiesBuffer = instancedArray(count, 'vec3')
const heatBuffer = instancedArray(count, 'float')

// Uniforms
const radius = uniform(0.5)
const gravityStrength = uniform(0.01)
const impactDamping = uniform(0.05)
const generalDamping = uniform(0.4)
const heatDamping = uniform(3)

const cylinderCenter = new THREE.Vector3(0, 0, 0)
const cylinderRadius = 2
const cylinderHalfHeight = 8

// uniforms of the bottle-cillinder
const cylinderRadiusUniform = uniform(cylinderRadius)
const cylinderCenterUniform = uniform(cylinderCenter)
const cylinderHalfHeightUniform = uniform(cylinderHalfHeight)
const heatImpactStrength = uniform(30)
const emissiveColor = uniform(color(0xff3f0f))

 
const cylinderGeometry = new THREE.CylinderGeometry(
    cylinderRadius,
    cylinderRadius,
    cylinderHalfHeight * 2,
    32
)

const cylinderMaterial = new THREE.MeshBasicMaterial({
    color: 0x0202020,
    wireframe: true
})

const cylinderMesh = new THREE.Mesh(
    cylinderGeometry,
    cylinderMaterial
)

cylinderMesh.position.copy(cylinderCenter)
scene.add(cylinderMesh)


// Computes
const initCompute = Fn(() => {
    const position = positionsBuffer.element(instanceIndex)
    // Cube volume positioning
    position.assign(vec3(
        hash(instanceIndex),
        hash(instanceIndex.add(12).mul(2)),
        hash(instanceIndex.add(23).mul(3))
    ).sub(0.5).mul(10))

})().compute(count)

renderer.compute(initCompute)


const updateCompute = Fn(() => {
    const clampedDeltaTime = deltaTime.min(1 / 30)

    // Buffers
    const aPosition = positionsBuffer.element(instanceIndex)
    const aVelocity = velocitiesBuffer.element(instanceIndex)
    const aHeat = heatBuffer.element(instanceIndex)

    // Apply gravity
    const gravityVelocity = gravityDirection.mul(gravityStrength).mul(clampedDeltaTime)
    aVelocity.addAssign(gravityVelocity)


      // Sphere-sphere collisions
    Loop({ start: instanceIndex.add(1), end: count, condition: '<', name: 'i' }, ({ i }) => {
        // Buffers
        const bPosition = positionsBuffer.element(i)
        const bVelocity = velocitiesBuffer.element(i)
        const bHeat = heatBuffer.element(i)

        // Distance between current sphere and other i spheres
        const delta = bPosition.sub(aPosition)
        const distance = delta.length()

        // max between distance and EPSILON to avoid division by zero
        const direction = delta.div(distance.max(EPSILON))

        // Is touching
        const radius2 = radius.mul(2)
        If(distance.lessThan(radius2), () => {
            // overmap is balls are crossing in each other, we need to move them apart
            // avoidance is the vector that will move the balls apart, we divide by 2 to move them equally
            const overlap = radius2.sub(distance)
            const avoidance = direction.mul(overlap.div(2))
            aPosition.subAssign(avoidance)
            bPosition.addAssign(avoidance)

            // direction is the normalised vector from a to b. so its already perfect direction for B
            //new direction for a is subtraction of previous velocity of this new one
            //relative velocity is the difference between the two velocities, we can use this to calculate the impact velocity - force of bounce between exact balls
            const relativeVelocity = aVelocity.sub(bVelocity)

            // dot shows here how the vectors are aligned from -1 to 1. it is used to calculate the strenght of the imact
            const impactStrength = dot(relativeVelocity, direction)
            //we put together force and the direction to get fianl impact
            //impact damping is for making the energy to fade 
            const impactVelocity = direction.mul(impactStrength).mul(impactDamping.oneMinus())
            aVelocity.subAssign(impactVelocity).mulAssign(generalDamping.mul(clampedDeltaTime).oneMinus())
            bVelocity.addAssign(impactVelocity)

            // Impact heat
            const heat = impactStrength.sub(0.01).max(0).mul(heatImpactStrength)
            aHeat.addAssign(heat).mulAssign(heatDamping.mul(clampedDeltaTime).oneMinus())
            bHeat.addAssign(heat)
        })
    })

    // Apply velocity - moving with speed in exact direction
    aPosition.addAssign(aVelocity)


    // CYLINDER COLLISION

    // relative position of the sphere to the center of the cylinder - how far is the center of the sphere from the center of the cylinder
    const relativePositionByCylinder = aPosition.sub(cylinderCenterUniform)
    // horizontal distance from the center of the cylinder to the sphere - how far is the sphere from the center of the cylinder in the xz plane
    const horizontalDistanceFromCenter = relativePositionByCylinder.xz.length()
    // maxRadialDistance  and maxVerticalDistance  are the maximum distances from the center of the cylinder to the sphere in the xz plane and y axis respectively, taking into account the radius of the sphere
    const maxRadialDistance  = cylinderRadiusUniform.sub(radius)
    const maxVerticalDistance  = cylinderHalfHeightUniform.sub(radius)
    const minVerticalDistance  = cylinderHalfHeightUniform.mul(-1).add(radius)
 
    // side collision
    If(
        //if in horisontal plane the distance of left/right is bigger than distance on the same height from the center
        horizontalDistanceFromCenter.greaterThan(maxRadialDistance ),
        () =>
        {
            const normal = relativePositionByCylinder.xz.normalize()
            const acceptableHorisontalPosition = normal.mul(maxRadialDistance )
            //move back the sphere to the acceptable position on the xz plane, keeping the y position the same
            aPosition.x.assign(cylinderCenterUniform.x.add(acceptableHorisontalPosition.x))
            aPosition.z.assign(cylinderCenterUniform.z.add(acceptableHorisontalPosition.y))

            //new velocity from the cylinder
            const velocityAgainstNormal = dot( aVelocity.xz, normal)
            const reflectedVelocity = aVelocity.xz.sub(normal.mul(velocityAgainstNormal.mul(2)))
            aVelocity.x.assign(reflectedVelocity.x)
            aVelocity.z.assign(reflectedVelocity.y)
        }
    )
 
        If(relativePositionByCylinder.y.lessThan(minVerticalDistance), () =>
        {
            // Put sphere back exactly on the bottom
            aPosition.y.assign(
                cylinderCenterUniform.y.add(minVerticalDistance)
            )

            // Bounce upward
            aVelocity.y.mulAssign(-1)
        })

})().compute(count)



const geometry = new THREE.IcosahedronGeometry(1, 2)
const material = new THREE.MeshLambertMaterial({ color: 0xffffff })


//Position
material.positionNode = Fn(() => {
    // Scale
    positionLocal.mulAssign(radius)

    // Translate
    positionLocal.addAssign(positionsBuffer.element(instanceIndex))

    return positionLocal
})()

// Emissive
const heat = heatBuffer.element(instanceIndex)
material.emissiveNode = emissiveColor.mul(heat)


const mesh = new THREE.Mesh(geometry, material)
mesh.castShadow = true
mesh.receiveShadow = true
mesh.frustumCulled = false
mesh.count = count

scene.add(mesh)




// Debug
const spheresGui = renderer.inspector.createParameters('Spheres')
spheresGui.add(radius, 'value', 0, 2.5, 0.001).name('radius')
spheresGui.add(gravityStrength, 'value', 0, 0.1, 0.001).name('gravityStrength')
// spheresGui.add(count, 'value', 0, 100, 1).name('count')
spheresGui.add(impactDamping, 'value', 0, 1, 0.001).name('impactDamping')
spheresGui.add(generalDamping, 'value', 0, 1, 0.01).name('generalDamping')
spheresGui.add(heatDamping, 'value', 0, 10, 0.1).name('heatDamping')
spheresGui.add(heatImpactStrength, 'value', 0, 100, 0.1).name('heatImpactStrength')
spheresGui.addColor(emissiveColor, 'value').name('emissiveColor')





/**
 * Post processing
 */
const renderPipeline = new THREE.RenderPipeline(renderer)
const scenePass = pass(scene, camera)
const scenePassColor = scenePass.getTextureNode('output')
const bloomPass = bloom(scenePassColor)
bloomPass.threshold.value = 0
bloomPass.strength.value = 0.15

renderPipeline.outputNode = scenePassColor.add(bloomPass)

const bloomGui = renderer.inspector.createParameters('Bloom').close()
bloomGui.add(bloomPass.threshold, 'value', 0, 2, 0.01).name('threshold')
bloomGui.add(bloomPass.strength, 'value', 0, 2, 0.01).name('strength')

/**
 * Lights
 */
const directionalLight = new THREE.DirectionalLight(0xffffff, 0.3)
directionalLight.castShadow = true
directionalLight.position.set(1, 1, 0.75).normalize().multiplyScalar(8)
directionalLight.shadow.camera.far = 16
directionalLight.shadow.camera.top = 8
directionalLight.shadow.camera.right = 8
directionalLight.shadow.camera.bottom = - 8
directionalLight.shadow.camera.left = - 8
directionalLight.shadow.mapSize.set(2048, 2048)
directionalLight.shadow.radius = 30
directionalLight.shadow.normalBias = -0.1
scene.add(directionalLight)

const cameraHelper = new THREE.CameraHelper(directionalLight.shadow.camera)
// scene.add(cameraHelper)

const ambientLight = new THREE.AmbientLight(0xe8b8ff, 0.08)
scene.add(ambientLight)

// Debug
const lightsGui = renderer.inspector.createParameters('Lights').close()

lightsGui.addColor(directionalLight, 'color').name('directionalColor')
lightsGui.add(directionalLight, 'intensity', 0, 5, 0.01).name('directionalIntensity')

lightsGui.addColor(ambientLight, 'color').name('ambientColor')
lightsGui.add(ambientLight, 'intensity', 0, 5, 0.01).name('ambientIntensity')





/**
 * Animate
 */
const tick = () => {
    // Update controls
    controls.update()

    // Computes
    renderer.compute(updateCompute)

    // Render
    renderPipeline.render()
}

renderer.setAnimationLoop(tick)
