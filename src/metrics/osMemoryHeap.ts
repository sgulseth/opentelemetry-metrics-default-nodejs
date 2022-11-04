import { MetricAttributes } from "@opentelemetry/api-metrics";
import { Config } from "../config";

import { osMemoryHeapLinux } from "./osMemoryHeapLinux";
import { safeMemoryUsage } from "./helpers/safeMemoryUsage";

const PROCESS_RESIDENT_MEMORY = "process_resident_memory_bytes";

export function notLinuxVariant<Attributes extends MetricAttributes>(
	config: Config<Attributes>,
) {
	const meter = config.meter;
	const namePrefix = config.prefix ? config.prefix : "";
	const labels = config.labels ? config.labels : {};

	const metric = meter.createObservableUpDownCounter(
		namePrefix + PROCESS_RESIDENT_MEMORY,
		{
			description: "Resident memory size in bytes.",
		},
	);

	metric.addCallback((result) => {
		const memUsage = safeMemoryUsage();

		// I don't think the other things returned from `process.memoryUsage()` is relevant to a standard export
		if (memUsage) {
			result.observe(memUsage.rss, labels);
		}
	});
}

export function osMemoryHeap<Attributes extends MetricAttributes>(
	config: Config<Attributes>,
) {
	return process.platform === "linux"
		? osMemoryHeapLinux(config)
		: notLinuxVariant(config);
}
