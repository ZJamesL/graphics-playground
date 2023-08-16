
//////////////////////////////////////////////////////////////////////////////
// Canvas Variables
//////////////////////////////////////////////////////////////////////////////
const canvas = document.getElementById("canvas1")
const canvasContext = canvas.getContext("2d");
const canvasBuffer = canvasContext.getImageData(0, 0, canvas.width, canvas.height)
const canvasRowPixelSize = canvasBuffer.width * 4 // size of 1 row of imageData array where 1 pixel is split into 4 datapoints 

// the scene object 
// TODO: make this a generic object and put it in objects.js 
// gotta figure out how I want to refactor my code. All object constructor
// in one place sounds kinda bad but having a different file for each category 
// of object (light, vec3, sphere, etc) sounds a bit excessive at this stage
let scene = {
    spheres : [],
    triangles : [], 
    lights : []
}


// camera, distance to viewport, spheres objects
const camera = new vec3(0, 0, 0)
const projectionPlaneZ = 1
const viewportDimensions = 1
const backgroundColor = new vec3(0, 0, 0)
const spheres = [//new sphere(new vec3(0, -1, 3), new vec3(255,   0, 255), 1, 500, 0.2),
                 new sphere(new vec3(-2, 0, 4), new vec3(  0, 255,   0), 1, 500, 0.3),
                 new sphere(new vec3( 2, 0, 4), new vec3(255,   0,   0), 1, 10, 0.4)] 
                 //new sphere([0, -5001, 0], [0, 255, 255], 5000, 1000, 0.5)]
                  
const lights = [new light('ambient',    new vec3(0.4, 0.4, 0.4) ),
                new light('point',       new vec3(0.7, 0.7, 0.7), new vec3(2, 1, -10)),
                new light('directional', new vec3(0.0, 0.0, 0.9), null, new vec3(1, 4, 4))]
const triangles = [new triangle([ new vec3(  2, -1,  6), 
                                  new vec3(  0,  2,  6), 
                                  new vec3( -2, -1,  6)], new vec3(0, 255, 0), 0.4, 0.8), 
                   new triangle([ new vec3(  2, -1,  0), 
                                  new vec3(  0, -1, 20), 
                                  new vec3( -2, -1,  0)], new vec3(255, 0, 255), 0.4, 0.8)]
scene.lights = lights;
scene.spheres = spheres;
scene.triangles = triangles; 


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
    canvasBuffer.data[offset++] = color.x
    canvasBuffer.data[offset++] = color.y
    canvasBuffer.data[offset++] = color.z
    canvasBuffer.data[offset++] = 255 // full alpha
}

// gets the vector between the viewport point and canvas
function canvasToViewport(x, y){
    //return [(x - camera[0]) / canvas.width, (y - camera[1]) / canvas.height, 1]
    return new vec3(x * viewportDimensions / canvas.width,
            y * viewportDimensions / canvas.height,
            projectionPlaneZ);
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
 * Traces the path of a ray to see what sphere it intersects with, if any. 
 * Returns the 2 solutions to the quadratic equation derived from the 
 * "Ray Meets Sphere" section of Gabriel Gambetta's book. 
 * parameters: 
 *      O - Camara position
 *      D - vector between camera and point on viewpoint
 *      tri - triangle being checked with
 */
function intersectRayTriangle(O, D, tri){
    // // first test to see the ray D is parallel to the tri 
    // let normalizedD = normalize(D);
    // let normalizedTriNor = normalize(tri.normal);
    // let parallelTest = dotProduct(tri.normal, D)
    // if (parallelTest === 0){
    //     // TODO: modify code so it handles tris on plane test 
    //     return Infinity;
    // } 
    // calculate the intersection  
    let numerator = dotProduct(vecSub(tri.points[0], O), tri.normal);
    let denominator = dotProduct(D, tri.normal)
    if (denominator === 0) {
        return Infinity;
    }
    let t = numerator / denominator; 
    if (t < 0 ) {
        return Infinity;
    }
    // now test to see if the point is in the triangle using barycentric coorindates
    let intersectPoint = vecAdd(O, vecScalarMult(D, t));
    let AB = vecSub(tri.points[1], tri.points[0]);
    let AC = vecSub(tri.points[2], tri.points[0]);
    let PA = vecSub(tri.points[0], intersectPoint);
    let PB = vecSub(tri.points[1], intersectPoint);
    let PC = vecSub(tri.points[2], intersectPoint);

    let areaABC = magnitude(crossProduct(AB, AC)) / 2// multiplied by 2
    let areaCPB = magnitude(crossProduct(PB, PC)) 
    let alpha = areaCPB / (areaABC * 2);
    let areaAPC = magnitude(crossProduct(PC, PA)) 
    let beta  = areaAPC / (areaABC * 2);
    let areaAPB = magnitude(crossProduct(PB, PA))
    let gamma = areaAPB / (areaABC * 2);
    let weightSum = alpha + beta + gamma 
    // note: I believe floating point numbers may lead to some inaccuracy here 
    // that is why I am skipping the alpha + beta + gamma === 1 check here for now 
    if ( ( 0 <= alpha && alpha <= 1 ) && 
         ( 0 <= beta  && beta  <= 1 ) && 
         ( 0 <= gamma && gamma <= 1 ) && 
         ( weightSum >= .99999 && weightSum <= 1.0001 )){
        return t;
    } 
    // failure: return inifinity 
    return Infinity; 
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
 * D. Then parameter anyIntersection is set to true then it just checks 
 * for any intersection
 * parameters 
 *      O - starting point 
 *      D - the ray we are using to find intersections
 *      tMin - the minimum factor of the parameter t 
 *      tMax - the maximum factor the the parameter t 
 *      anyIntersectio - boolean that when set to true changes 
 *          logic of this function to return a boolean if there 
 *          is any intersection at all. 
 * returns: array --> [closestSphere, closestT]
 */
function closestIntersection(O, D, tMin, tMax, anyIntersection) {
    // set up the variables that hold the closest sphere and the closest 
    // intersection 
    let closestT = Infinity
    let closestObject = null
    // iterate through each of the spheres and see if the ray, D, we sent 
    // out from the camera, O, intersects with any of them
    for (let sphere of scene.spheres){
        // intersection function gives us an array of 2 answers to 
        // the closest 
        ts = intersectRaySphere(O, D, sphere)
        if ( (ts[0] >= tMin && ts[0] < tMax) && ts[0] < closestT ) {
            closestT  = ts[0]
            closestObject = sphere
        }
        if ( (ts[1] >= tMin && ts[1] < tMax) && ts[1] < closestT ) {
            closestT  = ts[1]
            closestObject = sphere
        }
        if (anyIntersection && closestObject !== null){
            return true
        }
    }

    // check for triangle intersections
    for (let tri of scene.triangles){ 
        t = intersectRayTriangle(O, D, tri);
        if ( (t >= tMin && t < tMax) && t < closestT ) {
            closestT  = t
            closestObject = tri
        }
        if (anyIntersection && closestObject !== null){
            return true
        }
    }
    
    // reaching here means there was no intersection 
    if (anyIntersection){
        return false
    }
    return [closestObject, closestT]
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
            r += light.intensity.x
            g += light.intensity.y
            b += light.intensity.z
        } else {
            let L;
            if (light.type === 'point') { 
                L = vecSub(light.position, P)
            } else { // for directional lights
                L = light.direction
            }

            // check for shadows
            let anyIntersection = closestIntersection(P, L, 0.000001, Infinity, true)
            if (anyIntersection){
                continue;
            }

            // diffuse
            // get the dot product of N and L for the final calculation 
            // and check to see if it is negative
            let nlDotProduct = dotProduct(N, L)
            if (nlDotProduct > 0){
                right = ( nlDotProduct / (magnitude(N) * magnitude(L) ) )
                r += light.intensity.x * right
                g += light.intensity.y * right
                b += light.intensity.z * right
            }

            // specular
            if (s !== -1) {
                let R = reflectRay(L, N)
                let rDotV = dotProduct(R, V)
                if (rDotV > 0) {
                    spec = Math.pow(rDotV / (magnitude(R) * magnitude(V)), s)
                    r += light.intensity.x * spec
                    g += light.intensity.y * spec
                    b += light.intensity.z * spec
                }
            }
        }
    }
    return new vec3(r, g, b)
}

/**
 * Traces the path of a ray to see what it intersects with. Returns the color 
 * of whatever it intersects with. Returns the background color if it hits 
 * nothing
 * parameters: 
 *      O - Camara position
 *      D - vec3 aka vector between camera and point on viewpoint
 *      tMin - minimum render distance 
 *      tMax - maximum render distance 
 *      recursionDepth - the depth of recursion
 */
function traceRay(O, D, tMin, tMax, recursionDepth, x, y){
    // set up the variables that hold the closest sphere and the closest 
    // intersection, then run the closestIntersection variable
    let [closestObject, closestT] = closestIntersection(O, D, tMin, tMax);
    if (closestObject === null){
        return backgroundColor
    }
    // calculate the intersection point of the ray and the sphere 
    let P = vecAdd(O, vecScalarMult(D, closestT))
    // calculate the normal of the surface of the sphere at point P and normalize it
    let N;
    if (closestObject.hasOwnProperty('center')){
        N = vecSub(P, closestObject.center);
        N = normalize(N);
    } else {
        N = closestObject.normal;
    }
    
    let RGBintensityFactors = computeLighting(P, N, new vec3(-D.x, -D.y, -D.z), closestObject.specular);
    let localRColor = closestObject.color.x * RGBintensityFactors.x;
    let localGColor = closestObject.color.y * RGBintensityFactors.y;
    let localBColor = closestObject.color.z * RGBintensityFactors.z;
    
    // if we hit the recursion limit or the object is non reflective then we are done 
    let r = closestObject.reflective;
    if (r <= 0 || recursionDepth <= 0){
        return new vec3(localRColor, localGColor, localBColor);
    }

    // compute the reflected color 
    let R = reflectRay(new vec3(-D.x, -D.y, -D.z), N);
    let reflectedColors = traceRay(P, R, 0.00001, Infinity, recursionDepth - 1);
    // compute the weighted average for each color and return that 
    let rWeightedAve =  ( localRColor * (1-r) ) + (reflectedColors.x * r);
    let gWeightedAve =  ( localGColor * (1-r) ) + (reflectedColors.y * r);
    let bWeightedAve =  ( localBColor * (1-r) ) + (reflectedColors.z * r);

    return new vec3(rWeightedAve, gWeightedAve, bWeightedAve);
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
            let D = canvasToViewport(x, y);
            let color = traceRay(camera, D, 1, Infinity, 1, x, y);
            drawPixel(x, y, color)
        }
    }
    updateCanvas()
}

main()