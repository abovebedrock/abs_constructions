//@ts-check
import { Block, EntityComponentTypes, EntityEquippableComponent, EntityItemComponent, EquipmentSlot, ItemComponentTypes, ItemDurabilityComponent, ItemStack, Player, system, world } from "@minecraft/server";
import durability from "../utils/durability";

export default function breakBlockInit(){}

/**对不符合挖掘层次的工具执行删除掉落物。
 * @param {Player} player
 * @param {Block} block
 * @param {string} originId
 * @param {string[]} lowTiers
 */
function deleteLowTierDrop(player, block, originId, lowTiers){
    const item = /**@type {EntityEquippableComponent | undefined}*/ (player.getComponent(EntityComponentTypes.Equippable))?.getEquipmentSlot(EquipmentSlot.Mainhand)?.getItem();
    if(!item || !lowTiers.includes(item.typeId)){
        const {location, dimension} = block;
        system.run(()=>{
            const entities = dimension.getEntities({
                type: "minecraft:item",
                location,
                maxDistance: 2
            });
            for(let i = 0; i < entities.length; i++){
                const component = /**@type {EntityItemComponent}*/ (entities[i].getComponent("item"));
                if(component.itemStack.typeId === originId){
                    if(component.itemStack.amount > 1) component.itemStack.amount--;
                    else entities[i].remove();
                    return;
                }
            }
        });
    }
}

world.beforeEvents.worldInitialize.subscribe(data=>{
    data.blockComponentRegistry.registerCustomComponent("abs:none_tier", {
        onPlayerDestroy: data=>{
            if(data.player) durability(data.player);
        }
    });
    data.blockComponentRegistry.registerCustomComponent("abs:wooden_tier", {
        onPlayerDestroy: data=>{
            if(data.player){
                deleteLowTierDrop(data.player, data.block, data.destroyedBlockPermutation.type.id, [
                    "wooden_pickaxe",
                    "stone_pickaxe",
                    "iron_pickaxe",
                    "golden_pickaxe",
                    "diamond_pickaxe",
                    "netherite_pickaxe"
                ].map(value=>`minecraft:${value}`));
                durability(data.player);
            }
        }
    });
    data.blockComponentRegistry.registerCustomComponent("abs:stone_tier", {
        onPlayerDestroy: data=>{
            if(data.player){
                deleteLowTierDrop(data.player, data.block, data.destroyedBlockPermutation.type.id, [
                    "stone_pickaxe",
                    "iron_pickaxe",
                    "diamond_pickaxe",
                    "netherite_pickaxe"
                ].map(value=>`minecraft:${value}`));
                durability(data.player);
            }
        }
    });
});