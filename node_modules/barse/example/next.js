var parse = require('..');

var parser = parse()
  .next('a', 1, function (chunk, offset) {
    return chunk.readUInt8(offset);
  })
  .next('b', 4, function (chunk, offset) {
    return chunk.readUInt32LE(offset);
  })

parser.on('data', console.log);

var leet = new Buffer(5);
leet.writeUInt8(13, 0);
leet.writeUInt32LE(37, 1);
parser.write(leet);

var teel = new Buffer(5);
teel.writeUInt8(73, 0);
teel.writeUInt32LE(31, 1);
parser.write(teel);
