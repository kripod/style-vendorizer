import { cssValuePrefixFlags } from "../src";
import { expectedPrefixFlagsByPropertyValuePair } from "./utils";

test.each(
	[...expectedPrefixFlagsByPropertyValuePair.entries()].map(
		([propertyValuePair, prefixFlag]) => {
			const [property, value] = propertyValuePair.split(":") as [
				string,
				string,
			];
			return [property, value, prefixFlag] as const;
		},
	),
)('cssValuePrefixFlags("%s", "%s") === %i', (property, value, prefixFlag) => {
	expect(cssValuePrefixFlags(property, value)).toBe(prefixFlag);
});

/* TODO: Test for false positives */
