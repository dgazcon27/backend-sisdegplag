module.exports = function(app) {
    /*
    * The `app` object provides access to a variety of LoopBack resources such as
    * models (e.g. `app.models.YourModelName`) or data sources (e.g.
    * `app.datasources.YourDataSource`). See
    * http://docs.strongloop.com/display/public/LB/Working+with+LoopBack+objects
    * for more info.
    */
    // app.datasources.storage.connector.getFileName = function(file, req, res) {
    //     var pattern = /^image\/.+$/;
    //     var value = pattern.test(file.type);
    //     if(value ){
    //         var origFilename = origFilename.name;
    //         var parts = origFilename.split('.'),
    //         extension = parts[parts.length-1];
    //         var newFilename = (new Date()).getTime()+'_'+parts[parts.length-2]+'.'+extension;
    //         return NewFileName;
    //     }
    //     else{
    //         throw "FileTypeError: Only File of Image type is accepted.";
    //     }
    // };
};
