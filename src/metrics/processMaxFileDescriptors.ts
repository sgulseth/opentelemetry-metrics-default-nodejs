import { MetricAttributes } from "@opentelemetry/api-metrics";
import { Config } from "../config";
import * as fs from "fs";

const PROCESS_MAX_FDS = "process_max_fds";

let maxFds: number;

export function processMaxFileDescriptors<Attributes extends MetricAttributes>(
	config: Config<Attributes>,
) {
	if (maxFds === undefined) {
		// This will fail if a linux-like procfs is not available.
		try {
			const limits = fs.readFileSync("/proc/self/limits", "utf8");
			const lines = limits.split("\n");
			for (const line of lines) {
				if (line.startsWith("Max open files")) {
					const parts = line.split(/ {2,}/);
					maxFds = Number(parts[1]);
					break;
				}
			}
		} catch {
			return;
		}
	}

	if (maxFds === undefined) {
		return;
	}

	const meter = config.meter;
	const namePrefix = config.prefix ? config.prefix : "";
	const labels = config.labels ? config.labels : {};

	const metric = meter.createObservableUpDownCounter(
		namePrefix + PROCESS_MAX_FDS,
		{
			description: "Maximum number of open file descriptors.",
		},
	);

	metric.addCallback((result) => {
		result.observe(maxFds, labels);
	});
}
