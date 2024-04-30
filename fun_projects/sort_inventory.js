Player.openInventory().openGui();
Client.waitTick(10);
var inv = Player.openInventory();

var slots = inv.findItem("minecraft:dirt");
// inv.click(slots[0]);
// Chat.log(inv.getHeld());



if (inv.contains("minecraft:dirt")) {
    var slots = inv.findItem("minecraft:dirt");
    if (slots.length > slots.filter((slot) => inv.getSlot(slot).getCount() == 64).length + 1) {
        Chat.log("Can be combined");
    } else {
        Chat.log("Full Stacks");
    }
} else {
    Chat.log("No dirt!");
}