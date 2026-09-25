import * as THREE from 'three/webgpu'
import {
    EPSILON,
    Fn,
    If,
    Loop,
    color,
    deltaTime,
    dot,
    hash,
    hue,
    instanceIndex,
    instancedArray,
    positionLocal,
    uniform,
    vec3,
    time
} from 'three/tsl'

import ExplotionSound from '../assets/explotion.mp3'
import DisSound from '../assets/dis.mp3'

const PARTICLE_COUNT = 2000
const CYLINDER_RADIUS = 3
const CYLINDER_HALF_HEIGHT = 3
const CYLINDER_OFFSET = new THREE.Vector3(0, 3.5, 0)
const EXPLOSION_RADIUS = 5.0
const RADIUS = 0.1

const createState = (initialContainerPosition) => {
    const cylinderCenter = new THREE.Vector3()
        .copy(initialContainerPosition)
        .add(CYLINDER_OFFSET)

    return {
        count: PARTICLE_COUNT,
        positions: instancedArray(PARTICLE_COUNT, 'vec3'),
        velocities: instancedArray(PARTICLE_COUNT, 'vec3'),
        heat: instancedArray(PARTICLE_COUNT, 'float'),
        radius: uniform(RADIUS),
        gravityStrength: uniform(0.5),
        impactDamping: uniform(0.6),
        generalDamping: uniform(0.2),
        heatDamping: uniform(10),
        heatImpactStrength: uniform(17),
        particlesColor: uniform(color(0x52807c)),
        emissiveColor: uniform(color(0x955fb9)),
        cursorPosition: uniform(vec3()),
        cursorVelocity: uniform(vec3()),
        cursorRadius: uniform(1),
        cursorStrength: uniform(0.7),
        cylinderCenter,
        cylinderCenterUniform: uniform(cylinderCenter),
        cylinderRadiusUniform: uniform(CYLINDER_RADIUS),
        cylinderHalfHeightUniform: uniform(CYLINDER_HALF_HEIGHT)
    }
}

const createInitCompute = (state) => Fn(() => {
    const position = state.positions.element(instanceIndex)

    position.assign(vec3(
        hash(instanceIndex),
        hash(instanceIndex.add(12).mul(2)),
        hash(instanceIndex.add(23).mul(3))
    ).sub(0.5).mul(10))
})().compute(state.count)

const createUpdateCompute = (state) => {
    const gravityDirection = vec3(0, -1, 0)

    return Fn(() => {
        const clampedDeltaTime = deltaTime.min(1 / 30)

        const aPosition = state.positions.element(instanceIndex)
        const aVelocity = state.velocities.element(instanceIndex)
        const aHeat = state.heat.element(instanceIndex)

        const cursorDistance = aPosition.distance(state.cursorPosition)
        const cursorDistanceRatio = cursorDistance.div(state.cursorRadius).oneMinus().max(0)
        const cursorForce = state.cursorVelocity
            .mul(cursorDistanceRatio)
            .mul(state.cursorStrength)
        aVelocity.addAssign(cursorForce)

        const gravityVelocity = gravityDirection
            .mul(state.gravityStrength)
            .mul(clampedDeltaTime)
        aVelocity.addAssign(gravityVelocity)

        Loop({ start: instanceIndex.add(1), end: state.count, condition: '<', name: 'i' }, ({ i }) => {
            const bPosition = state.positions.element(i)
            const bVelocity = state.velocities.element(i)
            const bHeat = state.heat.element(i)

            const delta = bPosition.sub(aPosition)
            const distance = delta.length()
            const direction = delta.div(distance.max(EPSILON))
            const diameter = state.radius.mul(2) 

            If(distance.lessThan(diameter), () => {
                const overlap = diameter.sub(distance)
                const avoidance = direction.mul(overlap.div(2))
                aPosition.subAssign(avoidance)
                bPosition.addAssign(avoidance)

                const relativeVelocity = aVelocity.sub(bVelocity)
                const impactStrength = dot(relativeVelocity, direction)
                const impactVelocity = direction
                    .mul(impactStrength)
                    .mul(state.impactDamping.oneMinus())

                aVelocity
                    .subAssign(impactVelocity)
                    .mulAssign(state.generalDamping.mul(clampedDeltaTime).oneMinus())
                bVelocity.addAssign(impactVelocity)

                const newHeat = impactStrength
                    .sub(0.01)
                    .max(0)
                    .mul(state.heatImpactStrength)
                aHeat
                    .addAssign(newHeat)
                    .mulAssign(state.heatDamping.mul(clampedDeltaTime).oneMinus())
                bHeat.addAssign(newHeat)
            })
        })

        aPosition.addAssign(aVelocity)

        const relativePosition = aPosition.sub(state.cylinderCenterUniform)
        const horizontalDistance = relativePosition.xz.length()
        const maxRadialDistance = state.cylinderRadiusUniform.sub(state.radius)
        const maxVerticalDistance = state.cylinderHalfHeightUniform.sub(state.radius)
        const minVerticalDistance = state.cylinderHalfHeightUniform.mul(-1).add(state.radius)

        If(horizontalDistance.greaterThan(maxRadialDistance), () => {
            const normal = relativePosition.xz.normalize()
            const acceptablePosition = normal.mul(maxRadialDistance)

            aPosition.x.assign(state.cylinderCenterUniform.x.add(acceptablePosition.x))
            aPosition.z.assign(state.cylinderCenterUniform.z.add(acceptablePosition.y))

            const velocityAgainstNormal = dot(aVelocity.xz, normal)
            const reflectedVelocity = aVelocity.xz.sub(
                normal.mul(velocityAgainstNormal.mul(2))
            )
            aVelocity.x.assign(reflectedVelocity.x)
            aVelocity.z.assign(reflectedVelocity.y)
        })

        If(relativePosition.y.lessThan(minVerticalDistance), () => {
            aPosition.y.assign(
                state.cylinderCenterUniform.y.add(minVerticalDistance)
            )
            aVelocity.y.mulAssign(-1)
        })

        If(relativePosition.y.greaterThan(maxVerticalDistance), () => {
            aPosition.y.assign(
                state.cylinderCenterUniform.y.add(maxVerticalDistance)
            )
            aVelocity.y.mulAssign(-1)
        })

    })().compute(state.count)
}

const createParticleMesh = (state) => {
    const geometry = new THREE.IcosahedronGeometry(1, 1)
    const material = new THREE.MeshLambertMaterial({ color: state.particlesColor.value })
    material.colorNode = hue(state.particlesColor, time.mul(0.1))

    material.positionNode = Fn(() => {
        positionLocal.mulAssign(state.radius)
        positionLocal.addAssign(state.positions.element(instanceIndex))
        return positionLocal
    })()

    material.emissiveNode = hue(
        state.emissiveColor,
        time.mul(0.1)
    ).mul(
        state.heat.element(instanceIndex)
    )
    material.metalnessNode = 1
    material.roughnessNode = 0

    const mesh = new THREE.Mesh(geometry, material)
    mesh.castShadow = false
    mesh.receiveShadow = false
    mesh.frustumCulled = false
    mesh.count = state.count

    return mesh
}

// const addDebugControls = (inspector, state) => {
//     const gui = inspector.createParameters('Spheres')

//     gui.add(state.radius, 'value', 0, 2.5, 0.001).name('radius')
//     gui.add(state.gravityStrength, 'value', 0, 0.1, 0.001).name('gravityStrength')
//     gui.add(state.impactDamping, 'value', 0, 1, 0.001).name('impactDamping')
//     gui.add(state.generalDamping, 'value', 0, 1, 0.01).name('generalDamping')
//     gui.add(state.heatDamping, 'value', 0, 10, 0.1).name('heatDamping')
//     gui.add(state.heatImpactStrength, 'value', 0, 100, 0.1).name('heatImpactStrength')
//     gui.addColor(state.particlesColor, 'value').name('particlesColor')
//     gui.addColor(state.emissiveColor, 'value').name('emissiveColor')
//     gui.add(state.cursorRadius, 'value', 0, 5, 0.001).name('cursorRadius')
//     gui.add(state.cursorStrength, 'value', 0, 0.2, 0.001).name('cursorStrength')
// }

export const createParticleSystem = ({
    renderer,
    scene,
    // inspector,
    initialContainerPosition
}) => {
    const state = createState(initialContainerPosition)
    const initCompute = createInitCompute(state)
    const updateCompute = createUpdateCompute(state)
    const mesh = createParticleMesh(state)

    scene.add(mesh)
    // addDebugControls(inspector, state)
    renderer.compute(initCompute)

    return {
        mesh,
        update: () => renderer.compute(updateCompute),
        explode: () => {
            state.radius.value = EXPLOSION_RADIUS

            const canvas = document.querySelector('canvas.threejs')
            document.querySelector('.subtitle').textContent = 'Bravo... You exploded everything.'
            canvas.classList.add('is-exploding')

              const music = new Audio(ExplotionSound)
                music.loop = false
                music.volume = 0.4
                music.play()

                const dis = new Audio(DisSound)
                dis.loop = false
                dis.volume = 0.7
                dis.play()

            setTimeout(() => {
                canvas.classList.remove('is-exploding')
                canvas.classList.add('is-fading-out')

                const reloadButton = document.createElement('button')
                reloadButton.classList.add('reload-button')
                reloadButton.textContent = 'New bottle'
                reloadButton.addEventListener('click', () => window.location.reload())
                document.body.appendChild(reloadButton)
            }, 3000)
        },
        setContainerPosition: (position) => {
            state.cylinderCenter.copy(position).add(CYLINDER_OFFSET)
        },
        radiusRandom: (radius) => {
            state.radius.value = Math.random() * (0.32 - 0.042)
            document.body.classList.add('flash')
            setTimeout(() => {
                document.body.classList.remove('flash')
            }, 100)
        },
        gravityChange: () => {
            const gravities = [-1, 0, 0.5, 10]
            state.gravityStrength.value = gravities[Math.floor(Math.random() * gravities.length)]
            document.body.classList.add('flash')
            setTimeout(() => {
                document.body.classList.remove('flash')
            }, 100)
        },
        setCursor: (position, velocity) => {
            state.cursorPosition.value.copy(position)
            state.cursorVelocity.value.copy(velocity)
        }
    }
}
