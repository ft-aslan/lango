
(function(l, r) { if (l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (window.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(window.document);
var app = (function () {
    'use strict';

    function noop() { }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }

    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function destroy_each(iterations, detaching) {
        for (let i = 0; i < iterations.length; i += 1) {
            if (iterations[i])
                iterations[i].d(detaching);
        }
    }
    function element(name) {
        return document.createElement(name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function empty() {
        return text('');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function set_custom_element_data(node, prop, value) {
        if (prop in node) {
            node[prop] = value;
        }
        else {
            attr(node, prop, value);
        }
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function set_input_value(input, value) {
        if (value != null || input.value) {
            input.value = value;
        }
    }
    function set_style(node, key, value, important) {
        node.style.setProperty(key, value, important ? 'important' : '');
    }
    function toggle_class(element, name, toggle) {
        element.classList[toggle ? 'add' : 'remove'](name);
    }
    function custom_event(type, detail) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, false, false, detail);
        return e;
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }
    function get_current_component() {
        if (!current_component)
            throw new Error(`Function called outside component initialization`);
        return current_component;
    }
    function onMount(fn) {
        get_current_component().$$.on_mount.push(fn);
    }
    function createEventDispatcher() {
        const component = get_current_component();
        return (type, detail) => {
            const callbacks = component.$$.callbacks[type];
            if (callbacks) {
                // TODO are there situations where events could be dispatched
                // in a server (non-DOM) environment?
                const event = custom_event(type, detail);
                callbacks.slice().forEach(fn => {
                    fn.call(component, event);
                });
            }
        };
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    function add_flush_callback(fn) {
        flush_callbacks.push(fn);
    }
    let flushing = false;
    const seen_callbacks = new Set();
    function flush() {
        if (flushing)
            return;
        flushing = true;
        do {
            // first, call beforeUpdate functions
            // and update components
            for (let i = 0; i < dirty_components.length; i += 1) {
                const component = dirty_components[i];
                set_current_component(component);
                update(component.$$);
            }
            dirty_components.length = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        flushing = false;
        seen_callbacks.clear();
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }
    const outroing = new Set();
    let outros;
    function group_outros() {
        outros = {
            r: 0,
            c: [],
            p: outros // parent group
        };
    }
    function check_outros() {
        if (!outros.r) {
            run_all(outros.c);
        }
        outros = outros.p;
    }
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
    }

    const globals = (typeof window !== 'undefined'
        ? window
        : typeof globalThis !== 'undefined'
            ? globalThis
            : global);

    function bind(component, name, callback) {
        const index = component.$$.props[name];
        if (index !== undefined) {
            component.$$.bound[index] = callback;
            callback(component.$$.ctx[index]);
        }
    }
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        // onMount happens before the initial afterUpdate
        add_render_callback(() => {
            const new_on_destroy = on_mount.map(run).filter(is_function);
            if (on_destroy) {
                on_destroy.push(...new_on_destroy);
            }
            else {
                // Edge case - component was destroyed immediately,
                // most likely as a result of a binding initialising
                run_all(new_on_destroy);
            }
            component.$$.on_mount = [];
        });
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const prop_values = options.props || {};
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            before_update: [],
            after_update: [],
            context: new Map(parent_component ? parent_component.$$.context : []),
            // everything else
            callbacks: blank_object(),
            dirty
        };
        let ready = false;
        $$.ctx = instance
            ? instance(component, prop_values, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if ($$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                const nodes = children(options.target);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(nodes);
                nodes.forEach(detach);
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor);
            flush();
        }
        set_current_component(parent_component);
    }
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set() {
            // overridden by instance, if it has props
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.22.3' }, detail)));
    }
    function append_dev(target, node) {
        dispatch_dev("SvelteDOMInsert", { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev("SvelteDOMInsert", { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev("SvelteDOMRemove", { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
        const modifiers = options === true ? ["capture"] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        dispatch_dev("SvelteDOMAddEventListener", { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev("SvelteDOMRemoveEventListener", { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev("SvelteDOMRemoveAttribute", { node, attribute });
        else
            dispatch_dev("SvelteDOMSetAttribute", { node, attribute, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.data === data)
            return;
        dispatch_dev("SvelteDOMSetData", { node: text, data });
        text.data = data;
    }
    function validate_each_argument(arg) {
        if (typeof arg !== 'string' && !(arg && typeof arg === 'object' && 'length' in arg)) {
            let msg = '{#each} only iterates over array-like objects.';
            if (typeof Symbol === 'function' && arg && Symbol.iterator in arg) {
                msg += ' You can use a spread to convert this iterable into an array.';
            }
            throw new Error(msg);
        }
    }
    function validate_slots(name, slot, keys) {
        for (const slot_key of Object.keys(slot)) {
            if (!~keys.indexOf(slot_key)) {
                console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
            }
        }
    }
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error(`'target' is a required option`);
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn(`Component was already destroyed`); // eslint-disable-line no-console
            };
        }
        $capture_state() { }
        $inject_state() { }
    }

    /* src\Components\TopNav.svelte generated by Svelte v3.22.3 */
    const file = "src\\Components\\TopNav.svelte";

    function create_fragment(ctx) {
    	let nav;
    	let nav_top;
    	let div;
    	let p0;
    	let button0;
    	let span0;
    	let i0;
    	let t0;
    	let span1;
    	let t2;
    	let p1;
    	let button1;
    	let span2;
    	let i1;
    	let t3;
    	let span3;
    	let t5;
    	let p2;
    	let button2;
    	let span4;
    	let i2;
    	let t6;
    	let span5;
    	let dispose;

    	const block = {
    		c: function create() {
    			nav = element("nav");
    			nav_top = element("nav-top");
    			div = element("div");
    			p0 = element("p");
    			button0 = element("button");
    			span0 = element("span");
    			i0 = element("i");
    			t0 = space();
    			span1 = element("span");
    			span1.textContent = "Translation";
    			t2 = space();
    			p1 = element("p");
    			button1 = element("button");
    			span2 = element("span");
    			i1 = element("i");
    			t3 = space();
    			span3 = element("span");
    			span3.textContent = "Definition";
    			t5 = space();
    			p2 = element("p");
    			button2 = element("button");
    			span4 = element("span");
    			i2 = element("i");
    			t6 = space();
    			span5 = element("span");
    			span5.textContent = "Slang";
    			attr_dev(i0, "class", "fas fa-language");
    			add_location(i0, file, 49, 12, 1290);
    			attr_dev(span0, "class", "icon is-small");
    			add_location(span0, file, 48, 10, 1249);
    			add_location(span1, file, 51, 10, 1348);
    			attr_dev(button0, "class", "button is-dark");
    			toggle_class(button0, "is-warning", /*isTranslationSelected*/ ctx[0]);
    			toggle_class(button0, "is-selected", /*isTranslationSelected*/ ctx[0]);
    			add_location(button0, file, 43, 8, 1042);
    			attr_dev(p0, "class", "control");
    			add_location(p0, file, 42, 6, 1014);
    			attr_dev(i1, "class", "fas fa-book");
    			add_location(i1, file, 61, 12, 1681);
    			attr_dev(span2, "class", "icon is-small");
    			add_location(span2, file, 60, 10, 1640);
    			add_location(span3, file, 63, 10, 1735);
    			attr_dev(button1, "class", "button is-dark");
    			toggle_class(button1, "is-warning", /*isDefinitionSelected*/ ctx[1]);
    			toggle_class(button1, "is-selected", /*isDefinitionSelected*/ ctx[1]);
    			add_location(button1, file, 55, 8, 1436);
    			attr_dev(p1, "class", "control");
    			add_location(p1, file, 54, 6, 1408);
    			attr_dev(i2, "class", "fab fa-stripe-s");
    			add_location(i2, file, 73, 12, 2052);
    			attr_dev(span4, "class", "icon is-small");
    			add_location(span4, file, 72, 10, 2011);
    			add_location(span5, file, 75, 10, 2110);
    			attr_dev(button2, "class", "button is-dark");
    			toggle_class(button2, "is-warning", /*isSlangSelected*/ ctx[2]);
    			toggle_class(button2, "is-selected", /*isSlangSelected*/ ctx[2]);
    			add_location(button2, file, 67, 8, 1822);
    			attr_dev(p2, "class", "control");
    			add_location(p2, file, 66, 6, 1794);
    			attr_dev(div, "class", "field has-addons");
    			add_location(div, file, 41, 4, 977);
    			set_custom_element_data(nav_top, "class", "svelte-1d7i6wq");
    			add_location(nav_top, file, 40, 2, 963);
    			attr_dev(nav, "class", "svelte-1d7i6wq");
    			add_location(nav, file, 39, 0, 955);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor, remount) {
    			insert_dev(target, nav, anchor);
    			append_dev(nav, nav_top);
    			append_dev(nav_top, div);
    			append_dev(div, p0);
    			append_dev(p0, button0);
    			append_dev(button0, span0);
    			append_dev(span0, i0);
    			append_dev(button0, t0);
    			append_dev(button0, span1);
    			append_dev(div, t2);
    			append_dev(div, p1);
    			append_dev(p1, button1);
    			append_dev(button1, span2);
    			append_dev(span2, i1);
    			append_dev(button1, t3);
    			append_dev(button1, span3);
    			append_dev(div, t5);
    			append_dev(div, p2);
    			append_dev(p2, button2);
    			append_dev(button2, span4);
    			append_dev(span4, i2);
    			append_dev(button2, t6);
    			append_dev(button2, span5);
    			if (remount) run_all(dispose);

    			dispose = [
    				listen_dev(button0, "click", /*click_handler*/ ctx[6], false, false, false),
    				listen_dev(button1, "click", /*click_handler_1*/ ctx[7], false, false, false),
    				listen_dev(button2, "click", /*click_handler_2*/ ctx[8], false, false, false)
    			];
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*isTranslationSelected*/ 1) {
    				toggle_class(button0, "is-warning", /*isTranslationSelected*/ ctx[0]);
    			}

    			if (dirty & /*isTranslationSelected*/ 1) {
    				toggle_class(button0, "is-selected", /*isTranslationSelected*/ ctx[0]);
    			}

    			if (dirty & /*isDefinitionSelected*/ 2) {
    				toggle_class(button1, "is-warning", /*isDefinitionSelected*/ ctx[1]);
    			}

    			if (dirty & /*isDefinitionSelected*/ 2) {
    				toggle_class(button1, "is-selected", /*isDefinitionSelected*/ ctx[1]);
    			}

    			if (dirty & /*isSlangSelected*/ 4) {
    				toggle_class(button2, "is-warning", /*isSlangSelected*/ ctx[2]);
    			}

    			if (dirty & /*isSlangSelected*/ 4) {
    				toggle_class(button2, "is-selected", /*isSlangSelected*/ ctx[2]);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(nav);
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance($$self, $$props, $$invalidate) {
    	let isTranslationSelected = true;
    	let isDefinitionSelected;
    	let isSlangSelected;
    	const dispatch = createEventDispatcher();

    	function tabChanged(tab) {
    		dispatch("tabChange", { value: tab });
    	}

    	function selectTab(tabName) {
    		if (tabName == "translation") {
    			$$invalidate(0, isTranslationSelected = true);
    			$$invalidate(1, isDefinitionSelected = false);
    			$$invalidate(2, isSlangSelected = false);
    		} else if (tabName == "definition") {
    			$$invalidate(0, isTranslationSelected = false);
    			$$invalidate(1, isDefinitionSelected = true);
    			$$invalidate(2, isSlangSelected = false);
    		} else {
    			$$invalidate(0, isTranslationSelected = false);
    			$$invalidate(1, isDefinitionSelected = false);
    			$$invalidate(2, isSlangSelected = true);
    		}

    		tabChanged(tabName);
    	}

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<TopNav> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("TopNav", $$slots, []);
    	const click_handler = () => selectTab("translation");
    	const click_handler_1 = () => selectTab("definition");
    	const click_handler_2 = () => selectTab("slang");

    	$$self.$capture_state = () => ({
    		createEventDispatcher,
    		isTranslationSelected,
    		isDefinitionSelected,
    		isSlangSelected,
    		dispatch,
    		tabChanged,
    		selectTab
    	});

    	$$self.$inject_state = $$props => {
    		if ("isTranslationSelected" in $$props) $$invalidate(0, isTranslationSelected = $$props.isTranslationSelected);
    		if ("isDefinitionSelected" in $$props) $$invalidate(1, isDefinitionSelected = $$props.isDefinitionSelected);
    		if ("isSlangSelected" in $$props) $$invalidate(2, isSlangSelected = $$props.isSlangSelected);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		isTranslationSelected,
    		isDefinitionSelected,
    		isSlangSelected,
    		selectTab,
    		dispatch,
    		tabChanged,
    		click_handler,
    		click_handler_1,
    		click_handler_2
    	];
    }

    class TopNav extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "TopNav",
    			options,
    			id: create_fragment.name
    		});
    	}
    }

    var bind$1 = function bind(fn, thisArg) {
      return function wrap() {
        var args = new Array(arguments.length);
        for (var i = 0; i < args.length; i++) {
          args[i] = arguments[i];
        }
        return fn.apply(thisArg, args);
      };
    };

    /*global toString:true*/

    // utils is a library of generic helper functions non-specific to axios

    var toString = Object.prototype.toString;

    /**
     * Determine if a value is an Array
     *
     * @param {Object} val The value to test
     * @returns {boolean} True if value is an Array, otherwise false
     */
    function isArray(val) {
      return toString.call(val) === '[object Array]';
    }

    /**
     * Determine if a value is undefined
     *
     * @param {Object} val The value to test
     * @returns {boolean} True if the value is undefined, otherwise false
     */
    function isUndefined(val) {
      return typeof val === 'undefined';
    }

    /**
     * Determine if a value is a Buffer
     *
     * @param {Object} val The value to test
     * @returns {boolean} True if value is a Buffer, otherwise false
     */
    function isBuffer(val) {
      return val !== null && !isUndefined(val) && val.constructor !== null && !isUndefined(val.constructor)
        && typeof val.constructor.isBuffer === 'function' && val.constructor.isBuffer(val);
    }

    /**
     * Determine if a value is an ArrayBuffer
     *
     * @param {Object} val The value to test
     * @returns {boolean} True if value is an ArrayBuffer, otherwise false
     */
    function isArrayBuffer(val) {
      return toString.call(val) === '[object ArrayBuffer]';
    }

    /**
     * Determine if a value is a FormData
     *
     * @param {Object} val The value to test
     * @returns {boolean} True if value is an FormData, otherwise false
     */
    function isFormData(val) {
      return (typeof FormData !== 'undefined') && (val instanceof FormData);
    }

    /**
     * Determine if a value is a view on an ArrayBuffer
     *
     * @param {Object} val The value to test
     * @returns {boolean} True if value is a view on an ArrayBuffer, otherwise false
     */
    function isArrayBufferView(val) {
      var result;
      if ((typeof ArrayBuffer !== 'undefined') && (ArrayBuffer.isView)) {
        result = ArrayBuffer.isView(val);
      } else {
        result = (val) && (val.buffer) && (val.buffer instanceof ArrayBuffer);
      }
      return result;
    }

    /**
     * Determine if a value is a String
     *
     * @param {Object} val The value to test
     * @returns {boolean} True if value is a String, otherwise false
     */
    function isString(val) {
      return typeof val === 'string';
    }

    /**
     * Determine if a value is a Number
     *
     * @param {Object} val The value to test
     * @returns {boolean} True if value is a Number, otherwise false
     */
    function isNumber(val) {
      return typeof val === 'number';
    }

    /**
     * Determine if a value is an Object
     *
     * @param {Object} val The value to test
     * @returns {boolean} True if value is an Object, otherwise false
     */
    function isObject(val) {
      return val !== null && typeof val === 'object';
    }

    /**
     * Determine if a value is a Date
     *
     * @param {Object} val The value to test
     * @returns {boolean} True if value is a Date, otherwise false
     */
    function isDate(val) {
      return toString.call(val) === '[object Date]';
    }

    /**
     * Determine if a value is a File
     *
     * @param {Object} val The value to test
     * @returns {boolean} True if value is a File, otherwise false
     */
    function isFile(val) {
      return toString.call(val) === '[object File]';
    }

    /**
     * Determine if a value is a Blob
     *
     * @param {Object} val The value to test
     * @returns {boolean} True if value is a Blob, otherwise false
     */
    function isBlob(val) {
      return toString.call(val) === '[object Blob]';
    }

    /**
     * Determine if a value is a Function
     *
     * @param {Object} val The value to test
     * @returns {boolean} True if value is a Function, otherwise false
     */
    function isFunction(val) {
      return toString.call(val) === '[object Function]';
    }

    /**
     * Determine if a value is a Stream
     *
     * @param {Object} val The value to test
     * @returns {boolean} True if value is a Stream, otherwise false
     */
    function isStream(val) {
      return isObject(val) && isFunction(val.pipe);
    }

    /**
     * Determine if a value is a URLSearchParams object
     *
     * @param {Object} val The value to test
     * @returns {boolean} True if value is a URLSearchParams object, otherwise false
     */
    function isURLSearchParams(val) {
      return typeof URLSearchParams !== 'undefined' && val instanceof URLSearchParams;
    }

    /**
     * Trim excess whitespace off the beginning and end of a string
     *
     * @param {String} str The String to trim
     * @returns {String} The String freed of excess whitespace
     */
    function trim(str) {
      return str.replace(/^\s*/, '').replace(/\s*$/, '');
    }

    /**
     * Determine if we're running in a standard browser environment
     *
     * This allows axios to run in a web worker, and react-native.
     * Both environments support XMLHttpRequest, but not fully standard globals.
     *
     * web workers:
     *  typeof window -> undefined
     *  typeof document -> undefined
     *
     * react-native:
     *  navigator.product -> 'ReactNative'
     * nativescript
     *  navigator.product -> 'NativeScript' or 'NS'
     */
    function isStandardBrowserEnv() {
      if (typeof navigator !== 'undefined' && (navigator.product === 'ReactNative' ||
                                               navigator.product === 'NativeScript' ||
                                               navigator.product === 'NS')) {
        return false;
      }
      return (
        typeof window !== 'undefined' &&
        typeof document !== 'undefined'
      );
    }

    /**
     * Iterate over an Array or an Object invoking a function for each item.
     *
     * If `obj` is an Array callback will be called passing
     * the value, index, and complete array for each item.
     *
     * If 'obj' is an Object callback will be called passing
     * the value, key, and complete object for each property.
     *
     * @param {Object|Array} obj The object to iterate
     * @param {Function} fn The callback to invoke for each item
     */
    function forEach(obj, fn) {
      // Don't bother if no value provided
      if (obj === null || typeof obj === 'undefined') {
        return;
      }

      // Force an array if not already something iterable
      if (typeof obj !== 'object') {
        /*eslint no-param-reassign:0*/
        obj = [obj];
      }

      if (isArray(obj)) {
        // Iterate over array values
        for (var i = 0, l = obj.length; i < l; i++) {
          fn.call(null, obj[i], i, obj);
        }
      } else {
        // Iterate over object keys
        for (var key in obj) {
          if (Object.prototype.hasOwnProperty.call(obj, key)) {
            fn.call(null, obj[key], key, obj);
          }
        }
      }
    }

    /**
     * Accepts varargs expecting each argument to be an object, then
     * immutably merges the properties of each object and returns result.
     *
     * When multiple objects contain the same key the later object in
     * the arguments list will take precedence.
     *
     * Example:
     *
     * ```js
     * var result = merge({foo: 123}, {foo: 456});
     * console.log(result.foo); // outputs 456
     * ```
     *
     * @param {Object} obj1 Object to merge
     * @returns {Object} Result of all merge properties
     */
    function merge(/* obj1, obj2, obj3, ... */) {
      var result = {};
      function assignValue(val, key) {
        if (typeof result[key] === 'object' && typeof val === 'object') {
          result[key] = merge(result[key], val);
        } else {
          result[key] = val;
        }
      }

      for (var i = 0, l = arguments.length; i < l; i++) {
        forEach(arguments[i], assignValue);
      }
      return result;
    }

    /**
     * Function equal to merge with the difference being that no reference
     * to original objects is kept.
     *
     * @see merge
     * @param {Object} obj1 Object to merge
     * @returns {Object} Result of all merge properties
     */
    function deepMerge(/* obj1, obj2, obj3, ... */) {
      var result = {};
      function assignValue(val, key) {
        if (typeof result[key] === 'object' && typeof val === 'object') {
          result[key] = deepMerge(result[key], val);
        } else if (typeof val === 'object') {
          result[key] = deepMerge({}, val);
        } else {
          result[key] = val;
        }
      }

      for (var i = 0, l = arguments.length; i < l; i++) {
        forEach(arguments[i], assignValue);
      }
      return result;
    }

    /**
     * Extends object a by mutably adding to it the properties of object b.
     *
     * @param {Object} a The object to be extended
     * @param {Object} b The object to copy properties from
     * @param {Object} thisArg The object to bind function to
     * @return {Object} The resulting value of object a
     */
    function extend(a, b, thisArg) {
      forEach(b, function assignValue(val, key) {
        if (thisArg && typeof val === 'function') {
          a[key] = bind$1(val, thisArg);
        } else {
          a[key] = val;
        }
      });
      return a;
    }

    var utils = {
      isArray: isArray,
      isArrayBuffer: isArrayBuffer,
      isBuffer: isBuffer,
      isFormData: isFormData,
      isArrayBufferView: isArrayBufferView,
      isString: isString,
      isNumber: isNumber,
      isObject: isObject,
      isUndefined: isUndefined,
      isDate: isDate,
      isFile: isFile,
      isBlob: isBlob,
      isFunction: isFunction,
      isStream: isStream,
      isURLSearchParams: isURLSearchParams,
      isStandardBrowserEnv: isStandardBrowserEnv,
      forEach: forEach,
      merge: merge,
      deepMerge: deepMerge,
      extend: extend,
      trim: trim
    };

    function encode(val) {
      return encodeURIComponent(val).
        replace(/%40/gi, '@').
        replace(/%3A/gi, ':').
        replace(/%24/g, '$').
        replace(/%2C/gi, ',').
        replace(/%20/g, '+').
        replace(/%5B/gi, '[').
        replace(/%5D/gi, ']');
    }

    /**
     * Build a URL by appending params to the end
     *
     * @param {string} url The base of the url (e.g., http://www.google.com)
     * @param {object} [params] The params to be appended
     * @returns {string} The formatted url
     */
    var buildURL = function buildURL(url, params, paramsSerializer) {
      /*eslint no-param-reassign:0*/
      if (!params) {
        return url;
      }

      var serializedParams;
      if (paramsSerializer) {
        serializedParams = paramsSerializer(params);
      } else if (utils.isURLSearchParams(params)) {
        serializedParams = params.toString();
      } else {
        var parts = [];

        utils.forEach(params, function serialize(val, key) {
          if (val === null || typeof val === 'undefined') {
            return;
          }

          if (utils.isArray(val)) {
            key = key + '[]';
          } else {
            val = [val];
          }

          utils.forEach(val, function parseValue(v) {
            if (utils.isDate(v)) {
              v = v.toISOString();
            } else if (utils.isObject(v)) {
              v = JSON.stringify(v);
            }
            parts.push(encode(key) + '=' + encode(v));
          });
        });

        serializedParams = parts.join('&');
      }

      if (serializedParams) {
        var hashmarkIndex = url.indexOf('#');
        if (hashmarkIndex !== -1) {
          url = url.slice(0, hashmarkIndex);
        }

        url += (url.indexOf('?') === -1 ? '?' : '&') + serializedParams;
      }

      return url;
    };

    function InterceptorManager() {
      this.handlers = [];
    }

    /**
     * Add a new interceptor to the stack
     *
     * @param {Function} fulfilled The function to handle `then` for a `Promise`
     * @param {Function} rejected The function to handle `reject` for a `Promise`
     *
     * @return {Number} An ID used to remove interceptor later
     */
    InterceptorManager.prototype.use = function use(fulfilled, rejected) {
      this.handlers.push({
        fulfilled: fulfilled,
        rejected: rejected
      });
      return this.handlers.length - 1;
    };

    /**
     * Remove an interceptor from the stack
     *
     * @param {Number} id The ID that was returned by `use`
     */
    InterceptorManager.prototype.eject = function eject(id) {
      if (this.handlers[id]) {
        this.handlers[id] = null;
      }
    };

    /**
     * Iterate over all the registered interceptors
     *
     * This method is particularly useful for skipping over any
     * interceptors that may have become `null` calling `eject`.
     *
     * @param {Function} fn The function to call for each interceptor
     */
    InterceptorManager.prototype.forEach = function forEach(fn) {
      utils.forEach(this.handlers, function forEachHandler(h) {
        if (h !== null) {
          fn(h);
        }
      });
    };

    var InterceptorManager_1 = InterceptorManager;

    /**
     * Transform the data for a request or a response
     *
     * @param {Object|String} data The data to be transformed
     * @param {Array} headers The headers for the request or response
     * @param {Array|Function} fns A single function or Array of functions
     * @returns {*} The resulting transformed data
     */
    var transformData = function transformData(data, headers, fns) {
      /*eslint no-param-reassign:0*/
      utils.forEach(fns, function transform(fn) {
        data = fn(data, headers);
      });

      return data;
    };

    var isCancel = function isCancel(value) {
      return !!(value && value.__CANCEL__);
    };

    var normalizeHeaderName = function normalizeHeaderName(headers, normalizedName) {
      utils.forEach(headers, function processHeader(value, name) {
        if (name !== normalizedName && name.toUpperCase() === normalizedName.toUpperCase()) {
          headers[normalizedName] = value;
          delete headers[name];
        }
      });
    };

    /**
     * Update an Error with the specified config, error code, and response.
     *
     * @param {Error} error The error to update.
     * @param {Object} config The config.
     * @param {string} [code] The error code (for example, 'ECONNABORTED').
     * @param {Object} [request] The request.
     * @param {Object} [response] The response.
     * @returns {Error} The error.
     */
    var enhanceError = function enhanceError(error, config, code, request, response) {
      error.config = config;
      if (code) {
        error.code = code;
      }

      error.request = request;
      error.response = response;
      error.isAxiosError = true;

      error.toJSON = function() {
        return {
          // Standard
          message: this.message,
          name: this.name,
          // Microsoft
          description: this.description,
          number: this.number,
          // Mozilla
          fileName: this.fileName,
          lineNumber: this.lineNumber,
          columnNumber: this.columnNumber,
          stack: this.stack,
          // Axios
          config: this.config,
          code: this.code
        };
      };
      return error;
    };

    /**
     * Create an Error with the specified message, config, error code, request and response.
     *
     * @param {string} message The error message.
     * @param {Object} config The config.
     * @param {string} [code] The error code (for example, 'ECONNABORTED').
     * @param {Object} [request] The request.
     * @param {Object} [response] The response.
     * @returns {Error} The created error.
     */
    var createError = function createError(message, config, code, request, response) {
      var error = new Error(message);
      return enhanceError(error, config, code, request, response);
    };

    /**
     * Resolve or reject a Promise based on response status.
     *
     * @param {Function} resolve A function that resolves the promise.
     * @param {Function} reject A function that rejects the promise.
     * @param {object} response The response.
     */
    var settle = function settle(resolve, reject, response) {
      var validateStatus = response.config.validateStatus;
      if (!validateStatus || validateStatus(response.status)) {
        resolve(response);
      } else {
        reject(createError(
          'Request failed with status code ' + response.status,
          response.config,
          null,
          response.request,
          response
        ));
      }
    };

    /**
     * Determines whether the specified URL is absolute
     *
     * @param {string} url The URL to test
     * @returns {boolean} True if the specified URL is absolute, otherwise false
     */
    var isAbsoluteURL = function isAbsoluteURL(url) {
      // A URL is considered absolute if it begins with "<scheme>://" or "//" (protocol-relative URL).
      // RFC 3986 defines scheme name as a sequence of characters beginning with a letter and followed
      // by any combination of letters, digits, plus, period, or hyphen.
      return /^([a-z][a-z\d\+\-\.]*:)?\/\//i.test(url);
    };

    /**
     * Creates a new URL by combining the specified URLs
     *
     * @param {string} baseURL The base URL
     * @param {string} relativeURL The relative URL
     * @returns {string} The combined URL
     */
    var combineURLs = function combineURLs(baseURL, relativeURL) {
      return relativeURL
        ? baseURL.replace(/\/+$/, '') + '/' + relativeURL.replace(/^\/+/, '')
        : baseURL;
    };

    /**
     * Creates a new URL by combining the baseURL with the requestedURL,
     * only when the requestedURL is not already an absolute URL.
     * If the requestURL is absolute, this function returns the requestedURL untouched.
     *
     * @param {string} baseURL The base URL
     * @param {string} requestedURL Absolute or relative URL to combine
     * @returns {string} The combined full path
     */
    var buildFullPath = function buildFullPath(baseURL, requestedURL) {
      if (baseURL && !isAbsoluteURL(requestedURL)) {
        return combineURLs(baseURL, requestedURL);
      }
      return requestedURL;
    };

    // Headers whose duplicates are ignored by node
    // c.f. https://nodejs.org/api/http.html#http_message_headers
    var ignoreDuplicateOf = [
      'age', 'authorization', 'content-length', 'content-type', 'etag',
      'expires', 'from', 'host', 'if-modified-since', 'if-unmodified-since',
      'last-modified', 'location', 'max-forwards', 'proxy-authorization',
      'referer', 'retry-after', 'user-agent'
    ];

    /**
     * Parse headers into an object
     *
     * ```
     * Date: Wed, 27 Aug 2014 08:58:49 GMT
     * Content-Type: application/json
     * Connection: keep-alive
     * Transfer-Encoding: chunked
     * ```
     *
     * @param {String} headers Headers needing to be parsed
     * @returns {Object} Headers parsed into an object
     */
    var parseHeaders = function parseHeaders(headers) {
      var parsed = {};
      var key;
      var val;
      var i;

      if (!headers) { return parsed; }

      utils.forEach(headers.split('\n'), function parser(line) {
        i = line.indexOf(':');
        key = utils.trim(line.substr(0, i)).toLowerCase();
        val = utils.trim(line.substr(i + 1));

        if (key) {
          if (parsed[key] && ignoreDuplicateOf.indexOf(key) >= 0) {
            return;
          }
          if (key === 'set-cookie') {
            parsed[key] = (parsed[key] ? parsed[key] : []).concat([val]);
          } else {
            parsed[key] = parsed[key] ? parsed[key] + ', ' + val : val;
          }
        }
      });

      return parsed;
    };

    var isURLSameOrigin = (
      utils.isStandardBrowserEnv() ?

      // Standard browser envs have full support of the APIs needed to test
      // whether the request URL is of the same origin as current location.
        (function standardBrowserEnv() {
          var msie = /(msie|trident)/i.test(navigator.userAgent);
          var urlParsingNode = document.createElement('a');
          var originURL;

          /**
        * Parse a URL to discover it's components
        *
        * @param {String} url The URL to be parsed
        * @returns {Object}
        */
          function resolveURL(url) {
            var href = url;

            if (msie) {
            // IE needs attribute set twice to normalize properties
              urlParsingNode.setAttribute('href', href);
              href = urlParsingNode.href;
            }

            urlParsingNode.setAttribute('href', href);

            // urlParsingNode provides the UrlUtils interface - http://url.spec.whatwg.org/#urlutils
            return {
              href: urlParsingNode.href,
              protocol: urlParsingNode.protocol ? urlParsingNode.protocol.replace(/:$/, '') : '',
              host: urlParsingNode.host,
              search: urlParsingNode.search ? urlParsingNode.search.replace(/^\?/, '') : '',
              hash: urlParsingNode.hash ? urlParsingNode.hash.replace(/^#/, '') : '',
              hostname: urlParsingNode.hostname,
              port: urlParsingNode.port,
              pathname: (urlParsingNode.pathname.charAt(0) === '/') ?
                urlParsingNode.pathname :
                '/' + urlParsingNode.pathname
            };
          }

          originURL = resolveURL(window.location.href);

          /**
        * Determine if a URL shares the same origin as the current location
        *
        * @param {String} requestURL The URL to test
        * @returns {boolean} True if URL shares the same origin, otherwise false
        */
          return function isURLSameOrigin(requestURL) {
            var parsed = (utils.isString(requestURL)) ? resolveURL(requestURL) : requestURL;
            return (parsed.protocol === originURL.protocol &&
                parsed.host === originURL.host);
          };
        })() :

      // Non standard browser envs (web workers, react-native) lack needed support.
        (function nonStandardBrowserEnv() {
          return function isURLSameOrigin() {
            return true;
          };
        })()
    );

    var cookies = (
      utils.isStandardBrowserEnv() ?

      // Standard browser envs support document.cookie
        (function standardBrowserEnv() {
          return {
            write: function write(name, value, expires, path, domain, secure) {
              var cookie = [];
              cookie.push(name + '=' + encodeURIComponent(value));

              if (utils.isNumber(expires)) {
                cookie.push('expires=' + new Date(expires).toGMTString());
              }

              if (utils.isString(path)) {
                cookie.push('path=' + path);
              }

              if (utils.isString(domain)) {
                cookie.push('domain=' + domain);
              }

              if (secure === true) {
                cookie.push('secure');
              }

              document.cookie = cookie.join('; ');
            },

            read: function read(name) {
              var match = document.cookie.match(new RegExp('(^|;\\s*)(' + name + ')=([^;]*)'));
              return (match ? decodeURIComponent(match[3]) : null);
            },

            remove: function remove(name) {
              this.write(name, '', Date.now() - 86400000);
            }
          };
        })() :

      // Non standard browser env (web workers, react-native) lack needed support.
        (function nonStandardBrowserEnv() {
          return {
            write: function write() {},
            read: function read() { return null; },
            remove: function remove() {}
          };
        })()
    );

    var xhr = function xhrAdapter(config) {
      return new Promise(function dispatchXhrRequest(resolve, reject) {
        var requestData = config.data;
        var requestHeaders = config.headers;

        if (utils.isFormData(requestData)) {
          delete requestHeaders['Content-Type']; // Let the browser set it
        }

        var request = new XMLHttpRequest();

        // HTTP basic authentication
        if (config.auth) {
          var username = config.auth.username || '';
          var password = config.auth.password || '';
          requestHeaders.Authorization = 'Basic ' + btoa(username + ':' + password);
        }

        var fullPath = buildFullPath(config.baseURL, config.url);
        request.open(config.method.toUpperCase(), buildURL(fullPath, config.params, config.paramsSerializer), true);

        // Set the request timeout in MS
        request.timeout = config.timeout;

        // Listen for ready state
        request.onreadystatechange = function handleLoad() {
          if (!request || request.readyState !== 4) {
            return;
          }

          // The request errored out and we didn't get a response, this will be
          // handled by onerror instead
          // With one exception: request that using file: protocol, most browsers
          // will return status as 0 even though it's a successful request
          if (request.status === 0 && !(request.responseURL && request.responseURL.indexOf('file:') === 0)) {
            return;
          }

          // Prepare the response
          var responseHeaders = 'getAllResponseHeaders' in request ? parseHeaders(request.getAllResponseHeaders()) : null;
          var responseData = !config.responseType || config.responseType === 'text' ? request.responseText : request.response;
          var response = {
            data: responseData,
            status: request.status,
            statusText: request.statusText,
            headers: responseHeaders,
            config: config,
            request: request
          };

          settle(resolve, reject, response);

          // Clean up request
          request = null;
        };

        // Handle browser request cancellation (as opposed to a manual cancellation)
        request.onabort = function handleAbort() {
          if (!request) {
            return;
          }

          reject(createError('Request aborted', config, 'ECONNABORTED', request));

          // Clean up request
          request = null;
        };

        // Handle low level network errors
        request.onerror = function handleError() {
          // Real errors are hidden from us by the browser
          // onerror should only fire if it's a network error
          reject(createError('Network Error', config, null, request));

          // Clean up request
          request = null;
        };

        // Handle timeout
        request.ontimeout = function handleTimeout() {
          var timeoutErrorMessage = 'timeout of ' + config.timeout + 'ms exceeded';
          if (config.timeoutErrorMessage) {
            timeoutErrorMessage = config.timeoutErrorMessage;
          }
          reject(createError(timeoutErrorMessage, config, 'ECONNABORTED',
            request));

          // Clean up request
          request = null;
        };

        // Add xsrf header
        // This is only done if running in a standard browser environment.
        // Specifically not if we're in a web worker, or react-native.
        if (utils.isStandardBrowserEnv()) {
          var cookies$1 = cookies;

          // Add xsrf header
          var xsrfValue = (config.withCredentials || isURLSameOrigin(fullPath)) && config.xsrfCookieName ?
            cookies$1.read(config.xsrfCookieName) :
            undefined;

          if (xsrfValue) {
            requestHeaders[config.xsrfHeaderName] = xsrfValue;
          }
        }

        // Add headers to the request
        if ('setRequestHeader' in request) {
          utils.forEach(requestHeaders, function setRequestHeader(val, key) {
            if (typeof requestData === 'undefined' && key.toLowerCase() === 'content-type') {
              // Remove Content-Type if data is undefined
              delete requestHeaders[key];
            } else {
              // Otherwise add header to the request
              request.setRequestHeader(key, val);
            }
          });
        }

        // Add withCredentials to request if needed
        if (!utils.isUndefined(config.withCredentials)) {
          request.withCredentials = !!config.withCredentials;
        }

        // Add responseType to request if needed
        if (config.responseType) {
          try {
            request.responseType = config.responseType;
          } catch (e) {
            // Expected DOMException thrown by browsers not compatible XMLHttpRequest Level 2.
            // But, this can be suppressed for 'json' type as it can be parsed by default 'transformResponse' function.
            if (config.responseType !== 'json') {
              throw e;
            }
          }
        }

        // Handle progress if needed
        if (typeof config.onDownloadProgress === 'function') {
          request.addEventListener('progress', config.onDownloadProgress);
        }

        // Not all browsers support upload events
        if (typeof config.onUploadProgress === 'function' && request.upload) {
          request.upload.addEventListener('progress', config.onUploadProgress);
        }

        if (config.cancelToken) {
          // Handle cancellation
          config.cancelToken.promise.then(function onCanceled(cancel) {
            if (!request) {
              return;
            }

            request.abort();
            reject(cancel);
            // Clean up request
            request = null;
          });
        }

        if (requestData === undefined) {
          requestData = null;
        }

        // Send the request
        request.send(requestData);
      });
    };

    var DEFAULT_CONTENT_TYPE = {
      'Content-Type': 'application/x-www-form-urlencoded'
    };

    function setContentTypeIfUnset(headers, value) {
      if (!utils.isUndefined(headers) && utils.isUndefined(headers['Content-Type'])) {
        headers['Content-Type'] = value;
      }
    }

    function getDefaultAdapter() {
      var adapter;
      if (typeof XMLHttpRequest !== 'undefined') {
        // For browsers use XHR adapter
        adapter = xhr;
      } else if (typeof process !== 'undefined' && Object.prototype.toString.call(process) === '[object process]') {
        // For node use HTTP adapter
        adapter = xhr;
      }
      return adapter;
    }

    var defaults = {
      adapter: getDefaultAdapter(),

      transformRequest: [function transformRequest(data, headers) {
        normalizeHeaderName(headers, 'Accept');
        normalizeHeaderName(headers, 'Content-Type');
        if (utils.isFormData(data) ||
          utils.isArrayBuffer(data) ||
          utils.isBuffer(data) ||
          utils.isStream(data) ||
          utils.isFile(data) ||
          utils.isBlob(data)
        ) {
          return data;
        }
        if (utils.isArrayBufferView(data)) {
          return data.buffer;
        }
        if (utils.isURLSearchParams(data)) {
          setContentTypeIfUnset(headers, 'application/x-www-form-urlencoded;charset=utf-8');
          return data.toString();
        }
        if (utils.isObject(data)) {
          setContentTypeIfUnset(headers, 'application/json;charset=utf-8');
          return JSON.stringify(data);
        }
        return data;
      }],

      transformResponse: [function transformResponse(data) {
        /*eslint no-param-reassign:0*/
        if (typeof data === 'string') {
          try {
            data = JSON.parse(data);
          } catch (e) { /* Ignore */ }
        }
        return data;
      }],

      /**
       * A timeout in milliseconds to abort a request. If set to 0 (default) a
       * timeout is not created.
       */
      timeout: 0,

      xsrfCookieName: 'XSRF-TOKEN',
      xsrfHeaderName: 'X-XSRF-TOKEN',

      maxContentLength: -1,

      validateStatus: function validateStatus(status) {
        return status >= 200 && status < 300;
      }
    };

    defaults.headers = {
      common: {
        'Accept': 'application/json, text/plain, */*'
      }
    };

    utils.forEach(['delete', 'get', 'head'], function forEachMethodNoData(method) {
      defaults.headers[method] = {};
    });

    utils.forEach(['post', 'put', 'patch'], function forEachMethodWithData(method) {
      defaults.headers[method] = utils.merge(DEFAULT_CONTENT_TYPE);
    });

    var defaults_1 = defaults;

    /**
     * Throws a `Cancel` if cancellation has been requested.
     */
    function throwIfCancellationRequested(config) {
      if (config.cancelToken) {
        config.cancelToken.throwIfRequested();
      }
    }

    /**
     * Dispatch a request to the server using the configured adapter.
     *
     * @param {object} config The config that is to be used for the request
     * @returns {Promise} The Promise to be fulfilled
     */
    var dispatchRequest = function dispatchRequest(config) {
      throwIfCancellationRequested(config);

      // Ensure headers exist
      config.headers = config.headers || {};

      // Transform request data
      config.data = transformData(
        config.data,
        config.headers,
        config.transformRequest
      );

      // Flatten headers
      config.headers = utils.merge(
        config.headers.common || {},
        config.headers[config.method] || {},
        config.headers
      );

      utils.forEach(
        ['delete', 'get', 'head', 'post', 'put', 'patch', 'common'],
        function cleanHeaderConfig(method) {
          delete config.headers[method];
        }
      );

      var adapter = config.adapter || defaults_1.adapter;

      return adapter(config).then(function onAdapterResolution(response) {
        throwIfCancellationRequested(config);

        // Transform response data
        response.data = transformData(
          response.data,
          response.headers,
          config.transformResponse
        );

        return response;
      }, function onAdapterRejection(reason) {
        if (!isCancel(reason)) {
          throwIfCancellationRequested(config);

          // Transform response data
          if (reason && reason.response) {
            reason.response.data = transformData(
              reason.response.data,
              reason.response.headers,
              config.transformResponse
            );
          }
        }

        return Promise.reject(reason);
      });
    };

    /**
     * Config-specific merge-function which creates a new config-object
     * by merging two configuration objects together.
     *
     * @param {Object} config1
     * @param {Object} config2
     * @returns {Object} New object resulting from merging config2 to config1
     */
    var mergeConfig = function mergeConfig(config1, config2) {
      // eslint-disable-next-line no-param-reassign
      config2 = config2 || {};
      var config = {};

      var valueFromConfig2Keys = ['url', 'method', 'params', 'data'];
      var mergeDeepPropertiesKeys = ['headers', 'auth', 'proxy'];
      var defaultToConfig2Keys = [
        'baseURL', 'url', 'transformRequest', 'transformResponse', 'paramsSerializer',
        'timeout', 'withCredentials', 'adapter', 'responseType', 'xsrfCookieName',
        'xsrfHeaderName', 'onUploadProgress', 'onDownloadProgress',
        'maxContentLength', 'validateStatus', 'maxRedirects', 'httpAgent',
        'httpsAgent', 'cancelToken', 'socketPath'
      ];

      utils.forEach(valueFromConfig2Keys, function valueFromConfig2(prop) {
        if (typeof config2[prop] !== 'undefined') {
          config[prop] = config2[prop];
        }
      });

      utils.forEach(mergeDeepPropertiesKeys, function mergeDeepProperties(prop) {
        if (utils.isObject(config2[prop])) {
          config[prop] = utils.deepMerge(config1[prop], config2[prop]);
        } else if (typeof config2[prop] !== 'undefined') {
          config[prop] = config2[prop];
        } else if (utils.isObject(config1[prop])) {
          config[prop] = utils.deepMerge(config1[prop]);
        } else if (typeof config1[prop] !== 'undefined') {
          config[prop] = config1[prop];
        }
      });

      utils.forEach(defaultToConfig2Keys, function defaultToConfig2(prop) {
        if (typeof config2[prop] !== 'undefined') {
          config[prop] = config2[prop];
        } else if (typeof config1[prop] !== 'undefined') {
          config[prop] = config1[prop];
        }
      });

      var axiosKeys = valueFromConfig2Keys
        .concat(mergeDeepPropertiesKeys)
        .concat(defaultToConfig2Keys);

      var otherKeys = Object
        .keys(config2)
        .filter(function filterAxiosKeys(key) {
          return axiosKeys.indexOf(key) === -1;
        });

      utils.forEach(otherKeys, function otherKeysDefaultToConfig2(prop) {
        if (typeof config2[prop] !== 'undefined') {
          config[prop] = config2[prop];
        } else if (typeof config1[prop] !== 'undefined') {
          config[prop] = config1[prop];
        }
      });

      return config;
    };

    /**
     * Create a new instance of Axios
     *
     * @param {Object} instanceConfig The default config for the instance
     */
    function Axios(instanceConfig) {
      this.defaults = instanceConfig;
      this.interceptors = {
        request: new InterceptorManager_1(),
        response: new InterceptorManager_1()
      };
    }

    /**
     * Dispatch a request
     *
     * @param {Object} config The config specific for this request (merged with this.defaults)
     */
    Axios.prototype.request = function request(config) {
      /*eslint no-param-reassign:0*/
      // Allow for axios('example/url'[, config]) a la fetch API
      if (typeof config === 'string') {
        config = arguments[1] || {};
        config.url = arguments[0];
      } else {
        config = config || {};
      }

      config = mergeConfig(this.defaults, config);

      // Set config.method
      if (config.method) {
        config.method = config.method.toLowerCase();
      } else if (this.defaults.method) {
        config.method = this.defaults.method.toLowerCase();
      } else {
        config.method = 'get';
      }

      // Hook up interceptors middleware
      var chain = [dispatchRequest, undefined];
      var promise = Promise.resolve(config);

      this.interceptors.request.forEach(function unshiftRequestInterceptors(interceptor) {
        chain.unshift(interceptor.fulfilled, interceptor.rejected);
      });

      this.interceptors.response.forEach(function pushResponseInterceptors(interceptor) {
        chain.push(interceptor.fulfilled, interceptor.rejected);
      });

      while (chain.length) {
        promise = promise.then(chain.shift(), chain.shift());
      }

      return promise;
    };

    Axios.prototype.getUri = function getUri(config) {
      config = mergeConfig(this.defaults, config);
      return buildURL(config.url, config.params, config.paramsSerializer).replace(/^\?/, '');
    };

    // Provide aliases for supported request methods
    utils.forEach(['delete', 'get', 'head', 'options'], function forEachMethodNoData(method) {
      /*eslint func-names:0*/
      Axios.prototype[method] = function(url, config) {
        return this.request(utils.merge(config || {}, {
          method: method,
          url: url
        }));
      };
    });

    utils.forEach(['post', 'put', 'patch'], function forEachMethodWithData(method) {
      /*eslint func-names:0*/
      Axios.prototype[method] = function(url, data, config) {
        return this.request(utils.merge(config || {}, {
          method: method,
          url: url,
          data: data
        }));
      };
    });

    var Axios_1 = Axios;

    /**
     * A `Cancel` is an object that is thrown when an operation is canceled.
     *
     * @class
     * @param {string=} message The message.
     */
    function Cancel(message) {
      this.message = message;
    }

    Cancel.prototype.toString = function toString() {
      return 'Cancel' + (this.message ? ': ' + this.message : '');
    };

    Cancel.prototype.__CANCEL__ = true;

    var Cancel_1 = Cancel;

    /**
     * A `CancelToken` is an object that can be used to request cancellation of an operation.
     *
     * @class
     * @param {Function} executor The executor function.
     */
    function CancelToken(executor) {
      if (typeof executor !== 'function') {
        throw new TypeError('executor must be a function.');
      }

      var resolvePromise;
      this.promise = new Promise(function promiseExecutor(resolve) {
        resolvePromise = resolve;
      });

      var token = this;
      executor(function cancel(message) {
        if (token.reason) {
          // Cancellation has already been requested
          return;
        }

        token.reason = new Cancel_1(message);
        resolvePromise(token.reason);
      });
    }

    /**
     * Throws a `Cancel` if cancellation has been requested.
     */
    CancelToken.prototype.throwIfRequested = function throwIfRequested() {
      if (this.reason) {
        throw this.reason;
      }
    };

    /**
     * Returns an object that contains a new `CancelToken` and a function that, when called,
     * cancels the `CancelToken`.
     */
    CancelToken.source = function source() {
      var cancel;
      var token = new CancelToken(function executor(c) {
        cancel = c;
      });
      return {
        token: token,
        cancel: cancel
      };
    };

    var CancelToken_1 = CancelToken;

    /**
     * Syntactic sugar for invoking a function and expanding an array for arguments.
     *
     * Common use case would be to use `Function.prototype.apply`.
     *
     *  ```js
     *  function f(x, y, z) {}
     *  var args = [1, 2, 3];
     *  f.apply(null, args);
     *  ```
     *
     * With `spread` this example can be re-written.
     *
     *  ```js
     *  spread(function(x, y, z) {})([1, 2, 3]);
     *  ```
     *
     * @param {Function} callback
     * @returns {Function}
     */
    var spread = function spread(callback) {
      return function wrap(arr) {
        return callback.apply(null, arr);
      };
    };

    /**
     * Create an instance of Axios
     *
     * @param {Object} defaultConfig The default config for the instance
     * @return {Axios} A new instance of Axios
     */
    function createInstance(defaultConfig) {
      var context = new Axios_1(defaultConfig);
      var instance = bind$1(Axios_1.prototype.request, context);

      // Copy axios.prototype to instance
      utils.extend(instance, Axios_1.prototype, context);

      // Copy context to instance
      utils.extend(instance, context);

      return instance;
    }

    // Create the default instance to be exported
    var axios = createInstance(defaults_1);

    // Expose Axios class to allow class inheritance
    axios.Axios = Axios_1;

    // Factory for creating new instances
    axios.create = function create(instanceConfig) {
      return createInstance(mergeConfig(axios.defaults, instanceConfig));
    };

    // Expose Cancel & CancelToken
    axios.Cancel = Cancel_1;
    axios.CancelToken = CancelToken_1;
    axios.isCancel = isCancel;

    // Expose all/spread
    axios.all = function all(promises) {
      return Promise.all(promises);
    };
    axios.spread = spread;

    var axios_1 = axios;

    // Allow use of default import syntax in TypeScript
    var _default = axios;
    axios_1.default = _default;

    var axios$1 = axios_1;

    var has = Object.prototype.hasOwnProperty;
    var isArray$1 = Array.isArray;

    var hexTable = (function () {
        var array = [];
        for (var i = 0; i < 256; ++i) {
            array.push('%' + ((i < 16 ? '0' : '') + i.toString(16)).toUpperCase());
        }

        return array;
    }());

    var compactQueue = function compactQueue(queue) {
        while (queue.length > 1) {
            var item = queue.pop();
            var obj = item.obj[item.prop];

            if (isArray$1(obj)) {
                var compacted = [];

                for (var j = 0; j < obj.length; ++j) {
                    if (typeof obj[j] !== 'undefined') {
                        compacted.push(obj[j]);
                    }
                }

                item.obj[item.prop] = compacted;
            }
        }
    };

    var arrayToObject = function arrayToObject(source, options) {
        var obj = options && options.plainObjects ? Object.create(null) : {};
        for (var i = 0; i < source.length; ++i) {
            if (typeof source[i] !== 'undefined') {
                obj[i] = source[i];
            }
        }

        return obj;
    };

    var merge$1 = function merge(target, source, options) {
        /* eslint no-param-reassign: 0 */
        if (!source) {
            return target;
        }

        if (typeof source !== 'object') {
            if (isArray$1(target)) {
                target.push(source);
            } else if (target && typeof target === 'object') {
                if ((options && (options.plainObjects || options.allowPrototypes)) || !has.call(Object.prototype, source)) {
                    target[source] = true;
                }
            } else {
                return [target, source];
            }

            return target;
        }

        if (!target || typeof target !== 'object') {
            return [target].concat(source);
        }

        var mergeTarget = target;
        if (isArray$1(target) && !isArray$1(source)) {
            mergeTarget = arrayToObject(target, options);
        }

        if (isArray$1(target) && isArray$1(source)) {
            source.forEach(function (item, i) {
                if (has.call(target, i)) {
                    var targetItem = target[i];
                    if (targetItem && typeof targetItem === 'object' && item && typeof item === 'object') {
                        target[i] = merge(targetItem, item, options);
                    } else {
                        target.push(item);
                    }
                } else {
                    target[i] = item;
                }
            });
            return target;
        }

        return Object.keys(source).reduce(function (acc, key) {
            var value = source[key];

            if (has.call(acc, key)) {
                acc[key] = merge(acc[key], value, options);
            } else {
                acc[key] = value;
            }
            return acc;
        }, mergeTarget);
    };

    var assign = function assignSingleSource(target, source) {
        return Object.keys(source).reduce(function (acc, key) {
            acc[key] = source[key];
            return acc;
        }, target);
    };

    var decode = function (str, decoder, charset) {
        var strWithoutPlus = str.replace(/\+/g, ' ');
        if (charset === 'iso-8859-1') {
            // unescape never throws, no try...catch needed:
            return strWithoutPlus.replace(/%[0-9a-f]{2}/gi, unescape);
        }
        // utf-8
        try {
            return decodeURIComponent(strWithoutPlus);
        } catch (e) {
            return strWithoutPlus;
        }
    };

    var encode$1 = function encode(str, defaultEncoder, charset) {
        // This code was originally written by Brian White (mscdex) for the io.js core querystring library.
        // It has been adapted here for stricter adherence to RFC 3986
        if (str.length === 0) {
            return str;
        }

        var string = str;
        if (typeof str === 'symbol') {
            string = Symbol.prototype.toString.call(str);
        } else if (typeof str !== 'string') {
            string = String(str);
        }

        if (charset === 'iso-8859-1') {
            return escape(string).replace(/%u[0-9a-f]{4}/gi, function ($0) {
                return '%26%23' + parseInt($0.slice(2), 16) + '%3B';
            });
        }

        var out = '';
        for (var i = 0; i < string.length; ++i) {
            var c = string.charCodeAt(i);

            if (
                c === 0x2D // -
                || c === 0x2E // .
                || c === 0x5F // _
                || c === 0x7E // ~
                || (c >= 0x30 && c <= 0x39) // 0-9
                || (c >= 0x41 && c <= 0x5A) // a-z
                || (c >= 0x61 && c <= 0x7A) // A-Z
            ) {
                out += string.charAt(i);
                continue;
            }

            if (c < 0x80) {
                out = out + hexTable[c];
                continue;
            }

            if (c < 0x800) {
                out = out + (hexTable[0xC0 | (c >> 6)] + hexTable[0x80 | (c & 0x3F)]);
                continue;
            }

            if (c < 0xD800 || c >= 0xE000) {
                out = out + (hexTable[0xE0 | (c >> 12)] + hexTable[0x80 | ((c >> 6) & 0x3F)] + hexTable[0x80 | (c & 0x3F)]);
                continue;
            }

            i += 1;
            c = 0x10000 + (((c & 0x3FF) << 10) | (string.charCodeAt(i) & 0x3FF));
            out += hexTable[0xF0 | (c >> 18)]
                + hexTable[0x80 | ((c >> 12) & 0x3F)]
                + hexTable[0x80 | ((c >> 6) & 0x3F)]
                + hexTable[0x80 | (c & 0x3F)];
        }

        return out;
    };

    var compact = function compact(value) {
        var queue = [{ obj: { o: value }, prop: 'o' }];
        var refs = [];

        for (var i = 0; i < queue.length; ++i) {
            var item = queue[i];
            var obj = item.obj[item.prop];

            var keys = Object.keys(obj);
            for (var j = 0; j < keys.length; ++j) {
                var key = keys[j];
                var val = obj[key];
                if (typeof val === 'object' && val !== null && refs.indexOf(val) === -1) {
                    queue.push({ obj: obj, prop: key });
                    refs.push(val);
                }
            }
        }

        compactQueue(queue);

        return value;
    };

    var isRegExp = function isRegExp(obj) {
        return Object.prototype.toString.call(obj) === '[object RegExp]';
    };

    var isBuffer$1 = function isBuffer(obj) {
        if (!obj || typeof obj !== 'object') {
            return false;
        }

        return !!(obj.constructor && obj.constructor.isBuffer && obj.constructor.isBuffer(obj));
    };

    var combine = function combine(a, b) {
        return [].concat(a, b);
    };

    var maybeMap = function maybeMap(val, fn) {
        if (isArray$1(val)) {
            var mapped = [];
            for (var i = 0; i < val.length; i += 1) {
                mapped.push(fn(val[i]));
            }
            return mapped;
        }
        return fn(val);
    };

    var utils$1 = {
        arrayToObject: arrayToObject,
        assign: assign,
        combine: combine,
        compact: compact,
        decode: decode,
        encode: encode$1,
        isBuffer: isBuffer$1,
        isRegExp: isRegExp,
        maybeMap: maybeMap,
        merge: merge$1
    };

    var replace = String.prototype.replace;
    var percentTwenties = /%20/g;



    var Format = {
        RFC1738: 'RFC1738',
        RFC3986: 'RFC3986'
    };

    var formats = utils$1.assign(
        {
            'default': Format.RFC3986,
            formatters: {
                RFC1738: function (value) {
                    return replace.call(value, percentTwenties, '+');
                },
                RFC3986: function (value) {
                    return String(value);
                }
            }
        },
        Format
    );

    var has$1 = Object.prototype.hasOwnProperty;

    var arrayPrefixGenerators = {
        brackets: function brackets(prefix) {
            return prefix + '[]';
        },
        comma: 'comma',
        indices: function indices(prefix, key) {
            return prefix + '[' + key + ']';
        },
        repeat: function repeat(prefix) {
            return prefix;
        }
    };

    var isArray$2 = Array.isArray;
    var push = Array.prototype.push;
    var pushToArray = function (arr, valueOrArray) {
        push.apply(arr, isArray$2(valueOrArray) ? valueOrArray : [valueOrArray]);
    };

    var toISO = Date.prototype.toISOString;

    var defaultFormat = formats['default'];
    var defaults$1 = {
        addQueryPrefix: false,
        allowDots: false,
        charset: 'utf-8',
        charsetSentinel: false,
        delimiter: '&',
        encode: true,
        encoder: utils$1.encode,
        encodeValuesOnly: false,
        format: defaultFormat,
        formatter: formats.formatters[defaultFormat],
        // deprecated
        indices: false,
        serializeDate: function serializeDate(date) {
            return toISO.call(date);
        },
        skipNulls: false,
        strictNullHandling: false
    };

    var isNonNullishPrimitive = function isNonNullishPrimitive(v) {
        return typeof v === 'string'
            || typeof v === 'number'
            || typeof v === 'boolean'
            || typeof v === 'symbol'
            || typeof v === 'bigint';
    };

    var stringify = function stringify(
        object,
        prefix,
        generateArrayPrefix,
        strictNullHandling,
        skipNulls,
        encoder,
        filter,
        sort,
        allowDots,
        serializeDate,
        formatter,
        encodeValuesOnly,
        charset
    ) {
        var obj = object;
        if (typeof filter === 'function') {
            obj = filter(prefix, obj);
        } else if (obj instanceof Date) {
            obj = serializeDate(obj);
        } else if (generateArrayPrefix === 'comma' && isArray$2(obj)) {
            obj = utils$1.maybeMap(obj, function (value) {
                if (value instanceof Date) {
                    return serializeDate(value);
                }
                return value;
            }).join(',');
        }

        if (obj === null) {
            if (strictNullHandling) {
                return encoder && !encodeValuesOnly ? encoder(prefix, defaults$1.encoder, charset, 'key') : prefix;
            }

            obj = '';
        }

        if (isNonNullishPrimitive(obj) || utils$1.isBuffer(obj)) {
            if (encoder) {
                var keyValue = encodeValuesOnly ? prefix : encoder(prefix, defaults$1.encoder, charset, 'key');
                return [formatter(keyValue) + '=' + formatter(encoder(obj, defaults$1.encoder, charset, 'value'))];
            }
            return [formatter(prefix) + '=' + formatter(String(obj))];
        }

        var values = [];

        if (typeof obj === 'undefined') {
            return values;
        }

        var objKeys;
        if (isArray$2(filter)) {
            objKeys = filter;
        } else {
            var keys = Object.keys(obj);
            objKeys = sort ? keys.sort(sort) : keys;
        }

        for (var i = 0; i < objKeys.length; ++i) {
            var key = objKeys[i];
            var value = obj[key];

            if (skipNulls && value === null) {
                continue;
            }

            var keyPrefix = isArray$2(obj)
                ? typeof generateArrayPrefix === 'function' ? generateArrayPrefix(prefix, key) : prefix
                : prefix + (allowDots ? '.' + key : '[' + key + ']');

            pushToArray(values, stringify(
                value,
                keyPrefix,
                generateArrayPrefix,
                strictNullHandling,
                skipNulls,
                encoder,
                filter,
                sort,
                allowDots,
                serializeDate,
                formatter,
                encodeValuesOnly,
                charset
            ));
        }

        return values;
    };

    var normalizeStringifyOptions = function normalizeStringifyOptions(opts) {
        if (!opts) {
            return defaults$1;
        }

        if (opts.encoder !== null && opts.encoder !== undefined && typeof opts.encoder !== 'function') {
            throw new TypeError('Encoder has to be a function.');
        }

        var charset = opts.charset || defaults$1.charset;
        if (typeof opts.charset !== 'undefined' && opts.charset !== 'utf-8' && opts.charset !== 'iso-8859-1') {
            throw new TypeError('The charset option must be either utf-8, iso-8859-1, or undefined');
        }

        var format = formats['default'];
        if (typeof opts.format !== 'undefined') {
            if (!has$1.call(formats.formatters, opts.format)) {
                throw new TypeError('Unknown format option provided.');
            }
            format = opts.format;
        }
        var formatter = formats.formatters[format];

        var filter = defaults$1.filter;
        if (typeof opts.filter === 'function' || isArray$2(opts.filter)) {
            filter = opts.filter;
        }

        return {
            addQueryPrefix: typeof opts.addQueryPrefix === 'boolean' ? opts.addQueryPrefix : defaults$1.addQueryPrefix,
            allowDots: typeof opts.allowDots === 'undefined' ? defaults$1.allowDots : !!opts.allowDots,
            charset: charset,
            charsetSentinel: typeof opts.charsetSentinel === 'boolean' ? opts.charsetSentinel : defaults$1.charsetSentinel,
            delimiter: typeof opts.delimiter === 'undefined' ? defaults$1.delimiter : opts.delimiter,
            encode: typeof opts.encode === 'boolean' ? opts.encode : defaults$1.encode,
            encoder: typeof opts.encoder === 'function' ? opts.encoder : defaults$1.encoder,
            encodeValuesOnly: typeof opts.encodeValuesOnly === 'boolean' ? opts.encodeValuesOnly : defaults$1.encodeValuesOnly,
            filter: filter,
            formatter: formatter,
            serializeDate: typeof opts.serializeDate === 'function' ? opts.serializeDate : defaults$1.serializeDate,
            skipNulls: typeof opts.skipNulls === 'boolean' ? opts.skipNulls : defaults$1.skipNulls,
            sort: typeof opts.sort === 'function' ? opts.sort : null,
            strictNullHandling: typeof opts.strictNullHandling === 'boolean' ? opts.strictNullHandling : defaults$1.strictNullHandling
        };
    };

    var stringify_1 = function (object, opts) {
        var obj = object;
        var options = normalizeStringifyOptions(opts);

        var objKeys;
        var filter;

        if (typeof options.filter === 'function') {
            filter = options.filter;
            obj = filter('', obj);
        } else if (isArray$2(options.filter)) {
            filter = options.filter;
            objKeys = filter;
        }

        var keys = [];

        if (typeof obj !== 'object' || obj === null) {
            return '';
        }

        var arrayFormat;
        if (opts && opts.arrayFormat in arrayPrefixGenerators) {
            arrayFormat = opts.arrayFormat;
        } else if (opts && 'indices' in opts) {
            arrayFormat = opts.indices ? 'indices' : 'repeat';
        } else {
            arrayFormat = 'indices';
        }

        var generateArrayPrefix = arrayPrefixGenerators[arrayFormat];

        if (!objKeys) {
            objKeys = Object.keys(obj);
        }

        if (options.sort) {
            objKeys.sort(options.sort);
        }

        for (var i = 0; i < objKeys.length; ++i) {
            var key = objKeys[i];

            if (options.skipNulls && obj[key] === null) {
                continue;
            }
            pushToArray(keys, stringify(
                obj[key],
                key,
                generateArrayPrefix,
                options.strictNullHandling,
                options.skipNulls,
                options.encode ? options.encoder : null,
                options.filter,
                options.sort,
                options.allowDots,
                options.serializeDate,
                options.formatter,
                options.encodeValuesOnly,
                options.charset
            ));
        }

        var joined = keys.join(options.delimiter);
        var prefix = options.addQueryPrefix === true ? '?' : '';

        if (options.charsetSentinel) {
            if (options.charset === 'iso-8859-1') {
                // encodeURIComponent('&#10003;'), the "numeric entity" representation of a checkmark
                prefix += 'utf8=%26%2310003%3B&';
            } else {
                // encodeURIComponent('✓')
                prefix += 'utf8=%E2%9C%93&';
            }
        }

        return joined.length > 0 ? prefix + joined : '';
    };

    var has$2 = Object.prototype.hasOwnProperty;
    var isArray$3 = Array.isArray;

    var defaults$2 = {
        allowDots: false,
        allowPrototypes: false,
        arrayLimit: 20,
        charset: 'utf-8',
        charsetSentinel: false,
        comma: false,
        decoder: utils$1.decode,
        delimiter: '&',
        depth: 5,
        ignoreQueryPrefix: false,
        interpretNumericEntities: false,
        parameterLimit: 1000,
        parseArrays: true,
        plainObjects: false,
        strictNullHandling: false
    };

    var interpretNumericEntities = function (str) {
        return str.replace(/&#(\d+);/g, function ($0, numberStr) {
            return String.fromCharCode(parseInt(numberStr, 10));
        });
    };

    var parseArrayValue = function (val, options) {
        if (val && typeof val === 'string' && options.comma && val.indexOf(',') > -1) {
            return val.split(',');
        }

        return val;
    };

    // This is what browsers will submit when the ✓ character occurs in an
    // application/x-www-form-urlencoded body and the encoding of the page containing
    // the form is iso-8859-1, or when the submitted form has an accept-charset
    // attribute of iso-8859-1. Presumably also with other charsets that do not contain
    // the ✓ character, such as us-ascii.
    var isoSentinel = 'utf8=%26%2310003%3B'; // encodeURIComponent('&#10003;')

    // These are the percent-encoded utf-8 octets representing a checkmark, indicating that the request actually is utf-8 encoded.
    var charsetSentinel = 'utf8=%E2%9C%93'; // encodeURIComponent('✓')

    var parseValues = function parseQueryStringValues(str, options) {
        var obj = {};
        var cleanStr = options.ignoreQueryPrefix ? str.replace(/^\?/, '') : str;
        var limit = options.parameterLimit === Infinity ? undefined : options.parameterLimit;
        var parts = cleanStr.split(options.delimiter, limit);
        var skipIndex = -1; // Keep track of where the utf8 sentinel was found
        var i;

        var charset = options.charset;
        if (options.charsetSentinel) {
            for (i = 0; i < parts.length; ++i) {
                if (parts[i].indexOf('utf8=') === 0) {
                    if (parts[i] === charsetSentinel) {
                        charset = 'utf-8';
                    } else if (parts[i] === isoSentinel) {
                        charset = 'iso-8859-1';
                    }
                    skipIndex = i;
                    i = parts.length; // The eslint settings do not allow break;
                }
            }
        }

        for (i = 0; i < parts.length; ++i) {
            if (i === skipIndex) {
                continue;
            }
            var part = parts[i];

            var bracketEqualsPos = part.indexOf(']=');
            var pos = bracketEqualsPos === -1 ? part.indexOf('=') : bracketEqualsPos + 1;

            var key, val;
            if (pos === -1) {
                key = options.decoder(part, defaults$2.decoder, charset, 'key');
                val = options.strictNullHandling ? null : '';
            } else {
                key = options.decoder(part.slice(0, pos), defaults$2.decoder, charset, 'key');
                val = utils$1.maybeMap(
                    parseArrayValue(part.slice(pos + 1), options),
                    function (encodedVal) {
                        return options.decoder(encodedVal, defaults$2.decoder, charset, 'value');
                    }
                );
            }

            if (val && options.interpretNumericEntities && charset === 'iso-8859-1') {
                val = interpretNumericEntities(val);
            }

            if (part.indexOf('[]=') > -1) {
                val = isArray$3(val) ? [val] : val;
            }

            if (has$2.call(obj, key)) {
                obj[key] = utils$1.combine(obj[key], val);
            } else {
                obj[key] = val;
            }
        }

        return obj;
    };

    var parseObject = function (chain, val, options, valuesParsed) {
        var leaf = valuesParsed ? val : parseArrayValue(val, options);

        for (var i = chain.length - 1; i >= 0; --i) {
            var obj;
            var root = chain[i];

            if (root === '[]' && options.parseArrays) {
                obj = [].concat(leaf);
            } else {
                obj = options.plainObjects ? Object.create(null) : {};
                var cleanRoot = root.charAt(0) === '[' && root.charAt(root.length - 1) === ']' ? root.slice(1, -1) : root;
                var index = parseInt(cleanRoot, 10);
                if (!options.parseArrays && cleanRoot === '') {
                    obj = { 0: leaf };
                } else if (
                    !isNaN(index)
                    && root !== cleanRoot
                    && String(index) === cleanRoot
                    && index >= 0
                    && (options.parseArrays && index <= options.arrayLimit)
                ) {
                    obj = [];
                    obj[index] = leaf;
                } else {
                    obj[cleanRoot] = leaf;
                }
            }

            leaf = obj; // eslint-disable-line no-param-reassign
        }

        return leaf;
    };

    var parseKeys = function parseQueryStringKeys(givenKey, val, options, valuesParsed) {
        if (!givenKey) {
            return;
        }

        // Transform dot notation to bracket notation
        var key = options.allowDots ? givenKey.replace(/\.([^.[]+)/g, '[$1]') : givenKey;

        // The regex chunks

        var brackets = /(\[[^[\]]*])/;
        var child = /(\[[^[\]]*])/g;

        // Get the parent

        var segment = options.depth > 0 && brackets.exec(key);
        var parent = segment ? key.slice(0, segment.index) : key;

        // Stash the parent if it exists

        var keys = [];
        if (parent) {
            // If we aren't using plain objects, optionally prefix keys that would overwrite object prototype properties
            if (!options.plainObjects && has$2.call(Object.prototype, parent)) {
                if (!options.allowPrototypes) {
                    return;
                }
            }

            keys.push(parent);
        }

        // Loop through children appending to the array until we hit depth

        var i = 0;
        while (options.depth > 0 && (segment = child.exec(key)) !== null && i < options.depth) {
            i += 1;
            if (!options.plainObjects && has$2.call(Object.prototype, segment[1].slice(1, -1))) {
                if (!options.allowPrototypes) {
                    return;
                }
            }
            keys.push(segment[1]);
        }

        // If there's a remainder, just add whatever is left

        if (segment) {
            keys.push('[' + key.slice(segment.index) + ']');
        }

        return parseObject(keys, val, options, valuesParsed);
    };

    var normalizeParseOptions = function normalizeParseOptions(opts) {
        if (!opts) {
            return defaults$2;
        }

        if (opts.decoder !== null && opts.decoder !== undefined && typeof opts.decoder !== 'function') {
            throw new TypeError('Decoder has to be a function.');
        }

        if (typeof opts.charset !== 'undefined' && opts.charset !== 'utf-8' && opts.charset !== 'iso-8859-1') {
            throw new TypeError('The charset option must be either utf-8, iso-8859-1, or undefined');
        }
        var charset = typeof opts.charset === 'undefined' ? defaults$2.charset : opts.charset;

        return {
            allowDots: typeof opts.allowDots === 'undefined' ? defaults$2.allowDots : !!opts.allowDots,
            allowPrototypes: typeof opts.allowPrototypes === 'boolean' ? opts.allowPrototypes : defaults$2.allowPrototypes,
            arrayLimit: typeof opts.arrayLimit === 'number' ? opts.arrayLimit : defaults$2.arrayLimit,
            charset: charset,
            charsetSentinel: typeof opts.charsetSentinel === 'boolean' ? opts.charsetSentinel : defaults$2.charsetSentinel,
            comma: typeof opts.comma === 'boolean' ? opts.comma : defaults$2.comma,
            decoder: typeof opts.decoder === 'function' ? opts.decoder : defaults$2.decoder,
            delimiter: typeof opts.delimiter === 'string' || utils$1.isRegExp(opts.delimiter) ? opts.delimiter : defaults$2.delimiter,
            // eslint-disable-next-line no-implicit-coercion, no-extra-parens
            depth: (typeof opts.depth === 'number' || opts.depth === false) ? +opts.depth : defaults$2.depth,
            ignoreQueryPrefix: opts.ignoreQueryPrefix === true,
            interpretNumericEntities: typeof opts.interpretNumericEntities === 'boolean' ? opts.interpretNumericEntities : defaults$2.interpretNumericEntities,
            parameterLimit: typeof opts.parameterLimit === 'number' ? opts.parameterLimit : defaults$2.parameterLimit,
            parseArrays: opts.parseArrays !== false,
            plainObjects: typeof opts.plainObjects === 'boolean' ? opts.plainObjects : defaults$2.plainObjects,
            strictNullHandling: typeof opts.strictNullHandling === 'boolean' ? opts.strictNullHandling : defaults$2.strictNullHandling
        };
    };

    var parse = function (str, opts) {
        var options = normalizeParseOptions(opts);

        if (str === '' || str === null || typeof str === 'undefined') {
            return options.plainObjects ? Object.create(null) : {};
        }

        var tempObj = typeof str === 'string' ? parseValues(str, options) : str;
        var obj = options.plainObjects ? Object.create(null) : {};

        // Iterate over the keys and setup the new object

        var keys = Object.keys(tempObj);
        for (var i = 0; i < keys.length; ++i) {
            var key = keys[i];
            var newObj = parseKeys(key, tempObj[key], options, typeof str === 'string');
            obj = utils$1.merge(obj, newObj, options);
        }

        return utils$1.compact(obj);
    };

    var lib = {
        formats: formats,
        parse: parse,
        stringify: stringify_1
    };

    async function translate(text, opts, justDefinition) {
        try {
            const url = 'https://translate.google.com/translate_a/single';
            let data = {
                client: 'gtx',
                sl: opts.from,
                tl: opts.to,
                hl: opts.from,
                dt: ['md'],
                ie: 'UTF-8',
                oe: 'UTF-8',
                q: text,
            };
            if (!justDefinition) {
                let allOtherOptions = ['at', 'bd', 'ex', 'ld', 'qca', 'rw', 'rm', 'ss', 't'];
                data.dt.concat(allOtherOptions);
            }
            console.log(url + '?' + lib.stringify(data, { indices: false }));
            const res = await axios$1({
                method: 'get',
                url: url + '?' + lib.stringify(data, { indices: false })
            });
            if (justDefinition) {
                return remapJustDefinition(res.data);
            }
            else
                return remapTranslate(res.data);
        }
        catch (err) {
            console.error(err);
            return null;
        }
    }
    function remapJustDefinition(data) {
        let obj = { definitions };
        if (data[12]) {
            var definitions = [];
            for (let i = 0; i < data[12].length; i++) {
                let type = data[12][i][0];
                let content = [];
                for (let j = 0; j < data[12][i][1].length; j++) {
                    let obj = {
                        phrase: data[12][i][1][j][0],
                        instance: data[12][i][1][j][2]
                    };
                    content.push(obj);
                }
                let section = {
                    type,
                    content
                };
                definitions.push(section);
            }
            obj.definitions = definitions;
        }
        return obj;
    }
    function remapTranslate(data) {
        var obj;
        if (data[2] === data[8][0][0]) {
            obj.correction.language.iso = data[2];
        }
        else {
            obj.correction.language.didYouMean = true;
            obj.correction.language.iso = data[8][0][0];
        }
        if (data[7] && data[7][0]) {
            var youMean = data[7][1];
            obj.correction.text.value = youMean;
            if (data[7][5] === true) {
                obj.correction.text.autoCorrected = true;
            }
            else {
                obj.correction.text.didYouMean = true;
            }
        }
        if (data[0]) {
            let length = data[0].length;
            let input = [];
            let translation = [];
            obj.target = data[0][0][1] || null;
            for (let i = 0; i < length; i++) {
                if (data[0][i][1] !== null) {
                    input.push(data[0][i][1]);
                    translation.push(data[0][i][0]);
                }
            }
            obj.input = input;
            obj.text = input.join('');
            obj.translation = translation.join('');
        }
        if (data[0][1]) {
            obj.pronunciation = data[0][1][3];
        }
        if (data[1]) {
            var translations = [];
            for (let i = 0; i < data[1].length; i++) {
                let type = data[1][i][0];
                let content = [];
                for (let j = 0; j < data[1][i][2].length; j++) {
                    var rating = data[1][i][2][j][3];
                    var bar;
                    switch (true) {
                        case (rating > 0.05):
                            bar = 'common';
                            break;
                        case (rating < 0.05 && rating > 0.002):
                            bar = 'uncommon';
                            break;
                        case (rating < 0.002):
                            bar = 'rare';
                            break;
                        case (rating === undefined):
                            bar = 'rare';
                    }
                    let obj = {
                        article: data[1][i][2][j][4] || null,
                        word: data[1][i][2][j][0],
                        meaning: data[1][i][2][j][1],
                        rating,
                        bar
                    };
                    content.push(obj);
                }
                let section = {
                    type,
                    content
                };
                translations.push(section);
            }
            obj.translations = translations;
        }
        if (data[12]) {
            var definitions = [];
            for (let i = 0; i < data[12].length; i++) {
                let type = data[12][i][0];
                let content = [];
                for (let j = 0; j < data[12][i][1].length; j++) {
                    let obj = {
                        phrase: data[12][i][1][j][0],
                        instance: data[12][i][1][j][2]
                    };
                    content.push(obj);
                }
                let section = {
                    type,
                    content
                };
                definitions.push(section);
            }
            obj.definitions = definitions;
        }
        if (data[11]) {
            var synonyms = [];
            for (let i = 0; i < data[11].length; i++) {
                let type = data[11][i][0];
                let content = [];
                for (let j = 0; j < data[11][i][1].length; j++) {
                    let arr = data[11][i][1][j][0];
                    content.push(arr);
                }
                let section = {
                    type,
                    content
                };
                synonyms.push(section);
            }
            obj.synonyms = synonyms;
        }
        if (data[13]) {
            var examples = [];
            for (let i = 0; i < data[13][0].length; i++) {
                examples.push(data[13][0][i][0]);
            }
            obj.examples = examples;
        }
        if (data[14]) {
            obj.seeAlso = data[14][0];
        }
        return obj;
    }
    //# sourceMappingURL=google-translate.js.map

    /* src\Components\DropdownMenu.svelte generated by Svelte v3.22.3 */

    const file$1 = "src\\Components\\DropdownMenu.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[5] = list[i];
    	return child_ctx;
    }

    // (30:6) {#each items as item}
    function create_each_block(ctx) {
    	let a;
    	let t_value = /*item*/ ctx[5] + "";
    	let t;

    	const block = {
    		c: function create() {
    			a = element("a");
    			t = text(t_value);
    			attr_dev(a, "href", "/");
    			attr_dev(a, "class", "dropdown-item");
    			add_location(a, file$1, 30, 8, 823);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, a, anchor);
    			append_dev(a, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*items*/ 2 && t_value !== (t_value = /*item*/ ctx[5] + "")) set_data_dev(t, t_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(a);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block.name,
    		type: "each",
    		source: "(30:6) {#each items as item}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$1(ctx) {
    	let div3;
    	let div0;
    	let button;
    	let span0;
    	let t0;
    	let t1;
    	let span1;
    	let i;
    	let t2;
    	let div2;
    	let div1;
    	let dispose;
    	let each_value = /*items*/ ctx[1];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			div3 = element("div");
    			div0 = element("div");
    			button = element("button");
    			span0 = element("span");
    			t0 = text(/*placeholder*/ ctx[0]);
    			t1 = space();
    			span1 = element("span");
    			i = element("i");
    			t2 = space();
    			div2 = element("div");
    			div1 = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			add_location(span0, file$1, 21, 6, 524);
    			attr_dev(i, "class", "fas fa-angle-down");
    			attr_dev(i, "aria-hidden", "true");
    			add_location(i, file$1, 23, 8, 596);
    			attr_dev(span1, "class", "icon is-small");
    			add_location(span1, file$1, 22, 6, 558);
    			attr_dev(button, "class", "button is-dark");
    			attr_dev(button, "aria-haspopup", "true");
    			attr_dev(button, "aria-controls", "dropdown-menu");
    			add_location(button, file$1, 17, 4, 413);
    			attr_dev(div0, "class", "dropdown-trigger");
    			add_location(div0, file$1, 16, 2, 377);
    			attr_dev(div1, "class", "dropdown-content");
    			add_location(div1, file$1, 28, 4, 754);
    			attr_dev(div2, "class", "dropdown-menu");
    			attr_dev(div2, "id", "dropdown-menu");
    			attr_dev(div2, "role", "menu");
    			add_location(div2, file$1, 27, 2, 690);
    			attr_dev(div3, "class", "dropdown svelte-hlzhkl");
    			set_style(div3, "justify-self", /*justifySelf*/ ctx[2]);
    			toggle_class(div3, "is-active", /*isActive*/ ctx[3]);
    			add_location(div3, file$1, 11, 0, 234);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor, remount) {
    			insert_dev(target, div3, anchor);
    			append_dev(div3, div0);
    			append_dev(div0, button);
    			append_dev(button, span0);
    			append_dev(span0, t0);
    			append_dev(button, t1);
    			append_dev(button, span1);
    			append_dev(span1, i);
    			append_dev(div3, t2);
    			append_dev(div3, div2);
    			append_dev(div2, div1);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div1, null);
    			}

    			if (remount) dispose();
    			dispose = listen_dev(div3, "click", /*click_handler*/ ctx[4], false, false, false);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*placeholder*/ 1) set_data_dev(t0, /*placeholder*/ ctx[0]);

    			if (dirty & /*items*/ 2) {
    				each_value = /*items*/ ctx[1];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(div1, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}

    			if (dirty & /*justifySelf*/ 4) {
    				set_style(div3, "justify-self", /*justifySelf*/ ctx[2]);
    			}

    			if (dirty & /*isActive*/ 8) {
    				toggle_class(div3, "is-active", /*isActive*/ ctx[3]);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div3);
    			destroy_each(each_blocks, detaching);
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$1.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$1($$self, $$props, $$invalidate) {
    	let isActive;
    	let { placeholder } = $$props;
    	let { items } = $$props;
    	let { justifySelf } = $$props;
    	const writable_props = ["placeholder", "items", "justifySelf"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<DropdownMenu> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("DropdownMenu", $$slots, []);
    	const click_handler = () => $$invalidate(3, isActive = !isActive);

    	$$self.$set = $$props => {
    		if ("placeholder" in $$props) $$invalidate(0, placeholder = $$props.placeholder);
    		if ("items" in $$props) $$invalidate(1, items = $$props.items);
    		if ("justifySelf" in $$props) $$invalidate(2, justifySelf = $$props.justifySelf);
    	};

    	$$self.$capture_state = () => ({
    		isActive,
    		placeholder,
    		items,
    		justifySelf
    	});

    	$$self.$inject_state = $$props => {
    		if ("isActive" in $$props) $$invalidate(3, isActive = $$props.isActive);
    		if ("placeholder" in $$props) $$invalidate(0, placeholder = $$props.placeholder);
    		if ("items" in $$props) $$invalidate(1, items = $$props.items);
    		if ("justifySelf" in $$props) $$invalidate(2, justifySelf = $$props.justifySelf);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [placeholder, items, justifySelf, isActive, click_handler];
    }

    class DropdownMenu extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, { placeholder: 0, items: 1, justifySelf: 2 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "DropdownMenu",
    			options,
    			id: create_fragment$1.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*placeholder*/ ctx[0] === undefined && !("placeholder" in props)) {
    			console.warn("<DropdownMenu> was created without expected prop 'placeholder'");
    		}

    		if (/*items*/ ctx[1] === undefined && !("items" in props)) {
    			console.warn("<DropdownMenu> was created without expected prop 'items'");
    		}

    		if (/*justifySelf*/ ctx[2] === undefined && !("justifySelf" in props)) {
    			console.warn("<DropdownMenu> was created without expected prop 'justifySelf'");
    		}
    	}

    	get placeholder() {
    		throw new Error("<DropdownMenu>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set placeholder(value) {
    		throw new Error("<DropdownMenu>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get items() {
    		throw new Error("<DropdownMenu>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set items(value) {
    		throw new Error("<DropdownMenu>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get justifySelf() {
    		throw new Error("<DropdownMenu>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set justifySelf(value) {
    		throw new Error("<DropdownMenu>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\Views\TranslationView.svelte generated by Svelte v3.22.3 */

    const { console: console_1 } = globals;
    const file$2 = "src\\Views\\TranslationView.svelte";

    function get_each_context_1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[9] = list[i];
    	return child_ctx;
    }

    function get_each_context$1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[6] = list[i];
    	return child_ctx;
    }

    // (87:0) {#if translationResult != null}
    function create_if_block(ctx) {
    	let t0;
    	let div;
    	let span0;
    	let t2;
    	let span1;
    	let t3_value = /*translationResult*/ ctx[1].translation + "";
    	let t3;
    	let t4;
    	let each_1_anchor;
    	let if_block = /*translationResult*/ ctx[1].target != null && create_if_block_2(ctx);
    	let each_value = /*translationResult*/ ctx[1].translations;
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$1(get_each_context$1(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			if (if_block) if_block.c();
    			t0 = space();
    			div = element("div");
    			span0 = element("span");
    			span0.textContent = "most common";
    			t2 = space();
    			span1 = element("span");
    			t3 = text(t3_value);
    			t4 = space();

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			each_1_anchor = empty();
    			attr_dev(span0, "class", "translate-result-area-header svelte-2jmlz0");
    			set_style(span0, "font-weight", "bold");
    			add_location(span0, file$2, 91, 4, 2398);
    			set_style(span1, "font-weight", "bold");
    			set_style(span1, "color", "white");
    			add_location(span1, file$2, 94, 4, 2506);
    			attr_dev(div, "class", "translate-result-area svelte-2jmlz0");
    			add_location(div, file$2, 90, 2, 2357);
    		},
    		m: function mount(target, anchor) {
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, t0, anchor);
    			insert_dev(target, div, anchor);
    			append_dev(div, span0);
    			append_dev(div, t2);
    			append_dev(div, span1);
    			append_dev(span1, t3);
    			insert_dev(target, t4, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(target, anchor);
    			}

    			insert_dev(target, each_1_anchor, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (/*translationResult*/ ctx[1].target != null) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block_2(ctx);
    					if_block.c();
    					if_block.m(t0.parentNode, t0);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}

    			if (dirty & /*translationResult*/ 2 && t3_value !== (t3_value = /*translationResult*/ ctx[1].translation + "")) set_data_dev(t3, t3_value);

    			if (dirty & /*translationResult, showSimilarWordsForTranslations*/ 10) {
    				each_value = /*translationResult*/ ctx[1].translations;
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$1(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block$1(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(each_1_anchor.parentNode, each_1_anchor);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}
    		},
    		d: function destroy(detaching) {
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(div);
    			if (detaching) detach_dev(t4);
    			destroy_each(each_blocks, detaching);
    			if (detaching) detach_dev(each_1_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(87:0) {#if translationResult != null}",
    		ctx
    	});

    	return block;
    }

    // (88:2) {#if translationResult.target != null}
    function create_if_block_2(ctx) {
    	let div;
    	let t0;
    	let t1;

    	const block = {
    		c: function create() {
    			div = element("div");
    			t0 = text("Translations of ");
    			t1 = text(/*targetWords*/ ctx[0]);
    			attr_dev(div, "id", "translations-of");
    			attr_dev(div, "class", "svelte-2jmlz0");
    			add_location(div, file$2, 88, 4, 2283);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, t0);
    			append_dev(div, t1);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*targetWords*/ 1) set_data_dev(t1, /*targetWords*/ ctx[0]);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2.name,
    		type: "if",
    		source: "(88:2) {#if translationResult.target != null}",
    		ctx
    	});

    	return block;
    }

    // (108:10) {#if showSimilarWordsForTranslations}
    function create_if_block_1(ctx) {
    	let div;
    	let t_value = /*line*/ ctx[9].meaning.join(", ") + "";
    	let t;

    	const block = {
    		c: function create() {
    			div = element("div");
    			t = text(t_value);
    			add_location(div, file$2, 108, 12, 3088);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*translationResult*/ 2 && t_value !== (t_value = /*line*/ ctx[9].meaning.join(", ") + "")) set_data_dev(t, t_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1.name,
    		type: "if",
    		source: "(108:10) {#if showSimilarWordsForTranslations}",
    		ctx
    	});

    	return block;
    }

    // (102:6) {#each translation.content as line}
    function create_each_block_1(ctx) {
    	let div2;
    	let div1;
    	let div0;
    	let t0;
    	let span;
    	let t1_value = /*line*/ ctx[9].word + "";
    	let t1;
    	let t2;
    	let if_block = /*showSimilarWordsForTranslations*/ ctx[3] && create_if_block_1(ctx);

    	const block = {
    		c: function create() {
    			div2 = element("div");
    			div1 = element("div");
    			div0 = element("div");
    			t0 = space();
    			span = element("span");
    			t1 = text(t1_value);
    			t2 = space();
    			if (if_block) if_block.c();
    			attr_dev(div0, "class", "frequency-bar");
    			add_location(div0, file$2, 104, 12, 2907);
    			attr_dev(span, "class", "translation-word-of-line svelte-2jmlz0");
    			add_location(span, file$2, 105, 12, 2950);
    			add_location(div1, file$2, 103, 10, 2888);
    			attr_dev(div2, "class", "translate-result-line svelte-2jmlz0");
    			add_location(div2, file$2, 102, 8, 2841);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div2, anchor);
    			append_dev(div2, div1);
    			append_dev(div1, div0);
    			append_dev(div1, t0);
    			append_dev(div1, span);
    			append_dev(span, t1);
    			append_dev(div2, t2);
    			if (if_block) if_block.m(div2, null);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*translationResult*/ 2 && t1_value !== (t1_value = /*line*/ ctx[9].word + "")) set_data_dev(t1, t1_value);
    			if (/*showSimilarWordsForTranslations*/ ctx[3]) if_block.p(ctx, dirty);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div2);
    			if (if_block) if_block.d();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_1.name,
    		type: "each",
    		source: "(102:6) {#each translation.content as line}",
    		ctx
    	});

    	return block;
    }

    // (99:2) {#each translationResult.translations as translation}
    function create_each_block$1(ctx) {
    	let div;
    	let span;
    	let t0_value = /*translation*/ ctx[6].type + "";
    	let t0;
    	let t1;
    	let t2;
    	let each_value_1 = /*translation*/ ctx[6].content;
    	validate_each_argument(each_value_1);
    	let each_blocks = [];

    	for (let i = 0; i < each_value_1.length; i += 1) {
    		each_blocks[i] = create_each_block_1(get_each_context_1(ctx, each_value_1, i));
    	}

    	const block = {
    		c: function create() {
    			div = element("div");
    			span = element("span");
    			t0 = text(t0_value);
    			t1 = space();

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t2 = space();
    			attr_dev(span, "class", "translate-result-area-header svelte-2jmlz0");
    			add_location(span, file$2, 100, 6, 2720);
    			attr_dev(div, "class", "translate-result-area svelte-2jmlz0");
    			add_location(div, file$2, 99, 4, 2677);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, span);
    			append_dev(span, t0);
    			append_dev(div, t1);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div, null);
    			}

    			append_dev(div, t2);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*translationResult*/ 2 && t0_value !== (t0_value = /*translation*/ ctx[6].type + "")) set_data_dev(t0, t0_value);

    			if (dirty & /*translationResult, showSimilarWordsForTranslations*/ 10) {
    				each_value_1 = /*translation*/ ctx[6].content;
    				validate_each_argument(each_value_1);
    				let i;

    				for (i = 0; i < each_value_1.length; i += 1) {
    					const child_ctx = get_each_context_1(ctx, each_value_1, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block_1(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(div, t2);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value_1.length;
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_each(each_blocks, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$1.name,
    		type: "each",
    		source: "(99:2) {#each translationResult.translations as translation}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$2(ctx) {
    	let top_bar;
    	let t0;
    	let button;
    	let span;
    	let i;
    	let t1;
    	let t2;
    	let textarea;
    	let textarea_cols_value;
    	let textarea_rows_value;
    	let t3;
    	let if_block_anchor;
    	let current;
    	let dispose;

    	const dropdownmenu0 = new DropdownMenu({
    			props: {
    				placeholder: "Translate To",
    				items: /*languages*/ ctx[2]
    			},
    			$$inline: true
    		});

    	const dropdownmenu1 = new DropdownMenu({
    			props: {
    				justifySelf: "right",
    				placeholder: "Translate From",
    				items: /*languages*/ ctx[2]
    			},
    			$$inline: true
    		});

    	let if_block = /*translationResult*/ ctx[1] != null && create_if_block(ctx);

    	const block = {
    		c: function create() {
    			top_bar = element("top-bar");
    			create_component(dropdownmenu0.$$.fragment);
    			t0 = space();
    			button = element("button");
    			span = element("span");
    			i = element("i");
    			t1 = space();
    			create_component(dropdownmenu1.$$.fragment);
    			t2 = space();
    			textarea = element("textarea");
    			t3 = space();
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    			attr_dev(i, "class", "fas fa-exchange-alt");
    			add_location(i, file$2, 68, 6, 1821);
    			attr_dev(span, "class", "icon is-medium");
    			add_location(span, file$2, 67, 4, 1784);
    			attr_dev(button, "class", "button is-link svelte-2jmlz0");
    			add_location(button, file$2, 66, 2, 1747);
    			set_custom_element_data(top_bar, "class", "svelte-2jmlz0");
    			add_location(top_bar, file$2, 64, 0, 1669);
    			attr_dev(textarea, "class", "textarea has-fixed-size svelte-2jmlz0");
    			attr_dev(textarea, "placeholder", "Translate");
    			attr_dev(textarea, "name", "main-text-area");
    			attr_dev(textarea, "id", "main-text-area");
    			attr_dev(textarea, "cols", textarea_cols_value = 30);
    			attr_dev(textarea, "rows", textarea_rows_value = 5);
    			add_location(textarea, file$2, 77, 0, 1998);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor, remount) {
    			insert_dev(target, top_bar, anchor);
    			mount_component(dropdownmenu0, top_bar, null);
    			append_dev(top_bar, t0);
    			append_dev(top_bar, button);
    			append_dev(button, span);
    			append_dev(span, i);
    			append_dev(top_bar, t1);
    			mount_component(dropdownmenu1, top_bar, null);
    			insert_dev(target, t2, anchor);
    			insert_dev(target, textarea, anchor);
    			set_input_value(textarea, /*targetWords*/ ctx[0]);
    			insert_dev(target, t3, anchor);
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    			current = true;
    			if (remount) run_all(dispose);

    			dispose = [
    				listen_dev(textarea, "input", /*textarea_input_handler*/ ctx[5]),
    				listen_dev(textarea, "change", /*translateWords*/ ctx[4], false, false, false)
    			];
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*targetWords*/ 1) {
    				set_input_value(textarea, /*targetWords*/ ctx[0]);
    			}

    			if (/*translationResult*/ ctx[1] != null) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block(ctx);
    					if_block.c();
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(dropdownmenu0.$$.fragment, local);
    			transition_in(dropdownmenu1.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(dropdownmenu0.$$.fragment, local);
    			transition_out(dropdownmenu1.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(top_bar);
    			destroy_component(dropdownmenu0);
    			destroy_component(dropdownmenu1);
    			if (detaching) detach_dev(t2);
    			if (detaching) detach_dev(textarea);
    			if (detaching) detach_dev(t3);
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$2.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$2($$self, $$props, $$invalidate) {
    	let { targetWords } = $$props;

    	onMount(async () => {
    		if (targetWords) {
    			await translateWords();
    		}
    	});

    	let languages = ["Turkish", "English"];
    	let translationResult;
    	let showSimilarWordsForTranslations = false;

    	async function translateWords(e) {
    		let result = await translate(targetWords, { from: "en", to: "tr" }, false);

    		if (result) {
    			if (result.hasOwnProperty("translations")) {
    				$$invalidate(1, translationResult = result);
    			}
    		}

    		console.log(translationResult);
    	}

    	const writable_props = ["targetWords"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1.warn(`<TranslationView> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("TranslationView", $$slots, []);

    	function textarea_input_handler() {
    		targetWords = this.value;
    		$$invalidate(0, targetWords);
    	}

    	$$self.$set = $$props => {
    		if ("targetWords" in $$props) $$invalidate(0, targetWords = $$props.targetWords);
    	};

    	$$self.$capture_state = () => ({
    		onMount,
    		translate,
    		DropdownMenu,
    		targetWords,
    		languages,
    		translationResult,
    		showSimilarWordsForTranslations,
    		translateWords
    	});

    	$$self.$inject_state = $$props => {
    		if ("targetWords" in $$props) $$invalidate(0, targetWords = $$props.targetWords);
    		if ("languages" in $$props) $$invalidate(2, languages = $$props.languages);
    		if ("translationResult" in $$props) $$invalidate(1, translationResult = $$props.translationResult);
    		if ("showSimilarWordsForTranslations" in $$props) $$invalidate(3, showSimilarWordsForTranslations = $$props.showSimilarWordsForTranslations);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		targetWords,
    		translationResult,
    		languages,
    		showSimilarWordsForTranslations,
    		translateWords,
    		textarea_input_handler
    	];
    }

    class TranslationView extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, { targetWords: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "TranslationView",
    			options,
    			id: create_fragment$2.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*targetWords*/ ctx[0] === undefined && !("targetWords" in props)) {
    			console_1.warn("<TranslationView> was created without expected prop 'targetWords'");
    		}
    	}

    	get targetWords() {
    		throw new Error("<TranslationView>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set targetWords(value) {
    		throw new Error("<TranslationView>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\Views\DefinitionView.svelte generated by Svelte v3.22.3 */

    const { console: console_1$1 } = globals;
    const file$3 = "src\\Views\\DefinitionView.svelte";

    function get_each_context_1$1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[7] = list[i];
    	child_ctx[9] = i;
    	return child_ctx;
    }

    function get_each_context$2(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[4] = list[i];
    	return child_ctx;
    }

    // (77:0) {#if definitionResult != null}
    function create_if_block$1(ctx) {
    	let div;
    	let t0;
    	let t1;
    	let t2;
    	let each_1_anchor;
    	let each_value = /*definitionResult*/ ctx[1].definitions;
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$2(get_each_context$2(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			div = element("div");
    			t0 = text("Definitions of ");
    			t1 = text(/*targetWords*/ ctx[0]);
    			t2 = space();

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			each_1_anchor = empty();
    			attr_dev(div, "id", "definition-of");
    			add_location(div, file$3, 77, 2, 2001);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, t0);
    			append_dev(div, t1);
    			insert_dev(target, t2, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(target, anchor);
    			}

    			insert_dev(target, each_1_anchor, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*targetWords*/ 1) set_data_dev(t1, /*targetWords*/ ctx[0]);

    			if (dirty & /*definitionResult*/ 2) {
    				each_value = /*definitionResult*/ ctx[1].definitions;
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$2(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block$2(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(each_1_anchor.parentNode, each_1_anchor);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if (detaching) detach_dev(t2);
    			destroy_each(each_blocks, detaching);
    			if (detaching) detach_dev(each_1_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$1.name,
    		type: "if",
    		source: "(77:0) {#if definitionResult != null}",
    		ctx
    	});

    	return block;
    }

    // (83:6) {#each definition.content as line, i}
    function create_each_block_1$1(ctx) {
    	let div1;
    	let div0;
    	let t0_value = /*i*/ ctx[9] + 1 + "";
    	let t0;
    	let t1;
    	let span;
    	let t2_value = /*line*/ ctx[7].phrase + "";
    	let t2;

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			div0 = element("div");
    			t0 = text(t0_value);
    			t1 = space();
    			span = element("span");
    			t2 = text(t2_value);
    			attr_dev(div0, "class", "line-count svelte-ob64xk");
    			add_location(div0, file$3, 84, 10, 2336);
    			attr_dev(span, "class", "definition-word-of-line svelte-ob64xk");
    			add_location(span, file$3, 85, 10, 2385);
    			attr_dev(div1, "class", "definition-result-line svelte-ob64xk");
    			add_location(div1, file$3, 83, 8, 2288);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, div0);
    			append_dev(div0, t0);
    			append_dev(div1, t1);
    			append_dev(div1, span);
    			append_dev(span, t2);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*definitionResult*/ 2 && t2_value !== (t2_value = /*line*/ ctx[7].phrase + "")) set_data_dev(t2, t2_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_1$1.name,
    		type: "each",
    		source: "(83:6) {#each definition.content as line, i}",
    		ctx
    	});

    	return block;
    }

    // (80:2) {#each definitionResult.definitions as definition}
    function create_each_block$2(ctx) {
    	let div;
    	let span;
    	let t0_value = /*definition*/ ctx[4].type + "";
    	let t0;
    	let t1;
    	let t2;
    	let each_value_1 = /*definition*/ ctx[4].content;
    	validate_each_argument(each_value_1);
    	let each_blocks = [];

    	for (let i = 0; i < each_value_1.length; i += 1) {
    		each_blocks[i] = create_each_block_1$1(get_each_context_1$1(ctx, each_value_1, i));
    	}

    	const block = {
    		c: function create() {
    			div = element("div");
    			span = element("span");
    			t0 = text(t0_value);
    			t1 = space();

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t2 = space();
    			attr_dev(span, "class", "definition-result-area-header svelte-ob64xk");
    			add_location(span, file$3, 81, 6, 2165);
    			attr_dev(div, "class", "definition-result-area svelte-ob64xk");
    			add_location(div, file$3, 80, 4, 2121);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, span);
    			append_dev(span, t0);
    			append_dev(div, t1);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div, null);
    			}

    			append_dev(div, t2);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*definitionResult*/ 2 && t0_value !== (t0_value = /*definition*/ ctx[4].type + "")) set_data_dev(t0, t0_value);

    			if (dirty & /*definitionResult*/ 2) {
    				each_value_1 = /*definition*/ ctx[4].content;
    				validate_each_argument(each_value_1);
    				let i;

    				for (i = 0; i < each_value_1.length; i += 1) {
    					const child_ctx = get_each_context_1$1(ctx, each_value_1, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block_1$1(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(div, t2);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value_1.length;
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_each(each_blocks, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$2.name,
    		type: "each",
    		source: "(80:2) {#each definitionResult.definitions as definition}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$3(ctx) {
    	let top_bar;
    	let t0;
    	let textarea;
    	let textarea_cols_value;
    	let textarea_rows_value;
    	let t1;
    	let if_block_anchor;
    	let dispose;
    	let if_block = /*definitionResult*/ ctx[1] != null && create_if_block$1(ctx);

    	const block = {
    		c: function create() {
    			top_bar = element("top-bar");
    			t0 = space();
    			textarea = element("textarea");
    			t1 = space();
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    			set_custom_element_data(top_bar, "class", "svelte-ob64xk");
    			add_location(top_bar, file$3, 65, 0, 1744);
    			attr_dev(textarea, "class", "textarea has-fixed-size svelte-ob64xk");
    			attr_dev(textarea, "placeholder", "Write a word");
    			attr_dev(textarea, "name", "main-text-area");
    			attr_dev(textarea, "id", "main-text-area");
    			attr_dev(textarea, "cols", textarea_cols_value = 30);
    			attr_dev(textarea, "rows", textarea_rows_value = 5);
    			add_location(textarea, file$3, 67, 0, 1759);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor, remount) {
    			insert_dev(target, top_bar, anchor);
    			insert_dev(target, t0, anchor);
    			insert_dev(target, textarea, anchor);
    			set_input_value(textarea, /*targetWords*/ ctx[0]);
    			insert_dev(target, t1, anchor);
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    			if (remount) run_all(dispose);

    			dispose = [
    				listen_dev(textarea, "input", /*textarea_input_handler*/ ctx[3]),
    				listen_dev(textarea, "input", /*defineWords*/ ctx[2], false, false, false)
    			];
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*targetWords*/ 1) {
    				set_input_value(textarea, /*targetWords*/ ctx[0]);
    			}

    			if (/*definitionResult*/ ctx[1] != null) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block$1(ctx);
    					if_block.c();
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(top_bar);
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(textarea);
    			if (detaching) detach_dev(t1);
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$3.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$3($$self, $$props, $$invalidate) {
    	let { targetWords } = $$props;

    	onMount(async () => {
    		if (targetWords) {
    			await defineWords();
    		}
    	});

    	let definitionResult;

    	async function defineWords(e) {
    		let result = await translate(targetWords, { from: "en", to: "tr" }, true);

    		if (result) {
    			if (result.hasOwnProperty("definitions")) {
    				$$invalidate(1, definitionResult = result);
    			}
    		}

    		console.log(definitionResult);
    	}

    	const writable_props = ["targetWords"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1$1.warn(`<DefinitionView> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("DefinitionView", $$slots, []);

    	function textarea_input_handler() {
    		targetWords = this.value;
    		$$invalidate(0, targetWords);
    	}

    	$$self.$set = $$props => {
    		if ("targetWords" in $$props) $$invalidate(0, targetWords = $$props.targetWords);
    	};

    	$$self.$capture_state = () => ({
    		onMount,
    		translate,
    		DropdownMenu,
    		targetWords,
    		definitionResult,
    		defineWords
    	});

    	$$self.$inject_state = $$props => {
    		if ("targetWords" in $$props) $$invalidate(0, targetWords = $$props.targetWords);
    		if ("definitionResult" in $$props) $$invalidate(1, definitionResult = $$props.definitionResult);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [targetWords, definitionResult, defineWords, textarea_input_handler];
    }

    class DefinitionView extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$3, create_fragment$3, safe_not_equal, { targetWords: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "DefinitionView",
    			options,
    			id: create_fragment$3.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*targetWords*/ ctx[0] === undefined && !("targetWords" in props)) {
    			console_1$1.warn("<DefinitionView> was created without expected prop 'targetWords'");
    		}
    	}

    	get targetWords() {
    		throw new Error("<DefinitionView>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set targetWords(value) {
    		throw new Error("<DefinitionView>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\Views\SlangView.svelte generated by Svelte v3.22.3 */

    const { console: console_1$2 } = globals;
    const file$4 = "src\\Views\\SlangView.svelte";

    function get_each_context_1$2(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[9] = list[i];
    	return child_ctx;
    }

    function get_each_context$3(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[6] = list[i];
    	return child_ctx;
    }

    // (73:0) {#if translationResult != null}
    function create_if_block$2(ctx) {
    	let t0;
    	let div;
    	let span0;
    	let t2;
    	let span1;
    	let t3_value = /*translationResult*/ ctx[1].translation + "";
    	let t3;
    	let t4;
    	let each_1_anchor;
    	let if_block = /*translationResult*/ ctx[1].target != null && create_if_block_2$1(ctx);
    	let each_value = /*translationResult*/ ctx[1].translations;
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$3(get_each_context$3(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			if (if_block) if_block.c();
    			t0 = space();
    			div = element("div");
    			span0 = element("span");
    			span0.textContent = "most common";
    			t2 = space();
    			span1 = element("span");
    			t3 = text(t3_value);
    			t4 = space();

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			each_1_anchor = empty();
    			attr_dev(span0, "class", "translate-result-area-header svelte-khlx3c");
    			set_style(span0, "font-weight", "bold");
    			add_location(span0, file$4, 77, 4, 2077);
    			set_style(span1, "font-weight", "bold");
    			set_style(span1, "color", "white");
    			add_location(span1, file$4, 80, 4, 2185);
    			attr_dev(div, "class", "translate-result-area svelte-khlx3c");
    			add_location(div, file$4, 76, 2, 2036);
    		},
    		m: function mount(target, anchor) {
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, t0, anchor);
    			insert_dev(target, div, anchor);
    			append_dev(div, span0);
    			append_dev(div, t2);
    			append_dev(div, span1);
    			append_dev(span1, t3);
    			insert_dev(target, t4, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(target, anchor);
    			}

    			insert_dev(target, each_1_anchor, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (/*translationResult*/ ctx[1].target != null) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block_2$1(ctx);
    					if_block.c();
    					if_block.m(t0.parentNode, t0);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}

    			if (dirty & /*translationResult*/ 2 && t3_value !== (t3_value = /*translationResult*/ ctx[1].translation + "")) set_data_dev(t3, t3_value);

    			if (dirty & /*translationResult, showSimilarWordsForTranslations*/ 10) {
    				each_value = /*translationResult*/ ctx[1].translations;
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$3(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block$3(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(each_1_anchor.parentNode, each_1_anchor);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}
    		},
    		d: function destroy(detaching) {
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(div);
    			if (detaching) detach_dev(t4);
    			destroy_each(each_blocks, detaching);
    			if (detaching) detach_dev(each_1_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$2.name,
    		type: "if",
    		source: "(73:0) {#if translationResult != null}",
    		ctx
    	});

    	return block;
    }

    // (74:2) {#if translationResult.target != null}
    function create_if_block_2$1(ctx) {
    	let div;
    	let t0;
    	let t1;

    	const block = {
    		c: function create() {
    			div = element("div");
    			t0 = text("Translations of ");
    			t1 = text(/*targetWords*/ ctx[0]);
    			attr_dev(div, "id", "translations-of");
    			attr_dev(div, "class", "svelte-khlx3c");
    			add_location(div, file$4, 74, 4, 1962);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, t0);
    			append_dev(div, t1);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*targetWords*/ 1) set_data_dev(t1, /*targetWords*/ ctx[0]);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2$1.name,
    		type: "if",
    		source: "(74:2) {#if translationResult.target != null}",
    		ctx
    	});

    	return block;
    }

    // (94:10) {#if showSimilarWordsForTranslations}
    function create_if_block_1$1(ctx) {
    	let div;
    	let t_value = /*line*/ ctx[9].meaning.join(", ") + "";
    	let t;

    	const block = {
    		c: function create() {
    			div = element("div");
    			t = text(t_value);
    			add_location(div, file$4, 94, 12, 2767);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*translationResult*/ 2 && t_value !== (t_value = /*line*/ ctx[9].meaning.join(", ") + "")) set_data_dev(t, t_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1$1.name,
    		type: "if",
    		source: "(94:10) {#if showSimilarWordsForTranslations}",
    		ctx
    	});

    	return block;
    }

    // (88:6) {#each translation.content as line}
    function create_each_block_1$2(ctx) {
    	let div2;
    	let div1;
    	let div0;
    	let t0;
    	let span;
    	let t1_value = /*line*/ ctx[9].word + "";
    	let t1;
    	let t2;
    	let if_block = /*showSimilarWordsForTranslations*/ ctx[3] && create_if_block_1$1(ctx);

    	const block = {
    		c: function create() {
    			div2 = element("div");
    			div1 = element("div");
    			div0 = element("div");
    			t0 = space();
    			span = element("span");
    			t1 = text(t1_value);
    			t2 = space();
    			if (if_block) if_block.c();
    			attr_dev(div0, "class", "frequency-bar");
    			add_location(div0, file$4, 90, 12, 2586);
    			attr_dev(span, "class", "translation-word-of-line svelte-khlx3c");
    			add_location(span, file$4, 91, 12, 2629);
    			add_location(div1, file$4, 89, 10, 2567);
    			attr_dev(div2, "class", "translate-result-line svelte-khlx3c");
    			add_location(div2, file$4, 88, 8, 2520);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div2, anchor);
    			append_dev(div2, div1);
    			append_dev(div1, div0);
    			append_dev(div1, t0);
    			append_dev(div1, span);
    			append_dev(span, t1);
    			append_dev(div2, t2);
    			if (if_block) if_block.m(div2, null);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*translationResult*/ 2 && t1_value !== (t1_value = /*line*/ ctx[9].word + "")) set_data_dev(t1, t1_value);
    			if (/*showSimilarWordsForTranslations*/ ctx[3]) if_block.p(ctx, dirty);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div2);
    			if (if_block) if_block.d();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_1$2.name,
    		type: "each",
    		source: "(88:6) {#each translation.content as line}",
    		ctx
    	});

    	return block;
    }

    // (85:2) {#each translationResult.translations as translation}
    function create_each_block$3(ctx) {
    	let div;
    	let span;
    	let t0_value = /*translation*/ ctx[6].type + "";
    	let t0;
    	let t1;
    	let t2;
    	let each_value_1 = /*translation*/ ctx[6].content;
    	validate_each_argument(each_value_1);
    	let each_blocks = [];

    	for (let i = 0; i < each_value_1.length; i += 1) {
    		each_blocks[i] = create_each_block_1$2(get_each_context_1$2(ctx, each_value_1, i));
    	}

    	const block = {
    		c: function create() {
    			div = element("div");
    			span = element("span");
    			t0 = text(t0_value);
    			t1 = space();

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t2 = space();
    			attr_dev(span, "class", "translate-result-area-header svelte-khlx3c");
    			add_location(span, file$4, 86, 6, 2399);
    			attr_dev(div, "class", "translate-result-area svelte-khlx3c");
    			add_location(div, file$4, 85, 4, 2356);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, span);
    			append_dev(span, t0);
    			append_dev(div, t1);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div, null);
    			}

    			append_dev(div, t2);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*translationResult*/ 2 && t0_value !== (t0_value = /*translation*/ ctx[6].type + "")) set_data_dev(t0, t0_value);

    			if (dirty & /*translationResult, showSimilarWordsForTranslations*/ 10) {
    				each_value_1 = /*translation*/ ctx[6].content;
    				validate_each_argument(each_value_1);
    				let i;

    				for (i = 0; i < each_value_1.length; i += 1) {
    					const child_ctx = get_each_context_1$2(ctx, each_value_1, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block_1$2(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(div, t2);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value_1.length;
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_each(each_blocks, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$3.name,
    		type: "each",
    		source: "(85:2) {#each translationResult.translations as translation}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$4(ctx) {
    	let top_bar;
    	let t0;
    	let button;
    	let span;
    	let i;
    	let t1;
    	let t2;
    	let textarea;
    	let textarea_cols_value;
    	let textarea_rows_value;
    	let t3;
    	let if_block_anchor;
    	let current;
    	let dispose;

    	const dropdownmenu0 = new DropdownMenu({
    			props: {
    				placeholder: "Translate To",
    				items: /*languages*/ ctx[2]
    			},
    			$$inline: true
    		});

    	const dropdownmenu1 = new DropdownMenu({
    			props: {
    				justifySelf: "right",
    				placeholder: "Translate From",
    				items: /*languages*/ ctx[2]
    			},
    			$$inline: true
    		});

    	let if_block = /*translationResult*/ ctx[1] != null && create_if_block$2(ctx);

    	const block = {
    		c: function create() {
    			top_bar = element("top-bar");
    			create_component(dropdownmenu0.$$.fragment);
    			t0 = space();
    			button = element("button");
    			span = element("span");
    			i = element("i");
    			t1 = space();
    			create_component(dropdownmenu1.$$.fragment);
    			t2 = space();
    			textarea = element("textarea");
    			t3 = space();
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    			attr_dev(i, "class", "fas fa-exchange-alt");
    			add_location(i, file$4, 54, 6, 1499);
    			attr_dev(span, "class", "icon is-medium");
    			add_location(span, file$4, 53, 4, 1462);
    			attr_dev(button, "class", "button is-link svelte-khlx3c");
    			add_location(button, file$4, 52, 2, 1425);
    			set_custom_element_data(top_bar, "class", "svelte-khlx3c");
    			add_location(top_bar, file$4, 50, 0, 1347);
    			attr_dev(textarea, "class", "textarea has-fixed-size svelte-khlx3c");
    			attr_dev(textarea, "placeholder", "Translate");
    			attr_dev(textarea, "name", "main-text-area");
    			attr_dev(textarea, "id", "main-text-area");
    			attr_dev(textarea, "cols", textarea_cols_value = 30);
    			attr_dev(textarea, "rows", textarea_rows_value = 5);
    			add_location(textarea, file$4, 63, 0, 1676);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor, remount) {
    			insert_dev(target, top_bar, anchor);
    			mount_component(dropdownmenu0, top_bar, null);
    			append_dev(top_bar, t0);
    			append_dev(top_bar, button);
    			append_dev(button, span);
    			append_dev(span, i);
    			append_dev(top_bar, t1);
    			mount_component(dropdownmenu1, top_bar, null);
    			insert_dev(target, t2, anchor);
    			insert_dev(target, textarea, anchor);
    			set_input_value(textarea, /*targetWords*/ ctx[0]);
    			insert_dev(target, t3, anchor);
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    			current = true;
    			if (remount) run_all(dispose);

    			dispose = [
    				listen_dev(textarea, "input", /*textarea_input_handler*/ ctx[5]),
    				listen_dev(textarea, "change", /*translateWords*/ ctx[4], false, false, false)
    			];
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*targetWords*/ 1) {
    				set_input_value(textarea, /*targetWords*/ ctx[0]);
    			}

    			if (/*translationResult*/ ctx[1] != null) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block$2(ctx);
    					if_block.c();
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(dropdownmenu0.$$.fragment, local);
    			transition_in(dropdownmenu1.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(dropdownmenu0.$$.fragment, local);
    			transition_out(dropdownmenu1.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(top_bar);
    			destroy_component(dropdownmenu0);
    			destroy_component(dropdownmenu1);
    			if (detaching) detach_dev(t2);
    			if (detaching) detach_dev(textarea);
    			if (detaching) detach_dev(t3);
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$4.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$4($$self, $$props, $$invalidate) {
    	let languages = ["Turkish", "English"];
    	let { targetWords } = $$props;
    	let translationResult;
    	let showSimilarWordsForTranslations = false;

    	async function translateWords(e) {
    		$$invalidate(0, targetWords = e.target.value);
    		$$invalidate(1, translationResult = await translate(targetWords, { from: "en", to: "tr" }, false));
    		console.log(translationResult);
    	}

    	const writable_props = ["targetWords"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1$2.warn(`<SlangView> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("SlangView", $$slots, []);

    	function textarea_input_handler() {
    		targetWords = this.value;
    		$$invalidate(0, targetWords);
    	}

    	$$self.$set = $$props => {
    		if ("targetWords" in $$props) $$invalidate(0, targetWords = $$props.targetWords);
    	};

    	$$self.$capture_state = () => ({
    		translate,
    		DropdownMenu,
    		languages,
    		targetWords,
    		translationResult,
    		showSimilarWordsForTranslations,
    		translateWords
    	});

    	$$self.$inject_state = $$props => {
    		if ("languages" in $$props) $$invalidate(2, languages = $$props.languages);
    		if ("targetWords" in $$props) $$invalidate(0, targetWords = $$props.targetWords);
    		if ("translationResult" in $$props) $$invalidate(1, translationResult = $$props.translationResult);
    		if ("showSimilarWordsForTranslations" in $$props) $$invalidate(3, showSimilarWordsForTranslations = $$props.showSimilarWordsForTranslations);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		targetWords,
    		translationResult,
    		languages,
    		showSimilarWordsForTranslations,
    		translateWords,
    		textarea_input_handler
    	];
    }

    class SlangView extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$4, create_fragment$4, safe_not_equal, { targetWords: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "SlangView",
    			options,
    			id: create_fragment$4.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*targetWords*/ ctx[0] === undefined && !("targetWords" in props)) {
    			console_1$2.warn("<SlangView> was created without expected prop 'targetWords'");
    		}
    	}

    	get targetWords() {
    		throw new Error("<SlangView>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set targetWords(value) {
    		throw new Error("<SlangView>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\App.svelte generated by Svelte v3.22.3 */
    const file$5 = "src\\App.svelte";

    // (27:2) {:else}
    function create_else_block(ctx) {
    	let updating_targetWords;
    	let current;

    	function slangview_targetWords_binding(value) {
    		/*slangview_targetWords_binding*/ ctx[5].call(null, value);
    	}

    	let slangview_props = {};

    	if (/*targetWords*/ ctx[1] !== void 0) {
    		slangview_props.targetWords = /*targetWords*/ ctx[1];
    	}

    	const slangview = new SlangView({ props: slangview_props, $$inline: true });
    	binding_callbacks.push(() => bind(slangview, "targetWords", slangview_targetWords_binding));

    	const block = {
    		c: function create() {
    			create_component(slangview.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(slangview, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const slangview_changes = {};

    			if (!updating_targetWords && dirty & /*targetWords*/ 2) {
    				updating_targetWords = true;
    				slangview_changes.targetWords = /*targetWords*/ ctx[1];
    				add_flush_callback(() => updating_targetWords = false);
    			}

    			slangview.$set(slangview_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(slangview.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(slangview.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(slangview, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block.name,
    		type: "else",
    		source: "(27:2) {:else}",
    		ctx
    	});

    	return block;
    }

    // (25:40) 
    function create_if_block_1$2(ctx) {
    	let updating_targetWords;
    	let current;

    	function definitionview_targetWords_binding(value) {
    		/*definitionview_targetWords_binding*/ ctx[4].call(null, value);
    	}

    	let definitionview_props = {};

    	if (/*targetWords*/ ctx[1] !== void 0) {
    		definitionview_props.targetWords = /*targetWords*/ ctx[1];
    	}

    	const definitionview = new DefinitionView({
    			props: definitionview_props,
    			$$inline: true
    		});

    	binding_callbacks.push(() => bind(definitionview, "targetWords", definitionview_targetWords_binding));

    	const block = {
    		c: function create() {
    			create_component(definitionview.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(definitionview, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const definitionview_changes = {};

    			if (!updating_targetWords && dirty & /*targetWords*/ 2) {
    				updating_targetWords = true;
    				definitionview_changes.targetWords = /*targetWords*/ ctx[1];
    				add_flush_callback(() => updating_targetWords = false);
    			}

    			definitionview.$set(definitionview_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(definitionview.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(definitionview.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(definitionview, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1$2.name,
    		type: "if",
    		source: "(25:40) ",
    		ctx
    	});

    	return block;
    }

    // (23:2) {#if currentTab == "translation"}
    function create_if_block$3(ctx) {
    	let updating_targetWords;
    	let current;

    	function translationview_targetWords_binding(value) {
    		/*translationview_targetWords_binding*/ ctx[3].call(null, value);
    	}

    	let translationview_props = {};

    	if (/*targetWords*/ ctx[1] !== void 0) {
    		translationview_props.targetWords = /*targetWords*/ ctx[1];
    	}

    	const translationview = new TranslationView({
    			props: translationview_props,
    			$$inline: true
    		});

    	binding_callbacks.push(() => bind(translationview, "targetWords", translationview_targetWords_binding));

    	const block = {
    		c: function create() {
    			create_component(translationview.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(translationview, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const translationview_changes = {};

    			if (!updating_targetWords && dirty & /*targetWords*/ 2) {
    				updating_targetWords = true;
    				translationview_changes.targetWords = /*targetWords*/ ctx[1];
    				add_flush_callback(() => updating_targetWords = false);
    			}

    			translationview.$set(translationview_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(translationview.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(translationview.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(translationview, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$3.name,
    		type: "if",
    		source: "(23:2) {#if currentTab == \\\"translation\\\"}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$5(ctx) {
    	let main;
    	let t;
    	let current_block_type_index;
    	let if_block;
    	let current;
    	const topnav = new TopNav({ $$inline: true });
    	topnav.$on("tabChange", /*tabChange_handler*/ ctx[2]);
    	const if_block_creators = [create_if_block$3, create_if_block_1$2, create_else_block];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (/*currentTab*/ ctx[0] == "translation") return 0;
    		if (/*currentTab*/ ctx[0] == "definition") return 1;
    		return 2;
    	}

    	current_block_type_index = select_block_type(ctx);
    	if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

    	const block = {
    		c: function create() {
    			main = element("main");
    			create_component(topnav.$$.fragment);
    			t = space();
    			if_block.c();
    			attr_dev(main, "class", "svelte-1acfigg");
    			add_location(main, file$5, 20, 0, 436);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			mount_component(topnav, main, null);
    			append_dev(main, t);
    			if_blocks[current_block_type_index].m(main, null);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type(ctx);

    			if (current_block_type_index === previous_block_index) {
    				if_blocks[current_block_type_index].p(ctx, dirty);
    			} else {
    				group_outros();

    				transition_out(if_blocks[previous_block_index], 1, 1, () => {
    					if_blocks[previous_block_index] = null;
    				});

    				check_outros();
    				if_block = if_blocks[current_block_type_index];

    				if (!if_block) {
    					if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    					if_block.c();
    				}

    				transition_in(if_block, 1);
    				if_block.m(main, null);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(topnav.$$.fragment, local);
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(topnav.$$.fragment, local);
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    			destroy_component(topnav);
    			if_blocks[current_block_type_index].d();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$5.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$5($$self, $$props, $$invalidate) {
    	let currentTab = "translation";
    	var targetWords;
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("App", $$slots, []);
    	const tabChange_handler = e => $$invalidate(0, currentTab = e.detail.value);

    	function translationview_targetWords_binding(value) {
    		targetWords = value;
    		$$invalidate(1, targetWords);
    	}

    	function definitionview_targetWords_binding(value) {
    		targetWords = value;
    		$$invalidate(1, targetWords);
    	}

    	function slangview_targetWords_binding(value) {
    		targetWords = value;
    		$$invalidate(1, targetWords);
    	}

    	$$self.$capture_state = () => ({
    		TopNav,
    		TranslationView,
    		DefinitionView,
    		SlangView,
    		currentTab,
    		targetWords
    	});

    	$$self.$inject_state = $$props => {
    		if ("currentTab" in $$props) $$invalidate(0, currentTab = $$props.currentTab);
    		if ("targetWords" in $$props) $$invalidate(1, targetWords = $$props.targetWords);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		currentTab,
    		targetWords,
    		tabChange_handler,
    		translationview_targetWords_binding,
    		definitionview_targetWords_binding,
    		slangview_targetWords_binding
    	];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$5, create_fragment$5, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment$5.name
    		});
    	}
    }

    const app = new App({
        target: document.body,
        props: {
            name: 'world'
        }
    });
    //# sourceMappingURL=svelte.js.map

    return app;

}());
//# sourceMappingURL=bundle.js.map
