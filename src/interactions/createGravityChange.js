import * as THREE from 'three/webgpu'
import { playGrunt } from './playGrunt.js'

const MESSAGES = [
    'What the hell is this? I can feel the gravity changing!',
    'This is not normal! The gravity is shifting!',
    'I can feel the gravity changing! Stop it!',
    'The gravity is fluctuating! This is dangerous!',
    'I can feel the gravity shifting! This is not safe!',
    'I hate you. Really.',
    "You are menace to my lab."
]

export const createGravityChange = ({
    canvas,
    onGravity
}) => {
    let isHandlingdoubleClick = false

    const handleDoubleClick = (event) => {
        if (isHandlingdoubleClick) return

        console.log('Double click')
        event.preventDefault()
        isHandlingdoubleClick = true
        onGravity()
        playGrunt()
        document.querySelector('.subtitle-center').textContent = MESSAGES[Math.floor(Math.random() * MESSAGES.length)]
        setTimeout(() => {
            document.querySelector('.subtitle-center').textContent = ''
            isHandlingdoubleClick = false
        }, 1500)
    }

    canvas.addEventListener('dblclick', handleDoubleClick)

    return {
        dispose: () => {
            canvas.removeEventListener('dblclick', handleDoubleClick)
        }
    }
}