
/**
 * Module dependencies.
 */

var Buffer = require('buffer').Buffer;
var inherits = require('util').inherits;
var Transform = require('readable-stream').Transform;

/**
 * Expose `Parser`.
 */

module.exports = Parser;

/**
 * Create a new `Parser`.
 *
 * @return {Parser}
 * @api public
 */

function Parser () {
  if (!(this instanceof Parser)) return new Parser();

  Transform.call(this, {
    objectMode : true
  });

  this.steps = [];
  this.idx = 0;
  this.res = {};
  this.offset = 0;
  this.buf = null;
}

inherits(Parser, Transform);

/**
 * Transform callback.
 *
 * @param {Buffer} chunk
 * @param {String} encoding
 * @param {Function} done
 * @api private
 */

Parser.prototype._transform = function (chunk, encoding, done) {
  if (this.buf) {
    chunk = Buffer.concat([this.buf, chunk]);
    this.buf = null;
  }

  while (true) {
    var broken = false;
    for (var i = 0; i < this.steps.length; i++) {
      var step = this.steps[i];
      if (this.idx == i) {
        var stepLength;
        
        if (typeof step.length === 'number') {
          stepLength = step.length;
        } else if (typeof step.length === 'string') {
          stepLength = this.res[step.length];
        } else if (typeof step.chunkLength == 'number') {
          if (typeof step.iterations === 'number') {
            stepLength = step.iterations * step.chunkLength;
          } else if (typeof step.iterations === 'string') {
            stepLength = this.res[step.iterations] * step.chunkLength;
          }
        }

        if (chunk.length < stepLength + this.offset) {
          broken = true;
          break;
        }

        this.res[step.name] = step.fn.apply(this.res, [chunk, this.offset]);
        this.offset += stepLength;
        this.idx++;
      }

      if (i === this.steps.length - 1) {
        this.push(this.res);
        this.res = {};
        this.idx = 0;
      }
    }
    if (broken) break;
  }

  if (chunk.length != this.offset) {
    var dif = Math.abs(chunk.length - this.offset);
    this.buf = new Buffer(dif);
    chunk.copy(this.buf, 0, chunk.length - dif);
  }

  this.offset = 0;

  done();
};

/**
 * Register a parser function.
 *
 * @param {String} name
 * @param {Number|String} length
 * @param {Function} fn
 * @return {Parser}
 * @api public
 */

Parser.prototype.next = function (name, length, fn) {
  this.steps.push({ name : name, length : length, fn : fn });
  return this;
};

/**
 * Loop `length` times and save in `name` what `fn` registers.
 *
 * @param {String} name
 * @param {Number|String} length
 * @param {Function} fn
 * @return {Parser}
 * @api public
 */

Parser.prototype.loop = function (name, length, fn) {
  // Get static chunk length
  var parse = Parser();
  fn(parse);
  var chunkLength = parse.chunkLength();
  
  this.steps.push({
    name : name,
    iterations : length,
    chunkLength : chunkLength,
    fn : function (chunk, offset) {
      // let `fn` add parsing rules
      var parse = Parser();
      fn(parse);

      // parse.on('data') fires synchronously
      var res = [];
      parse.on('data', function (data) {
        res.push(data);
      });

      // iterations * chunkLength
      if (typeof length === 'string') length = this[length];
      length = length * parse.chunkLength();

      // write to the parser
      var buf = new Buffer(length);
      chunk.copy(buf, 0, offset, offset + length);
      parse.write(buf);

      return res;
    }
  });
  return this;
}

/**
 * Get the byte length of all steps together.
 *
 * @return {Number}
 * @api private
 */

Parser.prototype.chunkLength = function () {
  return this.steps.reduce(function (acc, step) {
    return acc + step.length;
  }, 0);
};

/**
 * API sugar.
 */

Parser.prototype.string = function (name, length, encoding) {
  if (!encoding) encoding = 'utf8';
  var self = this;
  return self.next(name, length, function (chunk, offset) {
    var len = (typeof length === 'string') ? this[length] : length;
    return chunk.toString(encoding, offset, offset + len);
  });
};

Parser.prototype.buffer = function (name, length) {
  var self = this;
  return self.next(name, length, function (chunk, offset) {
    var len = (typeof length === 'string') ? this[length] : length;
    var buf = new Buffer(len);
    chunk.copy(buf, 0, offset, offset + len);
    return buf;
  });
};

Parser.prototype.readUInt8 = function (name) {
  return this.next(name, 1, function (chunk, offset) {
    return chunk.readUInt8(offset);
  });
};

Parser.prototype.readUInt16LE = function (name) {
  return this.next(name, 2, function (chunk, offset) {
    return chunk.readUInt16LE(offset);
  });
};

Parser.prototype.readUInt16BE = function (name) {
  return this.next(name, 2, function (chunk, offset) {
    return chunk.readUInt16BE(offset);
  });
};

Parser.prototype.readUInt32LE = function (name) {
  return this.next(name, 4, function (chunk, offset) {
    return chunk.readUInt32LE(offset);
  });
};

Parser.prototype.readUInt32BE = function (name) {
  return this.next(name, 4, function (chunk, offset) {
    return chunk.readUInt32BE(offset);
  });
};

Parser.prototype.readInt8 = function (name) {
  return this.next(name, 1, function (chunk, offset) {
    return chunk.readInt8(offset);
  });
};

Parser.prototype.readInt16LE = function (name) {
  return this.next(name, 2, function (chunk, offset) {
    return chunk.readInt16LE(offset);
  });
};

Parser.prototype.readInt16BE = function (name) {
  return this.next(name, 2, function (chunk, offset) {
    return chunk.readInt16BE(offset);
  });
};

Parser.prototype.readInt32LE = function (name) {
  return this.next(name, 4, function (chunk, offset) {
    return chunk.readInt32LE(offset);
  });
};

Parser.prototype.readInt32BE = function (name) {
  return this.next(name, 4, function (chunk, offset) {
    return chunk.readInt32BE(offset);
  });
};

Parser.prototype.readFloatLE = function (name) {
  return this.next(name, 4, function (chunk, offset) {
    return chunk.readFloatLE(offset);
  });
};

Parser.prototype.readFloatBE = function (name) {
  return this.next(name, 4, function (chunk, offset) {
    return chunk.readFloatBE(offset);
  });
};

Parser.prototype.readDoubleLE = function (name) {
  return this.next(name, 8, function (chunk, offset) {
    return chunk.readDoubleLE(offset);
  });
};

Parser.prototype.readDoubleBE = function (name) {
  return this.next(name, 8, function (chunk, offset) {
    return chunk.readDoubleBE(offset);
  });
};
