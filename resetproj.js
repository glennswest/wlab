var db = require('diskdb');
db = db.connect('./db',['ipman','setting','proj','vm']);
var ip = require('ip');
var util = require('util');
var Moniker = require('moniker');
var names = Moniker.generator([Moniker.noun]);
var base_domain = "k.e2e.bos.redhat.com"

//00:50:56:00:00:00-00:50:56:3F:FF:FF
//00:50:56:1f:X:X


function reset_projects()
{
     projs=db.proj.find();
     for (idx = 0;idx < projs.length;idx++){
        projs[idx].state = "new";
        db.proj.update({_id : projs[idx]._id},projs[idx]);
        }
}

function reset_ipman()
{
     ipmans = db.ipman.find();
     for (idx = 0;idx < ipmans.length;idx++){
         ipmans[idx].state = "unassigned";
         ipmans[idx].fqdn  = "";
         ipmans[idx].project = "";
         db.ipman.update({_id : ipmans[idx]._id}, ipmans[idx]);
         }
}

reset_projects();
reset_ipman();
