var db = require('diskdb');
//db = db.connect('./db',['ipman','setting','proj','vm']);
db = db.connect('/data/wlab.app.ctl.k.e2e.bos.redhat.com',['ipman','setting','proj','vm','ipmap','srv']);
var ip = require('ip');
var util = require('util');
var Moniker = require('moniker');
var names = Moniker.generator([Moniker.noun]);
var base_domain = "k.e2e.bos.redhat.com"

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
    ipman.fqdn = "";
    ipman.project = "";
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

function create_named_project(thename)
{
   proj = {};

   proj.name = thename;
   proj.state = "unassigned";
   proj.ownwer = "";
   proj.hosts = [];
   db.proj.save(proj);
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

function allocate_ip(fqdn,project)
{
    ips = db.ipman.find({state : "unassigned"});
    if (ips.length == 0){
       console.log("IPMAN: No free ips");
       exit(0);
       }
    ipman = ips[0];
    ipman._id = ips[0]._id;
    ipman.state = "assigned";
    ipman.fqdn  = fqdn;
    ipman.project = project;
    result = db.ipman.update({ _id : ipman._id}, ipman);
    console.log("Result = " + result);
    return(ipman);
}

function add_vm_to_project(tp,theimagetype,thehostname)
{
         vm = {};
         vm.name = thehostname;
         vm.fqdn = thehostname + "." + tp.name + "." + base_domain;
         ipman   = allocate_ip(vm.fqdn,tp.name);
         vm.ip = ipman.ip;
         vm.mac = ipman.mac;
         vm.image = theimagetype;
         vm.state = "init";
         vm.project = vm.fqdn.split(".")[1];
         db.vm.save(vm);
}


function setup_hybrid2_project()
{
	projs=db.proj.find({state : "new"});
        if (projs.length == 0){
           console.log("setup_hbrid2_project: No new project entries available");
           exit();
           }
        proj = projs[0];
        console.log("Setup: " + util.inspect(proj));
        add_vm_to_project(proj,"rhel75","openshift");
        add_vm_to_project(proj,"win1709", "winnode01");
        proj.state = "init";
        db.proj.update({_id : proj._id},proj);
}

function setup_hybrid6_project()
{
        projs=db.proj.find({state : "new"});
        if (projs.length == 0){
           console.log("setup_hbrid2_project: No new project entries available");
           exit();
           }
        proj = projs[0];
        console.log("Setup: " + util.inspect(proj));
        add_vm_to_project(proj,"rhel75","bastion");
        add_vm_to_project(proj,"rhel75","master");
        add_vm_to_project(proj,"rhel75","node01");
        add_vm_to_project(proj,"rhel75","node02");
        add_vm_to_project(proj,"win1709", "winnode01");
        add_vm_to_project(proj,"win1709", "winnode02");
        proj.state = "init";
        db.proj.update({_id : proj._id},proj);


}

function reset_projects()
{
     projs=db.proj.find();
     for (idx = 0;idx < projs.length;idx++){
        projs[idx].state = "unassigned";
        db.proj.update({_id : projs[idx]._id},projs[idx]);
        }
}

function build_ipmap()
{
/*
<clustername>-api.<baseDomain> # ex: mycluster-api.example.com
<clustername>-master-0.<baseDomain> # ex: mycluster-master-0.example.com
<clustername>-etcd-0.<baseDomain> # ex: mycluster-etcd-0.example.com
<clustername>-bootstrap.<baseDomain> # ex: mycluster-bootstrap.example.com
green-etcd-0.green.k.e2e.bos.redhat.com
*/

     projs=db.proj.find();
     for (idx = 0;idx < projs.length;idx++){
         proj = projs[idx];
         master_name = "openshift." + proj.name + "." + base_domain;
         vms  = db.vm.find({fqdn : master_name});
         master_node  = vms[0];
        
         if (master_node == undefined) { //
            master_name = "master."  + proj.name + "." + base_domain;
            vms  = db.vm.find({fqdn : master_name});
            master_node  = vms[0];
            }
         if (master_node !== undefined) { 
            console.log("Master name = " + master_name);
            console.log("Master ip = " + master_node.ip);
            map = {};
            map.project = proj.name;
            map.name    = proj.name + "-api." + proj.name + "." + base_domain;
            map.ip      = master_node.ip;
            db.ipmap.save(map);

            map = {};
            map.project = proj.name;
            map.name    = proj.name + "-master-0." + proj.name + "." + base_domain;
            map.ip      = master_node.ip;
            db.ipmap.save(map);

            map = {};
            map.project = proj.name;
            map.name    = proj.name + "-etcd-0." + proj.name + "." + base_domain;
            map.ip      = master_node.ip;
            db.ipmap.save(map);
 
            bts_name = "bts." + proj.name + "." + base_domain;
            vms  = db.vm.find({fqdn : bts_name});
            bts_node  = vms[0];
            map = {};
            map.project = proj.name;
            map.name    = proj.name + "-bootstrap." + proj.name + "." + base_domain;
            map.ip      = bts_node.ip;
            db.ipmap.save(map);
            }
         }

}

function build_srv()
{
/*
SRV _etcd-client-ssl._tcp.<clustername>.<baseDomain> '1 1 2379 <clustername>-etcd-0.<baseDomain>'
SRV _etcd-server-ssl._tcp.<clustername>.<baseDomain> '1 1 2380 <clustername>-etcd-0.<baseDomain>'
...
SRV _etcd-client-ssl._tcp.<clustername>.<baseDomain> '1 1 2379 <clustername>-etcd-<N-1>.<baseDomain>'
SRV _etcd-server-ssl._tcp.<clustername>.<baseDomain> '1 1 2380 <clustername>-etcd-<N-1>.<baseDomain>'

green-etcd-0.green.k.e2e.bos.redhat.com
# ex: _etcd-client-ssl._tcp.green.green.k.e2e.bos.redhat.com '1 1 2379 green-etcd-0.green.k.e2e.bos.redhat.com'
*/
     projs=db.proj.find();
     for (idx = 0;idx < projs.length;idx++){
         proj = projs[idx];
         master_name = "openshift." + proj.name + "." + base_domain;
         vms  = db.vm.find({fqdn : master_name});
         master_node  = vms[0];

         if (master_node == undefined) { //
            master_name = "master."  + proj.name + "." + base_domain;
            vms  = db.vm.find({fqdn : master_name});
            master_node  = vms[0];
            }
         if (master_node !== undefined) {
            console.log("Master name = " + master_name);
            console.log("Master ip = " + master_node.ip);
            srv = {};
            srv.project = proj.name;
            srv.name    = "_etcd-client-ssl._tcp." + proj.name + "." + proj.name + "." + base_domain;
            srv.map     = "1 1 2379 " + proj.name + "-etcd-0." + proj.name + "." + base_domain;
            db.srv.save(srv);

            srv = {};
            srv.project = proj.name;
            srv.name    = "_etcd-server-ssl._tcp." + proj.name + "." + proj.name + "." + base_domain;
            srv.map     = "1 1 2380 " + proj.name + "-etcd-0." + proj.name + "." + base_domain;
            db.srv.save(srv);
            }
         }
}

build_srv();

