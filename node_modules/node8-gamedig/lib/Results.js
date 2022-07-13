class Player {
    constructor(data) {
        this.name = '';
        this.raw = {};

        if (typeof data === 'string') {
            this.name = data;
        } else {
            const {name, ...raw} = data;
            if (name) this.name = name;
            if (raw) this.raw = raw;
        }
    }
}

class Players extends Array {
    setNum(num) {
        // If the server specified some ridiculous number of players (billions), we don't want to
        // run out of ram allocating these objects.
        num = Math.min(num, 10000);

        while(this.length < num) {
            this.push({});
        }
    }

    push(data) {
        super.push(new Player(data));
    }
}

class Results {
    constructor() {
        this.name = '';
        this.map = '';
        this.password = false;

        this.raw = {};

        this.maxplayers = 0;
        this.players = new Players();
        this.bots = new Players();
    }
}

module.exports = Results;
