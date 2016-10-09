var player=(function(){
        var version=2.0;

        var inc=(function(){
                var id=0;
                return function(){
                        return id++;
                }
        })();

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
                        var currenturl="";
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
                                hide:function(){
                                        $albumart.stop().css({opacity:0});
                                        $player.stop().css({backgroundColor:"black"});
                                },
                                update:function(url){
                                        if (url!=currenturl){
                                                console.log("Updating artwork url ("+url+"!="+currenturl+")");
                                                currenturl=url;
                                                controller.albumart.hide();
                                                $loader.set({src:currenturl+"?r="+inc()});
                                        }
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

                        var $oneliner=$("<p>").append(
                                $title,
                                $artist
                        );
                        var $album=$("<p>");

                        var $songtitle=$("<div>").append(
                                $oneliner,
                                $album
                        );

                        $infotop.append($songtitle);

                        var currentalbum="",currentartist="",currenttitle="",currentwindowtitle="";
                        return {
                                hide:function(){
                                        $info.to({opacity:0}).css({pointerEvents:"none"});
                                },
                                show:function(){
                                        $info.to({opacity:1}).css({pointerEvents:"auto"});
                                },
                                update:function(meta){
                                        if (meta==null){
                                                $title.text(currenttitle="");
                                                $artist.text(currentartist="");
                                                $album.text(currentalbum="");
                                                document.title=currentwindowtitle="";
                                        }else{
                                                var metaalbum=meta.album||"Unknown Album",
                                                metaartist=meta.artist||"Unknown Artist",
                                                metatitle=meta.title||meta.filename||"No Title",
                                                metawindowtitle=[metatitle,metaartist,metaalbum].join(" - ");
                                                if (currenttitle!=metatitle){
                                                        $title.text(currenttitle=metatitle);
                                                        $infotop.do([{opacity:0},{opacity:1}],{duration:"4s"});
                                                }
                                                if (currentartist!=metaartist){
                                                        $artist.text(" - "+(currentartist=metaartist));
                                                }
                                                if (currentalbum!=metaalbum){
                                                        $album.text(currentalbum=metaalbum);
                                                }
                                                if (currentwindowtitle!=metawindowtitle){
                                                        document.title=currentwindowtitle=metawindowtitle;
                                                }
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
                                        controller.command("seek",Math.round(xpos*100)+"%");
                                }).append($progressbar)
                        );

                        return {
                                update:function(json){
                                        $progressbar.css({width:json.position*100+"%"});
                                }
                        };
                })();

                var search=(function(){

                        var $playlist=$("<div>").class("playlist");

                        var $searchbar=$("<input>").on("keydown",function(evt){
                                evt.stopPropagation();
                        }).on("input",function(){
                                // Search playlist
                                playlist.search(this.value());
                        });

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
                                $searchbar,
                                $playlist
                        );

                        $player.append($search);

                        return {
                                playlist:playlist,
                                hidden:true,
                                show:function(){
                                        this.hidden=false;
                                        // Page transform effect
                                        $search.to({transform:"translate(-50%,-50%)"});
                                        $square.to({transform:"translate(-150%,-50%)"});
                                },
                                hide:function(){
                                        this.hidden=true;
                                        // Page transform back
                                        $search.to({transform:"translate(50%,-50%)"});
                                        $square.to({transform:"translate(-50%,-50%)"});
                                }
                        };
                })();

                function update(callback){
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

                return {
                        albumart:albumart,
                        buttons:buttons,
                        info:info,
                        search:search,
                        insert:function(){
                                $body.append($player);
                        },
                        update:function(json){
                                this.current=json=JSON.parse(json);
                                if (json.information){
                                        var meta=json.information.category.meta;
                                        albumart.update(meta.artwork_url);
                                        progressbar.update(json);
                                        info.update(meta);
                                }else{
                                        albumart.update("img/noart.jpg");
                                        info.update();
                                }

                        },
                        command:function(cmd,ext){
                                var data={};
                                data['command']=cmd;
                                if (ext) $.extend(data,ext);
                                _.ajax("requests/status.json",{
                                        data:data,
                                        callback:function(response){
                                                console.log("RESPONSE");
                                                controller.update(response);
                                        }
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
