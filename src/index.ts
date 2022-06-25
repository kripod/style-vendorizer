const enum CSSPrefixFlags {
	"-webkit-" = 1 << 0,
	"-moz-" = 1 << 1,
	"-ms-" = 1 << 2,
}

const cssPropertyAliases = new Map([
	["align-self", "-ms-grid-row-align"],
	["color-adjust", "-webkit-print-color-adjust"],
	["column-gap", "grid-column-gap"],
	["forced-color-adjust", "-ms-high-contrast-adjust"],
	["gap", "grid-gap"],
	["grid-template-columns", "-ms-grid-columns"],
	["grid-template-rows", "-ms-grid-rows"],
	["justify-self", "-ms-grid-column-align"],
	["margin-inline-end", "-webkit-margin-end"],
	["margin-inline-start", "-webkit-margin-start"],
	["mask-border", "-webkit-mask-box-image"],
	["mask-border-outset", "-webkit-mask-box-image-outset"],
	["mask-border-slice", "-webkit-mask-box-image-slice"],
	["mask-border-source", "-webkit-mask-box-image-source"],
	["mask-border-repeat", "-webkit-mask-box-image-repeat"],
	["mask-border-width", "-webkit-mask-box-image-width"],
	["overflow-wrap", "word-wrap"],
	["padding-inline-end", "-webkit-padding-end"],
	["padding-inline-start", "-webkit-padding-start"],
	["print-color-adjust", "color-adjust"],
	["row-gap", "grid-row-gap"],
	["scroll-margin-bottom", "scroll-snap-margin-bottom"],
	["scroll-margin-left", "scroll-snap-margin-left"],
	["scroll-margin-right", "scroll-snap-margin-right"],
	["scroll-margin-top", "scroll-snap-margin-top"],
	["scroll-margin", "scroll-snap-margin"],
	["text-combine-upright", "-ms-text-combine-horizontal"],
]);

export function cssPropertyAlias(property: string): string | undefined {
	return cssPropertyAliases.get(property);
}

export function cssPropertyPrefixFlags(property: string): number {
	const matches =
		/^(?:(text-(?:decoration$|e|or|si)|back(?:ground-cl|d|f)|box-d|mask(?:$|-[ispro]|-cl)|pr|hyphena|flex-d)|(tab-|column(?!-s)|text-align-l)|(ap)|u|hy)/i.exec(
			property,
		);

	if (!matches) return 0;

	if (matches[1]) return CSSPrefixFlags["-webkit-"];
	if (matches[2]) return CSSPrefixFlags["-moz-"];
	if (matches[3]) return CSSPrefixFlags["-moz-"] | CSSPrefixFlags["-webkit-"];
	else return CSSPrefixFlags["-ms-"] | CSSPrefixFlags["-webkit-"];
}

export function cssValuePrefixFlags(property: string, value: string): number {
	const matches =
		/^(?:(pos)|(cli)|(background-i)|(flex(?:$|-b)|(?:max-|min-)?(?:block-s|inl|he|widt))|dis)/i.exec(
			property,
		);

	if (!matches) return 0;

	if (matches[1]) {
		// position: "sticky"
		return /^sti/i.test(value) ? CSSPrefixFlags["-webkit-"] : 0;
	} else if (matches[2]) {
		// clip-path: "path(…)"
		return /^pat/i.test(value) ? CSSPrefixFlags["-webkit-"] : 0;
	} else if (matches[3]) {
		// background-image: "image-set(…)"
		return /^image-/i.test(value) ? CSSPrefixFlags["-webkit-"] : 0;
	} else if (matches[4]) {
		// flex(-basis)?|(max-|min-)?(width|inline-size|height|block-size): "min-content" | "max-content" | "fit-content"
		return value[3] === "-" ? CSSPrefixFlags["-moz-"] : 0;
	} else {
		// display: "grid" | "inline-grid"
		return /^(?:inline-)?grid$/i.test(value) ? CSSPrefixFlags["-ms-"] : 0;
	}
}
