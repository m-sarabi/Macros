const player = Player.getPlayer();
const RegistryHelper = Java.type("xyz.wagyourtail.jsmacros.client.api.classes.RegistryHelper");
const items_raw = new RegistryHelper().getItems();
const items = [];

for (let item of items_raw) {
    items.push([item.getId().split(":")[1], item.getName().toLowerCase()]);
}


function smooth_look(x, y, z, speed = 2) {
    const player_pos = player.getEyePos();
    let yaw = -Math.atan2(x + 0.5 - player_pos.x, z + 0.5 - player_pos.z) * 180 / Math.PI;
    const pitch = -Math.atan2(y + 0.5 - player_pos.y,
        Math.sqrt((x + 0.5 - player_pos.x) ** 2 + (z + 0.5 - player_pos.z) ** 2)) * 180 / Math.PI;

    let old_yaw = Player.getPlayer().getYaw();
    const old_pitch = Player.getPlayer().getPitch();

    let mid_yaw;
    let mid_pitch;

    if (yaw < old_yaw) yaw += 360;
    if (yaw - old_yaw > 180) old_yaw += 360;

    const dominant = (Math.max(Math.abs(old_yaw - yaw), Math.abs(old_pitch - pitch)));
    const steps = Math.floor(dominant / speed);

    for (var i = 0; i < steps; i++) {
        mid_yaw = old_yaw + (yaw - old_yaw) / steps * (i + 1);
        mid_pitch = old_pitch + (pitch - old_pitch) / steps * (i + 1);
        player.lookAt(mid_yaw, mid_pitch);
        Time.sleep(10);
    }
}

/**
 * return an array of x, y, z from a Pos3D object
 * @param {Pos3D} pos 
 */
function pos3d_to_array(pos) {
    return [pos.x, pos.y, pos.z];
}

/**
 * 
 * @param {string} name 
 * @returns {Pos3D[]} a list of all signs that have the name
 */
function find_sign(name) {
    const scanner = World.getWorldScanner().withStringBlockFilter().contains("wall_sign").build();
    const signs = scanner.scanAroundPlayer(3);
    /** @type {Pos3D[]} */
    const matches = [];

    for (const sign of signs) {
        let linesNBT = World.getBlock(sign).getNBT().resolve("front_text.messages").at(0).asListHelper();
        for (let i = 0; i < linesNBT.length(); i++) {
            let line = linesNBT.get(i).asString().replaceAll("\"", "").toLowerCase();
            if (line.includes(name.toLowerCase())) {
                matches.push(sign);
            }
        }
    }

    return matches;
}

/**
 * Finds storage locations for items based on wall signs found within a 3 chunk radius of the player.
 *
 * @return {Record<String, Pos3D>} A record of item IDs as keys and arrays of Pos3D objects as values,
 * representing the storage locations for each item.
 */
function find_items_storage() {
    const scanner = World.getWorldScanner().withStringBlockFilter().contains("wall_sign").build();
    const signs = scanner.scanAroundPlayer(3);
    /** @type {Record<String,Pos3D>} */
    const storages = {};

    for (const sign of signs) {
        let linesNBT = World.getBlock(sign).getNBT().resolve("front_text.messages").at(0).asListHelper();
        for (let i = 0; i < linesNBT.length(); i++) {
            let line = linesNBT.get(i).asString().replaceAll("\"", "").toLowerCase();
            let item_id;
            if (items.some(e => {
                if (e.includes(line)) {
                    item_id = e[0];
                    return true;
                }
                return false;
            })) {
                if (Object.hasOwn(storages, item_id)) {
                    storages[item_id].push(sign_to_chest(sign));
                } else {
                    storages[item_id] = [sign_to_chest(sign)];
                }
            }
        }
    }
    return storages;
}

/**
 * simply walk to coords provided by pos in a straight line
 * returns true if walked
 * @param {Pos3D} pos 
 */
function move_to(pos) {
    if (player.distanceTo(pos) > 4) {
        const input = Player.createPlayerInput(1, 0, player.getYaw(), player.getPitch(), false, false, false);
        while (player.distanceTo(pos) > 3) {
            Player.clearInputs();
            Player.addInput(input);
            Client.waitTick();
        }
        return true;
    }
    return false;
}

function get_items_list() {
    signs = find_sign;
}

/**
 * 
 * @param {Pos3D} chest
 */
function open_chest(chest) {
    Chat.log(chest);
    smooth_look(...pos3d_to_array(chest));
    Client.waitTick();
    if (move_to(chest)) smooth_look(...pos3d_to_array(chest));

    smooth_look(...pos3d_to_array(chest));
    Player.getInteractionManager().interactBlock(chest.x, chest.y, chest.z, "south", false);
}

/**
* 
* @param {Pos3D} sign
* @returns {Pos3D} position of the chest that sign is attached to
*/
function sign_to_chest(sign) {
    const face_map = {
        "north": [0, 0, 1],
        "south": [0, 0, -1],
        "west": [1, 0, 0],
        "east": [-1, 0, 0]
    };
    return sign.add(...face_map[World.getBlock(sign).getBlockState().get("facing")]);
}

function sort() {
    const sort_chests = find_sign("sort").map(sign_to_chest);
    const item_chests = find_items_storage();
    for (const sort_chest of sort_chests) {
        open_chest(sort_chest);
        Client.waitTick(5);
        let inv = Player.openInventory();
        Client.waitTick(5);
        let items = new Set();
        // Chat.log(inv.getMap());

        for (const i of inv.getMap().container) {
            if (inv.findFreeSlot("hotbar") < 0 && inv.findFreeSlot("main") < 0) {
                Chat.log("inv is full");
                break;
            }
            const item_id = inv.getSlot(i).getItemId().split(":")[1];
            if (Object.keys(item_chests).includes(item_id) && !items.has(item_id)) {
                items.add(item_id);
                inv.quickAll(i);
                Client.waitTick();
            }
        }
        let new_items = new Set();
        for (let item of items) {
            new_items.add([item, inv.findItem(item)]);
        }
        Client.waitTick(5);
        inv.closeAndDrop();
        for (let item of new_items) {
            open_chest(item_chests[item[0]][0]);
            Client.waitTick(5);
            let inv = Player.openInventory();
            Client.waitTick(5);
            if (inv.findFreeSlot("container") < 0) {
                item_chests[item[0]].shift();
                if (item_chests[item[0]].length == 0) delete item_chests[item];
                Client.waitTick(5);
                inv.closeAndDrop();
                Client.waitTick(5);
                break;
            }
            inv.quickAll(inv.findItem("minecraft:" + item[0]).at(0));
            Client.waitTick(5);
            inv.closeAndDrop();
            Client.waitTick(5);
        }
    }
}
sort();