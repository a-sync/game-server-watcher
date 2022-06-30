var Client = require('./client');

/**
 * Creates an GbxRemote client.
 *
 * @param {Number} port
 * @param {String} host
 * @return {Client}
 * @see Client
 */
exports.createClient = function createClient(port, host) {
	var client = new Client(port, host);
	client.connect();

	return client;
};

exports.Client = Client;
