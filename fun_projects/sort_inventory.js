Player.openInventory().openGui();
Client.waitTick(10);
var inv = Player.openInventory();

var slots = inv.findItem("minecraft:dirt");
Chat.log(slots.filter((slot) => inv.getSlot(slot).getCount() == 64).length);

// Chat.log(inv.getSlot(9));
if (inv.contains("minecraft:dirt")) {
    while (true) {
        var slots = inv.findItem("minecraft:dirt");
    }
} else {
    Chat.log("No dirt!");
}