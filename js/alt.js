var alt=(function(){
        var version=2.876;

        /*
                TODO:

                        When everything else is finished:
                        --      Module interaction (e.g. Transform module attaches to CSS custom properties)
                        --      Animation "rescue mode"
        */

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
                function Animation(keyframes,style){
                        if (keyframes.length<=1) console.warn("Animation with keyframe length "+keyframes.length+" is probably useless");
                        this.name=animation.genName();
                        this.keyframes=keyframes;
                        this.properties=keyframes.getProperties();
                        this.style=style;
                }
                Animation.prototype={
                        _isAltAnimation:true
                };

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
                                        if (!isNaN(opts.ms)) opts.ms/=2;
                                }
                                if (!opts.duration) opts.duration=opts.ms+"ms";
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
                get:function(anything,opts){
                        var c=type(anything);
                        if (c==="string"){
                                var firstchar=anything.charAt(0);
                                if (firstchar==="<"){
                                        //DOM creation
                                        var tagname=anything.slice(1,-1);
                                        return element.create(document.createElement(tagname),opts);
                                }else if (firstchar=="#"){
                                        //ID
                                        var id=anything.slice(1);
                                        return element.create(document.getElementById(id),opts);
                                }else if (firstchar==">"){
                                        //TAGNAME
                                        var name=anything.slice(1);
                                        opts.id="group";
                                        return element.create(document.getElementsByTagName(name),opts);
                                }else if (firstchar=="."){
                                        //CLASS
                                        var classname=anything.slice(1);
                                        opts.id="group";
                                        return element.create(document.getElementsByClassName(classname),opts);
                                }else{
                                        //First char not recognized, create a text node
                                        return element.create(document.createTextNode(anything),opts);
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
                                                return element.create(elementlist[0],opts);
                                        }else if (elementlist.length>1){
                                                opts.id="group";
                                                return element.create(elementlist,opts);
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

        (function Core(){
                return element.module("core",function(){
                        this._id=genId();
                        this.length=0;
                        this._set.apply(this,arguments);
                },{
                        _isAlt:true,// I identify as an alt element
                });
        })();

        (function CSS(){
                function Properties(parent){
                        this.parent=parent;
                        this.data={};
                }
                Properties.prototype={
                        add:function(id,values,properties){
                                this.init(id,properties);

                                for (var g=0,glen=values.length;g<glen;g++){
                                        var a=this.data[id];
                                        // Add all the user values
                                        a.push(values[g]);
                                }
                        },
                        pop:function(id,count){
                                var a=this.data[id];
                                if (a==null) return;
                                if (count>=a.length){count=a.length-1;} // NEVER remove the original one unless forced to
                                a.splice(-count,count);
                        },
                        init:function(id,properties){
                                if (!(id in this.data)) this.data[id]=[properties[id]];
                        },
                        apply:function(id){
                                var self=this;
                                this.parent._each(function(){return this.style[id]=self.get(id);});
                                return self.get(id);
                        },
                        get:function(id,offset){
                                if (offset==null) offset=0;
                                var a=this.data[id];
                                if (a==null) return;
                                return a[a.length-1+offset];
                        },
                        getAll:function(){
                                return this.parent._getCurrentProperties();
                        }
                };

                return element.module("css",function(){
                        this._properties=new Properties(this);
                },{
                        _getCurrentProperties:function(filter){
                                var cs=window.getComputedStyle(this[0]);
                                if (!filter) return cs;
                                var o={};
                                for (var g in filter){
                                        o[g]=cs[g];
                                }
                                return o;
                        },
                        _sanitizeCSS:function(css){
                                var _cachedProperties;
                                var properties=this._properties;

                                // Convert layers into proper CSS
                                for (var h in css){
                                        var val=css[h];
                                        var t=type(val);
                                        if (t==="enumerable"){
                                                if (!_cachedProperties) {_cachedProperties=properties.getAll();}
                                                properties.add(h,val,_cachedProperties);
                                                css[h]=properties.get(h);
                                        }else if (t==="number"){
                                                properties.pop(h,-val);
                                                css[h]=properties.get(h);
                                        }else if (t==="string"){
                                                if (!_cachedProperties) {_cachedProperties=properties.getAll();}
                                                properties.init(h,_cachedProperties);
                                        }else throw new Error("Cannot sanitize "+t+"!");
                                        properties.apply(h);
                                }
                                return css;
                        },
                        css:function(obj){
                                /*
                                        Users can use several ways of declaring css properties
                                        1. normal string backgroundColor:"red"
                                        2. array backgroundColor:["red"] (This will create a new layer)
                                        3. boolean backgroundColor:false (This will remove a layer)
                                */
                                var e=this[0],_cachedProperties;
                                for (var g in obj){
                                        var val=obj[g];
                                        var t=type(val);
                                        if (t==="enumerable"){
                                                // Add n layers!
                                                if (!_cachedProperties) {_cachedProperties=this._getCurrentProperties(obj);}
                                                this._properties.add(g,val,_cachedProperties);
                                                this._properties.apply(g);
                                        }else if (t==="boolean"){
                                                this._properties.pop(g,1);
                                                this._properties.apply(g);
                                        }else{
                                                // Simple case!
                                                e.style[g]=val;
                                        }
                                }
                                return this;
                        }
                });
        })();

        (function Event(){
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

        (function Animation(){
                function fromCamelCase(str){
                        return str.replace(/[A-Z]/g,function(a){
                                return "-"+a.toLowerCase();
                        });
                }

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

                function Animation(animation,opts){
                        this.id=animation.name;
                        this.data=animation;
                        this.properties=animation.properties;
                        this.options=opts;
                }
                Animation.prototype={
                        toString:function(){
                                var anim=this.data,opts=this.options;
                                return [anim.name,opts.duration,opts.timingFunction,opts.delay,opts.iterationCount,opts.direction,opts.fillMode,opts.playState].join(" ");
                        }
                };

                function Animations(parent){
                        this.parent=parent;
                        this.ordered=[];
                        this.data={};
                }
                Animations.prototype={
                        add:function(anim,opts){
                                var prop=new Animation(anim,opts);
                                this.data[prop.id]=prop;
                                this.ordered.push(prop);
                                this.updateProperties();
                                return prop.id;
                        },
                        break:function(id){
                                var prop=this.data[id];
                                if (prop==null) return;
                                if (prop.options.break) prop.options.break.call(this.parent);
                                this.remove(id);
                        },
                        done:function(id){
                                var prop=this.data[id];
                                if (prop==null) return;
                                if (prop.options.done) prop.options.done.call(this.parent);
                                if (!prop.options.stay) this.remove(id);
                        },
                        each:function(callback){
                                for (var g in this.data){
                                        callback.call(this.data[g],g);
                                }
                        },
                        remove:function(id){
                                var prop=this.data[id];
                                if (prop==null) return;

                                var a=this.ordered;
                                for (var g=0,glen=a.length;g<glen;g++){
                                        if (a[g].id==id){
                                                a.splice(g,1);
                                                break;
                                        }
                                }

                                delete this.data[id];
                                if (!prop.options.doNotRemove) animation.remove(id);
                                if (prop.options.callback) prop.options.callback.call(this.parent);

                                this.updateProperties();
                        },
                        pop:function(count){
                                var a=this.ordered;
                                if (count>=a.length){count=a.length-1;} // NEVER remove the original one unless forced to
                                for (var g=0,glen=count;g<glen;g++){
                                        this.remove(a[a.length-g-1].id);
                                }
                        },
                        getPropertyString:function(){
                                return this.ordered.join(",");
                        },
                        updateProperties:function(){
                                var props=this.getPropertyString();
                                this.parent._each(function(){
                                        this.style.animation=props;
                                });
                        }
                };

                return element.module("animation",function(){
                        //console.log("INIT ANIM FOR ELEM ID #%s",this._id);

                        this._animations=new Animations(this);

                        var self=this;

                        this._listen("animationend",function(evt){
                                var animationName=evt.animationName;
                                evt.stopPropagation(); // Prevent animation end affecting parent elements
                                //console.log("An animation %s has ended on an alt3 animation enabled element. (#%s)",animationName,self._id);
                                self._animations.done(animationName);
                        },{native:true});
                },{
                        _animate:function(array,opts){
                                opts=options.Animation(opts);
                                if (array.length==1){
                                        // We need the first frame, as it wasn't specified
                                        var currentcss=this._getCurrentProperties(array[0]);
                                        array.unshift(currentcss);
                                }

                                for (var g=0,glen=array.length;g<glen;g++){
                                        array[g]=this._sanitizeCSS(array[g]);
                                }

                                var anim=animation.create(new Keyframes(array),opts);
                                return this._animations.add(anim,opts);
                        },
                        anim:function(anything,opts){
                                return this._animate(anything,opts);
                        },
                        stop:function(id){
                                return this._animations.remove(id);
                        },
                        do:function(anything,opts){
                                var t=type(anything);

                                if (t==="enumerable"){
                                        // Interpret as keyframes
                                        this._animate(anything,opts);
                                }else if (t==="object"){
                                        if(anything._isAltAnimation){
                                                // Already an animation, do not remove in that case as it's probably important
                                                opts.doNotRemove=true;
                                                this._animations.add(anything,opts);
                                        }
                                }
                                return this;
                        },
                        to:function(anything,opts){
                                var t=type(anything);

                                if (t==="object"){
                                        // Default behavior
                                        // Make layers for every property we affect, as we want them to persist
                                        for (var g in anything){
                                                var val=anything[g];
                                                if (type(val)!=="enumerable") anything[g]=[val];
                                        }

                                        // Animate
                                        var ourid=this._animate([anything],opts);

                                        // Deal with animations that use our properties
                                        var self=this;
                                        this._animations.each(function(g){
                                                var props=this.properties;
                                                for (var p in props) if (anything[p]&&this.id!=ourid){
                                                        // Break this animation
                                                        self._animations.break(this.id);
                                                }
                                        });
                                }
                                return this;
                        }
                },{
                        requires:["css","event"],
                        optional:false
                });
        })();

        (function Input(){
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

        (function DOM(){
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

        (function One(){
                return element.module("one",null,{
                        // TODO: Clean up and rearrange helpers like "value" and "text", etc
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
                        value:function(val){
                                if (val==null) return this[0].value;
                                this[0].value=val;
                                return this;
                        }
                },{
                        requires:["core","css","dom","input","animation","event"]
                });
        })();

        (function Group(){
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
                        requires:["core","css","dom","input","animation","event"],
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
