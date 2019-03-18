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
		Container.upload(req, res, { 
			container: 'documents',
			getFilename: function(fileInfo, req, res) {
				var origFilename = fileInfo.name;
				// optimisticly get the extension
				var parts = origFilename.split('.'),
				extension = parts[parts.length-1];

				// Using a local timestamp + user id in the filename (you might want to change this)
				var newFilename = (new Date()).getTime()+'_file.'+extension;
				return newFilename;
			} 
		}, 
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
						promise.resolve(compareText(obj))
						.then(ressp => cb(null, ressp))
						.catch(res => cb(err, null))
					}
				});
			}
		})
	}

	function lcsMethod(compare, toCompare) {
		var textInserted = compare.text;
		var defer = new promise((resolve, reject) => {
			var textCompared;
			var comparisson;
			var matriz;

			var promiseList = toCompare.map(item => {
				return new promise((resol, rej) => {
					matriz = null;
					comparisson = [];
					textCompared = item.text;
					matriz = initializeArray(textInserted.length,textCompared.length);
					for(var i = 0; i < textInserted.length; i++) {
						for (var j = 0; j < textCompared.length; j++) {
							if (textInserted[i] == textCompared[j]) {
								matriz[i+1][j+1] = 1 + matriz[i][j]
							} else {
								matriz[i+1][j+1] = Math.max(matriz[i][j+1], matriz[i+1][j])
							}
						}
					}
					let lcs = matriz[textInserted.length][textCompared.length];
					let lenCompare = textCompared.length;
					let lengthText = textInserted.length;
					resol({
						lcs: (lcs/lenCompare)*100,
						suspect:item.url,
						id: item.id
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
	
	function nGramMethod(textSuspect, listOfText) {
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
						ngram: (lenUnique/lenUnion)*100,
						suspect: item.url,
						id: item.id
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

	function vectorialModelFunction(textSuspect, listOfText) {
		var arrayText1 = removeStopWords(textSuspect.text);
		var defer = new promise((resolve, reject) => {
			var arrayText2;
			var vectorialModel;
			var vectorialResult1;
			var vectorialResult2;
			var result;
			var promiseList = listOfText.map(item => {
				return new promise((resol, rej) => {
					arrayText2 = removeStopWords(item.text);
					vectorialModel = uniq_fast(mergeDocuments(arrayText1, arrayText2));
					vectorialResult1 = []
					vectorialResult2 = []
					result = 0;
					var countText;
					for (var i = 0; i < vectorialModel.length; i++) {
						countText = 0;
						for (var j = 0; j < arrayText1.length; j++) {
							if (vectorialModel[i] == arrayText1[j]) {
								countText++;
							}
						}
						vectorialResult1.push(countText)
						countText = 0;
						for (var j = 0; j < arrayText2.length; j++) {
							if (vectorialModel[i] == arrayText2[j]) {
								countText++;
							}
						}
						vectorialResult2.push(countText)
					}
					var denominator = 0;
					var factorA = 0;
					var factorB = 0;
					var max = vectorialResult2.length;
					for (var i = 0; i < max; i++) {
						denominator += vectorialResult2[i]*vectorialResult1[i];
						factorA += Math.pow(vectorialResult2[i], 2);
						factorB += Math.pow(vectorialResult1[i], 2);
					}
					result = ((denominator/(Math.sqrt(factorA)*Math.sqrt(factorB))).toFixed(4))*100;
					resol({
						vectorialM: result,
						text: item.url,
						id: item.id
					})

				})
			})

			promise.all(promiseList)
			.then(resp => {
				resolve(resp)
			})
			.catch(err => reject(err))

		})
		return defer;
	}

	function compareText(fileUploaded) {
		// Buscar el resto de los documentos desde aqui
		var Statistics = app.models.Statistics;
		var defer = new promise((resl, reject)=> {
			promise.all([readDocument(fileUploaded),fetchDocuments(fileUploaded.url)])
			.then(documents => {
				var response = {}
				if (documents[0].text.length > 0 && documents[1].length > 0) {
					promise.all([
						lcsMethod(documents[0], documents[1]),
						nGramMethod(documents[0], documents[1]),
						vectorialModelFunction(documents[0], documents[1])
					])
					.then(rsp => {
						let obj = {
							lcs: rsp[0][0].lcs,
							ngrams: rsp[1][0].ngram,
							vectorialM: rsp[2][0].vectorialM,
							text: rsp[0][0].suspect,
							suspectId:rsp[0][0].id,
							documentId: documents[0].id
						}
						for (var i = 1; i < documents[1].length; i++) {
							let media1 = (obj.ngram+obj.lcs+obj.vectorialM)/3
							let media2 = (rsp[1][i].ngram+rsp[0][i].lcs+rsp[2][i].vectorialM)/3
							if (media2 > media1) {
								obj = {
									lcs: rsp[0][i].lcs,
									ngrams: rsp[1][i].ngram,
									vectorialM: rsp[2][i].vectorialM,
									text: rsp[0][i].suspect,
									suspectId:rsp[0][i].id,
									documentId: documents[0].id
								}
							}
						}
						promise.resolve(bayesianMethod(obj, documents[1]))
						.then(res=>{
 							resl(res)
						})
						.catch(error => {
							reject(error)
						})
					})
					.catch(er => reject(er))
				} else {
					// crear resultado como no plagiado
					// primer archivo guardado
					Statistics.create({
						ngram:"0",
						lcs:"0",
						vectorialModel:"0",
						type:'no_plagiado',
						suspectId:0,
						documentsId:documents[0].id
					}, 
					function (err, res) {
						if (err) {
							reject(err)
						} else {
							resl ()
						}
					})
				}
			})
			.catch(err => reject(err))
		});

		return defer;
		
	}

	// Regresa una respuesta diciendo si es plagiado o no_plagiado
	function bayesianMethod(result, documents) {
		var Statistics = app.models.Statistics;

		var defer = new promise((resolve, reject)=>{
			let numberOfClass = 6;
			let countPl = new Array(numberOfClass);
			let countNoPl = new Array(numberOfClass);

			for (var i = 0; i < numberOfClass; i++) {
				countPl[i] = 1 ;
				countNoPl[i] = 1;
			}
			let mediaPl = 0;
			let mediaNoPl = 0;

			documents.forEach(item => {
				if (item.statistics.type == 'plagiado') {

					if (parseFloat(item.statistics.ngram) < 30) {
						countPl[0] += 1
					} else {
						countPl[1] += 1
					}
					if (parseFloat(item.statistics.lcs) < 30) {
						countPl[2] += 1
					} else {
						countPl[3] += 1
					}
					if (parseFloat(item.statistics.vectorialModel) < 30) {
						countPl[4] += 1
					} else {
						countPl[5] += 1
					}
					mediaPl++;
				} else {
					if (parseFloat(item.statistics.ngram) < 30) {
						countNoPl[0] += 1
					} else {
						countNoPl[1] += 1
					}
					if (parseFloat(item.statistics.lcs) < 30) {
						countNoPl[2] += 1
					} else {
						countNoPl[3] += 1
					}
					if (parseFloat(item.statistics.vectorialModel) < 30) {
						countNoPl[4] += 1
					} else {
						countNoPl[5] += 1
					}
					mediaNoPl++;
				}
			})
			mediaPl = (mediaPl/documents.length).toFixed(4);
			mediaNoPl = (mediaNoPl/documents.length).toFixed(4);
			let laplPl = 0;
			let laplNopl = 0;
			for (var i = 0; i < numberOfClass; i++) {
				laplPl += countPl[i];
				laplNopl += countNoPl[i];
			}
			for (var i = 0; i < numberOfClass; i++) {
				countPl[i] = (countPl[i]/laplPl).toFixed(4);
				countNoPl[i] = (countNoPl[i]/laplNopl).toFixed(4);
			}

			if (parseFloat(result.ngrams) < 30) {
				mediaPl *= countPl[0]
				mediaNoPl *= countNoPl[0]
			} else {
				mediaPl *= countPl[1]
				mediaNoPl *= countNoPl[1]
			}
			if (parseFloat(result.lcs) < 30) {

				mediaPl *= countPl[2]
				mediaNoPl *= countNoPl[2]
			} else {
				mediaPl *= countPl[3]
				mediaNoPl *= countNoPl[3]
			}
			if (parseFloat(result.vectorialM) < 30) {
				mediaPl *= countPl[4]
				mediaNoPl *= countNoPl[4]
			} else {
				mediaPl *= countPl[5]
				mediaNoPl *= countNoPl[5]
			}

			let type = mediaPl > mediaNoPl ? 'plagiado' : 'no_plagiado';
			new promise((rs, rj) => {
				Statistics.create({
					ngram:result.ngrams,
					lcs:result.lcs,
					vectorialModel:result.vectorialM,
					type:type,
					suspectId: result.suspectId,
					documentsId:result.documentId
				}, 
				function (err, res) {
					if (err) {
						rj(err)
					} else {
						rs()
					}
				})
			})
			.then(response => resolve(result))
			.catch(err => reject(err))
		})
		return defer;
	}

	function readDocument(item) {
		var defer = new promise((resolve, reject) => {
			var extract = require('pdf-text-extract')
			extract(rootDoc+item.url, function (err, pages) {
				if (err) {
					console.dir(err)
					reject(err)
					return
				}
				var doc = {}
				var elements = []
				for (var i = 0; i < pages.length; i++) {
					var splitted = pages[i]
						.toLowerCase()
						.replace(/\t|\n|\,|\.|\:|\;|\(|\)|\{|\}|\?|\¿|\"|\-|\]|\[/g,' ')
						.split(" ")
					for (var j = 0; j < splitted.length; j++) {
						if (splitted[j].trim() != '' && splitted[j] != undefined) {
							elements.push(splitted[j])
						}
					}
				}
				doc.text = elements;
				doc.url = item.url;
				doc.id = item.id;
				resolve(doc)
			})
		})
		
		return defer;
	}

	function removeStopWords(array) {
		var obj = Object.assign(array,{})
		var regex = require('../shared/regex-expresion')
		for(var i = 0; i < obj.length; i++) {
			if (regex.test(obj[i]))
				obj.splice(i, 1);
		}
		return obj;
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
				},
				include:["statistics"]

			}, function (err, documents) {
				if (err) {
					reject(err)
				} else {
					if (documents.length > 0) {
						var promisesList = documents.map(it => {
							return readDocument(it)
						})
						
						promise.all(promisesList)
						.then(list => {
							for (var i = 0; i < list.length; i++) {
								list[i].statistics = documents[i].__data.statistics;
							}
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

 	Document.test = function test(cb) {
 		promise.resolve(bayesianMethod())
 		.then(res => {
 			console.log('response')
 			cb()
 		})
 		.catch(err => {
 			console.log(err)
 			cb()
 		})
	}

	Document.remoteMethod('test',{
		http: { 
			path: '/test', 
			verb: 'get' 
		},
		accepts: [
		],
		returns: { 
			arg: 'response', 
			type: 'object',
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
