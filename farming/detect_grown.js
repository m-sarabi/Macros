while (true) {
    if (Player.rayTraceBlock(3, false).getBlockState().age == 3) {
        break;
    }
    Client.waitTick(10);
}
World.playSound("minecraft:entity.ender_dragon.death", 100, 1.5);