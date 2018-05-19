'use strict';

module.exports = function(Document) {
	var fs = require('fs')
	var config = JSON.parse(fs.readFileSync('server/config.json', 'utf8'));
	var promise = require('promise');
	var app;

	Document.on('attached', function (a) {
		app = a;
	}); 

	/* Remote Hooks */
	/* Create a Image data after upload an image */
	Document.afterRemote('upload', function (ctx, modelInstance, next) {
		var file = modelInstance.status.files.document[0];
		Document.create({
				url: file.name
		}, function (err, obj) {
			if (err) { console.log(err) }
			readDocument(file.name)
			.then(r => next())
			.catch(e => next(e))
			console.log('Document data Created: ' + obj.url)
		});
		// next();
	});

	Document.upload = function (req, res, cb) {
		var Container = app.models.Container;
		var error;
		Container.upload(req, res, { container: 'documents' }, cb)
	}
	/* Remote Methods */

	function readDocument(url) {
		var fs = require("fs");
		var pdfreader = require('pdfreader');
		// var docu = '/home/deadline004/Documents/Daniel/Code/storage/documents/text_23445345.pdf'
		var docu = config.storage+'/documents/'+url
		console.log(docu)
		var i = 0
		var rows = {}
		var defer = new promise((resolve, reject) => {
			new pdfreader.PdfReader().parseFileItems(docu, function(err, item){
				if (item == undefined) {
					// finish read document
					printRows(rows)
					.then(r=>{
						var response = {text:r}
						console.log(response)
						resolve()
					})
					.catch(e => reject(e))
				} else if(item.text) {
					// accumulate text items into rows object, per line
					(rows[item.y] = rows[item.y] || []).push(item.text);
				}
				
			});
		})
		
		return defer;
	}

	function printRows(rows) {
		var defer = new promise((resolve, reject)=> {
			var text = ''
			Object.keys(rows) // => array of y-positions (type: float)
			.sort((y1, y2) => parseFloat(y1) - parseFloat(y2)) // sort float positions
			.forEach((y) => {
				text += (rows[y] || []).join('')
				// console.log((rows[y] || []).join(''))
			});
			resolve(text)
		})
		return defer;
	}

	function generateNgrams(n, text) {
		// body...
	}

	// Document.remoteMethod('readDocument', {
	// 	http: {
	// 		path: '/read-document',
	// 		verb: 'get'
	// 	},
	// 	accepts: [],
	// 	return: {
	// 		arg: 'object',
	// 		root:true
	// 	}
	// });

	Document.remoteMethod('upload',{
		http: { 
			path: '/upload', 
			verb: 'post' 
		},
		accepts: [
			{ arg: 'req', type: 'object', 'http': { source: 'req' } },
			{ arg: 'res', type: 'object', 'http': { source: 'res' } }
		],
		returns: { 
			arg: 'status', 
			type: 'string' 
		}
	});
};
