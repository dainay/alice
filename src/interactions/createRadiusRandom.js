import * as THREE from 'three/webgpu'
import { playGrunt } from './playGrunt.js'

const MESSAGES = [
    'Stop playing with my equipment!',
    'Hey! Get off!',
    'DO. NOT. TOUCH. ANYTHING.',
    'I saw that.',
    'Seriously?',
    'Hands. Off.',
    'That is not a toy.',
    'Do you mind?',
    'Can you not?',
    'I am watching you.',
    'You again?',
    'Leave it alone!',
    'Why are you like this?',
    'That was expensive.',
    'Put. It. Back.',
    'Absolutely not.',
    'Nope.',
    'Wrong button.',
    'Very funny.',
    'Are you done?',
    'Do I need to lock this?',
    'You have zero self-control.',
    'Touch it again. I dare you.',
    'I said don’t touch it.',
    'This is why we can’t have nice things.',
    'Congratulations. You annoyed me.',
    'Was the warning unclear?',
    'Pretend you never saw that.',
    'Step away from the equipment.',
    'Your curiosity is becoming a problem.',
    'There are literally other things to click.',
    'How many times are we going to do this?',
    'I’m adding a lock.',
    'You’re enjoying this way too much.',
    'That button did nothing. Probably.',
    'If it explodes, I’m blaming you.',
    'Great. Now it knows you’re here.',
    'You really pressed it again?',
    'Some people read warning labels.',
    'That sound was probably normal.',
    'Please stop discovering things.',
    'I specifically hid that from you.',
    'That was not an invitation.',
    'You have been officially warned.',
    'Bold of you to assume that was safe.',
    'Don’t make me unplug the whole thing.',
    'One more click and I’m calling security.',
    'I’m starting to regret giving you a cursor.',
    'The equipment has feelings too.',
    'Excellent. You found the dangerous part.',
    'I was hoping you wouldn’t notice that.',
    'Nothing good happens after the third click.',
    'You’re testing my patience, not the equipment.',
    'This interaction is no longer educational.',
    'Curiosity killed the rendering budget.',
    'Please return to being a passive observer.',
    'Why is “don’t touch” so difficult?',
    'I can literally see your mouse.',
    'That’s enough science for today.',
    'Stop poking the simulation.',
    'The particles are filing a complaint.',
    'Do not antagonize the particles.',
    'They remember what you did.',
    'You’re making them nervous.',
    'Great. Now the particles are angry.',
    'That was definitely not calibrated for this.',
    'You’ve voided the imaginary warranty.',
    'Please stop stress-testing my patience.',
    'I knew adding interactivity was a mistake.',
    'You were supposed to admire it, not attack it.',
]

export const createRadiusRandom = ({
    canvas,
    onRadius
}) => {
    let isHandlingRightClick = false

    const handleRightClick = (event) => {
        if (isHandlingRightClick) return

        console.log('Right click')
        event.preventDefault()
        isHandlingRightClick = true
        onRadius()
        playGrunt()
        document.querySelector('.subtitle-center').textContent = MESSAGES[Math.floor(Math.random() * MESSAGES.length)]
        setTimeout(() => {
            document.querySelector('.subtitle-center').textContent = ''
            isHandlingRightClick = false
        }, 1000)
    }

    canvas.addEventListener('contextmenu', handleRightClick)

    return {
        dispose: () => {
            canvas.removeEventListener('contextmenu', handleRightClick)
        }
    }
}