JsMacros.on("Key", true, JavaWrapper.methodToJava((event) => {
    if (event.key === "key.mouse.left") {
        Chat.log("clicked");
        event.cancel();
    }
}));