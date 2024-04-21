// smoothly look at the new direction from the current one over a given period and steps
// needs improvements
function smooth_look(old_yaw, new_yaw, old_pitch, new_pitch, steps = 20, duration = 300) {
    var yaws = [];
    for (var i = 0; i < steps - 1; i++) {
        yaws.push((new_yaw - old_yaw) / steps * (i + 1) + old_yaw);
    }
    yaws.push(new_yaw);

    var pitches = [];
    for (var i = 0; i < steps - 1; i++) {
        pitches.push((new_pitch - old_pitch) / steps * (i + 1) + old_pitch);
    }
    pitches.push(new_pitch);

    for (var i = 0; i < yaws.length; i++) {
        Player.getPlayer().lookAt(yaws[i], pitches[i]);
        Time.sleep(duration / steps);
    };
}

// if that area is depleted of fish, look 90 degrees to the other side
var randomness = 6;
JsMacros.on("RecvMessage", false, JavaWrapper.methodToJava((event) => {
    var yaw = Player.getPlayer().getYaw();
    var pitch = Player.getPlayer().getPitch();
    var text = event.text.getString().toLowerCase();
    if (text.includes("you sense that")) {
        if (yaw >= -15 && yaw <= 15) {
            smooth_look(yaw, randomness * (Math.random() - 0.5) + 90, pitch, pitch);
        } else if (yaw >= 75 && yaw <= 105) {
            smooth_look(yaw, randomness * (Math.random() - 0.5), pitch, pitch);
        }
    }
}));

// catch and recast fishes while also rotating the head
JsMacros.on("Sound", false, JavaWrapper.methodToJava((event) => {
    if (event.sound == "minecraft:entity.fishing_bobber.splash") {
        Time.sleep(Math.floor(Math.random() * 150) + 150);
        KeyBind.keyBind("key.use", true);
        Time.sleep(Math.floor(Math.random() * 40) + 30);
        KeyBind.keyBind("key.use", false);

        // recast only if holding a fishing rod
        if ((Player.getPlayer().getMainHand().getItemId() == "minecraft:fishing_rod" ||
            Player.getPlayer().getOffHand().getItemId() == "minecraft:fishing_rod")) {
            Time.sleep(Math.floor(Math.random() * 200) + 300);
            smooth_look(Player.getPlayer().getYaw(),
                Math.random() * 130 - 20,
                Player.getPlayer().getPitch(),
                Math.random() * 14 + 12
            );
            Time.sleep(Math.floor(Math.random() * 450) + 700);

            KeyBind.keyBind("key.use", true);
            Time.sleep(Math.floor(Math.random() * 40) + 30);
            KeyBind.keyBind("key.use", false);
        }
    }
}));