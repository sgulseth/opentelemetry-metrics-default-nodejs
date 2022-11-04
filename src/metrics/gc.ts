import perfHooks, { constants } from "perf_hooks";
import { MetricAttributes } from "@opentelemetry/api-metrics";

import { Config } from "../config";

const NODEJS_GC_DURATION_SECONDS = "nodejs_gc_duration_seconds";

const kinds = {
	[constants.NODE_PERFORMANCE_GC_MAJOR]: "major",
	[constants.NODE_PERFORMANCE_GC_MINOR]: "minor",
	[constants.NODE_PERFORMANCE_GC_INCREMENTAL]: "incremental",
	[constants.NODE_PERFORMANCE_GC_WEAKCB]: "weakcb",
} as const;

type GCAttributes = {
	kind: string;
} & MetricAttributes;

export function gc<T extends MetricAttributes>(config: Config<T>) {
	const namePrefix = config.prefix ? config.prefix : "";
	const labels = config.labels ? config.labels : {};

	const gcHistogram = config.meter.createHistogram<GCAttributes>(
		namePrefix + NODEJS_GC_DURATION_SECONDS,
		{
			description:
				"Garbage collection duration by kind, one of major, minor, incremental or weakcb.",
		},
	);

	const obs = new perfHooks.PerformanceObserver((list) => {
		const entry = list.getEntries()[0];
		// Node < 16 uses entry.kind
		// Node >= 16 uses entry.detail.kind
		// See: https://nodejs.org/docs/latest-v16.x/api/deprecations.html#deprecations_dep0152_extension_performanceentry_properties
		if (
			entry &&
			entry.detail &&
			typeof entry.detail === "object" &&
			"kind" in entry.detail
		) {
			const { detail } = entry;

			// TODO: Fix types
			// @ts-ignore-line
			const k = detail.kind;
			const kind = kinds[k];

			// Convert duration from milliseconds to seconds
			gcHistogram.record(
				entry.duration / 1000,
				Object.assign({ kind }, labels),
			);
		}
	});

	obs.observe({ entryTypes: ["gc"] });
}
