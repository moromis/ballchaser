
const yaml = require('js-yaml');
const fs = require("fs")

const loadPlayers = () => {
    return yaml.load(fs.readFileSync('./players.yaml', 'utf8'));
}

module.exports = {
    loadPlayers
}
