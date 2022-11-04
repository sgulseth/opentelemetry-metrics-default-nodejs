import { MetricAttributes } from "@opentelemetry/api-metrics";
import { Config } from "../config";

import { safeMemoryUsage } from "./helpers/safeMemoryUsage";

const NODEJS_HEAP_SIZE_TOTAL = "nodejs_heap_size_total_bytes";
const NODEJS_HEAP_SIZE_USED = "nodejs_heap_size_used_bytes";
const NODEJS_EXTERNAL_MEMORY = "nodejs_external_memory_bytes";

export function heapSizeAndUsed<Attributes extends MetricAttributes>(
	config: Config<Attributes>,
) {
	if (typeof process.memoryUsage !== "function") {
		return;
	}
	const meter = config.meter;
	const labels = config.labels ? config.labels : {};

	const namePrefix = config.prefix ? config.prefix : "";

	const heapSizeTotal = meter.createObservableUpDownCounter(
		namePrefix + NODEJS_HEAP_SIZE_TOTAL,
		{
			description: "Process heap size from Node.js in bytes.",
		},
	);
	const heapSizeUsed = meter.createObservableUpDownCounter(
		namePrefix + NODEJS_HEAP_SIZE_USED,
		{
			description: "Process heap size used from Node.js in bytes.",
		},
	);
	const externalMemUsed = meter.createObservableUpDownCounter(
		namePrefix + NODEJS_EXTERNAL_MEMORY,
		{
			description: "Node.js external memory size in bytes.",
		},
	);

	meter.addBatchObservableCallback(
		(result) => {
			const memUsage = safeMemoryUsage();
			if (!memUsage) {
				return;
			}

			result.observe(heapSizeTotal, memUsage.heapTotal, labels);
			result.observe(heapSizeUsed, memUsage.heapUsed, labels);
			if (memUsage.external !== undefined) {
				result.observe(externalMemUsed, memUsage.external, labels);
			}
		},
		[heapSizeTotal, heapSizeUsed, externalMemUsed],
	);
}
