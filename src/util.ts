import { Link } from "./Passage";

// regex for finding [[links]] in a string
// [[alias|passageName]] - group 1 is alias or passageName if there is no alias, group 2 is passageName if there's an alias
const linkRegex = new RegExp(/\[\[([^|\]]+)\|?([^\]]*)\]\]/, "g");

// Having a link alias set to one of these will cause that to be considered a "directional" link
const directionals = ["north", "south", "east", "west"];

// replace [[link]]s with <a data-passage-name="link">link</a>
export const convertLinks = (content: string) => {
	return content.replace(linkRegex, (m, group1, group2) => {
		const passageName = group2 || group1;
		const alias = group2 ? group1 : passageName;
		const link = document.createElement("a");
		link.innerHTML = alias;
		link.dataset.passageName = passageName;
		return link.outerHTML;
	});
};

// Returns all link data as JSON, and removes links from the passage
export const extractLinks = (content: string) => {
	const links: Link[] = [];
	const directionalLinks: Link[] = [];
	const contentWithoutLinks = content.replace(
		linkRegex,
		(m, group1, group2) => {
			const passageName = group2 || group1;
			const alias = group2 ? group1 : passageName;
			const link: Link = {
				passageName,
				alias,
			};

			if (directionals.includes(alias.toLowerCase())) {
				directionalLinks.push(link);
			} else {
				links.push(link);
			}

			// delete the link
			return "";
		}
	);

	return {
		links,
		directionalLinks,
		content: contentWithoutLinks,
	};
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
