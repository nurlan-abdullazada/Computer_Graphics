main();

function NormToDevice(coord, axisSize) {
	var halfAxisSize = axisSize / 2;

	var deviceCoord = (coord + 1) * halfAxisSize;

	return deviceCoord;
}

function DeviceToNorm(coord, axisSize) {
	var halfAxisSize = axisSize / 2;

	var normaCoord = (coord / halfAxisSize) - 1;

	return normaCoord;
}

function main() {
	const canvas = document.querySelector("#gl_canv");

	var camera_object = new Camera(canvas);

	const gl = canvas.getContext("webgl");

	if (!gl) {
		alert("Computer does not support it.");

		return;
	}

	var vertices = [
		// X, Y, Z         U, V
		// Top
		-1.0, 1.0, -1.0, 0, 0,
		-1.0, 1.0, 1.0, 0, 1,
		1.0, 1.0, 1.0, 1, 1,
		1.0, 1.0, -1.0, 1, 0,

		// Left
		-1.0, 1.0, 1.0, 0, 0,
		-1.0, -1.0, 1.0, 1, 0,
		-1.0, -1.0, -1.0, 1, 1,
		-1.0, 1.0, -1.0, 0, 1,

		// Right
		1.0, 1.0, 1.0, 1, 1,
		1.0, -1.0, 1.0, 0, 1,
		1.0, -1.0, -1.0, 0, 0,
		1.0, 1.0, -1.0, 1, 0,

		// Front
		1.0, 1.0, 1.0, 1, 1,
		1.0, -1.0, 1.0, 1, 0,
		-1.0, -1.0, 1.0, 0, 0,
		-1.0, 1.0, 1.0, 0, 1,

		// Back
		1.0, 1.0, -1.0, 0, 0,
		1.0, -1.0, -1.0, 0, 1,
		-1.0, -1.0, -1.0, 1, 1,
		-1.0, 1.0, -1.0, 1, 0,

		// Bottom
		-1.0, -1.0, -1.0, 1, 1,
		-1.0, -1.0, 1.0, 1, 0,
		1.0, -1.0, 1.0, 0, 0,
		1.0, -1.0, -1.0, 0, 1,
	];

	var indices = [
		// Top
		0, 1, 2,
		0, 2, 3,

		// Left
		5, 4, 6,
		6, 4, 7,

		// Right
		8, 9, 10,
		8, 10, 11,

		// Front
		13, 12, 14,
		15, 14, 12,

		// Back
		16, 17, 18,
		16, 18, 19,

		// Bottom
		21, 20, 22,
		22, 20, 23
	];



	var vertexBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);

	var indexBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
	gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);



	// Unbind the buffer
	// gl.bindBuffer( gl.ELEMENT_ARRAY_BUFFER, null );


	var vertex_code =
		[
			'precision mediump float;',

			'attribute vec3 position;',

			'uniform mat4 Pmatrix;',
			'uniform mat4 Vmatrix;',
			'uniform mat4 Mmatrix;',

			'attribute vec2 texture_coord;',
			'attribute vec3 vertex_normal;',

			'varying vec3 vColor;',
			'varying vec2 v_texture_coord;',
			'varying vec3 frag_normal;',

			'void main()',
			'{',
			'v_texture_coord = texture_coord;',
			'frag_normal = (Mmatrix * vec4(vertex_normal, 0.0)).xyz;',
			'gl_Position = Pmatrix * Vmatrix * Mmatrix * vec4(position, 1.0);',
			'}'
		].join('\n');

	var vertex_shader = gl.createShader(gl.VERTEX_SHADER);

	gl.shaderSource(vertex_shader, vertex_code);

	gl.compileShader(vertex_shader);

	var fragment_code =
		[
			'precision mediump float;',

			'varying vec2 v_texture_coord;',

			// 'varying vec3 vColor',
			'struct directional_light',
			'{',
			'vec3 direction;',
			'vec3 color;',
			'};',

			'varying vec3 frag_normal;',
			'uniform vec3 ambient_light_intensity;',

			'uniform directional_light sun;',
			'uniform sampler2D sampler;',

			'void main()',
			'{',
			'vec3 surfaceNormal = normalize(frag_normal);',
			'vec3 normal_sun_direction = normalize(sun.direction);',
			'vec4 texel = texture2D(sampler, v_texture_coord);',
			'vec3 light_intensity = ambient_light_intensity + sun.color * max(dot(frag_normal, normal_sun_direction), 0.0);',
			'gl_FragColor = vec4(texel.rgb * light_intensity, texel.a);',
			'}'
		].join('\n');

	var fragment_shader = gl.createShader(gl.FRAGMENT_SHADER);

	gl.shaderSource(fragment_shader, fragment_code);

	gl.compileShader(fragment_shader);


	var shader_program = gl.createProgram();

	gl.attachShader(shader_program, vertex_shader);

	gl.attachShader(shader_program, fragment_shader);

	gl.linkProgram(shader_program);

	gl.useProgram(shader_program);



	/* Associating attributes to vertex shader */
	var Pmatrix = gl.getUniformLocation(shader_program, "Pmatrix");
	var Vmatrix = gl.getUniformLocation(shader_program, "Vmatrix");
	var Mmatrix = gl.getUniformLocation(shader_program, "Mmatrix");

	gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
	var position = gl.getAttribLocation(shader_program, 'position');
	gl.vertexAttribPointer(
		position, // Attribute location
		3, // Number of elements per attribute
		gl.FLOAT, // Type of elements
		false,
		5 * Float32Array.BYTES_PER_ELEMENT, // Size of an individual vertex
		0 // Offset from the beginning of a single vertex to this attribute
	);

	// Position Buffer Binding
	gl.enableVertexAttribArray(position);

	var texture = gl.getAttribLocation(shader_program, 'texture_coord');
	gl.vertexAttribPointer(
		texture, // Attribute location
		2, // Number of elements per attribute
		gl.FLOAT, // Type of elements
		gl.FALSE,
		5 * Float32Array.BYTES_PER_ELEMENT, // Size of an individual vertex
		3 * Float32Array.BYTES_PER_ELEMENT // Offset from the beginning of a single vertex to this attribute
	);


	gl.enableVertexAttribArray(texture);

	gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
	var normalAttribLocation = gl.getAttribLocation(shader_program, 'vertex_normal');
	gl.vertexAttribPointer(
		normalAttribLocation, // Attribute location
		3, // Number of elements per attribute
		gl.FLOAT, // Type of elements
		gl.TRUE,
		3 * Float32Array.BYTES_PER_ELEMENT,
		0
	);
	gl.enableVertexAttribArray(normalAttribLocation);

	// Create texture
	var box_texture = gl.createTexture();
	gl.bindTexture(gl.TEXTURE_2D, box_texture);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
	gl.texImage2D(
		gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA,
		gl.UNSIGNED_BYTE,
		document.getElementById('light_wood')
	);
	gl.bindTexture(gl.TEXTURE_2D, null);



	gl.useProgram(shader_program);

	var ambient_uniform_location = gl.getUniformLocation(shader_program, 'ambient_light_intensity');
	var sunlight_direction_uniform_location = gl.getUniformLocation(shader_program, 'sun.direction');
	var sunlight_color_uniform_location = gl.getUniformLocation(shader_program, 'sun.color');

	gl.uniform3f(ambient_uniform_location, 1.0, 1.0, 0.0);
	gl.uniform3f(sunlight_direction_uniform_location, -1.0, 0.0, 0.0);
	gl.uniform3f(sunlight_color_uniform_location, 1.0, 1.0, 1.0);


	var movement_matrix = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
	var movement_matrix2 = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
	var movement_matrix3 = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
	var movement_matrix4 = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, -1, 0, 0, 0, 0, 1];

	var movement_matric = [];
	var movement_matric_position = [];

	for (i = 0; i < 100; i++) {
		movement_matric[i] = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
		movement_matric_position[i] = [0, 0, 0];
	}

	for (i = 0; i < 4; i++) {
		movement_matric_position[i][0] = Math.floor(Math.random() * 100) - 50;
		movement_matric_position[i][1] = Math.floor(Math.random() * 100) - 50;
		movement_matric_position[i][2] = Math.floor(Math.random() * 100) - 50;
	}

	var previous_time = 0;
	var animate = function (time) {
		movement_matrix[12] = 7;
		movement_matrix[13] = -6;
		movement_matrix[14] = -10;

		movement_matrix2[12] = 0;
		movement_matrix2[13] = 0;
		movement_matrix2[14] = 0;

		movement_matrix3[12] = 4;
		movement_matrix3[13] = 7;
		movement_matrix3[14] = 10;

		movement_matrix4[12] = -20;
		movement_matrix4[13] = 10;
		movement_matrix4[14] = 40;

		for (i = 0; i < 4; i++) {
			movement_matric[i][12] = movement_matric_position[i][0];
			movement_matric[i][13] = movement_matric_position[i][1];
			movement_matric[i][14] = movement_matric_position[i][2];

		}

		camera_object.update();
		var date_time = time - previous_time;

		camera_object.RotateZ(movement_matrix, date_time * 0.0003);
		camera_object.RotateY(movement_matrix, date_time * 0.0001);
		camera_object.RotateX(movement_matrix, date_time * 0.0006);

		camera_object.RotateZ(movement_matrix2, date_time * -0.0003);
		camera_object.RotateY(movement_matrix2, date_time * -0.0001);
		camera_object.RotateX(movement_matrix2, date_time * -0.0006);

		camera_object.RotateZ(movement_matrix3, date_time * 0.0003);
		camera_object.RotateY(movement_matrix3, date_time * 0.0006);
		camera_object.RotateX(movement_matrix3, date_time * 0.002);

		camera_object.RotateZ(movement_matrix4, date_time * -0.001);
		camera_object.RotateY(movement_matrix4, date_time * -0.0005);
		camera_object.RotateX(movement_matrix4, date_time * -0.0008);



		previous_time = time;



		gl.enable(gl.DEPTH_TEST);
		gl.depthFunc(gl.LEQUAL);
		gl.clearColor(0.7, 0.6, 0.5, 0.9);
		gl.clearDepth(1.0);

		gl.viewport(0.0, 0.0, canvas.width, canvas.height);
		gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

		gl.bindTexture(gl.TEXTURE_2D, box_texture);
		gl.activeTexture(gl.TEXTURE0);

		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);

		gl.uniformMatrix4fv(Pmatrix, false, projector_matrix);
		gl.uniformMatrix4fv(Vmatrix, false, view_matrix);
		gl.uniformMatrix4fv(Mmatrix, false, camera_object.update_mov_matrix(movement_matrix));
		gl.drawElements(gl.TRIANGLES, indices.length, gl.UNSIGNED_SHORT, 0);

		gl.uniformMatrix4fv(Pmatrix, false, projector_matrix);
		gl.uniformMatrix4fv(Vmatrix, false, view_matrix);
		gl.uniformMatrix4fv(Mmatrix, false, camera_object.update_mov_matrix(movement_matrix2));
		gl.drawElements(gl.TRIANGLES, indices.length, gl.UNSIGNED_SHORT, 0);

		gl.uniformMatrix4fv(Pmatrix, false, projector_matrix);
		gl.uniformMatrix4fv(Vmatrix, false, view_matrix);
		gl.uniformMatrix4fv(Mmatrix, false, camera_object.update_mov_matrix(movement_matrix3));
		gl.drawElements(gl.TRIANGLES, indices.length, gl.UNSIGNED_SHORT, 0);

		gl.uniformMatrix4fv(Pmatrix, false, projector_matrix);
		gl.uniformMatrix4fv(Vmatrix, false, view_matrix);
		gl.uniformMatrix4fv(Mmatrix, false, camera_object.update_mov_matrix(movement_matrix4));
		gl.drawElements(gl.TRIANGLES, indices.length, gl.UNSIGNED_SHORT, 0);

		for (i = 0; i < 100; i++) {
			gl.uniformMatrix4fv(Pmatrix, false, projector_matrix);
			gl.uniformMatrix4fv(Vmatrix, false, view_matrix);
			gl.uniformMatrix4fv(Mmatrix, false, camera_object.update_mov_matrix(movement_matric[i]));
			gl.drawElements(gl.TRIANGLES, indices.length, gl.UNSIGNED_SHORT, 0);
		}


		window.requestAnimationFrame(animate);

	}

	animate(0);
}