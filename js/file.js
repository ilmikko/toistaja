var file=(function(){
        // A basic file i/o handler.
        var fs=require("fs");
        var files={};
        var datafolder="data/";

        function save(){
                for (var g in files){
                        fs.writeFileSync(g,JSON.stringify(files[g]));
                }
        }

        process.on("exit",save);

        return {
                save:save,
                getJSON:function(){},
                getJSONSync:function(src,def){
                        try{
                                return files[datafolder+src]=JSON.parse(fs.readFileSync(datafolder+src,"utf-8"));
                        }
                        catch(err){
                                console.warn("Cannot get '%s', reverting to default",datafolder+src);
                                return files[datafolder+src]=def;
                        }
                }
        };
})();
