<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from "vue";
import { sileo, SileoToaster } from "sileo-vue";
import type { SileoPosition } from "sileo-vue";

const position = ref<SileoPosition>("top-right");

// null = follow system, 'dark'/'light' = manual override
const override = ref<"dark" | "light" | null>(null);
const systemDark = ref(window.matchMedia("(prefers-color-scheme: dark)").matches);

const dark = computed(() =>
	override.value !== null ? override.value === "dark" : systemDark.value,
);

function toggleTheme() {
	if (override.value === null) {
		override.value = systemDark.value ? "light" : "dark";
	} else {
		override.value = override.value === "dark" ? "light" : "dark";
	}
	applyColorScheme();
}

function resetToSystem() {
	override.value = null;
	applyColorScheme();
}

function applyColorScheme() {
	const el = document.documentElement;
	if (override.value) {
		el.style.colorScheme = override.value;
	} else {
		el.style.colorScheme = "light dark";
	}
}

let mql: MediaQueryList;
function onSystemChange(e: MediaQueryListEvent) {
	systemDark.value = e.matches;
}

onMounted(() => {
	mql = window.matchMedia("(prefers-color-scheme: dark)");
	mql.addEventListener("change", onSystemChange);
	applyColorScheme();
});

onUnmounted(() => {
	mql?.removeEventListener("change", onSystemChange);
});


const positions: SileoPosition[] = [
	"top-left",
	"top-center",
	"top-right",
	"bottom-left",
	"bottom-center",
	"bottom-right",
];

function showSuccess() {
	sileo.success({
		title: "Success",
		description: "Your changes have been saved successfully.",
		position: position.value,
	});
}

function showError() {
	sileo.error({
		title: "Error",
		description: "Something went wrong. Please try again.",
		position: position.value,
	});
}

function showWarning() {
	sileo.warning({
		title: "Warning",
		description: "This action cannot be undone.",
		position: position.value,
	});
}

function showInfo() {
	sileo.info({
		title: "Info",
		description: "A new version is available for download.",
		position: position.value,
	});
}

function showAction() {
	sileo.action({
		title: "Action",
		description: "Click the button below to proceed.",
		position: position.value,
		button: {
			title: "Confirm",
			onClick: () => {
				sileo.success({
					title: "Confirmed",
					position: position.value,
				});
			},
		},
	});
}

function showPromise() {
	const fakeRequest = () =>
		new Promise<string>((resolve, reject) => {
			setTimeout(() => {
				Math.random() > 0.3
					? resolve("Data loaded")
					: reject(new Error("Network error"));
			}, 2000);
		});

	sileo.promise(fakeRequest, {
		loading: { title: "Loading" },
		success: (data) => ({
			title: "Loaded",
			description: data,
		}),
		error: (err) => ({
			title: "Failed",
			description: err instanceof Error ? err.message : "Unknown error",
		}),
		position: position.value,
	});
}

function showNoDescription() {
	sileo.success({
		title: "Saved",
		position: position.value,
	});
}

function showCustomFill() {
	sileo.info({
		title: "Custom Fill",
		description: "This toast has a custom fill color.",
		fill: "#2d1b69",
		position: position.value,
	});
}

function showCustomRoundness() {
	sileo.success({
		title: "Rounded",
		description: "This toast has extra roundness.",
		roundness: 30,
		position: position.value,
	});
}

function showLongDuration() {
	sileo.info({
		title: "Sticky",
		description: "This toast stays for 15 seconds.",
		duration: 15000,
		position: position.value,
	});
}

function showNoDismiss() {
	sileo.warning({
		title: "Persistent",
		description: "This toast won't auto-dismiss. Swipe to dismiss it.",
		duration: null,
		position: position.value,
	});
}

function clearAll() {
	sileo.clear();
}
</script>

<template>
	<SileoToaster :position="position" :offset="16" />

	<div class="playground">
		<header class="hero">
			<h1>Sileo Vue</h1>
			<p>Physics-based toast notifications for Vue 3</p>
			<div class="theme-controls">
				<button class="theme-toggle" @click="toggleTheme">
					{{ dark ? '☀️ Light' : '🌙 Dark' }}
				</button>
				<button v-if="override !== null" class="theme-reset" @click="resetToSystem">
					System
				</button>
			</div>
		</header>

		<section class="controls">
			<div class="control-group">
				<label>Position</label>
				<div class="position-grid">
					<button
						v-for="pos in positions"
						:key="pos"
						:class="['pos-btn', { active: position === pos }]"
						@click="position = pos"
					>
						{{ pos }}
					</button>
				</div>
			</div>
		</section>

		<section class="demos">
			<h2>Toast Types</h2>
			<div class="btn-grid">
				<button class="demo-btn success" @click="showSuccess">Success</button>
				<button class="demo-btn error" @click="showError">Error</button>
				<button class="demo-btn warning" @click="showWarning">Warning</button>
				<button class="demo-btn info" @click="showInfo">Info</button>
				<button class="demo-btn action" @click="showAction">Action</button>
				<button class="demo-btn promise" @click="showPromise">Promise</button>
			</div>

			<h2>Variations</h2>
			<div class="btn-grid">
				<button class="demo-btn" @click="showNoDescription">No Description</button>
				<button class="demo-btn" @click="showCustomFill">Custom Fill</button>
				<button class="demo-btn" @click="showCustomRoundness">Extra Round</button>
				<button class="demo-btn" @click="showLongDuration">Long Duration</button>
				<button class="demo-btn" @click="showNoDismiss">Persistent</button>
			</div>

			<div class="clear-section">
				<button class="demo-btn clear" @click="clearAll">Clear All</button>
			</div>
		</section>

		<hr class="divider" />

		<section class="docs">
			<h2>Installation</h2>
			<pre class="code-block"><code>npm install sileo-vue</code></pre>

			<h2>Quick Start</h2>
			<pre class="code-block"><code>&lt;script setup&gt;
import { sileo, SileoToaster } from 'sileo-vue'
import 'sileo-vue/dist/style.css'
&lt;/script&gt;

&lt;template&gt;
  &lt;SileoToaster /&gt;
&lt;/template&gt;</code></pre>
			<pre class="code-block"><code>// Trigger a toast from anywhere
sileo.success({ title: 'Saved!' })</code></pre>

			<h2>API</h2>
			<div class="api-table-wrap">
				<table class="api-table">
					<thead>
						<tr><th>Method</th><th>Description</th></tr>
					</thead>
					<tbody>
						<tr><td><code>sileo.show(opts)</code></td><td>Show a toast with default state</td></tr>
						<tr><td><code>sileo.success(opts)</code></td><td>Success toast (green)</td></tr>
						<tr><td><code>sileo.error(opts)</code></td><td>Error toast (red)</td></tr>
						<tr><td><code>sileo.warning(opts)</code></td><td>Warning toast (yellow)</td></tr>
						<tr><td><code>sileo.info(opts)</code></td><td>Info toast (blue)</td></tr>
						<tr><td><code>sileo.action(opts)</code></td><td>Action toast (purple)</td></tr>
						<tr><td><code>sileo.promise(p, opts)</code></td><td>Promise toast: loading → success/error</td></tr>
						<tr><td><code>sileo.dismiss(id)</code></td><td>Dismiss a toast by ID</td></tr>
						<tr><td><code>sileo.clear(pos?)</code></td><td>Clear all toasts, or by position</td></tr>
					</tbody>
				</table>
			</div>

			<h2>SileoOptions</h2>
			<div class="api-table-wrap">
				<table class="api-table">
					<thead>
						<tr><th>Prop</th><th>Type</th><th>Default</th><th>Description</th></tr>
					</thead>
					<tbody>
						<tr><td><code>title</code></td><td>string</td><td>—</td><td>Toast title text</td></tr>
						<tr><td><code>description</code></td><td>VNode | string</td><td>—</td><td>Body content, supports VNode</td></tr>
						<tr><td><code>position</code></td><td>SileoPosition</td><td>top-right</td><td>6 positions available</td></tr>
						<tr><td><code>duration</code></td><td>number | null</td><td>6000</td><td>Auto-dismiss ms, null = persistent</td></tr>
						<tr><td><code>icon</code></td><td>VNode | null</td><td>—</td><td>Custom icon, overrides state icon</td></tr>
						<tr><td><code>fill</code></td><td>string</td><td>—</td><td>SVG background color</td></tr>
						<tr><td><code>roundness</code></td><td>number</td><td>18</td><td>Border radius of the pill shape</td></tr>
						<tr><td><code>autopilot</code></td><td>boolean | object</td><td>true</td><td>Auto expand/collapse timing</td></tr>
						<tr><td><code>button</code></td><td>SileoButton</td><td>—</td><td>Action button { title, onClick }</td></tr>
					</tbody>
				</table>
			</div>

			<h2>Toaster Props</h2>
			<div class="api-table-wrap">
				<table class="api-table">
					<thead>
						<tr><th>Prop</th><th>Type</th><th>Default</th></tr>
					</thead>
					<tbody>
						<tr><td><code>position</code></td><td>SileoPosition</td><td>top-right</td></tr>
						<tr><td><code>offset</code></td><td>number | string | object</td><td>—</td></tr>
						<tr><td><code>options</code></td><td>Partial&lt;SileoOptions&gt;</td><td>—</td></tr>
					</tbody>
				</table>
			</div>

			<h2>Promise Toast</h2>
			<pre class="code-block"><code>sileo.promise(
  fetch('/api/data'),
  {
    loading: { title: 'Loading...' },
    success: (data) => ({
      title: 'Done',
      description: `Loaded ${data.length} items`,
    }),
    error: (err) => ({
      title: 'Failed',
      description: err.message,
    }),
  }
)</code></pre>

			<h2>Dark Mode</h2>
			<p class="doc-text">
				Toast appearance is driven by CSS variables. Override them to match your theme:
			</p>
			<pre class="code-block"><code>:root {
  color-scheme: light dark;
  --sileo-fill: light-dark(#1a1a1a, #FFFFFF);
  --sileo-text: light-dark(#e0e0e0, #1a1a1a);
}</code></pre>

			<h2>CSS Variables</h2>
			<div class="api-table-wrap">
				<table class="api-table">
					<thead>
						<tr><th>Variable</th><th>Default</th><th>Description</th></tr>
					</thead>
					<tbody>
						<tr><td><code>--sileo-fill</code></td><td>#FFFFFF</td><td>Toast background (SVG fill)</td></tr>
						<tr><td><code>--sileo-text</code></td><td>#1a1a1a</td><td>Toast body text color</td></tr>
						<tr><td><code>--sileo-duration</code></td><td>600ms</td><td>Animation duration</td></tr>
						<tr><td><code>--sileo-height</code></td><td>40px</td><td>Pill height</td></tr>
						<tr><td><code>--sileo-width</code></td><td>350px</td><td>Toast width</td></tr>
					</tbody>
				</table>
			</div>
		</section>
	</div>
</template>

<style>
*,
*::before,
*::after {
	margin: 0;
	padding: 0;
	box-sizing: border-box;
}

:root {
	color-scheme: light dark;
	--sileo-fill: light-dark(#1a1a1a, #FFFFFF);
	--sileo-text: light-dark(#e0e0e0, #1a1a1a);
}

body {
	font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
	min-height: 100vh;
	background: light-dark(#f5f5f7, #0a0a0a);
	color: light-dark(#1a1a1a, #e0e0e0);
}

.playground {
	--surface: light-dark(#ffffff, #141414);
	--surface-hover: light-dark(#f0f0f0, #1a1a1a);
	--border: light-dark(#d4d4d8, #2a2a2a);
	--border-hover: light-dark(#a1a1aa, #444444);
	--text-muted: light-dark(#666666, #888888);

	max-width: 640px;
	margin: 0 auto;
	padding: 3rem 1.5rem;
	min-height: 100vh;
}

.hero {
	text-align: center;
	margin-bottom: 3rem;
}

.hero h1 {
	font-size: 2.5rem;
	font-weight: 700;
	background: linear-gradient(135deg, #a78bfa, #60a5fa);
	-webkit-background-clip: text;
	-webkit-text-fill-color: transparent;
	background-clip: text;
	margin-bottom: 0.5rem;
}

.hero p {
	color: var(--text-muted);
	font-size: 1.1rem;
}

.theme-controls {
	display: inline-flex;
	gap: 0.5rem;
	margin-top: 1rem;
}

.theme-toggle,
.theme-reset {
	padding: 0.4rem 1rem;
	border: 1px solid var(--border);
	border-radius: 9999px;
	background: var(--surface);
	color: inherit;
	font-size: 0.8rem;
	cursor: pointer;
	transition: all 150ms ease;
}

.theme-toggle:hover,
.theme-reset:hover {
	border-color: var(--border-hover);
	background: var(--surface-hover);
}

.theme-reset {
	color: var(--text-muted);
	font-size: 0.75rem;
}

.controls {
	margin-bottom: 2.5rem;
}

.control-group label {
	display: block;
	font-size: 0.8rem;
	font-weight: 600;
	text-transform: uppercase;
	letter-spacing: 0.05em;
	color: var(--text-muted);
	margin-bottom: 0.75rem;
}

.position-grid {
	display: grid;
	grid-template-columns: repeat(3, 1fr);
	gap: 0.5rem;
}

.pos-btn {
	padding: 0.5rem;
	border: 1px solid var(--border);
	border-radius: 8px;
	background: var(--surface);
	color: var(--text-muted);
	font-size: 0.75rem;
	cursor: pointer;
	transition: all 150ms ease;
}

.pos-btn:hover {
	border-color: var(--border-hover);
	color: inherit;
}

.pos-btn.active {
	border-color: #60a5fa;
	color: #60a5fa;
	background: rgba(96, 165, 250, 0.08);
}

.demos h2 {
	font-size: 0.8rem;
	font-weight: 600;
	text-transform: uppercase;
	letter-spacing: 0.05em;
	color: var(--text-muted);
	margin-bottom: 0.75rem;
}

.btn-grid {
	display: grid;
	grid-template-columns: repeat(3, 1fr);
	gap: 0.5rem;
	margin-bottom: 2rem;
}

.demo-btn {
	padding: 0.75rem 1rem;
	border: 1px solid var(--border);
	border-radius: 10px;
	background: var(--surface);
	color: inherit;
	font-size: 0.875rem;
	font-weight: 500;
	cursor: pointer;
	transition: all 150ms ease;
}

.demo-btn:hover {
	background: var(--surface-hover);
	border-color: var(--border-hover);
	transform: translateY(-1px);
}

.demo-btn:active {
	transform: translateY(0);
}

.demo-btn.success { border-color: #22c55e44; color: light-dark(#16a34a, #4ade80); }
.demo-btn.success:hover { background: #22c55e0d; border-color: #22c55e66; }
.demo-btn.error { border-color: #ef444444; color: light-dark(#dc2626, #f87171); }
.demo-btn.error:hover { background: #ef44440d; border-color: #ef444466; }
.demo-btn.warning { border-color: #eab30844; color: light-dark(#ca8a04, #fbbf24); }
.demo-btn.warning:hover { background: #eab3080d; border-color: #eab30866; }
.demo-btn.info { border-color: #3b82f644; color: light-dark(#2563eb, #60a5fa); }
.demo-btn.info:hover { background: #3b82f60d; border-color: #3b82f666; }
.demo-btn.action { border-color: #8b5cf644; color: light-dark(#7c3aed, #a78bfa); }
.demo-btn.action:hover { background: #8b5cf60d; border-color: #8b5cf666; }
.demo-btn.promise { border-color: #6366f144; color: light-dark(#4f46e5, #818cf8); }
.demo-btn.promise:hover { background: #6366f10d; border-color: #6366f166; }

.clear-section {
	text-align: center;
}

.demo-btn.clear {
	border-color: #ef444444;
	color: #f87171;
	width: 100%;
}

.demo-btn.clear:hover {
	background: #ef44440d;
	border-color: #ef444466;
}

.divider {
	border: none;
	border-top: 1px solid var(--border);
	margin: 2rem 0;
}

.docs h2 {
	font-size: 1.25rem;
	font-weight: 600;
	margin: 2rem 0 0.75rem;
}

.docs h2:first-child {
	margin-top: 0;
}

.doc-text {
	color: var(--text-muted);
	font-size: 0.9rem;
	line-height: 1.6;
	margin-bottom: 0.75rem;
}

.code-block {
	background: light-dark(#1e1e2e, #0d0d0d);
	color: #c9d1d9;
	padding: 1rem 1.25rem;
	border-radius: 10px;
	font-size: 0.8rem;
	line-height: 1.6;
	overflow-x: auto;
	margin-bottom: 1.5rem;
	border: 1px solid light-dark(#2a2a3a, #1a1a1a);
}

.code-block code {
	font-family: "SF Mono", "Fira Code", "Cascadia Code", monospace;
}

.api-table-wrap {
	overflow-x: auto;
	margin-bottom: 1.5rem;
	border: 1px solid var(--border);
	border-radius: 10px;
}

.api-table {
	width: 100%;
	border-collapse: collapse;
	font-size: 0.85rem;
}

.api-table th {
	text-align: left;
	padding: 0.6rem 1rem;
	background: light-dark(#f5f5f7, #111111);
	font-weight: 600;
	font-size: 0.75rem;
	text-transform: uppercase;
	letter-spacing: 0.04em;
	color: var(--text-muted);
	border-bottom: 1px solid var(--border);
}

.api-table td {
	padding: 0.6rem 1rem;
	border-bottom: 1px solid var(--border);
}

.api-table tr:last-child td {
	border-bottom: none;
}

.api-table code {
	font-family: "SF Mono", "Fira Code", "Cascadia Code", monospace;
	font-size: 0.8rem;
	background: light-dark(#f0f0f2, #1a1a1a);
	padding: 0.15rem 0.4rem;
	border-radius: 4px;
}
</style>
