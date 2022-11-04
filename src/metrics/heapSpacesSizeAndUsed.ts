import {
	MetricAttributes,
	ObservableUpDownCounter,
} from "@opentelemetry/api-metrics";
import { Config } from "../config";
import v8 from "v8";

const METRICS = ["total", "used", "available"];
const NODEJS_HEAP_SIZE: Record<string, string> = {};

METRICS.forEach((metricType) => {
	NODEJS_HEAP_SIZE[metricType] = `nodejs_heap_space_size_${metricType}_bytes`;
});

export function heapSpacesSizeAndUsed<Attributes extends MetricAttributes>(
	config: Config<Attributes>,
) {
	const meter = config.meter;
	const namePrefix = config.prefix ? config.prefix : "";

	const labels = config.labels ? config.labels : {};

	const gauges: Record<string, ObservableUpDownCounter> = {};

	METRICS.forEach((metricType) => {
		gauges[metricType] = meter.createObservableUpDownCounter(
			namePrefix + NODEJS_HEAP_SIZE[metricType],
			{
				description: `Process heap space size ${metricType} from Node.js in bytes.`,
			},
		);
	});

	meter.addBatchObservableCallback((result) => {
		for (const space of v8.getHeapSpaceStatistics()) {
			const spaceName = space.space_name.substr(
				0,
				space.space_name.indexOf("_space"),
			);

			const attributes = { space: spaceName, ...labels };
			result.observe(gauges["total"], space.space_size, attributes);
			result.observe(gauges["used"], space.space_used_size, attributes);
			result.observe(
				gauges["available"],
				space.space_available_size,
				attributes,
			);
		}
	}, Object.values(gauges));
}
