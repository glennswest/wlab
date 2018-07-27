var db = require('diskdb');
db = db.connect('./db',['ipman','setting','proj','vm']);
var ip = require('ip');
var util = require('util');
var Moniker = require('moniker');
var names = Moniker.generator([Moniker.noun]);
var base_domain = "k.e2e.bos.redhat.com"
const exec = util.promisify(require('child_process').exec);

argOffset = 2;

if (process.argv.length < 3){
   console.log("node wlab.js cmd value1 value 2\n");
   process.exit();
   }

async function execute(cmd)
{
  const { stdout, stderr } = await exec(cmd);
  console.log('stdout:', stdout);
  console.log('stderr:', stderr);
}

function create_vm(thename,theip,themac,theimage)
{

        cmd = "cd ansible-esxi/vm_deploy;ansible-playbook clone_local.yaml -l klab -e 'dst_ip_addr=\"" + theip + "\"' -e 'dst_vm_addr=\"" + themac + "\"' -e 'dst_vm_name=\"" + thename + "\"'" + " -e 'src_vm_name=\"" + theimage + "\"'";
        execute(cmd);
        console.log ("Cmd = " + cmd);
}

function list_projects()
{
   projs = db.proj.find();
   for (idx = 0;idx < projs.length;idx++){
       console.log(projs[idx].name);
       }
   return;
}
     
cmd = process.argv[argOffset];
switch(cmd){

}

// [{"name":"openshift","fqdn":"openshift.blue.k.e2e.bos.redhat.com","ip":"10.19.114.58","mac":"00:50:56:1f:58:58","image":"rhel75","state":"init","_id":"93df3e6409af4a1082791083a972c40b"}
function create_project(pname)
{
   proj=db.proj.findOne({name : pname});
   console.log(proj);
   if (proj == undefined){
      console.log("Cannot find project: " + pname);
      return(-1);
      }
   vms=db.vm.find({project : pname});
   if (vms.length == 0){
      console.log("No vms for project");
      return(-2);
      }
   for(idx = 0;idx < vms.length;idx++){
      vm = vms[idx];
      create_vm(vm.fqdn,vm.ip,vm.mac,vm.image);
      vm.state = "created";
      db.vm.update({_id : vm._id},vm);
      }

}

function fix_vm_project()
{
     vms=db.vm.find();
     for (idx = 0;idx < vms.length;idx++){
        vms[idx].project = vms[idx].fqdn.split(".")[1];
        console.log("Project = " + vms[idx].project);
        db.vm.update({_id : vms[idx]._id},vms[idx]);
        }
}
     
cmd = process.argv[argOffset];
switch(cmd){
     case "fix-vm":
           fix_vm_project();
           process.exit();
           break;
     case "list":
          list_projects();
          process.exit();
          break;
     case "create-project":
           if (process.argv.length < 4){
              console.log("node wlab.js create-project nameofproject");
              process.exit();
              }
           project_name = process.argv[argOffset+1];
           create_project(project_name);
           break;
     case "help":
           console.log("Commands: help, create-project\n");
           process.exit();
           break;
           }

//var Ansible = require('node-ansible');
//var command = new Ansible.AdHoc().module('shell').hosts('local').args("echo 'hello'");
//command.exec();

//#var playbook = new Ansible.Playbook().playbook('my-playbook');
//#playbook.exec();

