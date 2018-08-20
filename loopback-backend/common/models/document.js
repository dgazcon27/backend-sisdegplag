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
						// readDocument(file.name)
						// .then(res => {
						// 	console.log(res)
						// 	cb(null, res)
						// })
						// .catch(err => cb(err, null))
						promise.all([readDocument(file.name),fetchDocuments(file.name)])
						.then(documents => {
							// console.log(documents)	
							var response = {}
							if (documents[0].text.length > 0 && documents[1].length > 0) {
								comparedText_(documents[0], documents[1])
								.then(rsp => {
									response = rsp
									cb(null, rsp)
								})
								.catch(er => cb(er,null))
							} else {
								response = rs
								cb(null, obj)
							}
						})
						.catch(err => cb(err, null))
						// readDocument(file.name)
						// .then(r => {
						// 	compareText(file.name ,generateNgrams(3, r))
						// 	// lcsMethod(r.text, file.name)
						// 	.then(resp => {
						// 		cb(null,resp)
						// 	})
						// 	.catch(e => {
						// 		cb(e, null)
						// 	})
						// })
						// .catch(e => {
						// 	console.log(e)
						// 	cb(e, null)
						// })
					}
				});
			}
		})
	}
	/* Remote Methods */

	

	Document.test = function test(cb) {
		var extract = require('pdf-text-extract')
		var filePath = '/home/deadline004/Documents/Daniel/Tesis/El_plagio_en_la_investigacion_cientifica.pdf'
		extract(filePath, function (err, pages) {
			if (err) {
				console.dir(err)
				return
			}
			var elements = []
			for (var i = 0; i < pages.length; i++) {
				var splitted = pages[i].toLowerCase().replace(/\t|\n|/g,'').split(" ")
				splitted.map(it => {
					if (it.trim() != '' && it != undefined) {
						elements.push(it)
					}
				})
				
			}
		})
	}

	function comparedText_(compare, toCompare) {
		var defer = new promise((resolve, reject) => {
			var counted = 0;
			var record = [];
			var _3gram = {};
			var words = [];

			//Compare using N-Grams method
			var ngrams = generateNgrams(3, compare.text); // ngrams of document received
			var promiseList = toCompare.map(item => {
				return new promise((resol, rej) => {
					counted = 0;
					record = [];
					var ngramsToCompare = generateNgrams(3,item.text) // ngrams of documents in storage
					
					// for (var i = 0; i < ngrams.length ; i++) {
					// 	var text1 = ngrams[i];
					// 	for (var j = 0; j < ngramsToCompare.length; j++) {
					// 		var text2 = ngramsToCompare[j]
					// 		if (text1[0] == text2[0] && text1[1] == text2[1] && text1[2] == text2[2]) {
					// 			counted++
					// 			words.push(text2)
					// 		}
					// 	}
					// }

					// if (counted > 0) {
					// 	console.log(counted,'  ----  ',ngramsToCompare.length, ' - --- -', item.url)
					// 	record.push({
					// 		percentage: (counted*100)/ngrams.length,
					// 		words:words,
					// 		compareTo: item.url,
					// 		received:compare.url
					// 	})
					// }
					resol(record)
				})
			})

			promise.all(promiseList)
			.then(resp => {
				resolve(resp)
			})
			.catch(err => reject(err))

		});

		return defer;
	}

	function compareText(url, arrayOfText) {
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
							var counted = 0
							var record = []
							var _3gram = {}
							var words = []

							// Comparisson using ngrams
							var promiseList = res.map(item => {
								return new promise((resp, rej) => {
									counted = 0
									record = []
									words = []
									_3gram = generateNgrams(3,r)
									for(var i = 0; i< arrayOfText.length; i++) {
										var text1  = arrayOfText[i]
										for(var j = 0;j < _3gram.length;j++) {
											var text2 = _3gram[j]
											if (text1[0] == text2[0] && text1[1] == text2[1] && text1[2] == text2[2]) {
												counted++
												words.push(text2)
											}
										}
									}

									if (counted > 0) {
										record.push({
											received:url,
											scanned:item.url,
											percentage: (counted*100)/_3gram.length,
											words:words
										})
									}
								
								})
							})

							// Comparisson using LCS

							promise.all(promiseList)
							.then(respon => {
								resolve(respon)
							})
							.catch(error => reject(error))

						} else {
							resolve([])
						}
					}
				}
			)
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
					var splitted = pages[i].toLowerCase().replace(/\t|\n/g,' ').split(" ")
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

 	function lcsMethod(text1, url) {
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
			arg: 'response', 
			type: 'object',
		}
	});
};
