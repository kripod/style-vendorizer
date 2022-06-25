import bcd from "@mdn/browser-compat-data";
import browserslist from "browserslist";
import compareVersions from "compare-versions";
import { css } from "mdn-data";

const enum CSSPrefixFlags {
	"-webkit-" = 1 << 0,
	"-moz-" = 1 << 1,
	"-ms-" = 1 << 2,
}

export const nonObsoleteProperties = Object.keys(css.properties).filter(
	(property) => {
		const { status } = css.properties[property];
		return (
			status !== "obsolete" &&
			property !== "box-direction" && // Replaced by "flex-direction"
			property !== "unicode-bidi" // Site authors shouldn't override this
		);
	},
);

function normalizeVersion(version: string) {
	return version.replace("≤", "");
}

const prefixFlagsByPrefix = new Map([
	["-webkit-", CSSPrefixFlags["-webkit-"]],
	["-moz-", CSSPrefixFlags["-moz-"]],
	["-ms-", CSSPrefixFlags["-ms-"]],
]);

const browsersByBrowserslistId: ReadonlyMap<string, string> = new Map([
	/* Keys: https://github.com/browserslist/browserslist#browsers */
	/* Values: https://github.com/mdn/browser-compat-data/blob/master/schemas/compat-data-schema.md#browser-identifiers */
	["chrome", "chrome"],
	["and_chr", "chrome_android"],
	["edge", "edge"],
	["firefox", "firefox"],
	["and_ff", "firefox_android"],
	["ie", "ie"],
	["node", "nodejs"],
	["opera", "opera"],
	["op_mob", "opera_android"],
	["and_qq", "qq_android"],
	["safari", "safari"],
	["ios_saf", "safari_ios"],
	["samsung", "samsunginternet_android"],
	["and_uc", "uc_android"],
	["android", "webview_android"],
]);

const minSupportedVersionsByBrowser = new Map<string, string>();
/* TODO: Adjust query when necessary */
// UC Browser 12.12 -> Chrome >=57
// KaiOS 2.5 -> Firefox >=48
browserslist(
	"defaults, chrome >=57, edge >=16, firefox >=48, ie 11, opera >=46, safari >=12.2",
)
	.map((stat) => {
		const [browserslistId, versionRange] = stat.split(" ") as [string, string];
		return [
			browsersByBrowserslistId.get(browserslistId),
			// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
			versionRange.split("-")[0]!, // Uses lower version if a range is given
		] as const;
	})
	.forEach(([browser, version]) => {
		if (!browser) return; // Filter out unknown browsers

		// Find minimum version of each browser
		if (
			!minSupportedVersionsByBrowser.has(browser) ||
			// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
			compareVersions(version, minSupportedVersionsByBrowser.get(browser)!) < 0
		) {
			minSupportedVersionsByBrowser.set(browser, version);
		}
	});

const prefixesByProperty = new Map<string, Set<string>>();
const prefixesByPropertyValuePair = new Map<string, Set<string>>();
const aliasesByProperty = new Map<string, Set<string>>();
const aliasesByPropertyValuePair = new Map<string, Set<string>>();

function traverse(
	// TODO: Use `Identifier` type from `@mdn/browser-compat-data`
	{ __compat, ...subfeatures }: any,
	property: string,
	value?: string,
) {
	for (const [value, subfeatureIdentifier] of Object.entries(subfeatures)) {
		traverse(subfeatureIdentifier, property, __compat ? value : undefined);
	}

	if (!__compat || (__compat.status && !__compat.status.standard_track)) return;

	for (const [browser, supportStatement] of Object.entries(__compat.support)) {
		const minSupportedVersion = minSupportedVersionsByBrowser.get(browser);
		if (!minSupportedVersion) continue;

		const supportStatements = Array.isArray(supportStatement)
			? supportStatement
			: // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
			  [supportStatement!];
		const hasNativeSupport =
			!supportStatements[0].prefix &&
			!supportStatements[0].alternative_name &&
			(typeof supportStatements[0].version_added === "string"
				? supportStatements[0].version_added !== "preview" &&
				  compareVersions(
						normalizeVersion(supportStatements[0].version_added),
						minSupportedVersion,
				  ) <= 0
				: supportStatements[0].version_added);

		if (!hasNativeSupport) {
			supportStatements.forEach(
				({ prefix, version_added, version_removed, alternative_name }, i) => {
					if (
						(typeof version_removed === "string"
							? version_removed === "preview" ||
							  compareVersions(
									normalizeVersion(version_removed),
									minSupportedVersion,
							  ) > 0
							: !version_removed) &&
						(i === 0 ||
							(typeof version_added === "string" &&
							typeof supportStatements[0].version_added === "string"
								? version_added !== "preview" &&
								  (supportStatements[0].version_added === "preview" ||
										compareVersions(
											normalizeVersion(version_added),
											normalizeVersion(supportStatements[0].version_added),
										) < 0)
								: version_added))
					) {
						if (prefix) {
							if (value) {
								const propertyValuePair = `${property}:${value}`;
								const prefixes =
									prefixesByPropertyValuePair.get(propertyValuePair) ||
									new Set();
								if (prefixes.size === 0) {
									prefixesByPropertyValuePair.set(propertyValuePair, prefixes);
								}
								prefixes.add(prefix);
							} else {
								const prefixes = prefixesByProperty.get(property) || new Set();
								if (prefixes.size === 0) {
									prefixesByProperty.set(property, prefixes);
								}
								prefixes.add(prefix);
							}
						}

						if (alternative_name) {
							if (value) {
								const propertyValuePair = `${property}:${value}`;
								const aliases =
									aliasesByPropertyValuePair.get(propertyValuePair) ||
									new Set();
								if (aliases.size === 0) {
									aliasesByPropertyValuePair.set(propertyValuePair, aliases);
								}
								aliases.add(alternative_name);
							} else {
								const aliases = aliasesByProperty.get(property) || new Set();
								if (aliases.size === 0) {
									aliasesByProperty.set(property, aliases);
								}
								aliases.add(alternative_name);
							}
						}
					}
				},
			);
		}
	}
}

Object.entries(bcd.css.properties).forEach(([property, featureIdentifier]) => {
	traverse(featureIdentifier, property);
});

/* TODO: Remove adjustments below as @mdn/browser-compat-data gets fixed */

export const expectedPrefixFlagsByProperty = new Map(
	[...prefixesByProperty.entries()].map(([property, prefixes]) => [
		property,
		[...prefixes.values()]
			.map((prefix) => prefixFlagsByPrefix.get(prefix))
			.reduce(
				(accumulator = 0, currentValue = 0) => accumulator | currentValue,
			),
	]),
);
expectedPrefixFlagsByProperty.set("mask", CSSPrefixFlags["-webkit-"]);
expectedPrefixFlagsByProperty.set(
	"text-decoration",
	CSSPrefixFlags["-webkit-"],
);
expectedPrefixFlagsByProperty.delete("align-self"); // "-ms-grid-row-align" in IE 11
expectedPrefixFlagsByProperty.delete("initial-letter"); // Only supported by Safari
expectedPrefixFlagsByProperty.delete("justify-self"); // "-ms-grid-column-align" in IE 11
expectedPrefixFlagsByProperty.delete("line-break"); // Supported by iOS Safari 11+
expectedPrefixFlagsByProperty.delete("ruby-position"); // "-webkit-ruby-position" uses non-standard values
expectedPrefixFlagsByProperty.delete("scroll-snap-type"); // IE 11 uses non-standard values
expectedPrefixFlagsByProperty.set(
	"text-size-adjust",
	// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
	expectedPrefixFlagsByProperty.get("text-size-adjust")! ^
		CSSPrefixFlags["-moz-"], // Prefer responsive "viewport" meta tag
);
expectedPrefixFlagsByProperty.set(
	"user-select",
	// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
	expectedPrefixFlagsByProperty.get("user-select")! ^ CSSPrefixFlags["-moz-"], // Firefox 49+ supports the "-webkit-" prefix
);

export const expectedPrefixFlagsByPropertyValuePair = new Map(
	[...prefixesByPropertyValuePair.entries()].map(
		([propertyValuePair, prefixes]) => {
			return [
				propertyValuePair,
				[...prefixes.values()]
					.map((prefix) => prefixFlagsByPrefix.get(prefix))
					.reduce(
						(accumulator = 0, currentValue = 0) => accumulator | currentValue,
					),
			];
		},
	),
);
expectedPrefixFlagsByPropertyValuePair.delete("background-image:element"); // Only supported by Firefox
expectedPrefixFlagsByPropertyValuePair.delete("cursor:grab"); // Not required for Opera Mobile and QQ Browser
expectedPrefixFlagsByPropertyValuePair.delete("image-rendering:crisp-edges"); // Only supported by Firefox
expectedPrefixFlagsByPropertyValuePair.delete(
	"list-style-type:ethiopic-halehame",
); // Non-standard
expectedPrefixFlagsByPropertyValuePair.delete(
	"list-style-type:ethiopic-halehame-am",
); // Non-standard
expectedPrefixFlagsByPropertyValuePair.delete(
	"list-style-type:ethiopic-halehame-ti-er",
); // Non-standard
expectedPrefixFlagsByPropertyValuePair.delete(
	"list-style-type:ethiopic-halehame-ti-et",
); // Non-standard
expectedPrefixFlagsByPropertyValuePair.delete("list-style-type:hangul"); // Non-standard
expectedPrefixFlagsByPropertyValuePair.delete(
	"list-style-type:hangul-consonant",
); // Non-standard
expectedPrefixFlagsByPropertyValuePair.delete("list-style-type:urdu"); // Non-standard
expectedPrefixFlagsByPropertyValuePair.delete("text-decoration:shorthand"); // Supported with property prefix
expectedPrefixFlagsByPropertyValuePair.delete("transform:3d"); // Supported by newer WebView versions
expectedPrefixFlagsByPropertyValuePair.delete("unicode-bidi:isolate"); // Site authors shouldn't override this
expectedPrefixFlagsByPropertyValuePair.delete("unicode-bidi:isolate-override"); // Site authors shouldn't override this
expectedPrefixFlagsByPropertyValuePair.delete("unicode-bidi:plaintext"); // Site authors shouldn't override this

export const expectedAliasesByProperty = new Map(
	[...aliasesByProperty.entries()]
		.filter(
			([property]) =>
				property !== "word-wrap" && // IE 11 has non-standard behavior with "overflow-wrap"
				// Older Firefox supports these, but KaiOS target (~ Firefox 48) doesn't
				!property.startsWith("inset") && // Firefox 51–62
				property !== "text-decoration-thickness", // Firefox 69
		)
		.map(([property, aliases]) => {
			if (property.startsWith("grid-auto-")) {
				property = property.replace("auto", "template");
			} else if (property === "text-combine-upright") {
				aliases.delete("-webkit-text-combine"); // Uses non-standard values
			}

			if (aliases.size > 1) {
				throw new Error(
					`A property may only have one alias, but "${property}" has more: ${[
						...aliases.values(),
					]
						.map((value) => `"${value}"`)
						.join(", ")}`,
				);
			}

			return [property, aliases.values().next().value];
		}),
);
