var util = require('util');
var wl = require('./wlablib');
var pp = require('pretty-print');

var restify = require('restify');

function respond(req, res, next) {
  res.send('hello ' + req.params.name);
  next();
}
 
async function create_project(req,res, next)
{
	the_code = req.params.code;
        console.log("Code: " + the_code);
        assign = wl.get_assign(the_code);
        pp(assign);
        the_proj = assign.name;
        result = await wl.create_proj(the_proj);
        res.send('Create Project: ' + the_proj);
        next();

}

async function delete_project(req,res, next)
{
	the_code = req.params.code;
        console.log("Code: " + the_code);
        assign = wl.get_assign(the_code);
        pp(assign);
        the_proj = assign.name;
        result = await wl.delete_proj(the_proj);
        res.send('Delete Project: ' + the_proj);
        next();

}

async function assign_project(req,res, next)
{
	the_project = req.params.project;
        the_email   = req.params.email;
        assign = wl.assign_proj(the_project,the_email);
        pp(assign);
        res.send('Assign Project: ' + assign);
        next();

}

var server = restify.createServer();
server.server.setTimeout(60000*50000);
server.get('/', respond);
server.head('/',respond);
server.get('/create/:code', create_project);
server.head('/create/:code', create_project);
server.get('/delete/:code', delete_project);
server.head('/delete/:code', delete_project);
server.get('/assign/:project/:email', assign_project);
server.head('/assign/:project/:email', assign_project);

server.listen(8085, function() {
  console.log('%s listening at %s', server.name, server.url);
});

