import { MetricAttributes } from "@opentelemetry/api-metrics";
import { Config } from "../config";
import * as fs from "fs";
import * as process from "process";

const PROCESS_OPEN_FDS = "process_open_fds";

export function processOpenFileDescriptors<Attributes extends MetricAttributes>(
	config: Config<Attributes>,
) {
	if (process.platform !== "linux") {
		return;
	}
	const meter = config.meter;

	const namePrefix = config.prefix ? config.prefix : "";
	const labels = config.labels ? config.labels : {};

	const metric = meter.createObservableUpDownCounter(
		namePrefix + PROCESS_OPEN_FDS,
		{
			description: "Number of open file descriptors.",
		},
	);

	metric.addCallback((result) => {
		try {
			const fds = fs.readdirSync("/proc/self/fd");
			// Minus 1 to not count the fd that was used by readdirSync(),
			// it's now closed.
			result.observe(fds.length - 1, labels);
		} catch {
			// noop
		}
	});
}
