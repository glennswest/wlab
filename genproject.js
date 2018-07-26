var Moniker = require('moniker');
var names = Moniker.generator([Moniker.noun]);

console.log(names.choose());

