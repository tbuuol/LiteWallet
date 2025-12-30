function getMeta() {
    return JSON.parse(localStorage.getItem("Meta"))
}

function setMeta(meta) {
    localStorage.setItem("Meta", JSON.stringify(meta))
}