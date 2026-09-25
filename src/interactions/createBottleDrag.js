import * as THREE from 'three/webgpu'


export const createBottleDrag = ({
    canvas,
    camera,
    controls,
    bottle,
    minimumY,
    onBottleMove = () => { },
    onCursorMove = () => { },
    onExplosion = () => { }
}) => {
    let isDragging = false
    let activePointerId = null
    let explosionTimeout = null

    const cursor = new THREE.Vector2()
    const raycaster = new THREE.Raycaster()

    const dragOffset = new THREE.Vector3()
    const dragIntersection = new THREE.Vector3()
    const desiredPosition = new THREE.Vector3()

    const cursorIntersection = new THREE.Vector3()
    const previousCursorPosition = new THREE.Vector3()
    const cursorVelocity = new THREE.Vector3()

    const cameraDirection = new THREE.Vector3()
    const sceneOrigin = new THREE.Vector3()
    const dragPlane = new THREE.Plane()
    const cursorPlane = new THREE.Plane()

    const updateCursor = (event) => {
        const bounds = canvas.getBoundingClientRect()

        cursor.x = ((event.clientX - bounds.left) / bounds.width) * 2 - 1
        cursor.y = - ((event.clientY - bounds.top) / bounds.height) * 2 + 1
    }

    const startDragging = (event) => {
        updateCursor(event)
        raycaster.setFromCamera(cursor, camera)

        if (raycaster.intersectObject(bottle, true).length === 0) {
            return
        }

        camera.getWorldDirection(cameraDirection)
        dragPlane.setFromNormalAndCoplanarPoint(cameraDirection, bottle.position)

        if (!raycaster.ray.intersectPlane(dragPlane, dragIntersection)) {
            return
        }

        isDragging = true
        explosionTimeout = window.setTimeout(() => {
            if (isDragging && onExplosion) {
                onExplosion()
            } 
        }, 5000)

        activePointerId = event.pointerId
        controls.enabled = false
        canvas.setPointerCapture(event.pointerId)

        dragOffset.copy(bottle.position).sub(dragIntersection)

    }

    const stopDragging = (event) => {
        if (
            activePointerId !== null &&
            event.pointerId !== undefined &&
            event.pointerId !== activePointerId
        ) {
            return
        }

        if (activePointerId !== null && canvas.hasPointerCapture(activePointerId)) {
            canvas.releasePointerCapture(activePointerId)
        }

        isDragging = false
        activePointerId = null
        controls.enabled = true

        window.clearTimeout(explosionTimeout)
        explosionTimeout = null
    }

    const update = () => {
        raycaster.setFromCamera(cursor, camera)
        camera.getWorldDirection(cameraDirection)
        cursorPlane.setFromNormalAndCoplanarPoint(cameraDirection, sceneOrigin)

        if (raycaster.ray.intersectPlane(cursorPlane, cursorIntersection)) {
            cursorVelocity.copy(cursorIntersection).sub(previousCursorPosition)
            previousCursorPosition.copy(cursorIntersection)
            onCursorMove(previousCursorPosition, cursorVelocity)
        }

        if (!isDragging || !raycaster.ray.intersectPlane(dragPlane, dragIntersection)) {
            return
        }

        desiredPosition.copy(dragIntersection).add(dragOffset)
        desiredPosition.y = Math.max(desiredPosition.y, minimumY)
        bottle.position.copy(desiredPosition)
        onBottleMove(bottle.position)
    }

    window.addEventListener('pointermove', updateCursor)
    canvas.addEventListener('pointerdown', startDragging)
    window.addEventListener('pointerup', stopDragging)
    window.addEventListener('pointercancel', stopDragging)
    window.addEventListener('blur', stopDragging)

    return {
        update,
        dispose: () => {
            window.removeEventListener('pointermove', updateCursor)
            canvas.removeEventListener('pointerdown', startDragging)
            window.removeEventListener('pointerup', stopDragging)
            window.removeEventListener('pointercancel', stopDragging)
            window.removeEventListener('blur', stopDragging)
        }
    }
}
