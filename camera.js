"use strict";

var projector_matrix;
var view_matrix = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
const movSpeed = 0.05;

var mov_cycles_z_forward = 0;
var mov_cycles_z_backward = 0;

var mov_cycles_x_Left = 0;
var mov_cycles_x_right = 0;

var previous_mouse_x = null;
var previous_mouse_y = null;


var last_x = 400, last_y = 300;

var yaw = 0, pitch = 0;

// Converts from degrees to radians.
Math.radians = function (degrees) {
    return degrees * Math.PI / 180;
};

// Converts from radians to degrees.
Math.degrees = function (radians) {
    return radians * 180 / Math.PI;
};

class Camera {
    constructor(canvas) {
        projector_matrix = this.GetProjection(40, canvas.width / canvas.height, 1, 100);

        const bodyElement = document.querySelector("body");

        bodyElement.addEventListener("keydown", this.process_keyboard_input.bind(this), false);
        bodyElement.addEventListener("keyup", this.process_keyboard_input.bind(this), false);

        bodyElement.addEventListener("mousedown", this.process_mouse_input.bind(this), false);
        bodyElement.addEventListener("mousemove", this.process_mouse_input.bind(this), false);
        bodyElement.addEventListener("mouseup", this.process_mouse_input.bind(this), false);
        bodyElement.addEventListener("wheel", this.process_mouse_input.bind(this), false);
    }

    update_mov_matrix(matrix) {
        matrix[12] += view_matrix[12] * 2;
        matrix[13] += view_matrix[13] * 2;
        matrix[14] += view_matrix[14] * 2;

        return matrix;
    }

    update() {
        if (mov_cycles_z_forward > 0) {
            view_matrix[14] += movSpeed;
            mov_cycles_z_forward--;
        }

        if (mov_cycles_z_backward > 0) {
            view_matrix[14] -= movSpeed;
            mov_cycles_z_backward--;
        }

        if (mov_cycles_x_Left > 0) {
            view_matrix[12] += movSpeed;
            mov_cycles_x_Left--;
        }

        if (mov_cycles_x_right > 0) {
            view_matrix[12] -= movSpeed;
            mov_cycles_x_right--;
        }
    }

    move(event) {
        if ("ArrowUp" === event.key) {
            if (mov_cycles_z_forward === 0) {
                mov_cycles_z_forward += 30;
            }
            else if (mov_cycles_z_forward < 20) {
                mov_cycles_z_forward += 10;
            }
        }
        else if ("ArrowDown" === event.key) {
            if (mov_cycles_z_backward === 0) {
                mov_cycles_z_backward += 30;
            }
            else if (mov_cycles_z_backward < 20) {
                mov_cycles_z_backward += 10;
            }
        }

        if ("ArrowLeft" === event.key) {
            if (mov_cycles_x_Left === 0) {
                mov_cycles_x_Left += 30;
            }
            else if (mov_cycles_x_Left < 20) {
                mov_cycles_x_Left += 10;
            }
        }
        else if ("ArrowRight" === event.key) {
            if (mov_cycles_x_right === 0) {
                mov_cycles_x_right += 30;
            }
            else if (mov_cycles_x_right < 20) {
                mov_cycles_x_right += 10;
            }
        }
    }

    scroll(event) {
        // move the camera forwards and backwards using the mouse wheel
        if (event.wheelDeltaY) {
            view_matrix[14] += 0.005 * event.wheelDeltaY;
        }
    }

    process_keyboard_input(event) {

        this.move(event);
    }

    process_mouse_input(event) {
        var xoffset = event.clientX - last_x;
        var yoffset = last_y - event.clientY;
        last_x = event.clientX;
        last_y = event.clientY;

        var sensitivity = 0.007;
        xoffset *= sensitivity;
        yoffset *= sensitivity;

        yaw += xoffset;
        pitch += yoffset;

        if (event.ctrlKey) {
            var current_v_m_pos_x = view_matrix[12];
            var current_v_m_pos_y = view_matrix[13];
            var current_v_m_pos_z = view_matrix[14];

            if (null === previous_mouse_x) {
                previous_mouse_x = event.clientX;
            }

            if (null === previous_mouse_y) {
                previous_mouse_y = event.clientY;
            }

            if (event.clientX < previous_mouse_x) // left
            {

                this.RotateY(view_matrix, -0.1);
            }
            else if (event.clientX > previous_mouse_x) // right
            {

                this.RotateY(view_matrix, 0.1);
            }

            if (event.clientY < previous_mouse_y) // up
            {

                this.RotateX(view_matrix, -0.1);
            }
            else if (event.clientY > previous_mouse_y) // down
            {

                this.RotateX(view_matrix, 0.1);
            }

            previous_mouse_x = event.clientX;
            previous_mouse_y = event.clientY;

            view_matrix[12] = current_v_m_pos_x;
            view_matrix[13] = current_v_m_pos_y;
            view_matrix[14] = current_v_m_pos_z;
        }
    }

    GetProjection(angle, a, zMin, zMax) {
        var ang = Math.tan((angle * 0.5) * Math.PI / 180);

        return [
            0.5 / ang, 0, 0, 0,
            0, 0.5 * a / ang, 0, 0,
            0, 0, - (zMax + zMin) / (zMax - zMin), -1,
            0, 0, (-2 * zMax * zMin) / (zMax - zMin), 0
        ];
    }

    RotateX(m, angle) {
        var c = Math.cos(angle);
        var s = Math.sin(angle);
        var mv1 = m[1], mv5 = m[5], mv9 = m[9];

        m[1] = m[1] * c - m[2] * s;
        m[5] = m[5] * c - m[6] * s;
        m[9] = m[9] * c - m[10] * s;

        m[2] = m[2] * c + mv1 * s;
        m[6] = m[6] * c + mv5 * s;
        m[10] = m[10] * c + mv9 * s;
    }

    RotateY(m, angle) {
        var c = Math.cos(angle);
        var s = Math.sin(angle);
        var mv0 = m[0], mv4 = m[4], mv8 = m[8];

        m[0] = c * m[0] + s * m[2];
        m[4] = c * m[4] + s * m[6];
        m[8] = c * m[8] + s * m[10];

        m[2] = c * m[2] - s * mv0;
        m[6] = c * m[6] - s * mv4;
        m[10] = c * m[10] - s * mv8;
    }

    RotateZ(m, angle) {
        var c = Math.cos(angle);
        var s = Math.sin(angle);
        var mv0 = m[0], mv4 = m[4], mv8 = m[8];

        m[0] = c * m[0] - s * m[1];
        m[4] = c * m[4] - s * m[5];
        m[8] = c * m[8] - s * m[9];

        m[1] = c * m[1] + s * mv0;
        m[5] = c * m[5] + s * mv4;
        m[9] = c * m[9] + s * mv8;
    }
}