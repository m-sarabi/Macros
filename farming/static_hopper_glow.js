var minecarts;
var statics = [];
var potentials = [];
while (true) {
    minecarts = World.getEntities("hopper_minecart");
    statics.forEach((cart) => {
        if (cart.getSpeed() == 0.0) {
            cart.setGlowing(true);
        }
    });
    statics = [];
    potentials.forEach((cart) => {
        if (cart.getSpeed() == 0.0) {
            statics.push(cart);
        }
    });
    potentials = [];
    minecarts.forEach((cart) => {
        if (cart.getSpeed() == 0.0) {
            potentials.push(cart);
        } else {
            cart.setGlowing(false);
        }
    });
    Client.waitTick(20);
}