import { MetricAttributes } from "@opentelemetry/api-metrics";
import { Config } from "../config";

const NODEJS_ACTIVE_RESOURCES = "nodejs_active_resources";
const NODEJS_ACTIVE_RESOURCES_TOTAL = "nodejs_active_resources_total";

export function processResources<Attributes extends MetricAttributes>(
	config: Config<Attributes>,
) {
	// Don't do anything if the function does not exist in previous nodes (exists in node@17.3.0)
	// @ts-ignore-line
	if (typeof process.getActiveResourcesInfo !== "function") {
		return;
	}

	const meter = config.meter;
	const namePrefix = config.prefix ? config.prefix : "";
	const labels = config.labels ? config.labels : {};

	const activeResources = meter.createObservableUpDownCounter(
		namePrefix + NODEJS_ACTIVE_RESOURCES,
		{
			description:
				"Number of active resources that are currently keeping the event loop alive, grouped by async resource type.",
		},
	);

	const totalActiveResources = meter.createObservableUpDownCounter(
		namePrefix + NODEJS_ACTIVE_RESOURCES_TOTAL,
		{
			description: "Total number of active resources.",
		},
	);

	meter.addBatchObservableCallback(
		(result) => {
			// @ts-ignore-line
			// TODO: Fix typings
			const resources = process.getActiveResourcesInfo();

			const data: Record<string, number> = {};

			for (let i = 0; i < resources.length; i++) {
				const resource = resources[i];

				if (data.hasOwnProperty(resource)) {
					data[resource] += 1;
				} else {
					data[resource] = 1;
				}
			}

			for (const resource in data) {
				result.observe(activeResources, data[resource], { type: resource });
			}

			result.observe(totalActiveResources, resources.length);
		},
		[activeResources, totalActiveResources],
	);
}
