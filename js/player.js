var config=global.config;
var player=(function(){
        var version=2.28;

	var auth="";

	var user=config.username;
	var pass=config.password;

	if (user||pass) {
		auth=user+":"+pass+"@";
	}

	var host=config.host;
	var port=config.port;

        var remote="http://"+auth+host+":"+port; // Where VLC is running
	console.log("Remote: "+remote);
        var normalVolume=256; // The middle point of the volume

        // TODO:
        // Like/dislike button (wow, this is a cool song!) map to L & D
        // Better info
        //        (when album is clicked, show all songs of the album)
        //        When the title is clicked, show more info of the actual track
        //        When the artist is clicked, find songs from the same artist...
        // Internal playlist
        //        Play next - button
        //        What is going to play next?
        // ALT (haha, lol)

        var inc=(function(){var id=0;return function(){return id++;}})();

        _.key("Space",function(evt){
                player.pause();
        });
        _.key("Enter",function(evt){
                player.toggleCompact();
        });
        _.key("N",function(){
                player.next();
        });
        _.key("P",function(){
                player.prev();
        });
        _.key("S",function(){
                player.toggleSearch();
        });
        _.key("TAB",function(){
                player.toggleSearch();
        });
        _.key("ESC",function(){
                // I want back to the main screen!
                player.toggleSearch(false);
        });

        var controller=(function(){
                var $player=$("<div>").class("player");
                var $top,$mid,$bot;
                var $square=$("<div>").class("square center").append(
                        $top=$("<div>").class("top"),
                        $("<div>").class("mid").append(
                                $left=$("<div>").class("left"),
                                $mid=$("<div>").class("mid"),
                                $right=$("<div>").class("right")
                        ),
                        $bot=$("<div>").class("bot")
                );

                var $controls;
                $bot.append(
                        $controls=$("<div>").class("controls center hide")
                );

                var $out=$("<div>");

                (function(){
                        //Resizer
                        var q=function(){var ww=window.innerWidth,wh=window.innerHeight;return ww<wh?ww:wh;}

                        var lastSize=q();
                        var r=function(){
                                var currentSize=q(),c=currentSize+"px";
                                if (currentSize<300){
                                        if (!(lastSize<300)){
                                                player.toCompact();
                                        }
                                }else{
                                        if ((lastSize<300)){
                                                player.toNormal();
                                        }
                                }
                                lastSize=currentSize;
                                $square.css({width:c,height:c});
                        };

                        _.resize(r);
                        r();
                })();

                var albumart=(function(){
                        var tries=0;
                        var $albumart=$("<img>").class("albumart center").on("load",function(){
                                this.to({opacity:1},{duration:"2200ms"});
                        });
                        var $backgroundart=$("<img>").class("backgroundart center").on("load",function(){
                                $player.to({backgroundColor:"transparent"},{duration:"4s"});
                        });
                        var $loader=$("<img>").on("load",function(){
                                console.log("Album art set successfully.");
                                tries=0;
                                var src=this.get("src");
                                $albumart.set({src:src});
                                $backgroundart.set({src:src});
                        }).on("error",function(){
                                tries++;
                                if (tries==1){
                                        console.log("Loader: Cannot use local image, trying /art...");
                                        this.set({src:remote+"/art?r="+inc()});
                                }else if (tries==2){
                                        console.log("Loader: Cannot use /art, trying noart image...");
                                        this.set({src:"/img/noart.jpg?r="+inc()});
                                }else throw new Error("Loader: Cannot use noart image!");
                        });

                        $player.append($backgroundart)
                        $mid.append(
                                $("<div>").append(
                                        $albumart
                                )
                        );

                        return {
                                toFull:function(){
                                        $albumart.to({transform:"translate(-50%,-50%) scale(2,2)"});
                                },
                                toSmall:function(){
                                        $albumart.to({transform:"translate(-50%,-50%)"});
                                },
                                show:function(){},
                                hide:function(callback){
                                        $albumart.to({opacity:0},{duration:"300ms",done:callback});
                                        $player.to({backgroundColor:"black"},{duration:"200ms"});
                                },
                                update:function(url){
                                        console.log("Updating artwork url ("+url+")");
                                        controller.albumart.hide(function(){
                                                setTimeout(function(){
                                                        $loader.set({src:url+"?r="+inc()});
                                                },2000);
                                        });
                                }
                        };
                })();

                var buttons=(function(){
                        var anim=[{boxShadow:"0px 0px 12px white",backgroundColor:"white"},{boxShadow:"0px 0px 0px transparent"}];

                        var $fancyButton=$("<button>").on("mouseenter",function(){
                                this.to({backgroundColor:"rgba(255,255,255,0.2)"},{duration:"222ms"});
                        }).on("mouseleave",function(){
                                this.to({backgroundColor:"transparent"},{duration:"222ms"});
                        }).on("click",function(){
                                this.do(anim,{duration:"2s"});
                        });

                        var     $pausebutton=$fancyButton.clone().text("=").on("click",function(){
                                        player.pause();
                                }),
                                $nextbutton=$fancyButton.clone().text("N").on("click",function(){
                                        player.next();
                                }),
                                $prevbutton=$fancyButton.clone().text("P").on("click",function(){
                                        player.prev();
                                })

                        $controls.append(
                                $("<div>").class("buttonwrapper").append(
                                        $("<div>").append(
                                                $prevbutton,
                                                $pausebutton,
                                                $nextbutton
                                        )
                                )
                        );

                        return {
                                prev:function(){
                                        $prevbutton.do(anim,{duration:"2s"});
                                },
                                pause:function(){
                                        $pausebutton.do(anim,{duration:"2s"});
                                },
                                next:function(){
                                        $nextbutton.do(anim,{duration:"2s"});
                                },
                                hide:function(){
                                        $(".hide").to({opacity:0});
                                },
                                show:function(){
                                        $(".hide").to({opacity:1},{duration:"400ms"});
                                },
                                update:function(json){

                                }
                        };
                })();

                var info=(function(){
                        var $title=$("<span>");
                        var $artist=$("<span>");
                        var $album=$("<span>");

                        $top.append(
                                $("<div>").class("center").append(
                                        $("<p>").append(
                                                $title,
                                                $(" - "),
                                                $artist
                                        ),
                                        $album
                                )
                        );

                        return {
                                hide:function(){
                                        $top.to({opacity:0}).css({pointerEvents:"none"});
                                },
                                show:function(){
                                        $top.to({opacity:1}).css({pointerEvents:"auto"});
                                },
                                update:function(meta){
                                        if (meta==null){
                                                $top.css({opacity:0});
                                                document.title="";
                                        }else{
                                                $top.to({opacity:1},{duration:"4s"});
                                                var title=meta.title||meta.filename||"No Title",
                                                        artist=meta.artist||"Unknown Artist",
                                                        album=meta.album||"Unknown Album";
                                                $title.text(title);
                                                $artist.text(artist);
                                                $album.text(album);
                                                document.title=[title,artist,album].join(" - ");
                                        }
                                }
                        };
                })();

                var volumebar=(function(){
                        var $volumebar=$("<div>");

                        $left.append(
                                $("<div>").class("volumebar center hide").on("click",function(evt){
                                        // Get the position where we clicked 0..1
                                        var ypos=1-evt.mousePosition().y; // Invert because we want a value from bottom to top rather than top to bottom
                                        console.log("Set volume to %s",Math.round(ypos*normalVolume*2));
                                        controller.command("volume",{val:Math.round(ypos*normalVolume*2)});
                                }).append($volumebar)
                        );

                        return {
                                update:function(volume){
                                        $volumebar.css({height:volume*100+"%"});
                                }
                        };
                })();

                var progressbar=(function(){
                        var $progressbar=$("<div>");
                        var $current=$("<span>").text("-:-"),$length=$("<span>").text("-:-");

                        $controls.append(
                                $("<div>").class("progressbar")
                                .on("click",function(evt){
                                        controller.command("seek",{val:Math.round(evt.mousePosition().x*100)+"%"});
                                }).append($progressbar),
                                $("<div>",{class:"progresstext centerx"}).append(
                                        $current,$("<div>",{class:"separator"}),$length
                                )
                        );

                        function format(s){
                                var m=Math.floor(s/60);
                                var s=Math.floor(s-m*60);

                                return ('00'+m).slice(-2)+":"+('00'+s).slice(-2);
                        }

                        return {
                                update:function(position,length){
                                        $progressbar.css({width:position*100+"%"});
                                        var currentseconds=position*length;
                                        var lengthseconds=length;
                                        $current.text(format(currentseconds));
                                        $length.text(format(lengthseconds));
                                }
                        };
                })();

                var search=(function(){
                        var $playlist=$("<div>").class("playlist");

                        var $searchbarslave=$("<input>").set({disabled:true});

                        var $searchbar=$("<input>")
                                .css({opacity:0})
                                .on("keydown",function(evt){
                                        evt.stopPropagation();
                                        if (evt.key==27||evt.key==9){ // TAB or ESC
                                                player.toggleSearch(false);
                                        }
                                })
                                .on("input",function(){
                                        // Search playlist
                                        var v=this.value();
                                        playlist.search(v);
                                        $searchbarslave.value(v);
                                });
                        // NOTE: There are two search bars. I ran into issues with pages and focusing as the search bar was out of view.
                        // NOTE: So the input stays on the main page, and we merely copy its value to the "visual" search bar slave.


                        var playlist=(function(){

                                var $item=$("<div>").class("item").on("mouseenter",function(){
                                        this.to({backgroundColor:"rgba(255,255,255,0.3)"},{duration:"200ms"});
                                }).on("mouseleave",function(){
                                        this.to({backgroundColor:"transparent"},{duration:"400ms"});
                                }).on("click",function(){
                                        this.do([{boxShadow:"0px 0px 12px white",backgroundColor:"white"},{boxShadow:"0px 0px 0px transparent"}],{duration:"2s"});
                                });

                                return {
                                        search:function search(str){
                                                _.ajax(remote+"/requests/search.json",{
                                                        data:{search:str},
                                                        callback:function(response){
                                                                var json=JSON.parse(response);
                                                                var playlist=json.children[0];//FIXME: Not sure if this is always the case!
                                                                $playlist.empty();
                                                                if (playlist==null||str=="") return; else playlist=playlist.children;
                                                                for (var g=0;g<22;g++){
                                                                        var item=playlist[g];
                                                                        if (item==null) continue;
                                                                        $playlist.append(
                                                                                $item.clone().text(item.name).on("click",(function(item){
                                                                                        return function(){
                                                                                                $searchbar.value("");
                                                                                                $searchbarslave.value("");
                                                                                                search("");
                                                                                                player.play(item);
                                                                                        }
                                                                                })(item))
                                                                        );
                                                                }
                                                        }
                                                });
                                        }
                                };
                        })();

                        var $search=$("<search>")
                        .on("click",function(){
                                $searchbar.focus();
                        })
                        .class("square center search")
                        .append(
                                $searchbarslave,
                                $playlist
                        );

                        $player.append($searchbar,$search);

                        return {
                                playlist:playlist,
                                hidden:true,
                                show:function(){
                                        this.hidden=false;
                                        $searchbar.focus();
                                        // Page transform effect
                                        $search.to({transform:"translate(-50%,-50%)"});
                                        $square.to({transform:"translate(-150%,-50%)"});
                                },
                                hide:function(){
                                        this.hidden=true;
                                        $searchbar.blur();
                                        // Page transform back
                                        $search.to({transform:"translate(50%,-50%)"});
                                        $square.to({transform:"translate(-50%,-50%)"});
                                }
                        };
                })();

                function update(callback){
                        // Get an update from VLC and pass it to the controller
                        _.get(remote+"/requests/status.json",function(response){
                                controller.update(response);
                        });
                        setTimeout(update,250);
                }

                _.load(function(){
                        controller.insert();

                        $square.on("mouseover",function(){
                                if (player.layout=="normal") buttons.show();
                        }).on("mouseleave",function(){
                                if (player.layout=="normal") buttons.hide();
                        });

                        info.show();

                        update();
                });

                $player.append(
                        $square
                );

                var previousplaylistid;

                var currentSongStarttime=Date.now(),registeredAsPlayed=false;

                function resetSongData(){
                        currentSongStarttime=Date.now();
                        registeredAsPlayed=false;
                }

                return {
                        meta:{},
                        albumart:albumart,
                        buttons:buttons,
                        info:info,
                        search:search,
                        insert:function(){
                                $body.append($player);
                        },
                        update:function(json){
                                try{
                                        json=JSON.parse(json);
                                }
                                catch(err){
                                        //console.warn("VLC returned rubbish (not JSON)! %s",err);
                                        return;
                                }
                                var meta;
                                try{
                                        player.meta=meta=json.information.category.meta;
                                }
                                catch(err){
                                        console.warn("VLC returned a rubbish meta! %s",err);
                                        return;
                                }
                                // Detect only changes in the information, and send this information to the corresponding modules!

                                // First everything that needs a continuous update.

                                // Progress bar!
                                var position=json.position,length=json.length;
                                if (!isNaN(position)) progressbar.update(position,length);

                                // Volume bar!
                                var volume=json.volume;
                                if (!normalVolume&&!isNaN(volume)) normalVolume=volume;
                                var normalizedVolume=(volume/normalVolume)/2;
                                if (!isNaN(normalizedVolume)) volumebar.update(normalizedVolume);

                                // Some additional data for Ratings
                                // Determine if we have listened to this song
                                // A song is determined played if we have spent 22% of the song's time playing the song (even if the song is paused)
                                var percentListened=(Date.now()-currentSongStarttime)/(length*1000);
                                if (percentListened>0.22&&!registeredAsPlayed){
                                        registeredAsPlayed=true;
                                        rating.played(meta);
                                }

                                // Then we detect if the track has changed.
                                var playlistid=json.currentplid;
                                if (playlistid!=previousplaylistid){
                                        previousplaylistid=playlistid;
                                        console.log("TRACK CHANGE!");

                                        resetSongData();

                                        // Update everything that gets updated when the track changes

                                        // Album art! (the most important, IMHO)
                                        var albumarturl=meta.artwork_url;
                                        albumart.update(albumarturl);

                                        // Album info! Titles and such!
                                        info.update(meta);
                                }
                        },
                        command:function(cmd,ext){
                                var data={};
                                data['command']=cmd;
                                if (ext) $.extend(data,ext);
                                _.ajax(remote+"/requests/status.json",{
                                        data:data,
                                        callback:function(response){controller.update(response);}
                                });
                        }
                };
        })();

        return {
                layout:"normal",
                toCompact:function(){
                        this.toggleSearch(false);
                        this.layout="compact";
                        controller.info.hide();
                        controller.buttons.hide();
                        controller.albumart.toFull();
                },
                toNormal:function(){
                        this.layout="normal";
                        controller.info.show();
                        controller.albumart.toSmall();
                },
                toggleSearch:function(force){
                        if (player.layout=="normal"){
                                var s=force;
                                if (s==null) s=controller.search.hidden;
                                if (s){
                                        controller.search.show();
                                }else{
                                        controller.search.hide();
                                }
                        }
                },
                toggleCompact:function(force){
                        var s=force;
                        if (s==null) s=this.layout=="normal";
                        if (s){
                                this.toCompact();
                        }else{
                                this.toNormal();
                        }
                },
                play:function(item){
                        controller.command("pl_play",{id:item.id});
                        this.toggleSearch(false);//hide search window
                },
                pause:function(){
                        controller.buttons.pause();
                        controller.command("pl_pause");
                },
                next:function(){
                        currenturl="";
                        controller.buttons.next();
                        controller.command("pl_next");
                },
                prev:function(){
                        currenturl="";
                        controller.buttons.prev();
                        controller.command("pl_previous");
                }
        };
})();
