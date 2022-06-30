var parse = require('..');

var parser = parse()
  .readUInt8('string length')
  .string('string', 'string length')
  .readUInt8('field count')
  .loop('fields', 'field count', function (loop) {
    loop.readUInt8('some');
    loop.readUInt8('numbers');
  })

parser.on('data', console.log);
/*
{
  "string length" : 3,
  "string" : "foo",
  "field count" : 2,
  "fields" : [
    { "some" : 13, "numbers" : 37 },
    { "some" : 73, "numbers" : 13 }
  ]
}
*/

var buf = new Buffer(9);
buf.writeUInt8(3, 0); // string length
buf.write('foo', 1); // string
buf.writeUInt8(2, 4); // field count
buf.writeUInt8(13, 5); // fields[0].some
buf.writeUInt8(37, 6); // fields[0].numbers
buf.writeUInt8(73, 7); // fields[1].some
buf.writeUInt8(31, 8); // fields[1].numbers

parser.write(buf);
