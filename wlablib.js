var db = require('diskdb');
db = db.connect('./db',['ipman','setting','proj','vm']);
var ip = require('ip');
var util = require('util');
var Moniker = require('moniker');
var names = Moniker.generator([Moniker.noun]);
var base_domain = "k.e2e.bos.redhat.com"
const exec = util.promisify(require('child_process').exec);
var SSH2Promise = require('ssh2-promise');


argOffset = 2;

if (process.argv.length < 3){
   console.log("node wlab.js cmd value1 value 2\n");
   process.exit();
   }

async function execute_esxi(cmd)
{
	ssh_cmd = "ssh -T root@gwvcenter <<'EOF'\n" + cmd + "\nEOF\n";
        await execute(ssh_cmd);
}


async function execute(cmd)
{
  const { stdout, stderr } = await exec(cmd);
  console.log('stdout:', stdout);
  console.log('stderr:', stderr);
  return(stdout);
}


async function list_raw_vms()
{
	await execute_esxi('vim-cmd vmsvc/getallvms;exit');
        console.log("Back to list");

}



async function delete_raw_vm(vmname)
{
        cmd = 'vmid=`vim-cmd vmsvc/getallvms | grep "' + vmname + '"' + " | cut -d ' ' -f 1`;vim-cmd vmsvc/power.off $vmid;vim-cmd vmsvc/destroy $vmid";
        console.log(cmd);
	await execute_esxi(cmd);

}

function create_vm(thename,theip,themac,theimage)
{

        cmd = "cd ansible-esxi/vm_deploy;ansible-playbook clone_local.yaml -l klab -e 'dst_ip_addr=\"" + theip + "\"' -e 'dst_vm_addr=\"" + themac + "\"' -e 'dst_vm_name=\"" + thename + "\"'" + " -e 'src_vm_name=\"" + theimage + "\"'" + " -e 'do_power_on=true'";
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
     
async function delete_project(pname)
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
      await delete_raw_vm(vm.fqdn);
      vm.state = "init";
      db.vm.update({_id : vm._id},vm);
      }
}

function create_one_vm(pname,vname)
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
   console.log("Looking");
   for(idx = 0;idx < vms.length;idx++){
      vm = vms[idx];
      console.log(vm.name);
      if (vm.name.localeCompare(vname) == 0){
         create_vm(vm.fqdn,vm.ip,vm.mac,vm.image);
         vm.state = "created";
         db.vm.update({_id : vm._id},vm);
         }
      }
}

async function recreate_one_vm(pname,vname)
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
   console.log("Looking");
   for(idx = 0;idx < vms.length;idx++){
      vm = vms[idx];
      console.log(vm.name);
      if (vm.name.localeCompare(vname) == 0){
         await delete_raw_vm(vm.fqdn);
         create_vm(vm.fqdn,vm.ip,vm.mac,vm.image);
         vm.state = "created";
         db.vm.update({_id : vm._id},vm);
         }
      }
}

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
     case "list-raw-vms":
           list_raw_vms();
           break;
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
     case "recreate-onevm":
           if (process.argv.length < 5){
              console.log("node wlab.js recreate-one-vm nameofproject vmname");
              process.exit();
              }
           project_name = process.argv[argOffset+1];
           vm_name = process.argv[argOffset+2];
           recreate_one_vm(project_name,vm_name);
           break;
     case "create-onevm":
           if (process.argv.length < 5){
              console.log("node wlab.js create-one-vm nameofproject vmname");
              process.exit();
              }
           project_name = process.argv[argOffset+1];
           vm_name = process.argv[argOffset+2];
           create_one_vm(project_name,vm_name);
           break;
     case "delete-project":
           if (process.argv.length < 4){
              console.log("node wlab.js delete-project nameofproject");
              process.exit();
              }
           project_name = process.argv[argOffset+1];
           delete_project(project_name);
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

