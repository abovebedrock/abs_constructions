import { EntitySpawnAfterEvent, Entity, Block, MolangVariableMap } from "@minecraft/server";
import { setStage, hasOxidation, getStage, deoxidize } from "./copperUtils";
import { randomInt } from "../utils/random";
import { isModItem } from "../utils/namespace";

/**@param {EntitySpawnAfterEvent} data*/
export default function lightningDeoxidize(data){
    const bolt = data.entity, molang = new MolangVariableMap();
    molang.setVector3("variable.direction", {x: 0, y: 0.1, z: 0});
    if(bolt.typeId === "minecraft:lightning_bolt"){
        const info = deoxidationInfo(bolt);
        if(info.meetsCondition){
            if(info.type === "vanilla_within") return;
            else if(info.type === "mod_within") setStage(info.block, /**@type {import("./copperUtils").stageNumber}*/ (getStage(info.block.typeId) - 1));
            else{
                const isFromMod = info.type === "mod" || info.type === "mod_rod";
                if(isFromMod) setStage(info.block, 0);
                const operationCount = randomInt(3, 5);
                for(let i = 0; i < operationCount; i++){
                    const pathfindingCount = randomInt(1, 8);
                    let currentBlock = info.block;
                    for(let j = 0; j < pathfindingCount; j++){
                        /**@type {Block | null}*/
                        const newBlock = findNextLocation(currentBlock);
                        if(newBlock === null) continue;
                        else{
                            currentBlock = newBlock;
                            if(isFromMod || (!isFromMod && isModItem(currentBlock.typeId))){
                                deoxidize(currentBlock);
                                data.entity.dimension.spawnParticle("minecraft:electric_spark_particle", {
                                    x: currentBlock.location.x + Math.random(),
                                    y:currentBlock.location.y + 1.05,
                                    z: currentBlock.location.z + Math.random()
                                }, molang);
                            }
                        }
                    }
                }
            }
        }
    }
}

/**搜索下一除锈起始点。
 * @param {Block} block
 * @returns {Block | null}
*/
function findNextLocation(block){
    /**@type {import("@minecraft/server").Vector3[]}*/
    for(let i = 0; i < 10; i++){
        const searchBlock = block.offset({
            x: randomInt(-1, 1),
            y: randomInt(-1, 1),
            z: randomInt(-1, 1)
        });
        if(searchBlock && hasOxidation(searchBlock.typeId)) return searchBlock;
    }
    return null;
}

/**判断坐标是否触发除锈条件，触发何种条件，并返回除锈起始点坐标。
 * @param {Entity} entity 闪电。
 * @typedef {{
 *     meetsCondition :false;
 * } | {
 *     meetsCondition :true;
 *     block :Block;
 *     type :"vanilla" | "vanilla_within" | "vanilla_rod" | "mod" | "mod_within" | "mod_rod";
 * }} DeoxidationInfo
 * @returns {DeoxidationInfo}
 */
function deoxidationInfo(entity){
    const
        /**@type {import("@minecraft/server").Vector3}*/
        location = {
            x: Math.floor(entity.location.x),
            y: Math.floor(entity.location.y),
            z: Math.floor(entity.location.z)
        },
        block = entity.dimension.getBlock(location);
        /**@type {DeoxidationInfo}*/
        let result = {meetsCondition: false};
    if(block){
        //先检查是否击中避雷针。
        if(block.typeId === "minecraft:lightning_rod"){
            /**0朝下 1朝上 2朝北 3朝南 4朝西 5朝东，“依附”方块为反向
             * {0 | 1 | 2 | 3 | 4 | 5 | undefined}
             * @type {unknown}*/
            const direction =  (block.permutation.getState("facing_direction"));
            /**@type {Block | undefined}*/
            let blockAttached = undefined;
            switch(direction){
                case 0:
                    blockAttached = block.above(1);
                    break;
                case 1:
                    blockAttached = block.below(1);
                    break;
                case 2:
                    blockAttached = block.south(1);
                    break;
                case 3:
                    blockAttached = block.north(1);
                    break;
                case 4:
                    blockAttached = block.east(1);
                    break;
                case 5:
                    blockAttached = block.west(1);
                    break;
            }
            if(blockAttached && hasOxidation(blockAttached.typeId)) result = {
                meetsCondition: true,
                block: blockAttached,
                type: isModItem(blockAttached.typeId) ? "mod_rod" : "vanilla_rod"
            };
        }
        else{
            //如果击中方块不是避雷针，那么就可以直接检查下方方块，下方方块不能是避雷针
            const blockBelow = block.below(1);
            if(blockBelow && hasOxidation(blockBelow.typeId)) result = {
                meetsCondition: true,
                block: blockBelow,
                type: isModItem(blockBelow.typeId) ? "mod" : "vanilla"
            };
            //如果下方方块不满足条件，那么再检查击中的方块是否参与氧化机制，此时只会对其本身进行一次一个阶段的除锈。
            else if(hasOxidation(block.typeId)) result = {
                meetsCondition: true,
                block,
                type: isModItem(block.typeId) ? "mod_within" : "vanilla_within"
            };
        }
    }
    return result;
}