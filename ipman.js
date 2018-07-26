var db = require('diskdb');
db = db.connect('./db',['ipman','setting','proj']);
var ip = require('ip');
var util = require('util');
var Moniker = require('moniker');
var names = Moniker.generator([Moniker.noun]);

//00:50:56:00:00:00-00:50:56:3F:FF:FF
//00:50:56:1f:X:X

function get_mac(theip)
{
          theparts = theip.split('.');
          thehex = theparts[3].toString(16);
          
          mc = "00:50:56:1f:" + thehex + ":" + thehex; 
          return(mc);


}

function create_ip_entry(theip)
{
    mc = get_mac(theip);
    ipman = {}
    ipman.ip = theip;
    ipman.mac = mc;
    ipman.state = "unassigned";
    ipman.name  = "";
    ipman.domain = "";
    console.log("New Entry: " + util.inspect(ipman));
    db.ipman.save(ipman);
}

function add_ip_range(ipstart,ipend)
{
var ipstart_int = ip.toLong(ipstart);
var ipend_int   = ip.toLong(ipend);
var idx;
          
        

	for (idx = ipstart_int; idx <= ipend_int; idx++){
           theip=ip.fromLong(idx);
           console.log(theip);
           ipman = db.ipman.find({ip : theip});
           if (ipman.length == 0){
              console.log("Creating Entry for IP: " + theip);
              create_ip_entry(theip);
              }
           }

}

function create_project()
{
   proj = {};

   proj.name = names.choose();
   proj.state = "unassigned";
   proj.ownwer = "";
   proj.hosts = [];
   db.proj.save(proj);
}

function setup_hybrid2_project()
{
	projs=db.proj.find({state : "new"});
        console.log("Setup: " + util.inspect(projs));
        

}

add_ip_range('10.19.114.58','10.19.114.86');
projs = db.proj.find();
if (projs.length < 5){
   console.log("Creating Projects");
   for(idx = 0;idx < 5;idx++){
       pc = create_project();
       }
   }

setup_hybrid2_project();

