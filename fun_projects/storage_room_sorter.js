const player = Player.getPlayer();
const RegistryHelper = Java.type("xyz.wagyourtail.jsmacros.client.api.classes.RegistryHelper");
const items_raw = new RegistryHelper().getItems();
const items = [];

for (let item of items_raw) {
    items.push([item.getId().split(":")[1], item.getName().toLowerCase()]);
}

// if script is running
if (GlobalVars.getBoolean("storage_sorter_running")) {
    // if script is enabled disable it and sho a message
    if (GlobalVars.getBoolean("storage_sorter_toggle")) {
        Chat.log(Chat.createTextBuilder().append("Storage Sorter ").withColor(255, 255, 255)
            .append("Disabled").withColor(192, 0, 0));
        GlobalVars.putBoolean("storage_sorter_toggle", false);
    }
} else {  // if script is not running, run it
    GlobalVars.putBoolean("storage_sorter_toggle", true);
    GlobalVars.putBoolean("storage_sorter_running", true);
    Chat.log(Chat.createTextBuilder().append("Storage Sorter ").withColor(255, 255, 255)
        .append("Enabled").withColor(0, 192, 0));
    sort();
}

/**
 * Check if storage sorter is disabled
 * @returns {boolean} true if storage sorter is disabled
 */
function stop() {
    return !GlobalVars.getBoolean("storage_sorter_toggle");
}

/**
 * Smoothly rotates the player's head to the specified coordinates.
 *
 * @param {number} x - The x-coordinate of the target position.
 * @param {number} y - The y
 * @param {number} z - The z
 * @param {number} [speed=2] - The speed at which the player's head rotates.
 */
function smooth_look(x, y, z, speed = 2) {
    const player_pos = player.getEyePos();

    // Calculate the yaw and pitch rotations
    let yaw = -Math.atan2(x + 0.5 - player_pos.x, z + 0.5 - player_pos.z) * 180 / Math.PI;
    const pitch = -Math.atan2(y + 0.5 - player_pos.y,
        Math.sqrt((x + 0.5 - player_pos.x) ** 2 + (z + 0.5 - player_pos.z) ** 2)) * 180 / Math.PI;

    // Player's current yaw and pitch
    let old_yaw = Player.getPlayer().getYaw();
    const old_pitch = Player.getPlayer().getPitch();

    let mid_yaw;
    let mid_pitch;

    // yaw and old_yaw correction
    if (yaw < old_yaw) yaw += 360;
    if (yaw - old_yaw > 180) old_yaw += 360;

    const dominant = (Math.max(Math.abs(old_yaw - yaw), Math.abs(old_pitch - pitch)));
    const steps = Math.floor(dominant / speed);  // number of steps needed

    // smoothly rotate the player with a small delay in between
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
 * @returns {number[]}
 */
function pos3d_to_array(pos) {
    return [pos.x, pos.y, pos.z];
}

/**
 * finds all signs in 3 chunk radius around the player that contains the given text
 * @param {string} text 
 * @returns {Pos3D[]} a list of all signs that have the text
 */
function find_sign(text) {
    // world scanner for wall signs and scanning 3 chunk radius around the player
    const scanner = World.getWorldScanner().withStringBlockFilter().contains("wall_sign").build();
    const signs = scanner.scanAroundPlayer(3);

    /** @type {Pos3D[]} */
    const matches = [];

    // loop through each signs found
    for (const sign of signs) {
        // get the front text of each sign
        let linesNBT = World.getBlock(sign).getNBT().resolve("front_text.messages").at(0).asListHelper();
        for (let i = 0; i < linesNBT.length(); i++) {
            let line = linesNBT.get(i).asString().replaceAll("\"", "").toLowerCase();
            // check if sign includes the given text
            if (line.includes(text.toLowerCase())) {
                matches.push(sign);
            }
        }
    }

    return matches;
}

/**
 * Finds storage locations for items based on wall signs found within a 3 chunk radius of the player.
 *
 * @return {Record<String, Pos3D[]>} A record of item IDs as keys and arrays of Pos3D objects as values,
 * representing the storage locations for each item.
 */
function find_items_storage() {
    // world scanner for wall signs and scanning 3 chunk radius around the player
    const scanner = World.getWorldScanner().withStringBlockFilter().contains("wall_sign").build();
    const signs = scanner.scanAroundPlayer(3);

    /** @type {Record<String,Pos3D>} */
    const storages = {};

    // loop through each signs found
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
 * @param {Pos3D} pos  the position to move to
 * @returns {boolean} true if player moved
 */
function move_to(pos) {
    // if player is close enough, no need to move
    if (player.distanceTo(pos) > 4) {
        // create a player input (forward, sideways, yaw, pitch, jump, sneak, sprint)
        const input = Player.createPlayerInput(1, 0, player.getYaw(), player.getPitch(), false, false, false);

        // move the player until close enough
        while (player.distanceTo(pos) > 3) {
            if (stop()) return;
            Player.clearInputs();
            Player.addInput(input);
            Client.waitTick();
        }
        return true;
    }
    return false;
}

/**
 * walk to and open the chest at given position
 * @param {Pos3D} chest the position of the chest
 */
function open_chest(chest) {
    if (stop()) return;

    // turn toward the chest an move to
    smooth_look(...pos3d_to_array(chest));
    Client.waitTick();
    if (move_to(chest)) smooth_look(...pos3d_to_array(chest));
    if (stop()) return;

    // interact with the chest
    Player.getInteractionManager().interactBlock(chest.x, chest.y, chest.z, player.getFacingDirection().getName(), false);
}

/**
* get the position of a chest that the given sign is attached to
* @param {Pos3D} sign position of the sign
* @returns {Pos3D} position of the chest that sign is attached to
*/
function sign_to_chest(sign) {
    const face_map = {
        "north": [0, 0, 1],  // facing: [dx, dy, dz]
        "south": [0, 0, -1],
        "west": [1, 0, 0],
        "east": [-1, 0, 0]
    };
    return sign.add(...face_map[World.getBlock(sign).getBlockState().get("facing")]);
}

/**
 * Finds the slot index of items that are in player's main/hotbar inventory
 * @param {CanOmitNamespace<ItemId>} item the item to search for
 * @returns {number[]} found item slots
 */
function find_item_in_player(item, inv) {
    Client.waitTick();
    const result = [];

    // add minecraft namespace to the item
    if (!item.startsWith("minecraft:")) {
        item = "minecraft:" + item;
    }

    // loop through the inventory
    const first_slot = inv.getMap().main.at(0);
    for (let i = first_slot; i < first_slot + 36; i++) {
        if (inv.getSlot(i).getItemId() == item) {
            result.push(i);
        }
    }
    return result;
}

/**
 * Check if inventory is empty of interesting items
 * @param {Inventory<*>} inv 
 * @param {Record<String, Pos3D[]>} item_chests 
 * @returns 
 */
function is_container_empty(inv, item_chests) {
    for (const i of inv.getMap().container) {
        if (Object.keys(item_chests).includes(inv.getSlot(i).getItemId().split(":")[1])) {
            return false;
        }
    }
    return true;
}

/**
 * Check if inventory has no empty slot
 * @param {Inventory<*>} inv 
 * @returns 
 */
function is_container_full(inv) {
    for (const i of inv.getMap().container) {
        if (inv.getSlot(i).getItemId() == "minecraft:air") {
            return false;
        }
    }
    return true;
}

/**
 * cleans up the item_chests by removing a position from it
 * @param {Pos3D} pos the storage location to be removed
 * @param {Record<string,Pos3D[]>} item_chests
 */
function clean_item_chests(pos, item_chests) {
    for (let item in item_chests) {
        if (item_chests[item].some((e) => [e.x, e.y, e.z].every((v, i) => v == [pos.x, pos.y, pos.z][i]))) {
            item_chests[item].splice(item_chests[item].indexOf(pos), 1);
        }
    }
    let keys = Object.keys(item_chests);
    for (let key of keys) {
        if (item_chests[key].length == 0) {
            delete item_chests[key];
        }
    }
    return item_chests;
}

function sort() {
    const sort_chests = find_sign("sort").map(sign_to_chest);
    let item_chests = find_items_storage();
    let inv;
    while (sort_chests.length > 0) {
        if (stop()) return;
        open_chest(sort_chests[0]);
        if (stop()) return;
        Client.waitTick(5);
        inv = Player.openInventory();
        Client.waitTick(5);
        let items = [];
        for (const slot of inv.getMap().container) {
            const item_id = inv.getSlot(slot).getItemId().split(":")[1];
            if (Object.keys(item_chests).includes(item_id)) {
                if (find_item_in_player("minecraft:air", inv).length == 0) {
                    break;
                }
                items.push(item_id);
                inv.quickAll(slot);
                Client.waitTick();
            }
        }
        if (items.length == 0 || is_container_empty(inv, item_chests)) {
            sort_chests.shift();
        }
        Client.waitTick(5);
        inv.closeAndDrop();
        Client.waitTick(5);

        while (items.length > 0) {
            if (stop()) return;

            if (!Object.hasOwn(item_chests, items[0])) {
                items.shift();
                continue;
            }
            const storage = item_chests[items[0]][0];
            open_chest(storage);
            Client.waitTick(5);
            let inv = Player.openInventory();
            Client.waitTick(5);
            if (is_container_full(inv)) {
                item_chests = clean_item_chests(storage, item_chests);
                if (!Object.hasOwn(item_chests, items[0])) {
                    items.shift();
                }
                Client.waitTick(5);
                inv.closeAndDrop();
                Client.waitTick(5);
                continue;
            }
            inv.quickAll(find_item_in_player(items[0], inv)[0]);
            if (find_item_in_player(items[0], inv).length == 0) {
                items.shift();
                Client.waitTick(5);
                inv.closeAndDrop();
                Client.waitTick(5);
                continue;
            }
            Client.waitTick();
            if (is_container_full(inv)) {
                item_chests[items[0]].shift();
                if (item_chests[items[0]].length == 0) {
                    delete item_chests[items[0]];
                    items.shift();
                }
            }
            Client.waitTick(5);
            inv.closeAndDrop();
            Client.waitTick(5);
        }
    }
}
GlobalVars.putBoolean("storage_sorter_running", false);
if (GlobalVars.getBoolean("storage_sorter_toggle")) {
    Chat.log(Chat.createTextBuilder().append("Storage Sorter ").withColor(255, 255, 255)
        .append("Finished").withColor(215, 188, 0));
    GlobalVars.putBoolean("storage_sorter_toggle", false);
}
