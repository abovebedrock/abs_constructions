//@ts-check
import { isModItem } from "./namespace";

/**判断是否为组合方块，可能是水平或竖直组合！！！！！
 * @param {string} typeId
 * @returns {boolean}
 */
export function isDoubleBlock(typeId){
    return isModItem(typeId) && typeId.includes("double_");
}

/**判断是否为双竖砖。
 * @param {string} typeId
 * @returns {boolean}
 */
export function isVerticalDouble(typeId){
    return isModItem(typeId) && typeId.endsWith("double_slab");
}

/**判断是否为双台阶。
 * @param {string} typeId
 * @returns {boolean}
 */
export function isHorizontalDouble(typeId){
    return isModItem(typeId) && typeId.endsWith("double_hlab");
}

/**获得双竖砖的掉落物。
 * @param {string} typeId
 * @returns {[string, string]}
 */
export function getVerticalDoubleDrop(typeId){
    //@ts-ignore 绝对可以的，别担心
    return typeId.replace("_double_slab", "").replace("abs:", "").split("__").map(value=>`abs:${value}_slab`);
}

/**获得双台阶的掉落物。
 * @param {string} typeId
 * @returns {[string, string]}
 */
export function getHorizontalDoubleDrop(typeId){
    //@ts-ignore 绝对可以的，别担心
    return typeId.replace("_double_hlab", "").replace("abs:", "").split("__").map(value=>`abs:${value}_hlab`);
}

/**获得混合双竖砖的ID。
 * @param {string} typeId1
 * @param {string} typeId2
 */
export function combineVertical(typeId1, typeId2){
    const temp = [typeId1.replace("abs:", "").replace("_slab", ""), typeId2.replace("abs:", "").replace("_slab", "")];
    temp.sort();
    return `abs:${temp.join("__")}_double_slab`;
}

/**获得混合双台阶的ID。
 * @param {string} typeId1
 * @param {string} typeId2
 */
export function combineHorizontal(typeId1, typeId2){
    const temp = [typeId1.replace("abs:", "").replace("_hlab", ""), typeId2.replace("abs:", "").replace("_hlab", "")];
    temp.sort();
    return `abs:${temp.join("__")}_double_hlab`;
}

const
    woodSound = [
        "oak",
        "acacia",
        "spruce",
        "birch",
        "dark_oak",
        "jungle",
        "mangrove",
    ],
    bambooWoodSound = [
        "bamboo_mosaic",
        "bamboo",
    ],
    netherWoodSound = [
        "crimson",
        "warped",
    ],
    deepslateSound = [
        "cobbled_deepslate",
        "polished_deepslate",
    ],
    deepslateBrickSound = [
        "deepslate_brick",
        "deepslate_tile",
    ],
    copperSound = [
        "cut_copper",
        "exposed_cut_copper",
        "weathered_cut_copper",
        "oxidized_cut_copper",
        "waxed_cut_copper",
        "waxed_exposed_cut_copper",
        "waxed_weathered_cut_copper",
        "waxed_oxidized_cut_copper"
    ];

/**获得放置竖砖的声音ID。不支持原版，不支持双竖砖。
 * @param {string} typeId
 */
export function getPlaceSoundId(typeId){
    const extractedId = typeId.replace("abs:", "").replace("_slab", "");
    if(woodSound.includes(extractedId)) return "hit.wood";
    else if(bambooWoodSound.includes(extractedId)) return "hit.bamboo_wood";
    else if(netherWoodSound.includes(extractedId)) return "hit.nether_wood";
    else if(deepslateSound.includes(extractedId) || deepslateBrickSound.includes(extractedId)) return "hit.deepslate";
    else if(copperSound.includes(extractedId)) return "dig.copper";
    else if(extractedId === "cherry") return "hit.cherry_wood";
    else if(extractedId === "mud_brick") return "block.mud_bricks.hit";
    else if(extractedId === "tuff" || extractedId === "polished_tuff") return "step.tuff";
    else if(extractedId === "tuff_brick") return "step.tuff_bricks";
    else return "hit.stone";
}