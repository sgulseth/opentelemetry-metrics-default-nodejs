import { MetricAttributes } from "@opentelemetry/api-metrics";
import { Config } from "../config";

import { aggregateByObjectName } from "./helpers/processMetricsHelpers";

const NODEJS_ACTIVE_HANDLES = "nodejs_active_handles";
const NODEJS_ACTIVE_HANDLES_TOTAL = "nodejs_active_handles_total";

export function processHandles<Attributes extends MetricAttributes>(
	config: Config<Attributes>,
) {
	// @ts-ignore-line
	// Don't do anything if the function is removed in later nodes (exists in node@6-12...)
	if (typeof process._getActiveHandles !== "function") {
		return;
	}

	const meter = config.meter;
	const namePrefix = config.prefix ? config.prefix : "";
	const labels = config.labels ? config.labels : {};

	const activeHandles = meter.createObservableGauge(
		namePrefix + NODEJS_ACTIVE_HANDLES,
		{
			description:
				"Number of active libuv handles grouped by handle type. Every handle type is C++ class name.",
		},
	);
	const activeHandlesTotal = meter.createObservableGauge(
		namePrefix + NODEJS_ACTIVE_HANDLES_TOTAL,
		{
			description: "Total number of active handles.",
		},
	);

	meter.addBatchObservableCallback(
		(result) => {
			// @ts-ignore-line
			const handles = process._getActiveHandles();
			const aggregated = aggregateByObjectName(handles);
			for (const type in aggregated) {
				result.observe(activeHandles, aggregated[type], { type, ...labels });
			}
			result.observe(activeHandlesTotal, handles.length, labels);
		},
		[activeHandles, activeHandlesTotal],
	);
}
