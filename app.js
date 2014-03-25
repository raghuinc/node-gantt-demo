var express = require('express');
var path = require('path');

var mysql      = require('mysql');
var db = mysql.createConnection({
  host     : '192.168.3.251',
  user     : 'ganttdemos',
  password : 'ganttdemos',
  database : 'ganttdemos'
});

require("date-format-lite")

var app = express();
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.bodyParser());

app.get('/data', function(req, res){
	db.query("SELECT * FROM gantt_tasks", function(err, rows){
		if (err) console.log(err);
		db.query("SELECT * FROM gantt_links", function(err, links){
			if (err) console.log(err);
			
			for (var i = 0; i < rows.length; i++){
				rows[i].start_date = rows[i].start_date.format("YYYY-MM-DD");
				rows[i].open = true;
			}
				

			res.send({ data:rows, collections: { links : links } });
		});
	});
});


app.post('/data', function(req, res){
	var data = req.body;
	var mode = data["!nativeeditor_status"];
	var sid = data.id;
	var tid = sid;


	function update_response(err, result){
		if (err){
			console.log(err);
			mode = "error";
		}

		else if (mode == "inserted")
			tid = result.insertId;

		res.setHeader("Content-Type","text/xml");
		res.send("<data><action type='"+mode+"' sid='"+sid+"' tid='"+tid+"'/></data>");
	}

	if (req.query.gantt_mode == "links"){
		//save links
		if (mode == "deleted")
			db.query("DELETE FROM gantt_links WHERE id = ?", [sid], update_response);
		else {
			var source  = data.source;
			var target 	= data.target;
			var type  	= data.type;
			
			if (mode == "updated")
				db.query("UPDATE gantt_links SET source = ?, target = ?, type = ? WHERE id = ?",
					[source, target, type, sid],
					update_response);
			else if (mode == "inserted")
				db.query("INSERT INTO gantt_links(source, target, type) VALUES (?,?,?)",
					[source, target, type],
					update_response);
			else
				res.send("Not supported operation");
		}


	} else {
		//save data
		if (mode == "deleted")
			db.query("DELETE FROM gantt_tasks WHERE id = ?", [sid], update_response);
		else {
			var text  		= data.text;
			var start_date 	= data.start_date.date("YYYY-MM-DD");
			var duration  	= data.duration;
			var progress  	= data.progress;
			var parent  	= data.parent;

			if (mode == "updated")
				db.query("UPDATE gantt_tasks SET text = ?, start_date = ?, duration = ?, progress = ?, parent = ? WHERE id = ?",
					[text, start_date, duration, progress, parent, sid],
					update_response);
			else if (mode == "inserted")
				db.query("INSERT INTO gantt_tasks(text, start_date, duration, progress, parent) VALUES (?,?,?,?,?)",
					[text, start_date, duration, progress, parent],
					update_response);
			else
				res.send("Not supported operation");
		}
	}
});

app.listen(3000);