import clickSoundUrl from '../assets/click.mp3'

export const playClickSound = () => {
    const playNext = () => {
        const sound = new Audio(clickSoundUrl)

        sound.volume = 0.1 + Math.random() * 0.3
        sound.playbackRate = 0.9 + Math.random() * 0.3

        sound.play()

        const delay = 20 + Math.random() * 500

        setTimeout(playNext, delay)
    }

    playNext()
}