import { assign } from './util';

/**
 * Creates a new store, which is a tiny evented state container.
 * @name createStore
 * @param {Object} [state={}]		Optional initial state
 * @returns {store}
 * @example
 * let store = createStore();
 * store.subscribe( state => console.log(state) );
 * store.on('a', stateChange => console.log(stateChange))
 * store.setState({ a: 'b' });   // logs { a: 'b'}
 * store.setState({ c: 'd' });   // logs { a: 'b', c: 'd'}
 * store.setState({ a: 'foo' }); // logs { a: 'foo', c: 'd' }, { a: 'foo' }
 */
export default function createStore(state) {
	let listeners = [];
	let onListeners = new Map();
	state = state || {};
	const noop = () => {};

	function setState(update, overwrite) {
		state = overwrite ? update : assign(assign({}, state), update);
		let currentListeners = listeners;
		// Update all state subscribers first
		for (let i=0; i<currentListeners.length; i++) {
			currentListeners[i]._li(state);
			currentListeners[i]._ef(state);
		}
		// Update all listeners to 'slices' of state last
		let stateChanged = Object.keys(update);
		for (let j=0; j<stateChanged.length; j++) {
		  let _key = stateChanged[j];
		  if (onListeners.has(_key)) {
			let listeners = onListeners.get(_key);
			for (let k=0; k<listeners.length; k++) {
			  listeners[k]._li(state[_key])
			  listeners[k]._ef(state[_key])
			}
		  }
		}
	}

	/**
	 * Attaches a listener with a callback to a slice of state
	 * @param {String} stateSlice
	 * @param {Function} callback
	 */
	function on(stateSlice, callback, effect = noop) {
		if (!Boolean(onListeners.get(stateSlice))) onListeners.set(stateSlice, [])

		const _call = { _li: callback, _ef: effect }
		onListeners.get(stateSlice).push(_call)
	}

	/**
	 * An observable state container, returned from {@link createStore}
	 * @name store
	 */

	return /** @lends store */ {

		/**
		 * Apply a partial state object to the current state, invoking registered listeners.
		 * @param {Object} update				An object with properties to be merged into state
		 * @param {Boolean} [overwrite=false]	If `true`, update will replace state instead of being merged into it
		 */
		setState,

		/**
		 * Attach a listener with a callback to a particular 'slice' of state
		 * @param {String} stateSlice
		 * @param {Function} callback  callback function to be fired when listener is detected
		 * @param {Function} effect  function to handle any side effects allowing callback to be a pure function
		 */
		on,

		/**
		 * Register a listener function to be called whenever state is changed function.
		 * @param {Function} listener	A function to call when state changes. Gets passed the new state.
		 * @param {Function} effect  function to handle any side effects allowing listener to be a pure function
		 */
		subscribe(listener, effect = noop) {
			const _listener = { _li: listener, _ef: effect };
			listeners.push(_listener);
		},

		/**
		 * Retrieve the current state object.
		 * @returns {Object} state
		 */
		getState() {
			return state;
		}
	};
}
