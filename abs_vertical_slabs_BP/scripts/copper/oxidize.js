//@ts-check
import { world, ScriptEventCommandMessageAfterEvent } from "@minecraft/server";
import { getStage, hasOxidation, setStage } from "./copperUtils";
import { decide } from "../utils/random";
/**@param {ScriptEventCommandMessageAfterEvent} data*/
export default function oxidize(data){
    //这里不需要检查方块是否满足氧化条件，因为脚本事件肯定是由满足条件的方块触发的
    if(data.id == "abs:oxidize" && data.sourceBlock){
        const stage = getStage(data.sourceBlock.typeId);
        let categoryCount = 0, moreStageCount = 0;
        //周围曼哈顿距离小于等于4
        for(let x = -4; x <= 4; x++) for(let y = -4; y <= 4; y++) for(let z = -4; z <= 4; z++){
            if(x == 0 && y == 0 && z == 0) continue;
            else if(Math.abs(x) + Math.abs(y) + Math.abs(z) <= 4){
                const blockToCheck = data.sourceBlock.offset({x, y, z});
                //可能超出世界范围，需要先检查方块是否存在
                if(blockToCheck && hasOxidation(blockToCheck.typeId)){
                    categoryCount++;
                    const stageToCheck = getStage(blockToCheck.typeId);
                    //若周围其他*未涂蜡*铜质方块的氧化程度更低，则该铜质方块不会进一步氧化
                    if(stageToCheck < stage) return;
                    else if(stageToCheck > stage) moreStageCount++;
                }
            }
        }
        const oxidationPossibility = (stage ? 1 : 0.75) * Math.pow(moreStageCount + 1, 2) / Math.pow(categoryCount + 1, 2);
        if(decide(oxidationPossibility)) setStage(data.sourceBlock, /**@type {import("./copperUtils").stageNumber}*/ (getStage(data.sourceBlock.typeId) + 1));
    }
}