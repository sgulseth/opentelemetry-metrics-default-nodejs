import { MetricAttributes } from "@opentelemetry/api-metrics";
import { Config } from "../config";

const PROCESS_CPU_USER_SECONDS = "process_cpu_user_seconds_total";
const PROCESS_CPU_SYSTEM_SECONDS = "process_cpu_system_seconds_total";
const PROCESS_CPU_SECONDS = "process_cpu_seconds_total";

export function processCpuTotal<Attributes extends MetricAttributes>(
	config: Config<Attributes>,
) {
	const meter = config.meter;
	const namePrefix = config.prefix ? config.prefix : "";
	const labels = config.labels ? config.labels : {};

	let lastCpuUsage = process.cpuUsage();

	const cpuUserUsageCounter = meter.createObservableCounter(
		namePrefix + PROCESS_CPU_USER_SECONDS,
		{
			description: "Total user CPU time spent in seconds.",
		},
	);
	const cpuSystemUsageCounter = meter.createObservableCounter(
		namePrefix + PROCESS_CPU_SYSTEM_SECONDS,
		{
			description: "Total system CPU time spent in seconds.",
		},
	);
	const cpuUsageCounter = meter.createObservableCounter(
		namePrefix + PROCESS_CPU_SECONDS,
		{
			description: "Total user and system CPU time spent in seconds.",
		},
	);

	meter.addBatchObservableCallback(
		(result) => {
			const cpuUsage = process.cpuUsage();

			const userUsageMicros = cpuUsage.user - lastCpuUsage.user;
			const systemUsageMicros = cpuUsage.system - lastCpuUsage.system;

			lastCpuUsage = cpuUsage;
			result.observe(cpuUserUsageCounter, userUsageMicros / 1e6, labels);
			result.observe(cpuSystemUsageCounter, systemUsageMicros / 1e6, labels);
			result.observe(
				cpuUsageCounter,
				(userUsageMicros + systemUsageMicros) / 1e6,
				labels,
			);
		},
		[cpuUserUsageCounter, cpuSystemUsageCounter, cpuUsageCounter],
	);
}
