import { cssPropertyAlias } from "../src";
import { expectedAliasesByProperty } from "./utils";

test.each([...expectedAliasesByProperty.entries()])(
	'cssPropertyAlias("%s") === "%s"',
	(property, alias) => {
		expect(cssPropertyAlias(property)).toBe(alias);
	},
);
