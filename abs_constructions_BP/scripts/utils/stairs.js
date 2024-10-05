//@ts-check

import { isModItem } from "./namespace";

/**判断是否为楼梯。
 * @param {string} typeId
 * @returns {boolean}
 */
export function isStairs(typeId){
    return isModItem(typeId) && typeId.endsWith("_stairs");
}