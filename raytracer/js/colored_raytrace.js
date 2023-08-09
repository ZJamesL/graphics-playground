//////////////////////////////////////////////////////////////////////////////
// Canvas Variables
//////////////////////////////////////////////////////////////////////////////
const canvas = document.getElementById("canvas1")
const canvasContext = canvas.getContext("2d");
const canvasBuffer = canvasContext.getImageData(0, 0, canvas.width, canvas.height)
const canvasRowPixelSize = canvasBuffer.width * 4 // size of 1 row of imageData array where 1 pixel is split into 4 datapoints 

// the scene object 
let scene = {
    spheres : [], 
    lights : []
}

/**
 * This creates sphere objects
 * Center - array in the format of [x, y, z]
 * color - array in the format of [r, g, b]
 * radius - integer value for the radius
 * specular - how shiny the object is 
 * reflective - how reflective an object is 
 */
let sphere = function(center, color, radius, specular, reflective){
    this.center = center;
    this.color = color;
    this.radius = radius;
    this.specular = specular;
    this.reflective = reflective;
}

/**
 * This creates light objects
 * parameters:
 *      type: type of light -> point, ambient, directional
 *      intensity: 3 intensities of light for rgb, 0.0 to 1.0
 *      direction: direction of the light, array of 3 components (used by point and directional)
 *      position: position of the light, array of 3 components (used by point light)
 */
let light = function(type, intensity, position = null, direction = null) {
    this.type = type;
    this.intensity = intensity;
    if (position !== null){
        this.position = position;
    }
    if (direction !== null){
        this.direction = direction;
    }
}

// camera, distance to viewport, spheres objects
const camera = [0, 0, 0]
const projectionPlaneZ = 1
const viewportDimensions = 1
const backgroundColor = [100, 100, 100]
const spheres = [new sphere([0, -1, 3], [255, 255, 255], 1, 500, 0.2),
                 new sphere([-2, 0, 4], [255, 255, 255], 1, 500, 0.3),
                 new sphere([2, 0, 4], [255, 255, 255], 1, 10, 0.4), 
                 new sphere([0, -5001, 0], [255, 255, 255], 5000, 1000, 0.5)]

const lights = [new light('ambient', [0.1, 0.1, 0.4]),
                new light('point', [0.2, 0.4, 0.1], [2, 1, -10]),
                new light('directional', [0.0, 0.0, 0.0], null, [1, 4, 4])]
scene.lights = lights
scene.spheres = spheres


/**
 * Converts the coordinate system where the origin (0,0) is in the
 * middle to actual canvas coordinate system where the origin is 
 * at the top left  
 */
function coordinateConversion(x, y) {
    return [canvas.width/2 + x, 
            canvas.height/2 - y - 1]
}

/**
 * This draws a single pixel onto the canvas
 * Parameters:
 *      x - x coordinate
 *      y - y coordinate
 *      color - the color to draw
 */
function drawPixel(x, y, color) {
    // convert coorindates
    xy = coordinateConversion(x, y)
    x = xy[0]
    y = xy[1]

    // check if valid 
    if (!( x >= 0 && x <= canvas.width && y >= 0 && y <= canvas.height )){
        return
    }

    // offset gives us the offset into the 1d array of rgba pixel data for the 
    // data image object
    let offset = 4 * x + canvasRowPixelSize * y
    canvasBuffer.data[offset++] = color[0]
    canvasBuffer.data[offset++] = color[1]
    canvasBuffer.data[offset++] = color[2]
    canvasBuffer.data[offset++] = 255 // full alpha
}

// gets the vector between the viewport point and canvas
function canvasToViewport(x, y){
    //return [(x - camera[0]) / canvas.width, (y - camera[1]) / canvas.height, 1]
    return [x * viewportDimensions / canvas.width,
            y * viewportDimensions / canvas.height,
            projectionPlaneZ]
}

/**
 * Traces the path of a ray to see what sphere it intersects with, if any. 
 * Returns the 2 solutions to the quadratic equation derived from the 
 * "Ray Meets Sphere" section of Gabriel Gambetta's book. 
 * parameters: 
 *      O - Camara position
 *      D - vector between camera and point on viewpoint
 *      sphere - sphere intersected with
 */
function intersectRaySphere(O, D, sphere){
    let r = sphere.radius
    let CO = vecSub(O, sphere.center)
    let a = dotProduct(D, D)
    let b = 2 * dotProduct(CO, D)
    let c = dotProduct(CO, CO) - r*r

    discriminant = b * b - 4 * a * c
    if (discriminant < 0){
        return [Infinity, Infinity]
    }

    let t1 = (-b + Math.sqrt(discriminant)) / (2*a)
    let t2 = (-b - Math.sqrt(discriminant)) / (2*a)
    return [t1, t2]
}

/**
 * Computes the reflection of a ray R with respect to 
 * a normal N
 * parameters:
 *      R - the ray 
 *      N - normal of the surface 
 */
function reflectRay (R, N){
    return vecSub(vecScalarMult(N, 2 * dotProduct(N, R)), R)  
}

/**
 * Computes the closest intersection with a sphere for a given ray
 * D. 
 * parameters 
 *      O - starting point 
 *      D - the ray we are using to find intersections
 *      tMin - the minimum factor of the parameter t 
 *      tMax - the maximum factor the the parameter t 
 * returns: array --> [closestSphere, closestT]
 */
function closestIntersection(O, D, tMin, tMax) {
    // set up the variables that hold the closest sphere and the closest 
    // intersection 
    let closestT = Infinity
    let closestSphere = null
    // iterate through each of the spheres and see if the ray, D, we sent 
    // out from the camera, O, intersects with any of them
    for (let sphere of scene.spheres){
        // intersection function gives us an array of 2 answers to 
        // the closest 
        ts = intersectRaySphere(O, D, sphere)
        if ( ts[0] != null && (ts[0] >= tMin && ts[0] < tMax) && ts[0] < closestT ) {
            closestT  = ts[0]
            closestSphere = sphere
        }
        if ( ts[1] != null && (ts[1] > tMin && ts[1] < tMax) && ts[1] < closestT ) {
            closestT  = ts[1]
            closestSphere = sphere
        }
    }
    return [closestSphere, closestT]
}


/**
 * Computes the intensity of light on a single pixel. It loops 
 * through all of the available light sources in the scene and 
 * checks how light interacts with the pixel and returns the 
 * intensity factor for that pixel. 
 * parameters:
 *      P - the point that we are on 
 *      N - the normal of the surface of the sphere at point P
 *      v - the viewing vector aka the vector from the point to the viewer
 *      s - the specular factor
 */
function computeLighting(P, N, V, s){
    let r = 0.0
    let g = 0.0
    let b = 0.0
    for (let light of scene.lights){
        if (light.type === 'ambient'){
            r += light.intensity[0]
            g += light.intensity[1]
            b += light.intensity[2]
        } else {
            let L;
            if (light.type === 'point') { 
                L = vecSub(light.position, P)
            } else { // for directional lights
                L = light.direction
            }

            // check for shadows
            let [closestSphere, closestT] = closestIntersection(P, L, 0.000001, Infinity)
            if ( closestSphere !== null ){
                continue;
            }

            // diffuse
            // get the dot product of N and L for the final calculation 
            // and check to see if it is negative
            let nlDotProduct = dotProduct(N, L)
            if (nlDotProduct > 0){
                right = ( nlDotProduct / (magnitude(N) * magnitude(L) ) )
                r += light.intensity[0] * right
                g += light.intensity[1] * right
                b += light.intensity[2] * right
            }

            // specular
            if (s !== -1) {
                let R = reflectRay(L, N)
                let rDotV = dotProduct(R, V)
                if (rDotV > 0) {
                    x = Math.pow(rDotV / (magnitude(R) * magnitude(V)), s)
                    r += light.intensity[0] * right
                    g += light.intensity[1] * right
                    b += light.intensity[2] * right
                }
            }
        }
    }
    return [r, g, b]
}

/**
 * Traces the path of a ray to see what it intersects with. Returns the color 
 * of whatever it intersects with. Returns the background color if it hits 
 * nothing
 * parameters: 
 *      O - Camara position
 *      D - vector between camera and point on viewpoint
 *      tMin - minimum render distance 
 *      tMax - maximum render distance 
 *      recursionDepth - the depth of recursion
 */
function traceRay(O, D, tMin, tMax, recursionDepth){
    // set up the variables that hold the closest sphere and the closest 
    // intersection, then run the closestIntersection variable
    let [closestSphere, closestT] = closestIntersection(O, D, tMin, tMax)
    if (closestSphere == null){
        return backgroundColor
    }
    // calculate the intersection point of the ray and the sphere 
    let P = vecAdd(O, vecScalarMult(D, closestT))
    // calculate the normal of the surface of the sphere at point P and normalize it 
    let N = vecSub(P, closestSphere.center)
    N = vecDivision(N, magnitude(N))
    let RGBintensityFactors = computeLighting(P, N, [-D[0], -D[1], -D[2]], closestSphere.specular)
    let localRColor = closestSphere.color[0] * RGBintensityFactors[0]
    let localGColor = closestSphere.color[1] * RGBintensityFactors[1]
    let localBColor = closestSphere.color[2] * RGBintensityFactors[2]

    // if we hit the recursion limit or the object is non reflective then we are done 
    r = closestSphere.reflective
    if (r <= 0 || recursionDepth <= 0){
        return [localRColor, localGColor, localBColor]
    }

    // compute the reflected color 
    let R = reflectRay([-D[0], -D[1], -D[2]], N)
    let reflectedColors = traceRay(P, R, 0.00001, Infinity, recursionDepth - 1)
    
    // compute the weighted average for each color and return that 
    let rWeightedAve =  ( localRColor * (1-r) ) + (reflectedColors[0] * r)
    let gWeightedAve =  ( localGColor * (1-r) ) + (reflectedColors[1] * r)
    let bWeightedAve =  ( localBColor * (1-r) ) + (reflectedColors[2] * r)
    return [rWeightedAve, gWeightedAve, bWeightedAve]
}

function updateCanvas(){
    canvasContext.putImageData(canvasBuffer, 0, 0)
}


//////////////////////////////////////////////////////////////////////////////
// The main loop
//////////////////////////////////////////////////////////////////////////////
function main(){
    for (let x = -canvas.width/2; x < canvas.width/2; x++){
        for (let y = -canvas.height/2; y < canvas.height/2; y++){
            let D = canvasToViewport(x, y)
            let color = traceRay(camera, D, 1, Infinity, 1)
            drawPixel(x, y, color)
        }
    }
    updateCanvas()
}

main()