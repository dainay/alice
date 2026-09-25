import { createExperience } from './core/createExperience.js'
import { createBottleDrag } from './interactions/createBottleDrag.js'
import { createCorkInteraction } from './interactions/createCorkInteraction.js'
import { createLights } from './lighting/createLights.js'
import { loadModels } from './models/loadModels.js'
import { createParticleSystem } from './particles/createParticleSystem.js'
import { createPostProcessing } from './rendering/createPostProcessing.js'
// import { createReflection } from './lighting/createReflection.js'
import { createRadiusRandom } from './interactions/createRadiusRandom.js'
import { createGravityChange } from './interactions/createGravityChange.js'
import { playClickSound } from './interactions/playClickSound.js'

const canvas = document.querySelector('canvas.threejs')

if (!canvas) {
    throw new Error('Canvas .threejs was not found')
}

const { scene, camera, controls, renderer, inspector } = await createExperience(canvas)
const { bottle, tableHeight } = await loadModels(scene)


document.querySelector('.canvas-wrapper').classList.add('fading-in')

const particles = createParticleSystem({
    renderer,
    scene,
    inspector,
    initialContainerPosition: bottle.position
})


const bottleDrag = createBottleDrag({
    canvas,
    camera,
    controls,
    bottle,
    minimumY: tableHeight,
    onBottleMove: particles.setContainerPosition,
    onCursorMove: particles.setCursor,
    onExplosion: particles.explode
})

createCorkInteraction({
    canvas,
    camera,
    bottle,
    onExplosion: particles.explode
})

createRadiusRandom({
    canvas,
    onRadius: particles.radiusRandom
})

createGravityChange({
    canvas,
    onGravity: particles.gravityChange
})
  playClickSound()

// createReflection({ scene, renderer })

const postProcessing = createPostProcessing({
    renderer,
    scene,
    camera,
    // inspector
})

createLights({ 
    scene,
    //  inspector
     })

const tick = () => {
    controls.update()
    bottleDrag.update()
    particles.update() 
    postProcessing.render()
    
}

renderer.setAnimationLoop(tick)
