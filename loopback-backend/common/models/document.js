'use strict';

module.exports = function(Document) {

	var promise = require('promise');
	var app;
	Document.on('attached', function (a) {
		app = a;
	});

	Document.upload = function (req, res, cb) {
		var Container = app.models.Container;
		var AccessToken = app.models.AccessToken;
		var error;
		Container.upload(req, res, { container: 'documents' }, cb)
	}
	/* Remote Methods */

	Document.readDocument = function (cb) {
		var fs = require("fs");
		var pdfreader = require('pdfreader');
		var docu = '/home/deadline004/Documents/Daniel/Code/storage/documents/text_23445345.pdf'
		var i = 0
		var rows = {}
		new pdfreader.PdfReader().parseFileItems(docu, function(err, item){
			if (item == undefined) {
				// finish read document
				printRows(rows)
				.then(r=>{
					var response = {text:r}
					console.log(response)
					cb(null,response)
				})
				.catch(e=>cb(e, null))
			} else if(item.text) {
				// accumulate text items into rows object, per line
				(rows[item.y] = rows[item.y] || []).push(item.text);
			}
			
		});
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

	Document.remoteMethod('readDocument', {
		http: {
			path: '/read-document',
			verb: 'get'
		},
		accepts: [],
		return: {
			arg: 'object',
			root:true
		}
	});

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
