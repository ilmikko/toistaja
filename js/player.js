var player=(function(){

var inc=(function(){
        var id=0;
        return function(){
        return id++;
        }
})();

_.key("Space",function(evt){
        evt.preventDefault();
        player.pause();
});
_.key("N",function(){
        player.next();
});
_.key("P",function(){
        player.prev();
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
                                        player.toFull();
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
                                $albumart.to({width:"100%",height:"100%"},{duration:"200s"});
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

                var     $pausebutton=$("<button>").text("=").on("click",function(){
                                player.pause();
                        }),
                        $nextbutton=$("<button>").text("N").on("click",function(){
                                player.next();
                        }),
                        $prevbutton=$("<button>").text("P").on("click",function(){
                                player.prev();
                        }),
                        $randombutton=$("<button>").text("R").on("click",function(){

                        });

                $controls.append(
                        //$randombutton,
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
                        $(" - "),
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
                                var metaalbum=meta.album||"Unknown Album",
                                metaartist=meta.artist||"Unknown Artist",
                                metatitle=meta.title||meta.filename||"No Title",
                                metawindowtitle=[metatitle,metaartist,metaalbum].join(" - ");
                                if (currenttitle!=metatitle){
                                        currenttitle=metatitle;
                                        $title.text(metatitle);
                                        $infotop.do([{opacity:0},{opacity:1}],{duration:"4s"});
                                }
                                if (currentartist!=metaartist){
                                        currentartist=metaartist;
                                        $artist.text(metaartist);
                                }
                                if (currentalbum!=metaalbum){
                                        currentalbum=metaalbum;
                                        $album.text(metaalbum);
                                }
                                if (currentwindowtitle!=metawindowtitle){
                                        currentwindowtitle=metawindowtitle;
                                        document.title=metawindowtitle;
                                }
                        }
                };
        })();

        var progressbar=(function(){
                var $progressbar=$("<div>").class("progressbar").on("click",function(evt){
                        // Get the position where clicked 0..1
                        var xpos=evt.mousePosition().x;
                });

                $infobot.append(
                        $("<div>").class("barwrapper").append($progressbar),
                        $controls
                );

                return {
                        update:function(json){
                                $progressbar.css({width:json.position*100+"%"});
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

                $(">button").on("mouseenter",function(){
                        this.to({backgroundColor:"rgba(255,255,255,0.2)"},{duration:"222ms"});
                }).on("mouseleave",function(){
                        this.to({backgroundColor:"transparent"},{duration:"222ms"});
                });

                $square.on("mouseenter",function(){
                        $controls.to({opacity:1},{duration:"400ms"});
                }).on("mouseleave",function(){
                        $controls.to({opacity:0});
                });

                info.show();

                update();
        });

        $player.append(
                $square.append(
                        $info
                )
        );

        return {
                albumart:albumart,
                buttons:buttons,
                info:info,
                insert:function(){
                        $body.append($player);
                },
                update:function(json){
                        //$out.text(json);
                        this.current=json=JSON.parse(json);
                        if (json.information){
                                var meta=json.information.category.meta;
                                albumart.update(meta.artwork_url);
                                progressbar.update(json);
                                info.update(meta);
                        }else{
                                albumart.update("img/noart.jpg");
                        }
                },
                command:function(cmd){
                        _.ajax("requests/status.json",{
                                data:{command:cmd},
                                callback:function(response){
                                        console.log("RESPONSE");
                                        controller.update(response);
                                }
                        });
                }
        };
})();

        return {
                toCompact:function(){
                        controller.info.hide();
                        controller.albumart.toFull();
                },
                toFull:function(){
                        controller.info.show();
                        controller.albumart.toSmall();
                },
                browse:function(){

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
