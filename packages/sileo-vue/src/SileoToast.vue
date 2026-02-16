<script setup lang="ts">
import {
	type CSSProperties,
	type VNode,
	computed,
	h,
	nextTick,
	onMounted,
	onUnmounted,
	ref,
	watch,
} from "vue";
import type { SileoButton, SileoState, SileoStyles } from "./types";
import {
	ArrowRight,
	Check,
	CircleAlert,
	LifeBuoy,
	LoaderCircle,
	X,
} from "./icons";

/* --------------------------------- Config --------------------------------- */

const HEIGHT = 40;
const WIDTH = 350;
const DEFAULT_ROUNDNESS = 18;
const BLUR_RATIO = 0.5;
const PILL_PADDING = 10;
const MIN_EXPAND_RATIO = 2.25;
const SWAP_COLLAPSE_MS = 200;
const HEADER_EXIT_MS = 150;

/* ---------------------------------- Props --------------------------------- */

const props = withDefaults(
	defineProps<{
		id: string;
		fill?: string;
		state?: SileoState;
		title?: string;
		description?: VNode | string;
		position?: "left" | "center" | "right";
		expand?: "top" | "bottom";
		icon?: VNode | null;
		styles?: SileoStyles;
		button?: SileoButton;
		roundness?: number;
		exiting?: boolean;
		autoExpandDelayMs?: number;
		autoCollapseDelayMs?: number;
		canExpand?: boolean;
		interruptKey?: string;
		refreshKey?: string;
	}>(),
	{
		state: "success",
		position: "left",
		expand: "bottom",
		exiting: false,
	},
);

const emit = defineEmits<{
	mouseenter: [e: MouseEvent];
	mouseleave: [e: MouseEvent];
	dismiss: [];
}>();

const resolvedTitle = computed(() => props.title ?? props.state);

/* ---------------------------------- Icons --------------------------------- */

const STATE_ICON: Record<SileoState, () => VNode> = {
	success: Check,
	loading: () => LoaderCircle({ "data-sileo-icon": "spin", "aria-hidden": "true" }),
	error: X,
	warning: CircleAlert,
	info: LifeBuoy,
	action: ArrowRight,
};

/* ---------------------------------- View ---------------------------------- */

interface View {
	title?: string;
	description?: VNode | string;
	state: SileoState;
	icon?: VNode | null;
	styles?: SileoStyles;
	button?: SileoButton;
	fill?: string;
}

const makeView = (): View => ({
	title: resolvedTitle.value,
	description: props.description,
	state: props.state,
	icon: props.icon,
	styles: props.styles,
	button: props.button,
	fill: props.fill,
});

const view = ref<View>(makeView());
const applied = ref(props.refreshKey);
const isExpanded = ref(false);
const ready = ref(false);
const pillWidth = ref(0);
const contentHeight = ref(0);

const hasDesc = computed(() => Boolean(view.value.description) || Boolean(view.value.button));
const isLoading = computed(() => view.value.state === "loading");
const open = computed(() => hasDesc.value && isExpanded.value && !isLoading.value);
const allowExpand = computed(() =>
	isLoading.value
		? false
		: (props.canExpand ?? (!props.interruptKey || props.interruptKey === props.id)),
);

const headerKey = computed(() => `${view.value.state}-${view.value.title}`);
const filterId = computed(() => `sileo-gooey-${props.id}`);
const resolvedRoundness = computed(() => Math.max(0, props.roundness ?? DEFAULT_ROUNDNESS));
const blur = computed(() => resolvedRoundness.value * BLUR_RATIO);

/* ---------------------------------- Refs ---------------------------------- */

const buttonRef = ref<HTMLButtonElement | null>(null);
const headerRef = ref<HTMLDivElement | null>(null);
const contentRef = ref<HTMLDivElement | null>(null);
const innerRef = ref<HTMLDivElement | null>(null);

let headerExitTimer: number | null = null;
let autoExpandTimer: number | null = null;
let autoCollapseTimer: number | null = null;
let swapTimer: number | null = null;
let lastRefreshKey = props.refreshKey;
let pending: { key?: string; payload: View } | null = null;
let headerPadCache: number | null = null;

/* ------------------------------ Header Layer ------------------------------ */

const headerLayer = ref<{
	current: { key: string; view: View };
	prev: { key: string; view: View } | null;
}>({
	current: { key: headerKey.value, view: view.value },
	prev: null,
});

/* ------------------------------ Measurements ------------------------------ */

let pillRo: ResizeObserver | null = null;
let pillRaf = 0;
let contentRo: ResizeObserver | null = null;
let contentRaf = 0;

function measurePill() {
	const el = innerRef.value;
	const header = headerRef.value;
	if (!el || !header) return;
	if (headerPadCache === null) {
		const cs = getComputedStyle(header);
		headerPadCache = parseFloat(cs.paddingLeft) + parseFloat(cs.paddingRight);
	}
	const px = headerPadCache;
	const w = el.scrollWidth + px + PILL_PADDING;
	if (w > PILL_PADDING && pillWidth.value !== w) {
		pillWidth.value = w;
	}
}

function setupPillObserver() {
	pillRo?.disconnect();
	cancelAnimationFrame(pillRaf);
	const el = innerRef.value;
	if (!el) return;
	measurePill();
	pillRo = new ResizeObserver(() => {
		cancelAnimationFrame(pillRaf);
		pillRaf = requestAnimationFrame(measurePill);
	});
	pillRo.observe(el);
}

function measureContent() {
	const el = contentRef.value;
	if (!el) return;
	const h = el.scrollHeight;
	if (contentHeight.value !== h) contentHeight.value = h;
}

function setupContentObserver() {
	contentRo?.disconnect();
	cancelAnimationFrame(contentRaf);
	if (!hasDesc.value) {
		contentHeight.value = 0;
		return;
	}
	const el = contentRef.value;
	if (!el) return;
	measureContent();
	contentRo = new ResizeObserver(() => {
		cancelAnimationFrame(contentRaf);
		contentRaf = requestAnimationFrame(measureContent);
	});
	contentRo.observe(el);
}

/* ------------------------------ Header Layer Sync ------------------------- */

watch(
	[headerKey, view],
	() => {
		const hk = headerKey.value;
		const v = view.value;
		const state = headerLayer.value;
		if (state.current.key === hk) {
			if (state.current.view !== v) {
				headerLayer.value = { ...state, current: { key: hk, view: v } };
			}
		} else {
			headerLayer.value = {
				prev: state.current,
				current: { key: hk, view: v },
			};
		}
	},
	{ flush: "sync" },
);

watch(
	() => headerLayer.value.prev,
	(prev) => {
		if (!prev) return;
		if (headerExitTimer) clearTimeout(headerExitTimer);
		headerExitTimer = window.setTimeout(() => {
			headerExitTimer = null;
			headerLayer.value = { ...headerLayer.value, prev: null };
		}, HEADER_EXIT_MS);
	},
);

watch(
	() => headerLayer.value.current.key,
	() => {
		nextTick(setupPillObserver);
	},
);

watch(hasDesc, () => {
	nextTick(setupContentObserver);
});

/* ----------------------------- Refresh logic ------------------------------ */

watch(
	[() => props.refreshKey, open],
	([rk]) => {
		const next = makeView();

		if (rk === undefined) {
			view.value = next;
			applied.value = undefined;
			pending = null;
			lastRefreshKey = rk;
			return;
		}

		if (lastRefreshKey === rk) return;
		lastRefreshKey = rk;

		if (swapTimer) {
			clearTimeout(swapTimer);
			swapTimer = null;
		}

		if (open.value) {
			pending = { key: rk, payload: next };
			isExpanded.value = false;
			swapTimer = window.setTimeout(() => {
				swapTimer = null;
				if (!pending) return;
				view.value = pending.payload;
				applied.value = pending.key;
				pending = null;
			}, SWAP_COLLAPSE_MS);
		} else {
			pending = null;
			view.value = next;
			applied.value = rk;
		}
	},
	{ immediate: true },
);

/* ----------------------------- Auto expand/collapse ----------------------- */

watch(
	[hasDesc, () => props.exiting, allowExpand, () => props.autoExpandDelayMs, () => props.autoCollapseDelayMs, applied],
	() => {
		if (!hasDesc.value) return;

		if (autoExpandTimer) clearTimeout(autoExpandTimer);
		if (autoCollapseTimer) clearTimeout(autoCollapseTimer);

		if (props.exiting || !allowExpand.value) {
			isExpanded.value = false;
			return;
		}

		if (props.autoExpandDelayMs == null && props.autoCollapseDelayMs == null) return;

		const expandDelay = props.autoExpandDelayMs ?? 0;
		const collapseDelay = props.autoCollapseDelayMs ?? 0;

		if (expandDelay > 0) {
			autoExpandTimer = window.setTimeout(
				() => (isExpanded.value = true),
				expandDelay,
			);
		} else {
			isExpanded.value = true;
		}

		if (collapseDelay > 0) {
			autoCollapseTimer = window.setTimeout(
				() => (isExpanded.value = false),
				collapseDelay,
			);
		}
	},
	{ immediate: true },
);

/* ------------------------------ Derived values ---------------------------- */

const minExpanded = HEIGHT * MIN_EXPAND_RATIO;

const rawExpanded = computed(() =>
	hasDesc.value
		? Math.max(minExpanded, HEIGHT + contentHeight.value)
		: minExpanded,
);

let frozenExpanded = rawExpanded.value;
watch([open, rawExpanded], () => {
	if (open.value) frozenExpanded = rawExpanded.value;
});

const expanded = computed(() => (open.value ? rawExpanded.value : frozenExpanded));
const svgHeight = computed(() => (hasDesc.value ? Math.max(expanded.value, minExpanded) : HEIGHT));
const expandedContent = computed(() => Math.max(0, expanded.value - HEIGHT));
const resolvedPillWidth = computed(() => Math.max(pillWidth.value || HEIGHT, HEIGHT));

const pillX = computed(() =>
	props.position === "right"
		? WIDTH - resolvedPillWidth.value
		: props.position === "center"
			? (WIDTH - resolvedPillWidth.value) / 2
			: 0,
);

/* ------------------------------- Inline styles ---------------------------- */

const rootStyle = computed(() => {
	const s: Record<string, string> = {
		"--_h": `${open.value ? expanded.value : HEIGHT}px`,
		"--_pw": `${resolvedPillWidth.value}px`,
		"--_px": `${pillX.value}px`,
		"--_sy": `${open.value ? 1 : HEIGHT / expanded.value}`,
		"--_ph": `${open.value ? expanded.value - 5 : expanded.value}px`,
		"--_by": `${open.value ? 1 : 0}`,
		"--_ht": `translateY(${open.value ? (props.expand === "bottom" ? 3 : -3) : 0}px) scale(${open.value ? 0.9 : 1})`,
		"--_co": `${open.value ? 1 : 0}`,
	};
	if (view.value.fill) {
		s["--sileo-fill"] = view.value.fill;
	}
	return s;
});

/* -------------------------------- Handlers -------------------------------- */

function handleEnter(e: MouseEvent) {
	emit("mouseenter", e);
	if (hasDesc.value) isExpanded.value = true;
}

function handleLeave(e: MouseEvent) {
	emit("mouseleave", e);
	isExpanded.value = false;
}

function handleTransitionEnd(e: TransitionEvent) {
	if (e.propertyName !== "height" && e.propertyName !== "transform") return;
	if (open.value) return;
	if (!pending) return;
	if (swapTimer) {
		clearTimeout(swapTimer);
		swapTimer = null;
	}
	view.value = pending.payload;
	applied.value = pending.key;
	pending = null;
}

function handleButtonClick(e: MouseEvent) {
	e.preventDefault();
	e.stopPropagation();
	view.value.button?.onClick();
}

/* -------------------------------- Swipe ----------------------------------- */

const SWIPE_DISMISS = 30;
const SWIPE_MAX = 20;
let pointerStart: number | null = null;

function onPointerDown(e: PointerEvent) {
	if (props.exiting) return;
	const target = e.target as HTMLElement;
	if (target.closest("[data-sileo-button]")) return;
	pointerStart = e.clientY;
	(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
}

function onPointerMove(e: PointerEvent) {
	if (pointerStart === null) return;
	const el = buttonRef.value;
	if (!el) return;
	const dy = e.clientY - pointerStart;
	const sign = dy > 0 ? 1 : -1;
	const clamped = Math.min(Math.abs(dy), SWIPE_MAX) * sign;
	el.style.transform = `translateY(${clamped}px)`;
}

function onPointerUp(e: PointerEvent) {
	if (pointerStart === null) return;
	const dy = e.clientY - pointerStart;
	pointerStart = null;
	const el = buttonRef.value;
	if (el) el.style.transform = "";
	if (Math.abs(dy) > SWIPE_DISMISS) {
		emit("dismiss");
	}
}

/* -------------------------------- Lifecycle -------------------------------- */

onMounted(() => {
	requestAnimationFrame(() => (ready.value = true));
	nextTick(() => {
		setupPillObserver();
		setupContentObserver();
	});
});

onUnmounted(() => {
	pillRo?.disconnect();
	contentRo?.disconnect();
	cancelAnimationFrame(pillRaf);
	cancelAnimationFrame(contentRaf);
	if (headerExitTimer) clearTimeout(headerExitTimer);
	if (autoExpandTimer) clearTimeout(autoExpandTimer);
	if (autoCollapseTimer) clearTimeout(autoCollapseTimer);
	if (swapTimer) clearTimeout(swapTimer);
});

/* ------------------------------ Icon helper ------------------------------- */

function getIcon(v: View): VNode {
	if (v.icon !== undefined && v.icon !== null) return v.icon as VNode;
	return STATE_ICON[v.state]();
}
</script>

<template>
	<button
		ref="buttonRef"
		type="button"
		data-sileo-toast
		:data-ready="ready"
		:data-expanded="open"
		:data-exiting="props.exiting"
		:data-edge="props.expand"
		:data-position="props.position"
		:data-state="view.state"
		:style="rootStyle"
		@mouseenter="handleEnter"
		@mouseleave="handleLeave"
		@transitionend="handleTransitionEnd"
		@pointerdown="onPointerDown"
		@pointermove="onPointerMove"
		@pointerup="onPointerUp"
	>
		<div data-sileo-canvas :data-edge="props.expand">
			<svg
				data-sileo-svg
				:width="WIDTH"
				:height="svgHeight"
				:viewBox="`0 0 ${WIDTH} ${svgHeight}`"
			>
				<title>Sileo Notification</title>
				<defs>
					<filter
						:id="filterId"
						x="-20%"
						y="-20%"
						width="140%"
						height="140%"
						colorInterpolationFilters="sRGB"
					>
						<feGaussianBlur in="SourceGraphic" :stdDeviation="blur" result="blur" />
						<feColorMatrix
							in="blur"
							mode="matrix"
							values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 20 -10"
							result="goo"
						/>
						<feComposite in="SourceGraphic" in2="goo" operator="atop" />
					</filter>
				</defs>
				<g :filter="`url(#${filterId})`">
					<rect
						data-sileo-pill
						:x="pillX"
						:rx="resolvedRoundness"
						:ry="resolvedRoundness"
					/>
					<rect
						data-sileo-body
						:y="HEIGHT"
						:width="WIDTH"
						:height="expandedContent"
						:rx="resolvedRoundness"
						:ry="resolvedRoundness"
					/>
				</g>
			</svg>
		</div>

		<div ref="headerRef" data-sileo-header :data-edge="props.expand">
			<div data-sileo-header-stack>
				<div
					ref="innerRef"
					:key="headerLayer.current.key"
					data-sileo-header-inner
					data-layer="current"
				>
					<div
						data-sileo-badge
						:data-state="headerLayer.current.view.state"
						:class="headerLayer.current.view.styles?.badge"
					>
						<component :is="() => getIcon(headerLayer.current.view)" />
					</div>
					<span
						data-sileo-title
						:data-state="headerLayer.current.view.state"
						:class="headerLayer.current.view.styles?.title"
					>
						{{ headerLayer.current.view.title }}
					</span>
				</div>
				<div
					v-if="headerLayer.prev"
					:key="headerLayer.prev.key"
					data-sileo-header-inner
					data-layer="prev"
					data-exiting="true"
				>
					<div
						data-sileo-badge
						:data-state="headerLayer.prev.view.state"
						:class="headerLayer.prev.view.styles?.badge"
					>
						<component :is="() => getIcon(headerLayer.prev!.view)" />
					</div>
					<span
						data-sileo-title
						:data-state="headerLayer.prev.view.state"
						:class="headerLayer.prev.view.styles?.title"
					>
						{{ headerLayer.prev.view.title }}
					</span>
				</div>
			</div>
		</div>

		<div
			v-if="hasDesc"
			data-sileo-content
			:data-edge="props.expand"
			:data-visible="open"
		>
			<div
				ref="contentRef"
				data-sileo-description
				:class="view.styles?.description"
			>
				<template v-if="typeof view.description === 'string'">
					{{ view.description }}
				</template>
				<component v-else-if="view.description" :is="() => view.description" />
				<a
					v-if="view.button"
					href="#"
					data-sileo-button
					:data-state="view.state"
					:class="view.styles?.button"
					@click="handleButtonClick"
				>
					{{ view.button.title }}
				</a>
			</div>
		</div>
	</button>
</template>