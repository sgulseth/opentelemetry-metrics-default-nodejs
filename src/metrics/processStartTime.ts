import { MetricAttributes } from "@opentelemetry/api-metrics";
import { Config } from "../config";

const startInSeconds = Math.round(Date.now() / 1000 - process.uptime());

const PROCESS_START_TIME = "process_start_time_seconds";

export function processStartTime<Attributes extends MetricAttributes>(
	config: Config<Attributes>,
) {
	const meter = config.meter;
	const namePrefix = config.prefix ? config.prefix : "";
	const labels = config.labels ? config.labels : {};

	const metric = meter.createObservableUpDownCounter(
		namePrefix + PROCESS_START_TIME,
		{
			description: "Start time of the process since unix epoch in seconds.",
		},
	);
	metric.addCallback((result) => {
		result.observe(startInSeconds, labels);
	});
}
