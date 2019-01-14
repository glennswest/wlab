var util = require('util');
var wl = require('./wlablib');

argOffset = 2;

if (process.argv.length < 3){
   console.log("node wlab.js cmd value1 value 2\n");
   process.exit();
   }

cmd = process.argv[argOffset];
switch(cmd){
     case "list-raw-vms":
           wl.list_raw_vms();
           break;
     case "fix-vm":
           wl.fix_vm_project();
           process.exit();
           break;
     case "list":
          wl.list_projects();
          process.exit();
          break;
     case "create-project":
           if (process.argv.length < 4){
              console.log("node wlab.js create-project nameofproject");
              process.exit();
              }
           project_name = process.argv[argOffset+1];
           result = wl.create_proj(project_name);
           break;
     case "recreate-onevm":
           if (process.argv.length < 5){
              console.log("node wlab.js recreate-one-vm nameofproject vmname");
              process.exit();
              }
           project_name = process.argv[argOffset+1];
           vm_name = process.argv[argOffset+2];
           wl.recreate_one_vm(project_name,vm_name);
           break;
     case "create-onevm":
           if (process.argv.length < 5){
              console.log("node wlab.js create-one-vm nameofproject vmname");
              process.exit();
              }
           project_name = process.argv[argOffset+1];
           vm_name = process.argv[argOffset+2];
           wl.create_one_vm(project_name,vm_name);
           break;
     case "delete-project":
           if (process.argv.length < 4){
              console.log("node wlab.js delete-project nameofproject");
              process.exit();
              }
           project_name = process.argv[argOffset+1];
           wl.delete_proj(project_name);
           break;
     case "assign-project":
           if (process.argv.length < 5){
              console.log("node wlab.js assign-project  nameofproject email");
              process.exit();
              }
           project_name = process.argv[argOffset+1];
           the_email = process.argv[argOffset+2];
           console.log(the_email);
           console.log(project_name);
           wl.assign_proj(project_name,the_email);
           break;
     case "help":
           console.log("Commands: help, create-project\n");
           process.exit();
           break;
           }

