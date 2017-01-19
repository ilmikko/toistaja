var rating=(function(){
        // The ratings is a separate module, because it needs Node.js to work.
        // It would be a shame if Toistaja didn't work without Node.js just because the stupid
        // ratings system needs Node.js.
        // Node.js is awesome.

        var crypt=require("crypto");

        var data=file.getJSONSync("songmeta.json",{});

        function Song(id,extend){
                this.id=id;
                this.score=0;
                this.plays=0;
                $.extend(this,extend);
        }

        return {
                genIdFromMeta:function(meta){
                        // Generate an ID (sha1 sum) for a song using the meta data
                        // Properties that are needed to match to identify as the same song
                        var shash=crypt.createHash("sha1");
                        var matchProperties=["artist","album","title"];
                        for (var g in matchProperties) if (meta[matchproperties[g]]) shash.update(meta[matchProperties[g]]);
                        return shash.digest("hex");
                },
                getSongFromMeta:function(meta){
                        var id=this.genIdFromMeta(meta);
                        return data[id]=new Song(id,data[id]);
                },
                up:function(meta){
                        var song=this.getSongFromMeta(meta);
                        return ++song.score;
                },
                down:function(meta){
                        var song=this.getSongFromMeta(meta);
                        return --song.score;
                },
                played:function(meta){
                        var song=this.getSongFromMeta(meta);
                        return ++song.plays;
                }
        };
})();
