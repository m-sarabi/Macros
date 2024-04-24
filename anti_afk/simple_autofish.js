
// catch fish and recast the rod
JsMacros.on("Sound", false, JavaWrapper.methodToJava((event) => {
    if (event.sound == "minecraft:entity.fishing_bobber.splash" &&
        (Player.getPlayer().getMainHand().getItemId() == "minecraft:fishing_rod" ||
            Player.getPlayer().getOffHand().getItemId() == "minecraft:fishing_rod")) {
        Time.sleep(Math.floor(Math.random() * 150) + 150);
        Player.interactions().interact();

        // recast only if holding a fishing rod
        Time.sleep(Math.floor(Math.random() * 200) + 200);

        Player.interactions().interact();
    }
}));
