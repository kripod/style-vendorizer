import { cssPropertyPrefixFlags } from "../src";
import { expectedPrefixFlagsByProperty, nonObsoleteProperties } from "./utils";

test.each([...expectedPrefixFlagsByProperty.entries()])(
	'cssPropertyPrefixFlags("%s") === %i',
	(property, prefixFlag) => {
		expect(cssPropertyPrefixFlags(property)).toBe(prefixFlag);
	},
);

test.each(
	nonObsoleteProperties.filter(
		(property) => !expectedPrefixFlagsByProperty.has(property),
	),
)('no false positive for cssPropertyPrefixFlags("%s")', (property) => {
	expect(cssPropertyPrefixFlags(property)).toBe(0);
});
