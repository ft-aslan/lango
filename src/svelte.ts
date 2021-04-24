import App from './App.svelte';

import "../node_modules/bulma/css/bulma.css";

import "../public/global.css";


const app = new App({
	target: document.body,
	props: {
		name: 'world'
	}
});

export default app;