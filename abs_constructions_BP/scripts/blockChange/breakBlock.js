//@ts-check
import { Block, Dimension, EntityComponentTypes, EntityEquippableComponent, EntityItemComponent, EquipmentSlot, ItemStack, Player, system, world } from "@minecraft/server";
import durability from "../utils/durability";
import { getHorizontalDoubleDrop, getVerticalDoubleDrop, isDoubleBlock, isVerticalDouble } from "../utils/double";

export default function breakBlockInit(){}

/**对不符合挖掘层次的工具执行删除掉落物。
 * @param {Player} player
 * @param {Block} block
 * @param {string} originId
 * @param {string[]} lowTiers
 */
function deleteLowTierDrop(player, block, originId, lowTiers){
    const item = player.getComponent(EntityComponentTypes.Equippable).getEquipmentSlot(EquipmentSlot.Mainhand).getItem();
    if(!item || !lowTiers.includes(item.typeId)) deleteDrop(originId, block.dimension, block.location);
}

/**对不符合挖掘层次的工具执行删除掉落物，并对精准采集双台阶进行处理。
 * @param {Player} player
 * @param {Block} block
 * @param {string} originId
 * @param {string[]} [lowTiers]
 */
async function processDouble(player, block, originId, lowTiers){
    const
        item = player.getComponent(EntityComponentTypes.Equippable).getEquipmentSlot(EquipmentSlot.Mainhand).getItem(),
        hitLowTier = lowTiers && (!item || !lowTiers.includes(item.typeId)),
        hitSilkTouch = item && item.getComponent("minecraft:enchantable")?.hasEnchantment("minecraft:silk_touch");
    if(hitLowTier){
        if(hitSilkTouch) deleteDrop(originId, block.dimension, block.location);
        else{
            const drops = isVerticalDouble(originId) ? getVerticalDoubleDrop(originId) : getHorizontalDoubleDrop(originId);
            deleteDrop(drops[0], block.dimension, block.location);
            deleteDrop(drops[1], block.dimension, block.location);
        }
    }
    else if(hitSilkTouch){
        const
            itemLocation = await deleteDrop(originId, block.dimension, block.location),
            drops = isVerticalDouble(originId) ? getVerticalDoubleDrop(originId) : getHorizontalDoubleDrop(originId);
        //world.sendMessage(`${drops[0]} ${drops[1]}`);
        if(itemLocation){
            if(drops[0] === drops[1]) block.dimension.spawnItem(new ItemStack(drops[0], 2), itemLocation);
            else{
                block.dimension.spawnItem(new ItemStack(drops[0], 1), itemLocation);
                block.dimension.spawnItem(new ItemStack(drops[1], 1), itemLocation);
            }
        }
    }
}

/**执行删除一个掉落物的操作。返回undefined就是没找到。
 * @param {string} typeId
 * @param {Dimension} dimension
 * @param {import("@minecraft/server").Vector3} location
 * @returns {Promise<import("@minecraft/server").Vector3 | undefined>}
 */
async function deleteDrop(typeId, dimension, location){
    return new Promise(resolve=>{
        system.run(()=>{
            const entities = dimension.getEntities({
                type: "minecraft:item",
                location,
                maxDistance: 2
            });
            let foundItem = false;
            for(let i = 0; i < entities.length; i++){
                const component = entities[i].getComponent("item");
                if(component.itemStack.typeId === typeId){
                    const
                        itemLocation = entities[i].location,
                        clone = entities[i].getComponent("minecraft:item").itemStack.clone();
                    entities[i].remove();
                    if(clone.amount > 1){
                        clone.amount--;
                        dimension.spawnItem(clone, itemLocation);
                    }
                    foundItem = true;
                    resolve(itemLocation);
                    return;
                }
            }
            if(!foundItem) resolve(undefined);
        });
    });
}

const
    woodenTier = [
        "wooden_pickaxe",
        "stone_pickaxe",
        "iron_pickaxe",
        "golden_pickaxe",
        "diamond_pickaxe",
        "netherite_pickaxe"
    ].map(value=>`minecraft:${value}`),
    stoneTier = [
        "stone_pickaxe",
        "iron_pickaxe",
        "diamond_pickaxe",
        "netherite_pickaxe"
    ].map(value=>`minecraft:${value}`);

world.beforeEvents.worldInitialize.subscribe(data=>{
    data.blockComponentRegistry.registerCustomComponent("abs:none_tier", {
        onPlayerDestroy: data=>{
            if(data.player){
                if(isDoubleBlock(data.destroyedBlockPermutation.type.id)) processDouble(data.player, data.block, data.destroyedBlockPermutation.type.id);
                //耐久机制需要放到最后，不然玩家手上东西坏了就没法判断能不能掉落了，下同
                durability(data.player);
            }
        }
    });
    data.blockComponentRegistry.registerCustomComponent("abs:wooden_tier", {
        onPlayerDestroy: data=>{
            if(data.player){
                if(isDoubleBlock(data.destroyedBlockPermutation.type.id)) processDouble(data.player, data.block, data.destroyedBlockPermutation.type.id, woodenTier);
                else deleteLowTierDrop(data.player, data.block, data.destroyedBlockPermutation.type.id, woodenTier);
                durability(data.player);
            }
        }
    });
    data.blockComponentRegistry.registerCustomComponent("abs:stone_tier", {
        onPlayerDestroy: data=>{
            if(data.player){
                if(isDoubleBlock(data.destroyedBlockPermutation.type.id)) processDouble(data.player, data.block, data.destroyedBlockPermutation.type.id, woodenTier);
                else deleteLowTierDrop(data.player, data.block, data.destroyedBlockPermutation.type.id, stoneTier);
                durability(data.player);
            }
        }
    });
    data.blockComponentRegistry.registerCustomComponent("abs:silk_touch", {
        onPlayerDestroy: async data=>{
            if(data.player){
                const
                    item = data.player.getComponent("equippable").getEquipmentSlot(EquipmentSlot.Mainhand).getItem(),
                    originId = data.destroyedBlockPermutation.type.id,
                    block = data.block;
                if(!item || !item.getComponent("minecraft:enchantable")?.hasEnchantment("minecraft:silk_touch")){
                    if(isDoubleBlock(originId)){
                        const drops = isVerticalDouble(originId) ? getVerticalDoubleDrop(originId) : getHorizontalDoubleDrop(originId);
                        deleteDrop(drops[0], block.dimension, block.location);
                        deleteDrop(drops[1], block.dimension, block.location);
                    }
                    else deleteDrop(originId, block.dimension, block.location);
                }
                else if(isDoubleBlock(originId)){
                    const
                        itemLocation = await deleteDrop(originId, block.dimension, block.location),
                        drops = isVerticalDouble(originId) ? getVerticalDoubleDrop(originId) : getHorizontalDoubleDrop(originId);
                    if(itemLocation){
                        if(drops[0] === drops[1]) block.dimension.spawnItem(new ItemStack(drops[0], 2), itemLocation);
                        else{
                            block.dimension.spawnItem(new ItemStack(drops[0], 1), itemLocation);
                            block.dimension.spawnItem(new ItemStack(drops[1], 1), itemLocation);
                        }
                    }
                }
                durability(data.player);
            }
        }
    });
});