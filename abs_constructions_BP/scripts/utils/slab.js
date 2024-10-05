//@ts-check
import { isDoubleBlock } from "./double";
import { isModItem } from "./namespace";

/**本来只需要`!isDoubleBlock`的，奈何有《另一种红色下界砖块》:)
 * @param {string} typeId
 * @returns {boolean}
 */
export function isHalfBlock(typeId){
    return isModItem(typeId) && (isVerticalSlab(typeId) || isHorizontalSlab(typeId));
}

/**判断是否为单个竖砖。
 * @param {string} typeId
 * @returns {boolean}
 */
export function isVerticalSlab(typeId){
    return isModItem(typeId) && !isDoubleBlock(typeId) && typeId.endsWith("_slab");
}

/**判断是否为单个台阶。
 * @param {string} typeId 
 * @returns {boolean}
 */
export function isHorizontalSlab(typeId){
    return isModItem(typeId) && !isDoubleBlock(typeId) && typeId.endsWith("_hlab");
}