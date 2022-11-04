import { MetricAttributes } from "@opentelemetry/api-metrics";
import { Config } from "../config";

import fs from "fs";

const values = ["VmSize", "VmRSS", "VmData"];

const PROCESS_RESIDENT_MEMORY = "process_resident_memory_bytes";
const PROCESS_VIRTUAL_MEMORY = "process_virtual_memory_bytes";
const PROCESS_HEAP = "process_heap_bytes";

function structureOutput(input: string): Record<string, number> {
	const returnValue: Record<string, number> = {};

	input
		.split("\n")
		.filter((s) => values.some((value) => s.indexOf(value) === 0))
		.forEach((string) => {
			const split = string.split(":");

			// Get the value
			let valueStr = split[1].trim();
			// Remove trailing ` kb`
			valueStr = valueStr.substring(0, valueStr.length - 3);
			// Make it into a number in bytes bytes
			const value = Number(valueStr) * 1024;

			returnValue[split[0]] = value;
		});

	return returnValue;
}

export function osMemoryHeapLinux<Attributes extends MetricAttributes>(
	config: Config<Attributes>,
) {
	const meter = config.meter;
	const namePrefix = config.prefix ? config.prefix : "";
	const labels = config.labels ? config.labels : {};
	const labelNames = Object.keys(labels);

	const residentMemGauge = meter.createObservableUpDownCounter(
		namePrefix + PROCESS_RESIDENT_MEMORY,
		{
			description: "Resident memory size in bytes.",
			// Use this one metric's `collect` to set all metrics' values.
		},
	);
	const virtualMemGauge = meter.createObservableUpDownCounter(
		namePrefix + PROCESS_VIRTUAL_MEMORY,
		{
			description: "Virtual memory size in bytes.",
		},
	);
	const heapSizeMemGauge = meter.createObservableUpDownCounter(
		namePrefix + PROCESS_HEAP,
		{
			description: "Process heap size in bytes.",
		},
	);

	meter.addBatchObservableCallback(
		(result) => {
			try {
				// Sync I/O is often problematic, but /proc isn't really I/O, it
				// a virtual filesystem that maps directly to in-kernel data
				// structures and never blocks.
				//
				// Node.js/libuv do this already for process.memoryUsage(), see:
				// - https://github.com/libuv/libuv/blob/a629688008694ed8022269e66826d4d6ec688b83/src/unix/linux-core.c#L506-L523
				const stat = fs.readFileSync("/proc/self/status", "utf8");
				const structuredOutput = structureOutput(stat);

				result.observe(residentMemGauge, structuredOutput.VmRSS, labels);
				result.observe(virtualMemGauge, structuredOutput.VmSize, labels);
				result.observe(heapSizeMemGauge, structuredOutput.VmData, labels);
			} catch {
				// noop
			}
		},
		[residentMemGauge, virtualMemGauge, heapSizeMemGauge],
	);
}
