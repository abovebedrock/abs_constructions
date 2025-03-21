import { world } from "@minecraft/server";
import { getStage, hasOxidation, setStage } from "./copperUtils";
import { decide } from "../utils/random";

export default function oxidizeInit(){}

world.beforeEvents.worldInitialize.subscribe(init=>{
    init.blockComponentRegistry.registerCustomComponent("abs:oxidizable", {
        onRandomTick: data=>{
            //128 / 1875
            if(decide(0.06826666666666667)){
                const stage = getStage(data.block.typeId);
                let categoryCount = 0, moreStageCount = 0;
                //周围曼哈顿距离小于等于4
                for(let x = -4; x <= 4; x++) for(let y = -4; y <= 4; y++) for(let z = -4; z <= 4; z++){
                    if(x === 0 && y === 0 && z === 0) continue;
                    else if(Math.abs(x) + Math.abs(y) + Math.abs(z) <= 4){
                        const blockToCheck = data.block.offset({x, y, z});
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
                if(decide(oxidationPossibility)) setStage(data.block, /**@type {import("./copperUtils").stageNumber}*/ (getStage(data.block.typeId) + 1));
            }
        }
    });
});