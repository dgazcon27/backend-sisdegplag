'use strict';

module.exports = function(Document) {
	var fs = require('fs')
	var config = JSON.parse(fs.readFileSync('server/config.json', 'utf8'));
	var promise = require('promise');
	var app;
	var rootDoc = config.documentsRoot;

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
			if (err) { 
				console.log(err) 
			} else {
				readDocument(file.name)
				.then(r => {
					compareText(file.name ,generateNgrams(3, r.text.toLowerCase().split(" ")))
					.then(res => {
						next()
					})
					.catch(e => next(e))
				})
				.catch(e => next(e))
			}
		});
		// next();
	});

	Document.upload = function (req, res, cb) {
		var Container = app.models.Container;
		var error;
		Container.upload(req, res, { container: 'documents' }, cb)
	}
	/* Remote Methods */

	

	Document.test = function test(cb) {
		readDocument('')
		.then(res => {
			cb(null, {})
		})
		.catch(err => cb(err, null))
	}

	function compareText(url, arrayOfText) {
		const urlstore = rootDoc;

		var defer = new promise((resolve, reject) => {
			Document.find({
					where: {
						url:{neq:url}
					}

				},function (err, res) {
					if (err) {
						reject(err)
					} else {
						if (res.length > 0) {
							// // compare text
							// console.log(arrayOfText)
							var promiseList = res.map(item => {
								return new promise((resp, rej) => {
									readDocument(item.url)
									.then(r => {
										var record = []
										var _3gram = generateNgrams(3,r.text.toLowerCase().split(" "))
										for(var i = 0; i< arrayOfText.length; i++) {
											var counted = 0
											var text1  = arrayOfText[i]
											// console.log(text1)
											for(var j = 0;j < _3gram.length;j++) {
												var text2 = _3gram[j]
												if (text1[0] == text2[0] && text1[1] == text2[1] && text1[2] == text2[2]) {
													counted++
												}
											}
											record.push({received:url,scanned:item.url, text:text1, count:counted})
											counted = 0
										}
										console.log('=============')
										console.log(record)
										console.log('=============')
										resp()
										
									})
									.catch(e => {
										console.log(e)
										rej(e)
									})
								})
							})

							promise.all(promiseList)
							.then(respon => resolve())
							.catch(error => reject(error))

						} else {
							resolve()
						}
					}
				}
			)
		})


		return defer;
	}

	function readDocument(url) {
		var fs = require("fs");
		var pdfreader = require('pdfreader');
		var i = 0
		var rows = {}
		var defer = new promise((resolve, reject) => {
			new pdfreader.PdfReader().parseFileItems(rootDoc+url, function(err, item){
				if (item == undefined) {
					// finish read document
					printRows(rows)
					.then(r=>{
						var response = {text:r}
						resolve(response)
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
		// number of ngrams
		var x = text.length - (n-1);
		var ngram = []
		var gram = []
		for(var i = 0; i< x; i++) {
			gram.push(text[i]);
			gram.push(text[i+1]);
			gram.push(text[i+2]);
			ngram.push(gram)
			gram = []
		}
		
		return ngram;

 	}

	Document.remoteMethod('test', {
		http: {
			path: '/test',
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
