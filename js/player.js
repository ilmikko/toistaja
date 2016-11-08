var player=(function(){
        var version=2.22;

        // TODO:
        // Like/dislike button (wow, this is a cool song!) map to L & D, save to JSON, bind to title tjsp (as playlist id can change)
        // Better info
        //        (when album is clicked, show all songs of the album)
        //        When the title is clicked, show more info of the actual track
        //        When the artist is clicked, find songs from the same artist...

        var inc=(function(){var id=0;return function(){return id++;}})();

        _.key("Space",function(evt){
                player.pause();
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
                var $square=$("<div>").class("square");
                var $controls=$("<div>").class("controls");
                var $infotop,$infobot;
                var $info=$("<div>").class("info").append(
                        $infotop=$("<div>").class("infotop"),
                        $infobot=$("<div>").class("infobot")
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
                        var $loader=$("<img>").on("load",function(){
                                console.log("Album art set successfully.");
                                tries=0;
                                var src=this.get("src");
                                $albumart.set({src:src});
                                $backgroundart.set({src:src});
                                albumart.show();
                        }).on("error",function(){
                                tries++;
                                if (tries==1){
                                        console.log("Loader: Cannot use local image, trying /art...");
                                        this.set({src:"/art?r="+inc()});
                                }else if (tries==2){
                                        console.log("Loader: Cannot use /art, trying noart image...");
                                        this.set({src:"img/noart.jpg?r="+inc()});
                                }else throw new Error("Loader: Cannot use noart image!");
                        });
                        var $albumart=$("<img>").class("albumart");
                        var $backgroundart=$("<img>").class("backgroundart");

                        $player.append($backgroundart)
                        $square.append($albumart);

                        return {
                                toFull:function(){
                                        $albumart.to({width:"95%",height:"95%"});
                                },
                                toSmall:function(){
                                        $albumart.to({width:"50%",height:"50%"});
                                },
                                show:function(){
                                        $albumart.to({opacity:1},{duration:"2s",delay:"1s"});
                                        $player.to({backgroundColor:"transparent"},{duration:"4s"});
                                },
                                hide:function(callback){
                                        $albumart.stop().to({opacity:0},{duration:"200ms"});
                                        $player.stop().to({backgroundColor:"black"},{duration:"200ms",callback:callback});
                                },
                                update:function(url){
                                        console.log("Updating artwork url ("+url+")");
                                        controller.albumart.hide(function(){
                                                $loader.set({src:url+"?r="+inc()});
                                        });
                                }
                        };
                })();

                var buttons=(function(){
                        var anim=[{boxShadow:"0px 0px 12px white",backgroundColor:"white"},{boxShadow:"0px 0px 0px transparent",backgroundColor:"transparent"}];

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
                                $prevbutton,
                                $pausebutton,
                                $nextbutton
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
                                update:function(json){

                                }
                        };
                })();

                var info=(function(){
                        var $title=$("<span>");
                        var $artist=$("<span>");
                        var $album=$("<span>");

                        $infotop.append(
                                $("<div>").append(
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
                                        $info.to({opacity:0}).css({pointerEvents:"none"});
                                },
                                show:function(){
                                        $info.to({opacity:1}).css({pointerEvents:"auto"});
                                },
                                update:function(meta){
                                        if (meta==null){
                                                $infotop.css({opacity:0});
                                                document.title="";
                                        }else{
                                                $infotop.do([{opacity:0},{opacity:1}],{duration:"4s"});
                                                var title=meta.title||meta.filename||"No Title",
                                                        artist=meta.artist||"Unknown Artist",
                                                        album=meta.album||"Unknown Album";
                                                $title.text(title);
                                                $artist.text(artist);
                                                $album.text(album);
                                                document.title=[title,artist,album].join("-");
                                        }
                                }
                        };
                })();

                var progressbar=(function(){
                        var $progressbar=$("<div>").class("progressbar");

                        $controls.append(
                                $("<div>").class("barwrapper").on("click",function(evt){
                                        // Get the position where we clicked 0..1
                                        var xpos=evt.mousePosition().x;
                                        controller.command("seek",{val:Math.round(xpos*100)+"%"});
                                }).append($progressbar)
                        );

                        return {
                                update:function(position){
                                        $progressbar.css({width:position*100+"%"});
                                }
                        };
                })();

                var search=(function(){
                        var $playlist=$("<div>").class("playlist");

                        var $searchbarslave=$("<input>",{disabled:true});

                        var $searchbar=$("<input>")
                                .css({
                                        opacity:0
                                })
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
                                        this.do([{boxShadow:"0px 0px 12px white",backgroundColor:"white"},{boxShadow:"0px 0px 0px transparent",backgroundColor:"transparent"}],{duration:"2s"});
                                });

                                return {
                                        search:function search(str){
                                                _.ajax("requests/search.json",{
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

                        var $search=$("<search>").class("square search").append(
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
                        _.get("requests/status.json",function(response){
                                controller.update(response);
                        });
                        setTimeout(update,400);
                }

                _.load(function(){
                        controller.insert();

                        $square.on("mouseenter",function(){
                                if (player.layout=="normal")
                                        $controls.to({opacity:1},{duration:"400ms"});
                        }).on("mouseleave",function(){
                                if (player.layout=="normal")
                                        $controls.to({opacity:0});
                        });

                        info.show();

                        update();
                });

                $player.append(
                        $square.append(
                                $info.append(
                                        $controls
                                )
                        )
                );

                var previousplaylistid;

                return {
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
                                        console.warn("VLC returned rubbish (not JSON)! %s",err);
                                        return;
                                }
                                //console.log(json);
                                // Detect only changes in the information, and send this information to the corresponding modules!

                                // First everything that needs a continuous update.

                                // Progress bar!
                                var position=json.position;
                                if (!isNaN(position)) progressbar.update(position);

                                // Then we detect if the track has changed.
                                var playlistid=json.currentplid;
                                if (playlistid!=previousplaylistid){
                                        previousplaylistid=playlistid;
                                        console.log("TRACK CHANGE!");

                                        try{
                                                var meta=json.information.category.meta;
                                        }
                                        catch(err){
                                                console.warn("VLC returned a rubbish meta! %s",err);
                                                return;
                                        }
                                        console.log(meta);

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
                                _.ajax("requests/status.json",{
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
