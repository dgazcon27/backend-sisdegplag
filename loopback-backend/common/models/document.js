'use strict';

module.exports = function(Document) {

	var app;
	Document.on('attached', function (a) {
		app = a;
	});

	Document.upload = function (req, res, cb) {
		var Container = app.models.Container;
		var AccessToken = app.models.AccessToken;
		var error;
		if (process.env.NODE_ENV === 'development') {
			Container.upload(req, res, { container: 'documents' }, cb())
		} else {
			Container.upload(req, res, { container: 'documents' }, cb())
		}
	}
	/* Remote Methods */

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
