// storing the initial fps value
const fps = Client.getGameOptions().getVideoOptions().getMaxFps();
var focused = Client.getMinecraft().method_1569();  // MinecraftClient.isWindowFocused
while (true) {
    if (focused != Client.getMinecraft().method_1569()) {
        switch (focused) {
            case true:
                Client.getGameOptions().getVideoOptions().setMaxFps(10.0);
                focused = !focused;
                Chat.actionbar(Chat.createTextBuilder().append("Unfocused").withColor(0xc).build());
                break;
            case false:
                Client.getGameOptions().getVideoOptions().setMaxFps(fps);
                focused = !focused;
                Chat.actionbar(Chat.createTextBuilder().append("Focused").withColor(0x2).build());
                break;
        }
    }
    Client.waitTick(1);
}