var _=(function(){
        // LIGHT IS A GENERAL HELPER
        var loadQuery=[];
        window.addEventListener("load",function(){
                while(loadQuery.length>0){
                        loadQuery.shift()();
                }
        });
        var keys={
                "Backspace":8,
                "TAB":9,
                "Enter":13,
                "Shift":16,
                "Ctrl":17,
                "LeftAlt":18,
                "ESC":27,
                "Left":37,"Up":38,"Right":39,"Down":40,
                "1":49,"2":50,"3":51,"4":52,"5":53,"6":54,"7":55,"8":56,"9":57,"0":48,
                "A":65,"B":66,"C":67,"D":68,"E":69,"F":70,"G":71,"H":72,"I":73,"J":74,"K":75,"L":76,"M":77,"N":78,"O":79,"P":80,"Q":81,"R":82,"S":83,"T":84,"U":85,"V":86,"W":87,"X":88,"Y":89,"Z":90,
                "LeftSuper":91,
                "F1":112,"F2":113,"F3":114,"F4":115,"F5":116,"F6":117,"F7":118,"F8":119,"F9":120,"F10":121,"F11":122,"F12":123,
                "Space":32
        };
        var keyEvents=(function(){
                var data={};
                return {
                        register:function(id,callback){
                                var cid=id;
                                if (isNaN(cid)) cid=keys[cid];
                                if (isNaN(cid)) throw new Error("Cannot register key: id #"+id+" not defined!");
                                var d=data[cid];
                                if (d==null) d=[];
                                d.push(callback);
                                data[cid]=d;
                        },
                        fire:function(evt){
                                var id=evt.keyCode;
                                console.log("keyEvent "+id);
                                var d=data[id];
                                if (d==null) return;
                                for (var g=0,glen=d.length;g<glen;g++){
                                        evt.preventDefault();
                                        d[g](evt);
                                }
                        }
                };
        })();
        window.addEventListener("keydown",function(event){
                keyEvents.fire(event);
        });
        return {
                keys:keys,
                key:function(id,callback){
                  keyEvents.register(id,callback);
                },
                ajax:function(url,options){
                  var xmh=new XMLHttpRequest();
                  if (options==null) options={};
                  if (options.callback)
                    xmh.onreadystatechange=function(){
                      if (xmh.readyState<4) return;
                      options.callback(xmh.responseText);
                    };

                  var query="",data=options.data;
                  if (typeof data==="string") query=data;
                  else for (var g in data){
                    query+=g+"="+data[g]+"&";
                  }

                  if (query!="")
                  xmh.open("GET",url+"?"+query.slice(0,-1));
                  else
                  xmh.open("GET",url);

                  xmh.send();
                },
                send:function(url,data){
                  var query="?";
                  if (data==null) query="";
                  else if (typeof data==="string") query=data
                  else for (var g in data){
                    if (query!="?") query+="&";
                    query+=g+"="+data[g];
                  }
                  var xmh=new XMLHttpRequest();
                  xmh.open("GET",url+query);
                  xmh.send();
                },
                get:function(url,callback){
                  var xmh=new XMLHttpRequest();
                  xmh.onreadystatechange=function(){
                    if (xmh.readyState<4) return;
                    callback(xmh.responseText);
                  };
                  xmh.open("GET",url);
                  xmh.send();
                },
                load:function(func){
                        loadQuery.push(func);
                },
                resize:function(func){
                        window.addEventListener("resize",func);
                }
        };
})();
