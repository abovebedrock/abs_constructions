//@ts-check
import { EntityComponentTypes, EntityEquippableComponent, EntityItemComponent, EquipmentSlot, ItemComponentTypes, ItemEnchantableComponent, PlayerBreakBlockBeforeEvent, system } from "@minecraft/server";
import { isModItem } from "../utils/namespace";
const wood = ["abs:acacia_slab", "abs:bamboo_mosaic_slab", "abs:bamboo_slab", "abs:birch_slab", "abs:cherry_slab", "abs:crimson_slab", "abs:dark_oak_slab", "abs:jungle_slab", "abs:mangrove_slab", "abs:oak_slab", "abs:spruce_slab", "abs:warped_slab"];
/**@param {PlayerBreakBlockBeforeEvent} data*/
export default function breakBlock(data){
    const id = data.block.typeId;
    if(isModItem(id) && wood.indexOf(id) == -1){
        const equipment = /**@type {EntityEquippableComponent | undefined}*/ (data.player.getComponent(EntityComponentTypes.Equippable));
        if(equipment){
            const item = equipment.getEquipmentSlot(EquipmentSlot.Mainhand).getItem();
            if(item){
                const enchant = /**@type {ItemEnchantableComponent | undefined}*/ (item.getComponent(ItemComponentTypes.Enchantable));
                if(enchant){
                    const enchantments = enchant.getEnchantments();
                    for(let i = 0; i < enchantments.length; i++)if(enchantments[i].type.id == "silk_touch"){
                        const {location, dimension, typeId, isWaterlogged} = data.block;
                        system.run(()=>{
                            const entities = dimension.getEntities({
                                type: "minecraft:item",
                                location,
                                maxDistance: 2
                            });
                            for(let i = 0; i < entities.length; i++){
                                const component = /**@type {EntityItemComponent}*/ (entities[i].getComponent("item"));
                                if(component.itemStack.typeId == typeId){
                                    entities[i].remove();
                                    return;
                                }
                            }
                        });
                    }
                }
            }
        }
    }
}