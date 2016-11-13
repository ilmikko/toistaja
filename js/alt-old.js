var alt=(function(){
        var version=2.8022;

        var type=function(a){
                var t=typeof a;
                if (a instanceof Array) return "enumerable";
                else if (a instanceof Node) return "node";
                else if (t==="object"){
                        if (a!=null&&!isNaN(a.length)&&a.length>=0) return "enumerable";
                        if (!isNaN(a.nodeType)) return "node";
                }
                return t;
        };
        var extend=function(a,b){
                for (var g in b) a[g]=b[g];
        };
        var genId=(function(){var id=0;return function(){return id++;};})();

        var listeners={};
        var animation=(function(){
                return {
                        data:{},
                        genName:function(){
                                return "alt-anim-"+genId();
                        },
                        get:function(name){
                                return this.data[name];
                        },
                        remove:function(name){
                                var animation=this.data[name];//get the animation by name
                                if (animation==null) throw new Error("New error: animation "+name+" cannot be found!");
                                var styleElement=animation.style;//get the style element
                                styleElement.parentNode.removeChild(styleElement);//remove the style element
                                delete this.data[name];//remove the reference
                                return animation;//return the deleted animation
                        },
                        create:function(keyframes){
                                var style=document.createElement("style");//Create the style element
                                var animation=new Animation(keyframes,style);//Return the animation object;
                                style.innerHTML=keyframes.toString(animation.name);//Populate the style element
                                document.head.appendChild(style);//Append the style element to head
                                return this.data[animation.name]=animation;
                        }
                };
        })();
        var options=(function(){
                function Options(opts){
                        for (var g in opts) this[g]=opts[g];
                }
                Options.prototype={
                        set:function(obj){
                                for (var g in obj) if (!(g in this)) this[g]=obj[g];
                                return this;
                        }
                };
                return {
                        Alt:function(opts){
                                opts=new Options(opts);
                                if (!opts.set) opts.set={};
                                if (opts.class){opts.set["class"]=opts.class;}
                                return opts;
                        },
                        Animation:function(opts){
                                opts=new Options(opts);
                                if (!opts.ms) opts.ms=1000;
                                if (!opts.fillMode) opts.fillMode="both";
                                if (opts.loop){
                                        // Shorthand for these
                                        opts.iterationCount="infinite";
                                        opts.direction="alternate";
                                        // As the direction went alternate, we need to set the duration to be 2x faster
                                        opts.ms/=2;
                                }
                                opts.duration=opts.ms+"ms";
                                return opts;
                        },
                        Element:function(opts){
                                opts=new Options(opts);
                                if (!opts.id) opts.id="one";
                                if (!opts.modules) opts.modules={};

                                if (type(opts.modules)=="enumerable"){
                                        // If a list of sorts, turn into keys
                                        var o={};
                                        for (var g in opts.modules) o[opts.modules[g]]=true;
                                        opts.modules=o;
                                }

                                // User-friendly shortcuts
                                if (opts.animation){opts.modules["animation"]=true;}
                                return opts;
                        },
                        Module:function(opts){
                                opts=new Options(opts);
                                if (!opts.requires) opts.requires=[];
                                return opts;
                        }
                };
        })();
        var element=(function(){
                var modules={};

                function Module(id,init,prototype,opts){
                        this.id=id;
                        this.requires=opts.requires;

                        this.optional=opts.optional||false;

                        this.proto=prototype;
                        this.init=init;

                        this.buildDependencies();

                        this.buildConstructor(init,prototype);
                }
                Module.prototype={
                        eachDependency:function(callback){
                                for (var g in this.dependencies){
                                        callback.call(modules[this.dependencies[g]],g);
                                }
                        },
                        buildConstructor:function(init,prototype){
                                var initlist=[],proto=prototype,optional={};
                                function depiter(deps){
                                        for (var id in deps){
                                                if (deps[id]) depiter(deps[id]);
                                                //console.log("Very bottom is %s",g);
                                                var module=modules[id];
                                                if (module.optional) optional[id]=true;
                                                if (module.init) initlist.push({f:module.init,name:id});
                                                if (module.customExtend) module.customExtend(proto,module.proto); else extend(proto,module.proto);
                                        }
                                }
                                depiter(this.dependencies);
                                if (init!=null) initlist.push(init);
                                //console.log(initlist);

                                this.disabled=optional;

                                var self=this;
                                this.construct=function(args,opts){
                                        for (var g=0,glen=initlist.length;g<glen;g++){
                                                var io=initlist[g];
                                                // Do not init disabled modules unless they're specifically enabled in opts.modules
                                                if (self.disabled[io.name]&&!opts.modules[io.name]) continue;
                                                io.f.apply(this,args);
                                        }
                                 };
                                this.construct.prototype=proto;
                        },
                        buildDependencies:function(){
                                function depiter(reqs,deps){
                                        if (deps==null) deps={};
                                        for (var g=0,glen=reqs.length;g<glen;g++){
                                                var id=reqs[g];
                                                var module=modules[id];
                                                deps[id]=depiter(module.requires,deps[id]);
                                        }
                                        return deps;
                                }
                                this.dependencies=depiter(this.requires,{});
                        }
                };



                return {
                        create:function(element,opts){
                                opts=options.Element(opts);
                                var id=opts.id;
                                if (!(id in modules)) throw new Error("Cannot find module '"+id+"'!");
                                var module=modules[id];
                                return new module.construct([element],opts);
                        },

                        module:function(id,init,prototype,opts){
                                opts=options.Module(opts);
                                if (id in modules) throw new Error("Cannot create module '"+id+"', a module with the same ID exists!");
                                var module;
                                modules[id]=module=new Module(id,init,prototype,opts);
                        }
                };
        })();

        // ** ------------------------------------ ALT ITSELF :3 ------------------------------------ **//

        var alt=function(anything,opts){
                opts=options.Alt(opts);
                var e=alt.get(anything,opts);

                // User-friendly convenience
                e.set(opts.set);

                return e;
        };

        // ** ------------------------------------ ALT EXTENSIONS ------------------------------------ **//

        alt.extend=function(obj){
                for (var g in obj) this[g]=obj[g];
        };
        alt.extend({
                version:version,
                extend:extend,
                type:type,
                text:function(a){
                        return document.createTextNode(a);
                },
                here:function(e){
                        $(document.currentScript).after(e);
                },
                key:function(){
                        return animation.create(new Keyframes(arguments));
                },
                /*
                        ALT GET FUNCTION
                        Probably the most important part of optimization is this
                        function. This function can receive almost any input and
                        it gets sorted out into proper sections.

                        Example parameters:
                        "<p>" - Returns a wrapped p element
                        ">p" - Returns all the p elements in the document
                        "#p" - Returns the element with the id p
                        "Text" - Returns a text node
                        ["<p>","<a>"] - Returns a 'p' and an 'a' element
                        etc...
                */
                get:function(anything,options){
                        var c=type(anything);
                        if (c==="string"){
                                var firstchar=anything.charAt(0);
                                if (firstchar==="<"){
                                        //DOM creation
                                        var tagname=anything.slice(1,-1);
                                        return element.create(document.createElement(tagname),options);
                                }else if (firstchar=="#"){
                                        //ID
                                        var id=anything.slice(1);
                                        return element.create(document.getElementById(id),options);
                                }else if (firstchar==">"){
                                        //TAGNAME
                                        var name=anything.slice(1);
                                        return element.create(document.getElementsByTagName(name),options.set({id:"group"}));
                                }else if (firstchar=="."){
                                        //CLASS
                                        var classname=anything.slice(1);
                                        return element.create(document.getElementsByClassName(classname),options.set({id:"group"}));
                                }else{
                                        //First char not recognized, create a text node
                                        return element.create(document.createTextNode(anything),options);
                                }
                        }else if (c==="enumerable"){
                                // TODO: Alt is too strict about the empty sets, create a dummy empty set maybe?
                                // TODO: Or just warn beforehand, "you're going to see errors"?
                                // TODO: Basically every called property is useless for a dummy empty set
                                if (anything.length===1){
                                        return alt(anything[0]);
                                }else if (anything.length===0){
                                        throw new Error("alt tried to create an empty wrapper");
                                }else if (anything.length>1){
                                        // TODO: ENUMERATING AN ENUMERABLE IS HEAVY.
                                        var elementlist=[];
                                        for (var g=0,glen=anything.length;g<glen;g++){
                                                var aww=alt.get(anything[g]);
                                                aww._each(function(){elementlist.push(this);});
                                        }
                                        if (elementlist.length==1){
                                                return element.create(elementlist[0],options);
                                        }else if (elementlist.length>1){
                                                return element.create(elementlist,options.set({id:"group"}));
                                        }else{
                                                alert(anything.nodeType);
                                                console.warn("Returning an empty wrapper for enumerable!");
                                                return element.create(null,"empty");
                                        }
                                }else throw new Error("Alt cannot parse array, invalid length: "+anything.length);
                        }else if (c==="object"){
                                if (anything._isAlt){
                                        // Sure, if the object says so.
                                        // Notice the underscore?
                                        // IDGAF
                                        return anything;
                                }else if (anything._toAlt){
                                        return anything._toAlt();
                                }else throw new Error("Alt cannot parse object *shrugs*");
                        }else if (c==="node"){
                                //Already a DOM Node
                                if (anything.getAttribute){
                                        var id=anything.getAttribute("data-altid");
                                        if (id){
                                                return element.get(id);
                                        }
                                }
                                return element.create(anything);

                        }else if (c==="undefined"){
                                console.warn("Returning an empty set");
                                return element.create(null,"empty");
                        }else throw new Error("Alt cannot parse type: "+c);
                }
        });

        // ** ------------------------------------ CONSTRUCTORS ------------------------------------ **//

        function CSS(css){
                this.data=css;
        }
        CSS.prototype={
                toString:function(){
                        var self=this;
                        return "{"+(function(){
                                var str="";
                                for (var g in self.data)
                                        str+=fromCamelCase(g)+":"+self.data[g]+";";
                                return str;
                        })()+"}";
                }
        };

        function Keyframes(keyframes){
                this.data=[];
                for (var g=0,glen=keyframes.length;g<glen;g++){
                        this.data.push(new CSS(keyframes[g]));
                }
        }
        Keyframes.prototype={
                getProperties:function(){
                        var props={};
                        for (var g=0,glen=this.data.length;g<glen;g++)
                                for (var h in this.data[g].data) props[h]=true;
                        return props;
                },
                toString:function(name){
                        var self=this;
                        return "@keyframes "+name+" {"+(function(){
                                var str="";
                                for (var g=0,glen=self.data.length;g<glen;g++)
                                        str+=(g/(glen-1)*100).toFixed(2)+"%"+self.data[g].toString();
                                return str;
                        })()+"}";
                }
        };

        function Animation(keyframes,style){
                if (keyframes.length<=1) console.warn("Animation with keyframe length "+keyframes.length+" is probably useless");
                this.name=animation.genName();
                this.keyframes=keyframes;
                this.properties=keyframes.getProperties();
                this.style=style;
        }

        function fromCamelCase(str){
                return str.replace(/[A-Z]/g,function(a){
                        return "-"+a.toLowerCase();
                });
        }

        // ** ----------------------------------- ALT EVENT WRAPPER ----------------------------------- **//

        /*
                There's a bit of a fuzz considering the alt event wrapper.
                The alt event wrapper WILL NOT contain a replacement to all properties
                provided by the original event. It tries to simplify and standardify
                the ways events are mostly used in.
                If you think you don't need alt event wrapper, you can always use
                the option {native:true}, kill the overhead, and just use the
                original event object. However, if you do think something should
                be added, it surely can be added if necessary!
                Just not all of them.
        */

        function altEventWrapper(elem){
                // Stores the original event
                this.e=elem;
                this.o=null;
        }
        extend(altEventWrapper,{
                choose:function(el,evt){
                        this.length=0;
                        // Create a default event wrapper
                        var ew=new altEventWrapper(el);
                        // Specialize for specific events (like mouse events)
                        ew._specialize(evt);
                        return ew;
                }
        });
        altEventWrapper.prototype={
                _specialize:function(evt){
                        // Try to keep overhead as MINIMUM as possible.
                        this.o=evt;
                        if (evt instanceof KeyboardEvent){
                                this.key=evt.keyCode;
                        }
                        if (evt instanceof AnimationEvent){
                                this.animation=animation.get(evt.animationName);
                        }
                },
                stopPropagation:function(){
                        this.o.stopPropagation();
                },
                preventDefault:function(){
                        this.o.preventDefault();
                },
                mousePosition:function(){
                        var evt=this.o,el=this.e,bd=el.getBoundingClientRect();
                        var mx=evt.pageX-bd.left,my=evt.pageY-bd.top;
                        return {x:mx/el.offsetWidth,y:my/el.offsetHeight};
                }
        };

        // ** --------------- MODULE CONFIG (Just for the sake of my sanity for now) --------------- ** //

        (function(){
                return element.module("core",function(){
                        this._id=genId();
                        this.length=0;
                        this._set.apply(this,arguments);
                },{
                        _isAlt:true,//I identify as an alt element
                });
        })();

        (function(){
                function wrap(original,self,options){
                        return function(evt){
                                if (options.onlyonce) self._deafen(id);
                                if (!options.native) evt=altEventWrapper.choose(this,evt);
                                return original.call(self,evt);
                        }
                }

                return element.module("event",function(){
                        this._events={};
                },{
                        _listen:function(name,callback,options){
                                /*
                                        Supported options:
                                                onlyonce - fire this event only once
                                                native - do not use alt3's own event wrapper
                                */
                                if (options==null) options={};
                                var id=options.id||genId();
                                wrapped=wrap(callback,this,options);
                                listeners[id]={name:name,callback:callback,wrapped:wrapped,options:options};
                                this._events[id]=true;
                                this[0].addEventListener(name,wrapped,options);
                                return id;
                        },
                        _deafen:function(){
                                for (var g=0,glen=arguments.length;g<glen;g++){
                                        var id=arguments[g];
                                        var listener=listeners[id];
                                        if (listener==null) throw new Error("Cannot deafen listener id #"+id+"!");
                                        delete this._events[id];
                                        this[0].removeEventListener(listener.name,listener.wrapped,listener.options);
                                }
                                return this;
                        },

                        _getEvents:function(){
                                return this._events;
                        },
                        _setEvents:function(_events){
                                for (var id in _events){
                                        var listener=listeners[id];
                                        if (listener==null) throw new Error("Cannot set event listener,listener id "+id+" null!");
                                        this._events[id]=true;
                                        this[0].addEventListener(listener.name,wrap(listener.callback,this,listener.options),listener.options);
                                }
                        },

                        fire:function(name){
                                // TODO: EVENT FIRE
                        },

                        on:function(name,callback){
                                this._listen(name,callback);
                                return this;
                        },
                        one:function(name,callback){
                                this._listen(name,callback,{onlyonce:true});
                                return this;
                        }
                });
        })();

        (function(){
                function AnimProperties(id){
                        this.data=[];
                        this._id=id;
                }
                AnimProperties.prototype={
                        add:function(animproperty){
                                console.log("Add property (#%s)",this._id);
                                this.data.push(animproperty);
                                return animproperty;
                        },
                        get:function(name){
                                for (var g=0,glen=this.data.length;g<glen;g++){
                                        if (this.data[g].animation.name==name) return this.data[g];
                                }
                        },
                        toString:function(){
                                return this.data.join(",");
                        },
                        remove:function(name){
                                console.log("Remove property (#%s)",this._id);
                                for (var g=0,glen=this.data.length;g<glen;g++){
                                        if (this.data[g].animation.name==name){var o=this.data[g];this.data.splice(g,1);return o;}
                                }
                        }
                };

                function AnimProperty(animation,options){
                        this.options=options;
                        this.animation=animation;
                }
                AnimProperty.prototype={
                        toString:function(){
                                var anim=this.animation,opts=this.options;
                                return [anim.name,opts.duration,opts.timingFunction,opts.delay,opts.iterationCount,opts.direction,opts.fillMode,opts.playState].join(" ");
                        }
                };

                return element.module("animation",function(){
                        console.log("INIT ANIM FOR ELEM ID #%s",this._id);
                        this._animproperties=new AnimProperties(this._id);
                        this._animations={};
                        var self=this;

                        this._listen("animationend",function(evt){
                                var animationName=evt.animationName;
                                evt.stopPropagation(); // Prevent animation end affecting parent elements
                                console.log("An animation %s has ended on an alt3 animation enabled element. (#%s)",animationName,self._id);
                                var prop=self._removeAnimation(animationName);
                                var callback=prop.options.callback;
                                if (callback) callback();
                        },{native:true});
                },{
                        _getCurrentSnapshot:function(props){
                                var cs=window.getComputedStyle(this[0]),o={};
                                for (var g in props) o[g]=cs[g];
                                return o;
                        },

                        _updateCSSProperties:function(){
                                var self=this;
                                return this._each(function(){
                                        this.style.animation=self._animproperties;
                                });
                        },

                        _addAnimation:function(animation,options){
                                var prop=this._animproperties.add(new AnimProperty(animation,options));
                                return this._updateCSSProperties();
                        },
                        _removeAnimation:function(name){
                                var prop=this._animproperties.remove(name);
                                //A forwards animation is the same as the properties set to the current state (if ended)
                                if (prop.options.fillMode&&prop.options.fillMode.toLowerCase().search(/(both|forwards)/)>-1){
                                        this.css(this._getCurrentSnapshot(prop.animation.properties));
                                }

                                if (!prop.options.doNotRemove) animation.remove(name);

                                this._updateCSSProperties();
                                return prop;
                        },

                        _animate:function(anim,options){
                                //this.stop();
                                this._addAnimation(anim,options);
                                return this;
                        },

                        do:function(anything,opts){
                                opts=options.Animation(opts);

                                if (type(anything)==="enumerable"){
                                        // Interpret as keyframes
                                        if (!opts.fillMode) opts.fillMode="forwards";
                                        var anim=animation.create(new Keyframes(anything),opts);
                                        this._animate(anim,opts);
                                }else{
                                        // Interpret as animation, do not remove in that case
                                        opts.doNotRemove=true;
                                        this._animate(anything,opts);
                                }
                                return this;
                        },
                        to:function(css,opts){
                                opts=options.Animation(opts);

                                if (type(css)!=="object") throw new Error("to: Cannot parse css, unknown type: "+type(css));
                                this.stop();
                                var currentcss=this._getCurrentSnapshot(css);
                                var anim=animation.create(new Keyframes([currentcss,css]),opts);
                                this._animate(anim,opts);
                                return this;
                        },
                        stop:function(){
                                for (var g=0,glen=this._animproperties.data.length;g<glen;g++){
                                        this._removeAnimation(this._animproperties.data[g].animation.name);
                                }
                                return this;
                        },
                },{
                        requires:["event"],
                        optional:false
                });
        })();

        (function(){
                return element.module("input",null,{
                        blur:function(){
                                this._each(function(){
                                        this.blur();
                                });
                        },
                        focus:function(){
                                this._each(function(){
                                        this.focus();
                                });
                        }
                });
        })();

        (function(){
                return element.module("dom",null,{
                        // DOM attributes
                        set:function(obj){
                                var e=this[0];
                                for (var g in obj) e.setAttribute(g,obj[g]);
                                return this;
                        },
                        get:function(id){
                                return this[0].getAttribute(id);
                        },

                        // Append and prepend: INSERT INTO THE ELEMENT
                        append:function(){
                                var aw=alt(arguments);
                                var self=this[0];
                                aw._each(function(){self.appendChild(this);});
                                return this;
                        },
                        prepend:function(){
                                var aw=alt(arguments);
                                var self=this[0],fc=self.firstChild;
                                aw._each(function(){self.insertBefore(this,fc);});
                                return this;
                        },

                        // Before and after: INSERT NEXT TO THE ELEMENT
                        before:function(){
                                var aw=alt(arguments);
                                var self=this[0];
                                aw._each(function(){self.parentNode.insertBefore(this,self);});
                                return this;
                        },
                        after:function(){
                                var aw=alt(arguments);
                                var self=this[0];
                                aw._each(function(){self.parentNode.insertBefore(this,self.nextSibling);});
                                return this;
                        },

                        empty:function(){
                                var e=this[0];
                                while(e.firstChild){
                                        e.removeChild(e.firstChild);
                                }
                                return this;
                        },
                        clone:function(count,shallow){
                                if (count==null) count=1;
                                var e=this[0];
                                if (count===1){
                                        var aw=element.create(e.cloneNode(!shallow));
                                        aw._setEvents(this._getEvents());
                                        return aw;
                                }else if (count>1){
                                        var a=[];
                                        for (var g=0;g<count;g++) a.push(e.cloneNode(!shallow));
                                        var aw=element.create(a);
                                        aw._setEvents(this._getEvents());
                                        return aw;
                                }else throw new Error("Cannot clone, weird count: "+count);
                        }
                });
        })();

        (function(){
                return element.module("one",null,{
                        _set:function(element){
                                this.length=1;
                                this[0]=element;
                                return this;
                        },
                        _each:function(callback){
                                callback.call(this[0]);
                                return this;
                        },

                        text:function(string){
                                if (string==null) return this[0].innerHTML;
                                this.empty();
                                this[0].appendChild(document.createTextNode(string));
                                return this;
                        },

                        class:function(name){
                                this[0].className=name;
                                return this;
                        },
                        css:function(obj){
                                var e=this[0];
                                for (var g in obj) e.style[g]=obj[g];
                                return this;
                        },
                        value:function(val){
                                if (val==null) return this[0].value;
                                this[0].value=val;
                                return this;
                        }
                },{
                        requires:["core","dom","input","animation","event"]
                });
        })();

        (function(){
                return element.module("group",null,{
                        _set:function(elements){
                                this.length=elements.length;
                                for (var g=0,glen=elements.length;g<glen;g++){
                                        this[g]=elements[g];
                                }
                                return this;
                        },
                        _each:function(callback){
                                for (var g=0,glen=this.length;g<glen;g++){
                                        callback.call(this[g],g);
                                }
                                return this;
                        }
                },{
                        requires:["core","dom","input","animation","event"],
                        customExtend:function(t,o){
                                for (var g in o){
                                        if (g[0]=="_") continue; // Skip properties that start with underscore
                                        t[g]=(function(callback){
                                                return function(){
                                                        var args=arguments;
                                                        return this._each(function(){
                                                                return callback.apply(element.create(this),args);
                                                        });
                                                };
                                        })(o[g]);
                                }
                        }
                });
        })();

        /*
                TODO: Groups, Empties, "Master modules"

                for (var g in wone.prototype){
                        if (g[0]=="_") continue; // Skip properties that start with underscore
                        aw.prototype[g]=(function(callback){
                                return function(){
                                        var args=arguments;
                                        return this._each(function(){
                                                return callback.apply(wrapper.create(this),args);
                                        });
                                };
                        })(wone.prototype[g]);
                }
        */

        if (!('$' in window)) window.$=alt;

        window.addEventListener("load",function(){
                extend(alt,{
                        body:window.$body=alt(document.body),
                        head:window.$head=alt(document.head),
                        document:window.$document=alt(document.documentElement)
                });
        });

        return alt;
})();
