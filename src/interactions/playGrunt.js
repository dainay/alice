import GruntSound from '../assets/grunt.mp3'
import GruntSound1 from '../assets/grunt1.mp3'
import GruntSound2 from '../assets/grunt2.mp3'
import GruntSound3 from '../assets/grunt3.mp3'



export const playGrunt = () => {
    const gruntSounds = [GruntSound, GruntSound1, GruntSound2, GruntSound3]
    const randomIndex = Math.floor(Math.random() * gruntSounds.length)
    const GruntSoundChoosen = gruntSounds[randomIndex]

    const music = new Audio(GruntSoundChoosen)
    console.log('playGrunt')
    music.loop = false
    music.volume = 1
    music.currentTime = 0
    music.play()
}