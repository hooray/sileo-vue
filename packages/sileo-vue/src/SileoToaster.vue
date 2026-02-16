<script setup lang="ts">
import { type CSSProperties, computed, onMounted, onUnmounted, ref, watch } from "vue";
import SileoToast from "./SileoToast.vue";
import {
	SILEO_POSITIONS,
	type SileoOptions,
	type SileoPosition,
} from "./types";
import {
	DEFAULT_DURATION,
	type SileoItem,
	type SileoListener,
	type SileoOffsetConfig,
	type SileoOffsetValue,
	expandDir,
	pillAlign,
	store,
	timeoutKey,
} from "./store";

const props = withDefaults(
	defineProps<{
		position?: SileoPosition;
		offset?: SileoOffsetValue | SileoOffsetConfig;
		options?: Partial<SileoOptions>;
	}>(),
	{
		position: "top-right",
	},
);

const toasts = ref<SileoItem[]>(store.toasts);
const activeId = ref<string>();

let hovered = false;
const timers = new Map<string, number>();
const handlersCache = new Map<
	string,
	{
		enter: (e: MouseEvent) => void;
		leave: (e: MouseEvent) => void;
		dismiss: () => void;
	}
>();

/* ----------------------------- Sync store config -------------------------- */

function syncConfig() {
	store.position = props.position;
	store.options = props.options;
}

/* ----------------------------- Timer management --------------------------- */

function clearAllTimers() {
	for (const t of timers.values()) clearTimeout(t);
	timers.clear();
}

function dismissToast(id: string) {
	const item = store.toasts.find((t) => t.id === id);
	if (!item || item.exiting) return;

	store.update((prev) =>
		prev.map((t) => (t.id === id ? { ...t, exiting: true } : t)),
	);

	const EXIT_DURATION = DEFAULT_DURATION * 0.1;
	setTimeout(
		() => store.update((prev) => prev.filter((t) => t.id !== id)),
		EXIT_DURATION,
	);
}

function schedule(items: SileoItem[]) {
	if (hovered) return;

	for (const item of items) {
		if (item.exiting) continue;
		const key = timeoutKey(item);
		if (timers.has(key)) continue;

		const dur = item.duration ?? DEFAULT_DURATION;
		if (dur === null || dur <= 0) continue;

		timers.set(
			key,
			window.setTimeout(() => dismissToast(item.id), dur),
		);
	}
}

/* ----------------------------- Latest toast ------------------------------- */

const latest = computed(() => {
	for (let i = toasts.value.length - 1; i >= 0; i--) {
		if (!toasts.value[i].exiting) return toasts.value[i].id;
	}
	return undefined;
});

/* ----------------------------- Handlers ----------------------------------- */

function getHandlers(toastId: string) {
	let cached = handlersCache.get(toastId);
	if (cached) return cached;

	cached = {
		enter: () => {
			activeId.value = toastId;
			if (!hovered) {
				hovered = true;
				clearAllTimers();
			}
		},
		leave: () => {
			activeId.value = latest.value;
			if (hovered) {
				hovered = false;
				schedule(toasts.value);
			}
		},
		dismiss: () => dismissToast(toastId),
	};

	handlersCache.set(toastId, cached);
	return cached;
}

/* ----------------------------- Viewport style ----------------------------- */

function getViewportStyle(pos: SileoPosition): CSSProperties | undefined {
	if (props.offset === undefined) return undefined;

	const o =
		typeof props.offset === "object"
			? props.offset
			: { top: props.offset, right: props.offset, bottom: props.offset, left: props.offset };

	const s: Record<string, string> = {};
	const px = (v: SileoOffsetValue) =>
		typeof v === "number" ? `${v}px` : v;

	if (pos.startsWith("top") && o.top) s.top = px(o.top);
	if (pos.startsWith("bottom") && o.bottom) s.bottom = px(o.bottom);
	if (pos.endsWith("left") && o.left) s.left = px(o.left);
	if (pos.endsWith("right") && o.right) s.right = px(o.right);

	return s as CSSProperties;
}

/* ----------------------------- Position grouping -------------------------- */

const byPosition = computed(() => {
	const map = {} as Partial<Record<SileoPosition, SileoItem[]>>;
	for (const t of toasts.value) {
		const pos = t.position ?? props.position;
		const arr = map[pos];
		if (arr) {
			arr.push(t);
		} else {
			map[pos] = [t];
		}
	}
	return map;
});

/* ----------------------------- Lifecycle ---------------------------------- */

const listener: SileoListener = (next) => {
	toasts.value = [...next];

	const toastKeys = new Set(next.map(timeoutKey));
	const toastIds = new Set(next.map((t) => t.id));
	for (const [key, timer] of timers) {
		if (!toastKeys.has(key)) {
			clearTimeout(timer);
			timers.delete(key);
		}
	}
	for (const id of handlersCache.keys()) {
		if (!toastIds.has(id)) handlersCache.delete(id);
	}

	activeId.value = latest.value;
	schedule(next);
};

onMounted(() => {
	syncConfig();
	store.listeners.add(listener);
});

watch(
	() => [props.position, props.options] as const,
	() => syncConfig(),
);

onUnmounted(() => {
	store.listeners.delete(listener);
	clearAllTimers();
});
</script>

<template>
	<slot />
	<template v-for="pos in SILEO_POSITIONS" :key="pos">
		<section
			v-if="byPosition[pos]?.length"
			data-sileo-viewport
			:data-position="pos"
			aria-live="polite"
			:style="getViewportStyle(pos)"
		>
			<SileoToast
				v-for="item in byPosition[pos]"
				:key="item.id"
				:id="item.id"
				:state="item.state"
				:title="item.title"
				:description="item.description"
				:position="pillAlign(pos)"
				:expand="expandDir(pos)"
				:icon="item.icon"
				:fill="item.fill"
				:styles="item.styles"
				:button="item.button"
				:roundness="item.roundness"
				:exiting="item.exiting"
				:auto-expand-delay-ms="item.autoExpandDelayMs"
				:auto-collapse-delay-ms="item.autoCollapseDelayMs"
				:refresh-key="item.instanceId"
				:can-expand="activeId === undefined || activeId === item.id"
				@mouseenter="getHandlers(item.id).enter($event)"
				@mouseleave="getHandlers(item.id).leave($event)"
				@dismiss="getHandlers(item.id).dismiss()"
			/>
		</section>
	</template>
</template>
