import * as THREE from 'three/webgpu'

export const createLights = ({ scene,
    //  inspector
     }) => {
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.2)
    scene.add(ambientLight)

    const pointLight = new THREE.PointLight(0xffffff, 110, 0)
    pointLight.position.set(-7, 4, 6)
    scene.add(pointLight)

    const pointLight2 = new THREE.PointLight(0xffffff, 94, 100)
    pointLight2.position.set(5, 4, -25)
    scene.add(pointLight2)

    const backgroundLightLeft = new THREE.PointLight(0xffd2a8, 80, 110)
    backgroundLightLeft.position.set(-22, 10, -35)
    scene.add(backgroundLightLeft)

    const backgroundLightRight = new THREE.PointLight(0xbfd7ff, 70, 110)
    backgroundLightRight.position.set(22, 12, -38)
    scene.add(backgroundLightRight)

    const backgroundLightTop = new THREE.PointLight(0xffffff, 55, 90)
    backgroundLightTop.position.set(0, 20, -25)
    scene.add(backgroundLightTop)

    // const gui = inspector.createParameters('Lights').close()
    // gui.addColor(ambientLight, 'color').name('ambientColor')
    // gui.add(ambientLight, 'intensity', 0, 5, 0.01).name('ambientIntensity')
    // gui.addColor(pointLight, 'color').name('pointColor')
    // gui.add(pointLight, 'intensity', 0, 100, 1).name('pointIntensity')
    // gui.add(backgroundLightLeft, 'intensity', 0, 150, 1).name('backgroundLeft')
    // gui.add(backgroundLightRight, 'intensity', 0, 150, 1).name('backgroundRight')
    // gui.add(backgroundLightTop, 'intensity', 0, 150, 1).name('backgroundTop')

    return {
        ambientLight,
        pointLight,
        pointLight2,
        backgroundLightLeft,
        backgroundLightRight,
        backgroundLightTop
    }
}
