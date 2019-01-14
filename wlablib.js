
var pp = require('pretty-print');
var db = require('diskdb');
db = db.connect('/data',['ipman','setting','proj','vm','assign']);
var ip = require('ip');
var util = require('util');
var Moniker = require('moniker');
var names = Moniker.generator([Moniker.noun]);
var base_domain = "k.e2e.bos.redhat.com"
const exec = util.promisify(require('child_process').exec);
var SSH2Promise = require('ssh2-promise');
var moment = require('moment');


argOffset = 2;



async function execute_esxi(cmd)
{
	ssh_cmd = "ssh -T root@gwvcenter.e2e.bos.redhat.com <<'EOF'\n" + cmd + "\nEOF\n";
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
	await execute_esxi(cmd).catch((err) => { console.log(err); });;

}

async function create_vm(thename,theip,themac,theimage)
{

        cmd = "cd ansible-esxi/vm_deploy;ansible-playbook clone_local.yaml -l klab -e 'dst_ip_addr=\"" + theip + "\"' -e 'dst_vm_addr=\"" + themac + "\"' -e 'dst_vm_name=\"" + thename + "\"'" + " -e 'src_vm_name=\"" + theimage + "\"'" + " -e 'do_power_on=true'";
        await execute(cmd);
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
     
function get_assignment(thecode)
{
       assignment = db.assign.findOne({code: thecode});
       if (assignment == undefined){
          console.log("Invalid Code: " + thecode);
          return(undefined);
          }
       return(assignment);
}


function assign_project(thename,themail)
{
       proj = db.proj.findOne({name: thename});
       if (proj == undefined){
          console.log("Unknown Project - " + thename);
          return("Error: Unknowd Project");
          }
       assign = db.assign.findOne({name: thename});
       if (assign != undefined){
          console.log("Project Assigned - " + assign.email);
          return("Error: Project Already Assigned - Email: " + assign.email);
          }
       assign = {};
       assign.name = thename;
       assign.email = themail;
       assign.code = Moniker.choose();
       assign.expire = moment().add(7,'days');
       db.assign.save(assign);
       console.log("Code = " + assign.code);
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
   proj.state = "init"
   db.proj.update({_id : proj._id},proj);
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

async function create_project(pname)
{
   proj=db.proj.findOne({name : pname});
   console.log(proj);
   if (proj == undefined){
      console.log("Cannot find project: " + pname);
      return(-1);
      }
   pp(proj);
   if (proj.state == "created"){
      console.log("Deleting Existing VM's");
      await delete_project(pname);
      console.log("Delete Complete");
      }
   vms=db.vm.find({project : pname});
   if (vms.length == 0){
      console.log("No vms for project");
      return(-2);
      }
   proj.state = "created"
   db.proj.update({_id : proj._id},proj);
   for(idx = 0;idx < vms.length;idx++){
      vm = vms[idx];
      await create_vm(vm.fqdn,vm.ip,vm.mac,vm.image);
      vm.state = "created";
      db.vm.update({_id : vm._id},vm);
      }
   console.log("Create Project Complete");
   return(0);
}

function fix_vm_project()
{
     console.log("Fix VM Project");
     projs = db.proj.find();
     console.log("Projects = " + projs.length);
     for (idx = 0;idx < projs.length;idx++){
         proj = projs[idx];
         console.log("Project = " + proj.name);
         }
     //vms=db.vm.find();
     //for (idx = 0;idx < vms.length;idx++){
     //   vms[idx].project = vms[idx].fqdn.split(".")[1];
     //   console.log("Project = " + vms[idx].project);
     //   db.vm.update({_id : vms[idx]._id},vms[idx]);
     //   }
}

module.exports.create_proj = create_project;
module.exports.delete_proj = delete_project;
module.exports.fix_vm_project = fix_vm_project;
exports.assign_proj = function(the_name,the_email){ assign_project(the_name,the_email); };
exports.get_assign  = function(the_code){ return get_assignment( the_code ); };

