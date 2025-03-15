import { Block, BlockPermutation } from "@minecraft/server";
import { getNamespace } from "../utils/namespace";

//#region 氧化阶段CRUD
export const stageNumberToString = ["", "exposed_", "weathered_", "oxidized_"];

/**获得方块目前的氧化程度。**important:目前这里不支持混合竖砖！到时候要改！**
 * @typedef {0 | 1 | 2 | 3} stageNumber
 * @param {string} typeId 方块 ID。
 * @returns {stageNumber} 氧化程度的可计算数字。
 */
export function getStage(typeId){
    if(typeId.includes("exposed")) return 1;
    else if(typeId.includes("weathered")) return 2;
    else if(typeId.includes("oxidized")) return 3;
    else return 0;
}
/**设置任何铜质方块的氧化阶段，支持原版和模组方块。
 * 
 * 会检查是否涂蜡。不用担心。
 * 
 * 操作失败会抛出错误。
 * @param {Block} block 目标方块。
 * @param {stageNumber} stageNumber 目标氧化阶段。
 * @returns {string} 最后方块的 ID。
 */
export function setStage(block, stageNumber){
    if(isInCopperCategory(block.typeId) && !isWaxed(block.typeId)){
        const
            oldStage = getStage(block.typeId),
            newID = oldStage === 0 ? block.typeId.replaceAll("cut_copper", `${stageNumberToString[stageNumber]}cut_copper`) : block.typeId.replaceAll(stageNumberToString[oldStage], stageNumberToString[stageNumber]),
            newPermutation = BlockPermutation.resolve(newID, block.permutation.getAllStates());
        block.setPermutation(newPermutation);
        return newID;
    }
    else throw new Error(`Got invalid block id: ${block.typeId}`);
}
//#endregion

//#region 基础属性获取
/**判断一个方块是否为（技术意义上的）铜质方块，排除铜矿石、粗铜块等方块。
 * 
 * **涂蜡的方块也会返回 `true`。**
 * @param {string} typeId 方块 ID。
 * @returns {boolean}
*/
export function isInCopperCategory(typeId){
    return typeId.includes("copper") && !typeId.includes("ore") && typeId !== "minecraft:raw_copper_block";
}

/**判断铜质方块是否涂蜡。
 * @param {string} typeId 方块 ID。
 * @returns {boolean}
 */
export function isWaxed(typeId){
    return typeId.includes("waxed");
}

/**获取铜质方块的类型的可拼接字符串，不包含命名空间 ID。
 * @param {string} typeId 
 * @returns {string}
 */
function getCopperType(typeId){
    return typeId.replace(getNamespace(typeId), "").replace(":", "").replaceAll("waxed_", "").replaceAll("exposed_", "").replaceAll("weathered_", "").replaceAll("oxidized_", "");
}
//#endregion

//#region 氧化机制细节判断
/**判断方块是否参与**脱**氧化机制，特别排除未锈蚀变种。
 * @param {string} typeId 方块 ID。
 * @returns {boolean}
 */
export function canDeoxidize(typeId){
    return isInCopperCategory(typeId) && !isWaxed(typeId) && getStage(typeId) !== 0;
}

/**试图给目标铜质方块去除一级氧化状态。如果目标为未氧化，则忽略。
 * @param {Block} block 目标铜质方块。
 * @returns {boolean} 是否成功去除了锈蚀。
*/
export function deoxidize(block){
    if(getStage(block.typeId) > 0){
        setStage(block, /**@type {import("./copperUtils").stageNumber}*/ (getStage(block.typeId) - 1));
        return true;
    }
    else return false;
}

/**判断方块是否参与**氧化**机制，特别排除彻底氧化变种。
 * @param {string} typeId 方块 ID。
 * @returns {boolean}
 */
export function canOxidize(typeId){
    return isInCopperCategory(typeId) && !isWaxed(typeId) && getStage(typeId) !== 3;
}

/**判断方块是否参与氧化或脱氧化机制，即是否可以转化。
 * @param {string} typeId 方块 ID。
 * @returns {boolean}
 */
export function hasOxidation(typeId){
    return isInCopperCategory(typeId) && !isWaxed(typeId);
}
//#endregion