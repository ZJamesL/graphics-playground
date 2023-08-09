//////////////////////////////////////////////////////////////////////////////
// Canvas Variables
//////////////////////////////////////////////////////////////////////////////
const canvas = document.getElementById("canvas1")
const canvas_context = canvas.getContext("2d");
const canvas_buffer = canvas_context.getImageData(0, 0, canvas.width, canvas.height)
const canvas_row_pixel_size = canvas_buffer.width * 4 // size of 1 row of imageData array where 1 pixel is split into 4 datapoints 

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
 *      intensity: intensity of the light, 0.0 to 1.0
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
const projection_plane_z = 1
const viewport_dimensions = 1
const background_color = [0, 0, 0]
const spheres = [new sphere([0, -1, 3], [255, 0, 0], 1, 500, 0.2),
                 new sphere([-2, 0, 4], [0, 0, 255], 1, 500, 0.3),
                 new sphere([2, 0, 4], [0, 255, 0], 1, 10, 0.4), 
                 new sphere([0, -5001, 0], [255, 255, 0], 5000, 1000, 0.5)]

const lights = [new light('ambient', 0.2),
                new light('point', 0.6, [2, 1, 0]),
                new light('directional', 0.2, null, [1, 4, 4]),]
scene.lights = lights
scene.spheres = spheres


/**
 * Converts the coordinate system where the origin (0,0) is in the
 * middle to actual canvas coordinate system where the origin is 
 * at the top left  
 */
function coordinate_conversion(x, y) {
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
function draw_pixel(x, y, color) {
    // convert coorindates
    xy = coordinate_conversion(x, y)
    x = xy[0]
    y = xy[1]

    // check if valid 
    if (!( x >= 0 && x <= canvas.width && y >= 0 && y <= canvas.height )){
        return
    }

    // offset gives us the offset into the 1d array of rgba pixel data for the 
    // data image object
    let offset = 4 * x + canvas_row_pixel_size * y
    canvas_buffer.data[offset++] = color[0]
    canvas_buffer.data[offset++] = color[1]
    canvas_buffer.data[offset++] = color[2]
    canvas_buffer.data[offset++] = 255 // full alpha
}

// gets the vector between the viewport point and canvas
function canvas_to_viewport(x, y){
    //return [(x - camera[0]) / canvas.width, (y - camera[1]) / canvas.height, 1]
    return [x * viewport_dimensions / canvas.width,
            y * viewport_dimensions / canvas.height,
            projection_plane_z]
}

//////////////////////////////////////////////////////////////////////////////
// Linear algebra operations
//////////////////////////////////////////////////////////////////////////////
/**
 * Gets the dot product of 2 vectors with 3 components 
 * Parameters:
 *      a - first 3d vector
 *      b - second 3d vector
 */
function dot_product(a, b){
    return [a[0] * b[0] + a[1] * b[1] + a[2] * b[2]]
}

/**
 * subtracts two 3 component vectors
 * Parameters: 
 *      a - first 3d vector
 *      b - second 3d vector  
 */
function vec_subtraction(a, b){
    return [a[0] - b[0], a[1] - b[1], a[2] - b[2]]
}

/**
 * subtracts scalar from 3 component vector
 * Parameters: 
 *      a - first 3d vector
 *      b - second 3d vector  
 */
function vec_scalar_subtraction(vec, scalar){
    return [vec[0] - scalar, vec[1] - scalar , vec[2] - scalar]
}

/**
 * adds 2 vectors 
 * parameters: 
 *      a - first 3d vector 
 *      b - second 3d vector
 */
function vec_addition(a, b) {
    return [a[0] + b[0], a[1] + b[1], a[2] + b[2]]
}

/**
 * multiplies a given vector by a scalar
 * parameters:
 *      vec - vector scalar is applied to 
 *      scalar - scalar of the vector
 */
function vec_scalar_mult(vec, scalar){
    return [scalar * vec[0], scalar * vec[1], scalar * vec[2]]
}

/**
 * divides a vector by a scalar
 * parameters:
 *      vec - the vector being divided
 *      scalar - the scalar to be applied
 */
function vec_division(vec, scalar) {
    return [vec[0] / scalar, vec[1] / scalar, vec[2] / scalar]
}


/**
 * Takes in a 3 component vector and returns the magnitude the vector
 * Parameters: 
 *      vec - the vector
 */
function magnitude(vec){
    return Math.sqrt(vec[0] ** 2 + vec[1] ** 2 + vec[2] ** 2)
}

/**
 * Traces the path of a ray to see what sphere it intersects with, if any. 
 * Returns the 2 solutions to the quadratic equation derived from the 
 * "Ray Meets Sphere" section of Gabriel Gambetta's book. 
 * parameters: 
 *      O - Camara position
 *      D - vector between camera and point on viewpoint
 *      t_min - minimum render distance 
 *      t_max - maximum render distance 
 */
function intersect_ray_sphere(O, D, sphere){
    let r = sphere.radius
    let CO = vec_subtraction(O, sphere.center)
    let a = dot_product(D, D)
    let b = 2 * dot_product(CO, D)
    let c = dot_product(CO, CO) - r*r

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
    return vec_subtraction(vec_scalar_mult(N, 2 * dot_product(N, R)), R)  
}

/**
 * Computes the closest intersection with a sphere for a given ray
 * D. 
 * parameters 
 *      O - starting point 
 *      D - the ray we are using to find intersections
 *      t_min - the minimum factor of the parameter t 
 *      t_max - the maximum factor the the parameter t 
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
        ts = intersect_ray_sphere(O, D, sphere)
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
function compute_lighting(P, N, V, s){
    let i = 0.0
    for (let light of scene.lights){
        if (light.type === 'ambient'){
            i += light.intensity
        } else {
            let L;
            if (light.type === 'point') { 
                L = vec_subtraction(light.position, P)
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
            nl_dot_product = dot_product(N, L)
            if (nl_dot_product > 0){
                i += light.intensity * ( nl_dot_product / (magnitude(N) * magnitude(L) ) )
            }

            // specular
            if (s !== -1) {
                let R = reflectRay(L, N)
                let r_dot_v = dot_product(R, V)
                if (r_dot_v > 0) {
                    i += light.intensity * Math.pow(r_dot_v / (magnitude(R) * magnitude(V)), s)
                }
            }
        }
    }
    return i
}

/**
 * Traces the path of a ray to see what it intersects with. Returns the color 
 * of whatever it intersects with. Returns the background color if it hits 
 * nothing
 * parameters: 
 *      O - Camara position
 *      D - vector between camera and point on viewpoint
 *      t_min - minimum render distance 
 *      t_max - maximum render distance 
 *      recursion_depth - the depth of recursion
 */
function trace_ray(O, D, t_min, t_max, recursion_depth){
    // set up the variables that hold the closest sphere and the closest 
    // intersection, then run the closestIntersection variable
    let [closestSphere, closestT] = closestIntersection(O, D, t_min, t_max)
    if (closestSphere == null){
        return background_color
    }
    // calculate the intersection point of the ray and the sphere 
    let P = vec_addition(O, vec_scalar_mult(D, closestT))
    // calculate the normal of the surface of the sphere at point P and normalize it 
    let N = vec_subtraction(P, closestSphere.center)
    N = vec_division(N, magnitude(N))
    let intensityFactor = compute_lighting(P, N, [-D[0], -D[1], -D[2]], closestSphere.specular)
    let localColor = vec_scalar_mult(closestSphere.color, intensityFactor)

    // if we hit the recursion limit or the object is non reflective then we are done 
    r = closestSphere.reflective
    if (r <= 0 || recursion_depth <= 0){
        return localColor
    }

    // compute the reflected color 
    let R = reflectRay([-D[0], -D[1], -D[2]], N)
    let reflectedColor = trace_ray(P, R, 0.00001, Infinity, recursion_depth - 1)
    
    // compute the weighted average and return that 
    let x = vec_scalar_mult(localColor, (1-r))
    let y = vec_scalar_mult(reflectedColor, r)
    let weightedAve = vec_addition(x, y)
    return weightedAve
}

function update_canvas(){
    canvas_context.putImageData(canvas_buffer, 0, 0)
}


//////////////////////////////////////////////////////////////////////////////
// The main loop
//////////////////////////////////////////////////////////////////////////////
function main(){
    for (let x = -canvas.width/2; x < canvas.width/2; x++){
        for (let y = -canvas.height/2; y < canvas.height/2; y++){
            let D = canvas_to_viewport(x, y)
            let color = trace_ray(camera, D, 1, Infinity, 3)
            draw_pixel(x, y, color)
        }
    }
    update_canvas()
}

main()