import { MetricAttributes } from "@opentelemetry/api-metrics";
import { Config } from "../config";

const nodeVersion = process.version;
const versionSegments = nodeVersion.slice(1).split(".").map(Number);

const NODE_VERSION_INFO = "nodejs_version_info";

export function version<Attributes extends MetricAttributes>(
	config: Config<Attributes>,
) {
	const meter = config.meter;
	const namePrefix = config.prefix ? config.prefix : "";
	const labels = config.labels ? config.labels : {};

	const metric = meter.createObservableUpDownCounter(
		namePrefix + NODE_VERSION_INFO,
		{
			description: "Node.js version info.",
		},
	);

	metric.addCallback((result) => {
		result.observe(1, {
			version: nodeVersion,
			major: versionSegments[0],
			minor: versionSegments[1],
			patch: versionSegments[2],
			...labels,
		});
	});
}
