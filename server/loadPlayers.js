
const yaml = require('js-yaml');

const loadPlayers = () => {
    return yaml.load(fs.readFileSync('./players.yaml', 'utf8'));
}

exports.default = loadPlayers;