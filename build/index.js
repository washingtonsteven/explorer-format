// Part 1, parse <tw-storydata> node
// Part 2, use that data to display stuff in the #passage node
// Part 3, other fun stuff!
const $882b6d93070905b3$var$buildStoryData = ()=>{
    // Get Story data from root node
    const rootStoryDataNode = document.querySelector("tw-storydata");
    if (!rootStoryDataNode) throw new Error("Story Data is missing! Oops!");
    const name = rootStoryDataNode.getAttribute("name");
    const ifid = rootStoryDataNode.getAttribute("ifid");
    const startnode = rootStoryDataNode.getAttribute("startnode");
    if (!name) throw new Error("Story is missing a name!");
    if (!ifid) throw new Error(`Story is missing an ifid!`);
    if (!startnode) throw new Error(`No startnode specified!`);
    const format = rootStoryDataNode.getAttribute("format");
    const formatVersion = rootStoryDataNode.getAttribute("format-version");
    const zoom = rootStoryDataNode.getAttribute("zoom");
    const creator = rootStoryDataNode.getAttribute("creator");
    const creatorVersion = rootStoryDataNode.getAttribute("creator-version");
    // Get Passages Data
    const passages = [];
    const passageNodes = document.querySelectorAll("tw-passagedata");
    Array.from(passageNodes).forEach((node)=>{
        const pid = node.getAttribute("pid");
        const name = node.getAttribute("name");
        if (!pid) throw new Error(`A passage (name: ${name}) is missing a pid!`);
        if (!name) throw new Error(`A passage with pid ${pid} is missing a name!`);
        const tagsRaw = node.getAttribute("name");
        const positionRaw = node.getAttribute("name");
        const sizeRaw = node.getAttribute("name");
        const content = node.innerHTML;
        const tags = tagsRaw?.split(" ");
        const position = {
            x: 0,
            y: 0
        };
        if (positionRaw) {
            const positionCoords = positionRaw.split(",").map((n)=>parseFloat(n));
            position.x = positionCoords[0];
            position.y = positionCoords[1];
        }
        const size = {
            width: 100,
            height: 100
        };
        if (sizeRaw) {
            const dims = sizeRaw.split(",").map((n)=>parseFloat(n));
            size.width = dims[0];
            size.height = dims[1];
        }
        passages.push({
            pid: pid,
            name: name,
            tags: tags,
            position: position,
            size: size,
            content: content
        });
    });
    return {
        name: name,
        ifid: ifid,
        format: format,
        formatVersion: formatVersion,
        startnode: startnode,
        zoom: zoom,
        creator: creator,
        creatorVersion: creatorVersion,
        passages: passages,
        currentPassage: startnode
    };
};
const $882b6d93070905b3$var$getPassageByPid = (pid, passages)=>{
    return passages.find((passage)=>{
        return passage.pid === pid;
    });
};
const $882b6d93070905b3$var$displayPassage = ({ currentPassage: currentPassagePid , passages: passages  }, node)=>{
    if (!currentPassagePid) throw new Error(`Tried to display a passage without supplying a pid!`);
    const passage = $882b6d93070905b3$var$getPassageByPid(currentPassagePid, passages);
    if (!passage) throw new Error(`Tried to display passage with pid: ${currentPassagePid}, but it doesn't exist!`);
    node.innerHTML = passage.content;
};
(()=>{
    const storyData = $882b6d93070905b3$var$buildStoryData();
    const storyContainer = document.querySelector("#tw-story");
    if (!storyContainer) throw new Error(`Missing story container #tw-story!`);
    const passageContainer = storyContainer.querySelector("#tw-story #tw-passage");
    if (!passageContainer) throw new Error(`Missing passage container #tw-passage`);
    $882b6d93070905b3$var$displayPassage(storyData, passageContainer);
})();


//# sourceMappingURL=index.js.map
