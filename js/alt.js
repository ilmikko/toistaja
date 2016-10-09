var alt=(function(){
        var version=2.7;

        /*
                TODO:
                        "Modularize" or "Specialize" the altWrapper a bit differently
                        If the element is going to be used for animations, only then
                        we should initialize the object properties for animations.
                        However, we cannot change prototypes after their creation.
                        We need a way to define different prototypes for the same
                        constructor and access them only when needed.

                        One possibility would be to use a "namespace" for optimized
                        functions, e.g. $(...).each(); would be a dummy, and we could
                        check if we use an optimized version or the wrapper prototype version.
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

        // ** ------------------------------------ ALT ITSELF :3 ------------------------------------ **//

        var alt=function(anything,setShortcut){
                var e=alt.get(anything);

                // Shortcuts and convenience
                if (setShortcut!=null) e.set(setShortcut);
                return e;
        };

        // ** ------------------------------------ ALT EXTENSIONS ------------------------------------ **//

        alt.extend=function(obj){
                for (var g in obj) this[g]=obj[g];
        };
        alt.extend({
                version:version,
                extend:function(a,b){
                        if (b==null) {
                                this.extend(this,a);
                                return;
                        }
                        for (var g in b) a[g]=b[g];
                },
                type:type,
                text:function(a){
                        return document.createTextNode(a);
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
                get:function(anything){
                        var c=type(anything);
                        if (c==="string"){
                                var firstchar=anything.charAt(0);
                                if (firstchar==="<"){
                                        //DOM creation
                                        var tagname=anything.slice(1,-1);
                                        return wrapper.create(document.createElement(tagname));
                                }else if (firstchar=="#"){
                                        //ID
                                        var id=anything.slice(1);
                                        return wrapper.create(document.getElementById(id));
                                }else if (firstchar==">"){
                                        //TAGNAME
                                        var name=anything.slice(1);
                                        return wrapper.create(document.getElementsByTagName(name),"group");
                                }else{
                                        //First char not recognized, create a text node
                                        return wrapper.create(document.createTextNode(anything));
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
                                                return wrapper.create(elementlist[0]);
                                        }else if (elementlist.length>1){
                                                return wrapper.create(elementlist,"group");
                                        }else{
                                                alert(anything.nodeType);
                                                console.warn("Returning an empty wrapper for enumerable!");
                                                return wrapper.create(null,"empty");
                                        }
                                }else throw new Error("Alt cannot parse array, invalid length: "+anything.length);
                        }else if (c==="object"){
                                if (anything._isAlt){
                                        // Sure, if the object says so.
                                        // Notice the underscore?
                                        // IDGAF
                                        return anything;
                                }else throw new Error("Alt cannot parse object *shrugs*");
                        }else if (c==="node"){
                                //Already a DOM Node
                                return wrapper.create(anything);
                        }else if (c==="undefined"){
                                console.warn("Returning an empty set");
                                return wrapper.create(null,"empty");
                        }else throw new Error("Alt cannot parse type: "+c);
                }
        });

        // ** ------------------------------------ CONSTRUCTORS ------------------------------------ **//

        function Animation(keyframes,style){
                if (keyframes.length<=1) console.warn("Animation with keyframe length "+keyframes.length+" is probably useless");
                this.name=animation.genName();
                this.keyframes=keyframes;
                this.properties=keyframes.getProperties();
                this.style=style;
        }

        /*
                Handles the animation style property and multiple animations at the same time
        */
        function AnimProperties(){
                this.data=[];
        }
        AnimProperties.prototype={
                add:function(animproperty){
                        this.data.push(animproperty);
                        return animproperty;
                },
                toString:function(){
                        return this.data.join(",");
                },
                remove:function(name){
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
        alt.extend(altEventWrapper,{
                choose:function(el,evt){
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
                        if (evt instanceof MouseEvent){
                                console.log(evt.type+" - it's a mouse event!");
                        }
                        if (evt instanceof AnimationEvent){
                                console.log(evt.type+" - it's an animation event!");
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
                        var mx=evt.pageX-el.offsetLeft,my=evt.pageY-el.offsetTop;
                        return {x:mx/el.offsetWidth,y:my/el.offsetHeight};
                }
        };

        // ** -------------------------------------- ALT WRAPPER -------------------------------------- ** //
        wrapper=(function(){
                var wrappers={};

                // TODO: MODULARIZE THE WHOLE SYSTEM
                /*
                        So, here's an idea.
                        Wrappers can be constructed using 'one' and 'group' etc,
                        but we should also have a way of differentiating between,
                        say, event handling, animations, etc.
                        These modules could then be called accordingly and disabled if needed.
                        So, for example, 'one' wrapper does need the 'event' (wrapper).
                        But you can disable it if you want to.
                */

                wrappers['event']=(function(){
                        var aw=function altWrapperEvent(){};

                        function wrap(original,self,options){
                                return function(evt){
                                        if (options.onlyonce) self._deafen(id);
                                        if (!options.native) evt=altEventWrapper.choose(this,evt);
                                        return original.call(self,evt);
                                }
                        }

                        aw.prototype={
                                __initEvents:function(){
                                        this._events={};
                                },

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
                        };
                        return aw;
                })();

                wrappers['animation']=(function(){
                        var aw=function altWrapperAnimation(){};
                        aw.prototype={
                                __initAnimation:function(){
                                        this._animproperties=new AnimProperties();
                                },

                                _getCurrentSnapshot:function(props){
                                        var cs=window.getComputedStyle(this[0]),o={};
                                        for (var g in props) o[g]=cs[g];
                                        return o;
                                },

                                _addAnimation:function(animation,options){
                                        var prop=this._animproperties.add(new AnimProperty(animation,options));
                                        var self=this;
                                        prop.eventId=this._listen("animationend",function(evt){
                                                console.log("CSS: "+evt.animationName+" has ended");
                                                var animationName=evt.animationName;
                                                if (options.callback) options.callback();
                                                if (animationName==prop.animationName){
                                                        self._removeAnimation(animationName);
                                                }
                                        },{native:true});
                                        this[0].style.animation=this._animproperties;
                                        return this;
                                },
                                _removeAnimation:function(name){
                                        var prop=this._animproperties.remove(name);
                                        //A forwards animation is the same as the properties set to the current state (if ended)
                                        if (prop.options.fillMode&&prop.options.fillMode.toLowerCase()=="forwards"){
                                                this.css(this._getCurrentSnapshot(prop.animation.properties));
                                        }
                                        this[0].style.animation=this._animproperties;

                                        if (!prop.options.doNotRemove) animation.remove(name);

                                        this._deafen(prop.eventId);
                                        return this;
                                },

                                _animate:function(anim,options){
                                        this.stop();
                                        this._addAnimation(anim,options);
                                        return this;
                                },

                                do:function(anything,options){
                                        if (type(anything)==="enumerable"){
                                                // Interpret as keyframes
                                                if (options==null){options={};}
                                                if (!options.fillMode) options.fillMode="forwards";
                                                var anim=animation.create(new Keyframes(anything));
                                                this._animate(anim,options);
                                        }else{
                                                // Interpret as animation, do not remove in that case
                                                options.doNotRemove=true;
                                                this._animate(anything,options);
                                        }
                                },
                                to:function(css,options){
                                        if (options==null){options={};}
                                        if (type(css)!=="object") throw new Error("to: Cannot parse css, unknown type: "+type(css));
                                        this.stop();
                                        var currentcss=this._getCurrentSnapshot(css);
                                        if (!options.fillMode) options.fillMode="forwards";
                                        if (!options.duration) options.duration="1s";
                                        var anim=animation.create(new Keyframes([currentcss,css]),options);
                                        this._animate(anim,options);
                                        return this;
                                },
                                stop:function(){
                                        for (var g=0,glen=this._animproperties.data.length;g<glen;g++){
                                                this._removeAnimation(this._animproperties.data[g].animation.name);
                                        }
                                        return this;
                                },
                        };
                        return aw;
                })();

                wrappers['one']=(function(wevent,wanimation){
                        var aw=function altWrapperOne(element){
                                this.length=0;
                                this._set(element);
                                this.__initEvents();
                                this.__initAnimation();
                        };
                        aw.prototype={
                                _isAlt:true,//I identify as an alt wrapper
                                _set:function(element){
                                        this.length=1;
                                        this[0]=element;
                                        return this;
                                },
                                _each:function(callback){
                                        callback.call(this[0]);
                                        return this;
                                },
                                /* BASE DOM MANIPULATION */
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
                                                var aw=wrapper.create(e.cloneNode(!shallow));
                                                aw._setEvents(this._getEvents());
                                                return aw;
                                        }else if (count>1){
                                                var a=[];
                                                for (var g=0;g<count;g++) a.push(e.cloneNode(!shallow));
                                                var aw=wrapper.create(a);
                                                aw._setEvents(this._getEvents());
                                                return aw;
                                        }else throw new Error("Cannot clone, weird count: "+count);
                                },
                                text:function(string){
                                        if (string==null) return this[0].innerHTML;
                                        this.empty();
                                        this[0].appendChild(document.createTextNode(string));
                                        return this;
                                },

                                /* BASE DOM PROPS */

                                class:function(name){
                                        this[0].className=name;
                                        return this;
                                },
                                css:function(obj){
                                        var e=this[0];
                                        for (var g in obj) e.style[g]=obj[g];
                                        return this;
                                },
                                set:function(obj){
                                        var e=this[0];
                                        for (var g in obj) e.setAttribute(g,obj[g]);
                                        return this;
                                },
                                get:function(id){
                                        return this[0].getAttribute(id);
                                },
                                value:function(val){
                                        if (val==null) return this[0].value;
                                        this[0].value=val;
                                        return this;
                                }
                        };

                        alt.extend(aw.prototype,Object.create(wevent.prototype));
                        alt.extend(aw.prototype,Object.create(wanimation.prototype));
                        return aw;
                })(wrappers['event'],wrappers['animation']);

                wrappers['group']=(function(wone){
                        var aw=function altWrapperGroup(enumerable){
                                this.length=0;
                                this._set(enumerable);
                        };
                        aw.prototype={
                                _isAlt:true,// I identify as an alt wrapper
                                _set:function(elements){
                                        this.length=elements.length;
                                        for (var g=0,glen=this.length;g<glen;g++){
                                                this[g]=elements[g];
                                        }
                                        return this;
                                },
                                _each:function(callback){
                                        for (var g=0,glen=this.length;g<glen;g++){
                                                callback.call(this[g]);
                                        }
                                        return this;
                                }
                        };

                        /* Quick and dirty inheritance */
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

                        return aw;
                })(wrappers['one']);

                wrappers['empty']=(function(w){
                        var aw=function altWrapperEmpty(){};
                        aw.prototype={
                                length:0
                        };

                        var dummy=function(){return this;}

                        for (var g in w){
                                var prt=w[g].prototype;
                                for (var h in prt){
                                        aw.prototype[h]=dummy;
                                }
                        }

                        console.log(aw.prototype);

                        return aw;
                })(wrappers);

                wrappers['default']=wrappers['one'];

                return {
                        create:function(element,special){
                                var id=special||"default";
                                if (!(id in wrappers)) throw new Error("Cannot find wrapper '"+id+"'!");
                                return new wrappers[id](element);
                        }
                };
        })();

        if (!('$' in window)) window.$=alt;

        window.addEventListener("load",function(){
                alt.extend({
                        body:window.$body=alt(document.body),
                        head:window.$head=alt(document.head),
                        document:window.$document=alt(document.documentElement)
                });
        });

        return alt;
})();
