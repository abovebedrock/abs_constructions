import { EquipmentSlot, GameMode, ItemStack, ItemUseOnBeforeEvent, MinecraftDimensionTypes, system } from "@minecraft/server";
import { isModItem } from "../utils/namespace";
import { isHalfBlock } from "../utils/slab";
import { isStairs } from "../utils/stairs";

/**@param {ItemUseOnBeforeEvent} data*/
export default async function placeWater(data){
    if(
        data.source.getGameMode() !== GameMode.adventure
     && data.itemStack.typeId === "minecraft:water_bucket"
     && isModItem(data.block.typeId)
     && (isHalfBlock(data.block.typeId) || isStairs(data.block.typeId))){
        data.cancel = true;
        const
        player = data.source,
        mode = player.getGameMode(),
        block = data.block;
        //只在生存模式下清空桶
        if(mode === GameMode.survival){
            const equipment = player.getComponent("minecraft:equippable");
            if(equipment) system.run(()=>equipment.getEquipmentSlot(EquipmentSlot.Mainhand).setItem(new ItemStack("minecraft:bucket", 1)));
        }
        system.run(()=>{
            if(data.block.dimension.id === MinecraftDimensionTypes.nether){
                data.block.dimension.playSound("random.fizz", block.location, {
                    volume: 0.5,
                    pitch: 2
                });
                data.block.dimension.spawnParticle("minecraft:water_evaporation_bucket_emitter", block.location);
            }
            else{
                block.setWaterlogged(true);
                data.block.dimension.playSound("bucket.empty_water", block.location);
            }
        });
    }
}