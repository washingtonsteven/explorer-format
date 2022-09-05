export const parseLinks = (content: string) => {
	// [[alias|passageName]] - group 1 is alias or passageName if there is no alias, group 2 is passageName if there's an alias
	const linkRegex = new RegExp(/\[\[([^|\]]+)\|?([^\]]*)\]\]/, "g");

	return content.replace(linkRegex, (m, group1, group2) => {
		const passageName = group2 || group1;
		const alias = group2 ? group1 : passageName;
		const link = document.createElement("a");
		link.innerHTML = alias;
		link.dataset.passageName = passageName;
		return link.outerHTML;
	});
};

export const unescape = (content: string) => {
	const unescapeSequences = [
		["&amp;", "&"],
		["&lt;", "<"],
		["&gt;", ">"],
		["&quot;", '"'],
		["&#x27;", "'"],
		["&#x60;", "`"],
	];

	unescapeSequences.forEach(([rule, template]) => {
		content = content.replace(new RegExp(rule, "g"), template);
	});

	return content;
};

/**
 * Once we pass the content through marked, it will replace quotes in
 * mustache blocks (i.e. {{#set thing="value"}}{{/set}}) with `&quot;`
 * This will undo that.
 */
export const fixHandlebarsAttributeQuotes = (content: string) => {
	const handlebarsAttributeQuoteRegex = new RegExp(
		/\{\{.*(&quot;).*\}\}/,
		"g"
	);

	return content.replace(handlebarsAttributeQuoteRegex, (m) => {
		return m.replace(new RegExp("&quot;", "g"), '"');
	});
};
