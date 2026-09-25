import * as THREE from 'three/webgpu'
import { playGrunt } from './playGrunt.js'

const MESSAGES = [
    'It is written: “DO NOT OPEN. ”',
    'Hey! I said: DO NOT OPEN!'
]

export const createCorkInteraction = ({
    canvas,
    camera,
    bottle,
    onExplosion
}) => {
    const cork = bottle.getObjectByName('Cork')

    if (!cork) {
        console.warn('The bottle model has no "Cork"')
        return { dispose: () => {} }
    }

    const cursor = new THREE.Vector2()
    const raycaster = new THREE.Raycaster()
    let clickCount = 0

    const handleClick = (event) => {
        if (event.button !== 0) {
            return
        }

        const bounds = canvas.getBoundingClientRect()
        cursor.x = ((event.clientX - bounds.left) / bounds.width) * 2 - 1
        cursor.y = - ((event.clientY - bounds.top) / bounds.height) * 2 + 1

        bottle.updateMatrixWorld(true)
        raycaster.setFromCamera(cursor, camera)

        if (raycaster.intersectObject(cork, true).length === 0) {
            return
        }

        if (clickCount < MESSAGES.length) {
            const subtitle = document.querySelector('.subtitle')
            const message = MESSAGES[clickCount]

            subtitle.textContent = message
            clickCount++

            playGrunt()

            setTimeout(() => {
                if (subtitle.textContent === message) {
                    subtitle.textContent = ''
                }
            }, 1500)

            return
        }

        if (clickCount === MESSAGES.length) {
            clickCount++
            onExplosion()
        }
    }

    canvas.addEventListener('click', handleClick)

    return {
        dispose: () => {
            canvas.removeEventListener('click', handleClick)
        }
    }
}
