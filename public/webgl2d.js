export class Webgl2D {
  constructor(gl, fragmentShader, uniforms) {
    this._gl = gl;
    gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
    gl.clearColor(0, 0, 0, 0);
    const vertexShader = `
      attribute vec4 aVertex;
      varying vec2 vPosition;
      void main() {
        vPosition = vec2((aVertex.x + 1.0)/2.0, (-aVertex.y + 1.0)/2.0);
        gl_Position = aVertex;
      }
    `;
    this._program = this._buildShaderProgram(vertexShader, fragmentShader);
    this._uniforms = this._processUniforms(uniforms);
    this._vertexAttrLocation = gl.getAttribLocation(this._program, "aVertex");
    this._vertexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this._vertexBuffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, 1, 1, 1, 1, -1, -1, 1, 1, -1, -1, -1]),
      gl.STATIC_DRAW
    );
  }

  _buildShaderProgram(vertexShader, fragmentShader) {
    const gl = this._gl;
    const program = gl.createProgram();
    gl.attachShader(
      program,
      this._compileShader(vertexShader, gl.VERTEX_SHADER)
    );
    gl.attachShader(
      program,
      this._compileShader(fragmentShader, gl.FRAGMENT_SHADER)
    );
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      throw new Error(
        "Error linking shader program: " + gl.getProgramInfoLog(program)
      );
    }
    return program;
  }

  _compileShader(code, type) {
    const gl = this._gl;
    const shader = gl.createShader(type);
    gl.shaderSource(shader, code);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      throw new Error(
        `Error compiling ${
          type === gl.VERTEX_SHADER ? "vertex" : "fragment"
        } shader: ${gl.getShaderInfoLog(shader)}`
      );
    }
    return shader;
  }

  _processUniforms(uniforms) {
    const result = {};
    var textureCounter = 0;
    for (let name in uniforms) {
      let { type, value } = uniforms[name];
      let location = this._gl.getUniformLocation(this._program, name);
      if (type == "sampler2D") {
        let textureSlot = textureCounter++;
        result[name] = {
          location,
          texture: this._createTexture(value, textureSlot),
          textureSlot,
        };
      } else {
        result[name] = {
          location,
          type,
          value,
        };
      }
    }
    return result;
  }

  _createTexture(data, textureSlot) {
    if (!data) return null;
    const gl = this._gl;
    const texture = gl.createTexture();
    gl.activeTexture(gl.TEXTURE0 + textureSlot);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    if (data instanceof Image) {
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, data);
    } else {
      gl.texImage2D(
        gl.TEXTURE_2D,
        0,
        data.format,
        data.width,
        data.height,
        0,
        data.format,
        data.type,
        data.data
      );
    }
    return texture;
  }

  clear() {
    const gl = this._gl;
    gl.clear(gl.COLOR_BUFFER_BIT);
  }

  draw(data) {
    const gl = this._gl;
    gl.useProgram(this._program);

    gl.bindBuffer(gl.ARRAY_BUFFER, this._vertexBuffer);
    gl.enableVertexAttribArray(this._vertexAttrLocation);
    gl.vertexAttribPointer(this._vertexAttrLocation, 2, gl.FLOAT, false, 0, 0);

    for (let name in this._uniforms) {
      if ("texture" in this._uniforms[name]) {
        let { location, texture, textureSlot } = this._uniforms[name];
        if (location == null) continue;
        if (name in data) {
          texture = this._createTexture(data[name], textureSlot);
        }
        if (!texture) continue;
        gl.uniform1i(location, textureSlot);
      } else {
        let { location, type, value } = this._uniforms[name];
        if (location == null) continue;
        if (name in data) {
          value = data[name];
        }
        if (!value) continue;
        let uniformFnName = {
          float: "uniform1f",
          vec2: "uniform2fv",
          vec3: "uniform3fv",
          vec4: "uniform4fv",
        }[type];
        if (!uniformFnName) continue;
        gl[uniformFnName](location, value);
      }
    }

    gl.drawArrays(gl.TRIANGLES, 0, 6);
  }
}
