// canvas variables 
const canvas = document.getElementById("canvas")
const context = canvas.getContext("2d");

// camera, distance to viewport, spheres objects
const camera = [0, 0, 0]
const d = 1
const viewport_dimensions = d
const background_color = [255, 255, 255]
spheres = []


/**
 * Center - array in the format of [x, y, z]
 * color - array in the format of [r, g, b]
 * radius - integer value for the radius
 */
function sphere_maker(center, color, radius){
    let sphere = {
        center : center, 
        radius : radius, 
        color : color
    }
    return sphere
}
spheres = [sphere_maker([0, -1, 3], [255, 0, 0],1),
           sphere_maker([2, 0, 4], [0, 0, 255], 1),
           sphere_maker([-2, 0, 2], [0, 255, 0], 1)]

/**
 * Converts the coordinate system where the origin (0,0) is in the
 * middle to actual canvas coordinate system where the origin is 
 * at the top left  
 */
function canvas_coords_to_viewport_coords(x, y) {
    return [canvas.width/2 + x, canvas.height/2 - y]
}

// draws a single pixel on the canvas with 1 color
function draw_pixel(x, y, color) {
    // convert coorindates
    xy = canvas_coords_to_viewport_coords(x, y)
    x = xy[0]
    y = xy[1]

    // check if valid 
    if (!( x >= 0 && x <= canvas.width && y >= 0 && y <= canvas.height )){
        return
    }
    context.fillStyle = `rgb(${color[0]}, ${color[1]}, ${color[2]})`;
    context.fillRect(x, y, 1, 1)
}

// gets the vector between the viewport point and canvas
function canvas_to_viewport(x, y){
    //return [(x - camera[0]) / canvas.width, (y - camera[1]) / canvas.height, 1]
    return [x * viewport_dimensions / canvas.width, y * viewport_dimensions / canvas.height, d]
}

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
    r = sphere.radius
    CO = vec_subtraction(O, sphere.center)
    a = dot_product(D, D)
    b = 2 * dot_product(CO, D)
    c = dot_product(CO, CO) - r*r

    discriminant = b * b - 4 * a * c
    if (discriminant < 0){
        return [Infinity, Infinity]
    }

    t1 = (-b + Math.sqrt(discriminant)) / (2*a)
    t2 = (-b - Math.sqrt(discriminant)) / (2*a)
    return [t1, t2]
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
 */
function trace_ray(O, D, t_min, t_max){
    let closest_t = Infinity
    let closest_sphere = null
    for (let sphere of spheres){
        ts = intersect_ray_sphere(O, D, sphere)
        if ( ts[0] != null && (ts[0] >= t_min && ts[0] < t_max) && ts[0] < closest_t ) {
            closest_t = ts[0]
            closest_sphere = sphere
        }
        if ( ts[1] != null && (ts[1] > t_min && ts[1] < t_max) && ts[1] < closest_t ) {
            closest_t = ts[0]
            closest_sphere = sphere
        }
    }
    if (closest_sphere == null){
        return background_color
    }
    return closest_sphere.color
}


function main(){
    console.log('234234')
    for (let x = -canvas.width/2; x < canvas.width/2; x++){
        for (let y = -canvas.height/2; y < canvas.height/2; y++){
            let D = canvas_to_viewport(x, y)
            let color = trace_ray(camera, D, 1, Infinity)
            draw_pixel(x, y, color)
        }
    }
}

main()