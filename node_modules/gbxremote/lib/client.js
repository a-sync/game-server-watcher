var net = require('net');
var barse = require('barse');
var Promise = require('any-promise');
var toPromise = require('event-to-promise');
var toStream = require('string-to-stream');
var Serializer = require('xmlrpc/lib/serializer');
var Deserializer = require('xmlrpc/lib/deserializer');

/**
 * Creates a Client object for making XML-RPC method calls.
 *
 * @constructor
 * @param  {Number} port
 * @param  {String} host (optional)
 * @return {Client}
 */
function Client(port, host) {
	// Invokes with new if called without
	if ((this instanceof Client) === false) {
		return new Client(port, host);
	}

	this.host = host || 'localhost';
	this.port = port;

	this.isConnected = false;
	this.isReady = false;
	this.reqhandle = 0x80000000;
}

// Inherit EventEmitter
Client.prototype = Object.create(require('events').EventEmitter.prototype);

/**
 * Connects to the server
 * @return {Promise} Resolves on connection
 */
Client.prototype.connect = function (timeout) {
	if (this.isConnected) {
		return Promise.resolve(this);
	}

	var self = this;
	timeout = timeout || 2000;

	return new Promise(function (resolve, reject) {
		// Connect to the server
		self.socket = net.connect(self.port, self.host);

		self._setupParsers();

		// TODO: Move timeout out of onConnect? (currently timeout is a handshake timeout)
		self.socket.on('connect', function () {
			self.isConnected = true;

			// Timeout for handshake
			var to = setTimeout(function () {
				var err = new Error('timeout - handshake timed out');
				self.emit('error', err);

				self.terminate();
			}, timeout);

			self.on('connect', function () {
				clearTimeout(to);
			});
		});

		self.socket.on('error', function (err) {
			self.isConnected = self.isReady = false;

			self.emit('error', err);
		});

		self.socket.on('close', function (hadError) {
			self.emit('close', hadError);
		});

		self.on('error', function () {
			reject();
		});

		self.on('connect', function () {
			resolve(this);
		});
	});
};

Client.prototype._setupParsers = function () {
	var self = this;

	var handshakeParser = barse()
		.readUInt32LE('length')
		.string('handshake', 'length')
		;

	var dataParser = barse()
		.readUInt32LE('length')
		.readUInt32LE('reqhandle')
		.string('xml', 'length')
		;

	// Pipe data to handshakeParser
	this.socket.pipe(handshakeParser);
	// Then switch to dataParser once handshakeParser is done
	handshakeParser.once('data', function () {
		self.socket.unpipe(handshakeParser);
		self.socket.pipe(dataParser);
	});

	// HANDSHAKE
	handshakeParser.once('data', function (data) {
		if (data.handshake !== 'GBXRemote 2') {
			var err = new Error('transport error - wrong lowlevel protocol version');
			self.emit('error', err);
			return;
		}

		self.protocol = 2;
		self.isReady = true;
		self.emit('connect');
	});

	dataParser.on('data', function (data) {
		var deserializer = new Deserializer();
		var stream = toStream(data.xml);

		// Reponse
		if (data.reqhandle > 0x80000000) {
			deserializer.deserializeMethodResponse(stream, function (err, res) {
				self.emit('response:' + data.reqhandle, [err, res]);
			});
		}	else { // Callback
			deserializer.deserializeMethodCall(stream, function (err, method, res) {
				if (err) {
					// Ignore
					return;
				}

				// its a callback from the server
				self.emit('callback', method, res);
				self.emit(method, res);
			});
		}
	});
};

Client.prototype.terminate = function () {
	if (this.socket) {
		this.socket.end();
		this.isConnected = false;
	}
};

/**
 * Makes an XML-RPC call to the server specified by the constructor's options.
 *
 * @param  {String} method     - The method name.
 * @param  {Array} params      - Params to send in the call.
 * @return {Promise}
 */
Client.prototype.query = function (method, params) {
	var self = this;

	if (typeof (arguments[2] || arguments[1]) === 'function') {
		throw new TypeError('.query does no longer take a callback. It returns a Promise!');
	}

	if (!this.isReady) {
		var args = arguments;
		return toPromise(this, 'connect').then(function () {
			return self.query.apply(self, args);
		});
	}

	if (!Array.isArray(params)) {
		params = [params];
	}

	// Returns JSON of the xml
	var xml = Serializer.serializeMethodCall(method, params);

	// Check if request (xml + header) is larger than 1024 Kbytes (limit of maniaplanet)
	if (xml.length + 8 > 1024 * 1024) {
		var error = new Error('transport error - request too large (' + xml.length + ')');
		return Promise.reject(error);
	}

	this.reqhandle++;

	// $bytes = pack('VVa*', strlen($xml), $this->reqhandle, $xml);
	var len = Buffer.byteLength(xml);
	var buf = new Buffer(8 + len);
	buf.writeInt32LE(len, 0);
	buf.writeUInt32LE(this.reqhandle, 4);
	buf.write(xml, 8);

	this.socket.write(buf, 'utf8');

	return toPromise(this, 'response:' + this.reqhandle, {
		ignoreErrors: true
	}).then(function (result) {
		var err = result[0];
		var res = result[1];

		if (err) {
			throw err;
		}

		return res;
	});
};

module.exports = Client;
