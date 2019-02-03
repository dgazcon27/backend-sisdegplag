'use strict';

module.exports = function(Document) {
	var fs = require('fs')
	var config = JSON.parse(fs.readFileSync('server/config.json', 'utf8'));
	var promise = require('promise');
	var app;
	const rootDoc = config.documentsRoot;

	Document.on('attached', function (a) {
		app = a;
	}); 

	/* Remote Hooks */
	/* Create a Image data after upload an image */

	Document.upload = function (req, res, cb) {
		var Container = app.models.Container;
		var error;
		Container.upload(req, res, { container: 'documents' }, 
			function (err, rs) {
			if (err) {
				cb(err, null)
			} else {
				var file = rs.files.document[0];
				Document.create({
					url: file.name
				}, function (err, obj) {
					if (err) { 
						console.log(err) 
					} else {
						promise.all([readDocument(file.name),fetchDocuments(file.name)])
						.then(documents => {
							var response = {}
							if (documents[0].text.length > 0 && documents[1].length > 0) {

								// compareText(documents[0], documents[1])
								lcsMethod(documents[0], documents[1])
								.then(rsp => {
									response = rsp
									cb(null, response)
								})
								.catch(er => cb(er,null))
							} else {
								response = rs
								cb(null, obj)
							}
						})
						.catch(err => cb(err, null))
					}
				});
			}
		})
	}
	
	function lcsMethod_(text1, url) {
 		var textInserted = text1.toLowerCase().split(" ")
 		var defer = new promise((resolve, reject) => {
 			Document.find({
				where: {
					url:{neq:url}
				}
			}, function (err, res) {
				if (err) {
					reject(err)
				} else if (res.length > 0) {
					var textCompared
					var comparisson = []
					res.map(item => {
						var matriz = null
						readDocument(item.url)
						.then(txt => {
							textCompared = txt.text.toLowerCase().split(' ')
							matriz = initializeArray(textInserted.length, textCompared.length)
							for(var i = 0; i < textInserted.length; i++) {
								for (var j = 0; j < textCompared.length; j++) {
									if (textInserted[i] == textCompared[j]) {
										matriz[i+1][j+1] = 1 + matriz[i][j]
									} else {
										matriz[i+1][j+1] = Math.max(matriz[i][j+1], matriz[i+1][j])
									}
								}
							}
							comparisson.push({
								inserted:url,
								compared:item.url,
								lcs:matriz[textInserted.length][textCompared.length]
							})

							writeArray(matriz,item.url)
							resolve(comparisson)
							
						})
						.catch(err => reject(err))
					})
				} else {
					resolve()
				}
			})
 		})

 		return defer;
 	}

	function lcsMethod(compare, toCompare) {
		var textInserted = compare.text;
		var defer = new promise((resolve, reject) => {
			var textCompared;
			var comparisson = [];
			toCompare.map(item => {
				var matriz = null
				textCompared = item.text;
				matriz = initializeArray(textInserted.length,textCompared.length);
				for(var i = 0; i < textInserted.length; i++) {
					for (var j = 0; j < textCompared.length; j++) {
						console.log(textInserted[i],textCompared[j])
						if (textInserted[i] == textCompared[j]) {
							matriz[i+1][j+1] = 1 + matriz[i][j]
						} else {
							matriz[i+1][j+1] = Math.max(matriz[i][j+1], matriz[i+1][j])
						}
					}
				}
				comparisson.push({
					inserted:compare.url,
					compared:item.url,
					lcs:matriz[textInserted.length][textCompared.length]
				})
				resolve(comparisson)

			})
		})

		return defer;
	}

	function compareText(textSuspect, listOfText) {
		var intersection = [];
		var union = [];
		var indexes = [];
		var ngLoaded = {};
		var ngSuspect = generateNgrams(3, textSuspect.text);
		var counted;
		var defer = new promise((resolve, reject) => {

			var promiseList = listOfText.map(item => {
				return new promise((resol, rej) => {
					indexes = [];
					counted = 0;
					ngLoaded = generateNgrams(3, item.text);
					union = mergeDocuments(ngLoaded, ngSuspect);
					for (var i = 0; i < ngSuspect.length ; i++) {
						var text1 = ngSuspect[i];
						for (var j = 0; j < ngLoaded.length; j++) {
							var text2 = ngLoaded[j];
							if (text1[0] == text2[0] && text1[1] == text2[1] && text1[2] == text2[2]) {
								counted++;
								indexes.push(text2)
							}
						}
					}
					let unique = uniq_fast(indexes);
					let lenUnique = unique.length;
					let lenUnion = union.length;
					resol({
						count: lenUnique,
						text: unique,
						percentage: (lenUnique/lenUnion)*100,
						union: lenUnion
					})
				})
			});

			promise.all(promiseList)
			.then(resp => {
				resolve(resp)
			})
			.catch(err => reject(err))

		})


		return defer;
	}

	function readDocument(url) {
		var defer = new promise((resolve, reject) => {
			var extract = require('pdf-text-extract')
			extract(rootDoc+url, function (err, pages) {
				if (err) {
					console.dir(err)
					reject(err)
					return
				}
				var doc = {}
				var elements = []
				for (var i = 0; i < pages.length; i++) {
					var splitted = pages[i].toLowerCase().replace(/\t|\n|\,|\.|\:|\;|\(|\)|\{|\}/g,' ').split(" ")
					for (var j = 0; j < splitted.length; j++) {
						if (splitted[j].trim() != '' && splitted[j] != undefined) {
							elements.push(splitted[j])
						}
						
					}
				}
				doc.text = elements;
				doc.url = url
				resolve(doc)
			})
		})
		
		return defer;
	}

	/**
	 * [Get all documents in storage without the file passed]
	 * @param  {[string]} url [url of file to exclude]
	 * @return {[array]}     [List of documents]
	 */
	function fetchDocuments(url) {
		var defer = new promise((resolve, reject)=> {
			Document.find({
				where: {
					url:{neq:url}
				}

			}, function (err, documents) {
				if (err) {
					reject(err)
				} else {
					if (documents.length > 0) {
						var promisesList = documents.map(it => {
							return readDocument(it.url)
						})
						
						promise.all(promisesList)
						.then(list => {
							resolve(list)
						})
						.catch(err => reject(err))
					} else {
						resolve([])
					}
				}
			})
		})

		return defer;
	}

	function mergeDocuments(text1, text2) {
		var union = [];
		union = text1.concat(text2);
		for (var i = 0; i < union.length; i++) {
			for(var j=i+1; j < union.length; j++) {
	            if(union[i][0] == union[j][0] &&
	            	union[i][1] == union[j][1] &&
	            	union[i][2] == union[j][2])
	                	union.splice(j--, 1);

	        }
		}

		return union
	}

	function uniq_fast(a) {
		var seen = {};
		var out = [];
		var len = a.length;
		var j = 0;
		for(var i = 0; i < len; i++) {
			var item = a[i];
			if(seen[item] !== 1) {
				seen[item] = 1;
				out[j++] = item;
			}
		}
		return out;
	}

	function printRows(rows) {
		var defer = new promise((resolve, reject)=> {
			var text = ''
			Object.keys(rows) // => array of y-positions (type: float)
			.sort((y1, y2) => parseFloat(y1) - parseFloat(y2)) // sort float positions
			.forEach((y) => {
				text += (rows[y] || []).join('')
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

 	function writeArray(matriz, textName) {
		var fs = require('fs');
		var urlText = rootDoc+textName+'.txt';
		var stream = fs.createWriteStream(urlText);
		stream.once('open', function(fd) {
			stream.write('==========================')
			stream.write(textName)
			stream.write('==========================\n')
			for (var i = 0; i < matriz.length; i++) {
				stream.write(matriz[i]+' \n')
			}
			stream.end();
		});
 	}

 	function initializeArray(leng1, leng2) {
 		var matriz = new Array(leng1+1)
 		for (var i = 0; i < matriz.length; i++) {
 			matriz[i] = new Array(leng2+1)
 		}

 		for(var i = 0;i < matriz.length; i++) {
 			matriz[i][0] = 0
 		}

 		for(var i = 0;i < matriz[0].length; i++) {
 			matriz[0][i] = 0
 		}
 		return matriz;
 	}

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
			arg: 'response', 
			type: 'object',
		}
	});
};
