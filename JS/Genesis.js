function Init() {
    //console.log(bitcoin, bip39)

    //localStorage.clear()

    let meta = getMeta()
    console.log(meta)

    if (meta == null) {
        Setup()
    } else {
        Login()
    }
}
Init()

function Setup() {
    const div = document.createElement("div")
    div.classList.add("Login")
    document.body.appendChild(div)

    const info = document.createElement("h1")
    info.innerText = "Setup Password"

    const input1 = document.createElement("input")
    input1.placeholder = "Password"
    input1.type = "password"
    const input2 = document.createElement("input")
    input2.placeholder = "repeat Password"
    input2.type = "password"

    const set_btn = document.createElement("button")
    set_btn.innerText = "Set Password"
    set_btn.onclick = async function() {
        if (input1.value == input2.value) {
            meta = {
                "Seeds": [],
                "Keys": [],
                "Salt": crypto.getRandomValues(new Uint8Array(16)),
                "IV": crypto.getRandomValues(new Uint8Array(12)),
                "Password": await SHA256(input1.value)
            }

            //console.log(meta)
            setMeta(meta)
            location.reload()
        }
        else alert("Passwords missmatch")
    }

    div.appendChild(info)
    div.appendChild(input1)
    div.appendChild(document.createElement("br"))
    div.appendChild(input2)
    div.appendChild(document.createElement("br"))
    div.appendChild(document.createElement("br"))
    div.appendChild(set_btn)
}

function Login() {
    const div = document.createElement("div")
    div.classList.add("Login")
    document.body.appendChild(div)

    const info = document.createElement("h1")
    info.innerText = "Login"

    const input = document.createElement("input")
    input.type = "password"
    input.placeholder = "password"

    const login_btn = document.createElement("button")
    login_btn.innerText = "Login"
    login_btn.onclick = async function() {
        const Meta = getMeta()
        const password = await SHA256(input.value)

        if (Meta.Password == password) {
            div.remove()
            GetLitecoin(input.value)
        } else alert("Password missmatch")
    }

    const reset_btn = document.createElement("button")
    reset_btn.innerText = "Reset Wallet"
    reset_btn.onclick = function() {
        localStorage.clear()
        location.reload()
    }

    div.appendChild(info)
    div.appendChild(input)
    div.appendChild(document.createElement("br"))
    div.appendChild(document.createElement("br"))
    div.appendChild(login_btn)
    div.appendChild(reset_btn)
}

function addSeed() {
    const div = document.createElement("div")
    div.classList.add("Login")
    document.body.appendChild(div)

    const info = document.createElement("h1")
    info.innerText = "Add Seed"

    const seed = document.createElement("textarea")
    seed.classList.add("Seed")
    seed.placeholder = "Enter your Seed here, or click \"Get Seed\""

    const password = document.createElement("input")
    password.placeholder = "password"
    password.type = "password"

    const validate_btn = document.createElement("button")
    validate_btn.innerText = "Continue"
    validate_btn.onclick = async function() {
        const Meta = getMeta()
        if (!bip39.validateMnemonic(seed.value)) {
            alert("Seed invalid!")
            throw "invalid Seed"
        }

        if (Meta.Password != await SHA256(password.value)) {
            alert("Password wrong")
            throw "wrong Password"
        }

        const entropy = hexToUint8Array(bip39.mnemonicToEntropy(seed.value))

        //console.log(entropy, password.value)

        saveEncryptedSeed(entropy, password.value)
        div.remove()
    }

    const getSeed_btn = document.createElement("button")
    getSeed_btn.innerText = "Get Seed"
    getSeed_btn.onclick = function() {
        const entropy = getEntrophy()
        //console.log(entropy)
        seed.value = bip39.entropyToMnemonic(entropy)
    }

    const cancel_btn = document.createElement("button")
    cancel_btn.innerText = "Cancel"
    cancel_btn.onclick = function() {
        div.remove()
    }

    div.appendChild(info)
    div.appendChild(seed)
    div.appendChild(document.createElement("br"))
    div.appendChild(password)
    div.appendChild(document.createElement("br"))
    div.appendChild(document.createElement("br"))
    div.appendChild(validate_btn)
    div.appendChild(getSeed_btn)
    div.appendChild(cancel_btn)
}

function addKey() {
    const div = document.createElement("div")
    div.classList.add("Login")
    document.body.appendChild(div)

    const info = document.createElement("h1")
    info.innerText = "Add private Key"

    const WIF = document.createElement("textarea")
    WIF.classList.add("Seed")
    WIF.placeholder = "Enter your Key here"

    const password = document.createElement("input")
    password.placeholder = "password"
    password.type = "password"

    const validate_btn = document.createElement("button")
    validate_btn.innerText = "Continue"
    validate_btn.onclick = async function() {
        const Meta = getMeta()

        if (Meta.Password != await SHA256(password.value)) {
            alert("Password wrong")
            throw "wrong Password"
        }

        const LTCpk = new LitecoinPK
        saveEncryptedKey(LTCpk.wifToUint8(WIF.value), password.value)

        div.remove()
    }

    const cancel_btn = document.createElement("button")
    cancel_btn.innerText = "Cancel"
    cancel_btn.onclick = function() {
        div.remove()
    }

    div.appendChild(info)
    div.appendChild(WIF)
    div.appendChild(document.createElement("br"))
    div.appendChild(password)
    div.appendChild(document.createElement("br"))
    div.appendChild(document.createElement("br"))
    div.appendChild(validate_btn)
    div.appendChild(cancel_btn)
}

async function GetLitecoin(password) {
    const Meta = getMeta()
    const LTC = new Litecoin
    const OMNI = new Omnilayer

    if (Meta.Seeds.length > 0) {
        const entrophy = await loadEncryptedSeed(password)
        const Addresses = LTC.AddressesFromSeeds(entrophy)
        const UTXO = new Array
        UTXO.Legacy = await LTC.UTXO(Addresses.Legacy)
        UTXO.Omni = await LTC.UTXO(Addresses.Omni)
        UTXO.SegWit = await LTC.UTXO(Addresses.SegWit)

        // Legacy
        const Legacy = document.getElementById("LTC_Legacy").children[1]
        Legacy.innerText = ""

        for (let a = 0; a < Addresses.Legacy.length; a++) {
            const option = document.createElement("option")
            let bal = 0

            for (let b = 0; b < UTXO.Legacy[a].length; b++) {
                bal += UTXO.Legacy[a][b].value
            }
            
            option.innerText = (bal / 100000000).toFixed(8) + " - " + Addresses.Legacy[a]
            option.value = bal

            Legacy.appendChild(option)
        }

        const addrIndexl = Legacy.selectedIndex

        const copyl_btn = document.getElementById("LTC_Legacy").children[2]
        copyl_btn.onclick = function() {
            navigator.clipboard.writeText(Legacy.options[addrIndexl].text.split(" - ")[1])
        }

        const sendl_btn = document.getElementById("LTC_Legacy").children[3].children[2]
        sendl_btn.onclick = function() {
            const origin = Legacy.options[addrIndexl].text.split(" - ")[1]
            const destiantion = document.getElementById("LTC_Legacy").children[3].children[0].value
            const amount = Math.round(document.getElementById("LTC_Legacy").children[3].children[1].value * 1e8)
            const TX = buildTX(LTC, origin, destiantion, amount, UTXO.Legacy, addrIndexl, 44)
            
            if (confirm("Send TX?")) LTC.submitTX(TX.toHex())
            GetLitecoin(password)
        }

        const sendAlll_btn = document.getElementById("LTC_Legacy").children[3].children[3]
        sendAlll_btn.onclick = function() {
            const destiantion = document.getElementById("LTC_Legacy").children[3].children[0].value
            const TX = buildTXall(LTC, destiantion, UTXO.Legacy, addrIndexl, 44)

            if (confirm("Send TX?")) LTC.submitTX(TX.toHex())
            GetLitecoin(password)
        }


        // Omni
        const Omni = document.getElementById("LTC_Omni").children[1]
        Omni.innerText = ""
        let addrIndexo

        Omni.onchange = async function() {
            addrIndexo = Omni.selectedIndex

            document.getElementById("LTC_Omni").children[4].innerHTML = ""
            const address = Omni.options[Omni.selectedIndex].text.split(" - ")[1]

            const r = await OMNI.getBalanceByAddress(address)

            for (let a = 0; a < r.length; a++) {
                //const property = await OMNI.getProperty(r[a].propertyid)
                //console.log(property)
                const entry = document.createElement("p")
                entry.innerText = r[a].propertyid + " - " + r[a].name + " - " + r[a].balance + "/" + r[a].reserved + "/" + r[a].frozen

                document.getElementById("LTC_Omni").children[4].appendChild(entry)
            }
        }

        for (let a = 0; a < Addresses.Omni.length; a++) {
            const option = document.createElement("option")
            let bal = 0

            for (let b = 0; b < UTXO.Omni[a].length; b++) {
                bal += UTXO.Omni[a][b].value
            }

            option.innerText = (bal / 100000000).toFixed(8) + " - " + Addresses.Omni[a]
            option.value = bal

            Omni.appendChild(option)
        }
        Omni.onchange()


        const copyo_btn = document.getElementById("LTC_Omni").children[2]
        copyo_btn.onclick = function() {
            navigator.clipboard.writeText(Omni.options[addrIndexo].text.split(" - ")[1])
        }

        const sendo_btn = document.getElementById("LTC_Omni").children[3].children[2]
        sendo_btn.onclick = function() {
            const origin = Omni.options[addrIndexo].text.split(" - ")[1]
            const destiantion = document.getElementById("LTC_Omni").children[3].children[0].value
            const amount = Math.round(document.getElementById("LTC_Omni").children[3].children[1].value * 1e8)
            const TX = buildTX(LTC, origin, destiantion, amount, UTXO.Omni, addrIndexo, 49)
            
            if (confirm("Send TX?")) LTC.submitTX(TX.toHex())
            GetLitecoin(password)
        }

        const sendAllo_btn = document.getElementById("LTC_Omni").children[3].children[3]
        sendAllo_btn.onclick = function() {
            const destiantion = document.getElementById("LTC_Omni").children[3].children[0].value
            const TX = buildTXall(LTC, destiantion, UTXO.Omni, addrIndexo, 49)

            if (confirm("Send TX?")) LTC.submitTX(TX.toHex())
            GetLitecoin(password)
        }

        
    }

    if (Meta.Keys.length > 0) {
        const pkey = await loadEncryptedKey(password)
        const wif = new Array
        for (let a = 0; a < pkey.length; a++) {
            wif[a] = LTC.uint8ToWIF(pkey[a])
            
        }

        const Addresses = LTC.AddressesFromWIF(wif)
        
        const UTXO = new Array
        UTXO.Legacy = await LTC.UTXO(Addresses.Legacy)
        UTXO.Omni = await LTC.UTXO(Addresses.Omni)

        const Legacy = document.getElementById("LTC_PK").children[1].children[1]
        let addrIndexl
        Legacy.innerText = ""

        Legacy.onchange = function() {
            addrIndexl = Legacy.selectedIndex
        }

        const Omni = document.getElementById("LTC_PK").children[2].children[1]
        let addrIndexo

        Omni.innerText = ""
        Omni.onchange = async function() {
            addrIndexo = Omni.selectedIndex

            document.getElementById("LTC_PK").children[2].children[4].innerText = ""
            const address = Omni.options[Omni.selectedIndex].text.split(" - ")[1]
            const r = await OMNI.getBalanceByAddress(address)
            const NFT = await OMNI.getNFTs(address)
            console.log(r)
            console.log(NFT)
            for (let a = 0; a < r.length; a++) {
                const property = await OMNI.getProperty(r[a].propertyid)
                //console.log(property["non-fungibletoken"])

                const div = document.createElement("div")
                const entry = document.createElement("p")
                entry.innerText = r[a].propertyid + " - " + r[a].name + " - " + r[a].balance + "/" + r[a].reserved + "/" + r[a].frozen

                const amount = document.createElement("input")
                amount.type = "number"
                amount.placeholder = "amount"

                const desire = document.createElement("input")
                desire.type = "number"
                desire.placeholder = "DEX desire"

                const simplesend_btn = document.createElement("button")
                simplesend_btn.innerText = "send Token"
                simplesend_btn.onclick = async function() {
                    const payload = await OMNI.OPsimpleSend(r[a].propertyid, amount.value)
                    console.log(payload)

                    const origin = Omni.options[addrIndexo].text.split(" - ")[1]
                    const destiantion = document.getElementById("LTC_PK").children[2].children[3].children[0].value

                    const TX = buildTokenSend(LTC, origin, destiantion, payload, UTXO.Omni[addrIndexo], wif[addrIndexo])
                    if (confirm("Send TX?")) LTC.submitTX(TX.toHex())
                    GetLitecoin(password)
                }

                const DEXlist_btn = document.createElement("button")
                DEXlist_btn.innerText = "List Token on DEX"
                DEXlist_btn.onclick = async function() {
                    const payload = await OMNI.OPsetupDEX(r[a].propertyid, amount.value, desire.value, 1)
                    console.log(payload)

                    const origin = Omni.options[addrIndexo].text.split(" - ")[1]
                    //const destiantion = document.getElementById("LTC_PK").children[2].children[3].children[0].value

                    const TX = buildSelfTX(LTC, origin, payload, UTXO.Omni[addrIndexo], wif[addrIndexo])
                    console.log(TX.toHex())
                    if (confirm("Send TX?")) LTC.submitTX(TX.toHex())
                    GetLitecoin(password)
                }

                const DEXupdate_btn = document.createElement("button")
                DEXupdate_btn.innerText = "Update Listing"
                DEXupdate_btn.onclick = async function() {
                    const payload = await OMNI.OPsetupDEX(r[a].propertyid, amount.value, desire.value, 2)
                    console.log(payload)

                    const origin = Omni.options[addrIndexo].text.split(" - ")[1]
                    //const destiantion = document.getElementById("LTC_PK").children[2].children[3].children[0].value

                    const TX = buildSelfTX(LTC, origin, payload, UTXO.Omni[addrIndexo], wif[addrIndexo])
                    console.log(TX.toHex())
                    if (confirm("Send TX?")) LTC.submitTX(TX.toHex())
                    GetLitecoin(password)
                }

                const DEXcancel_btn = document.createElement("button")
                DEXcancel_btn.innerText = "Cancel Listing"
                DEXcancel_btn.onclick = async function() {
                    const payload = await OMNI.OPsetupDEX(r[a].propertyid, amount.value, desire.value, 3)
                    console.log(payload)

                    const origin = Omni.options[addrIndexo].text.split(" - ")[1]
                    //const destiantion = document.getElementById("LTC_PK").children[2].children[3].children[0].value

                    const TX = buildSelfTX(LTC, origin, payload, UTXO.Omni[addrIndexo], wif[addrIndexo])
                    console.log(TX.toHex())
                    if (confirm("Send TX?")) LTC.submitTX(TX.toHex())
                    GetLitecoin(password)
                }

                document.getElementById("LTC_PK").children[2].children[4].appendChild(div)
                div.appendChild(entry)
                div.appendChild(amount)
                if (!property["non-fungibletoken"]) {
                    div.appendChild(simplesend_btn)
                    div.appendChild(document.createElement("br"))
                    div.appendChild(desire)
                    div.appendChild(DEXlist_btn)
                    div.appendChild(DEXupdate_btn)
                    div.appendChild(DEXcancel_btn)

                    if (property.issuer == Omni.options[addrIndexo].text.split(" - ")[1] && property.managedissuance) {
                        console.log("eigene property + managed supply")
                        div.appendChild(document.createElement("br"))

                        const grant_revoke = document.createElement("input")
                        grant_revoke.type = "number"
                        grant_revoke.placeholder = "mint/burn"

                        const grant_btn = document.createElement("button")
                        grant_btn.innerText = "Mint Token"
                        grant_btn.onclick = async function() {
                            let amount = grant_revoke.value
                            if (property.divisible) amount = amount * 100000000
                            const payload = await OMNI.OPgrant(property.propertyid, amount)

                            const TX = buildSelfTX(LTC, address, payload, UTXO.Omni[addrIndexo], wif[addrIndexo])
                            console.log(TX.toHex())
                            if (confirm("Send TX?")) LTC.submitTX(TX.toHex())
                            GetLitecoin(password)
                        }

                        const revoke_btn = document.createElement("button")
                        revoke_btn.innerText = "Burn Token"
                        revoke_btn.onclick = async function() {
                            let amount = grant_revoke.value
                            if (property.divisible) amount = amount * 100000000
                            const payload = await OMNI.OPrevoke(property.propertyid, amount)

                            const TX = buildSelfTX(LTC, address, payload, UTXO.Omni[addrIndexo], wif[addrIndexo])
                            console.log(TX.toHex())
                            if (confirm("Send TX?")) LTC.submitTX(TX.toHex())
                            GetLitecoin(password)
                        }

                        div.appendChild(grant_revoke)
                        div.appendChild(grant_btn)
                        div.appendChild(revoke_btn)
                    } else {
                        console.log("fremde property oder fixed supply")
                    }
                } else {
                    for (let b = 0; b < NFT.length; b++) {
                        const range = NFT[b]
                        if (range.propertyid == property.propertyid) {
                            console.log(range.tokens)

                            for (let c = 0; c < range.tokens.length; c++) {
                                //const data = OMNI.getNFTdata(range.propertyid, c)
                                console.log(range.tokens[c].amount)
                                entry.innerText += " " + range.tokens[c].tokenstart + "/" + range.tokens[c].tokenend

                                for (let d = range.tokens[c].tokenstart; d <= range.tokens[c].tokenend; d++) {
                                    console.log(property.propertyid, d)
                                    const data = await OMNI.getNFTdata(property.propertyid, d)
                                    console.log(data)
                                    
                                }
                            }
                        }
                    }

                    const sendNFT_btn = document.createElement("button")
                    sendNFT_btn.innerText = "Send NFT"
                    sendNFT_btn.onclick = async function () {
                        const tokenid = amount.value
                        const payload = await OMNI.OPsendNFT(property.propertyid, tokenid)
                        const origin = Omni.options[addrIndexo].text.split(" - ")[1]
                        const destiantion = document.getElementById("LTC_PK").children[2].children[3].children[0].value

                        const TX = buildTokenSend(LTC, origin, destiantion, payload, UTXO.Omni[addrIndexo], wif[addrIndexo])
                        console.log(TX.toHex())

                        if (confirm("Send TX?")) LTC.submitTX(TX.toHex())
                        GetLitecoin(password)
                    }

                    amount.placeholder = "NFT ID"

                    div.appendChild(sendNFT_btn)
                }
            }
        }

        for (let a = 0; a < Addresses.Legacy.length; a++) {
            const l = document.createElement("option")
            const o = document.createElement("option")

            let ball = 0
            let balo = 0

            for (let b = 0; b < UTXO.Legacy[a].length; b++) {
                ball += UTXO.Legacy[a][b].value
            }

            for (let b = 0; b < UTXO.Omni[a].length; b++) {
                balo += UTXO.Omni[a][b].value
            }
            
            l.innerText = (ball / 100000000).toFixed(8) + " - " + Addresses.Legacy[a]
            o.innerText = (balo / 100000000).toFixed(8) + " - " + Addresses.Omni[a]

            Legacy.appendChild(l)
            Omni.appendChild(o)
        }

        Omni.onchange()

        const copyl_btn = document.getElementById("LTC_PK").children[1].children[2]
        copyl_btn.onclick = function() {
            navigator.clipboard.writeText(Legacy.options[Legacy.selectedIndex].text.split(" - ")[1])
        }

        const sendl_btn = document.getElementById("LTC_PK").children[2].children[3].children[2]
        sendl_btn.onclick = function() {
            console.log("send Legacy")
            const origin = Legacy.options[addrIndexl].text.split(" - ")[1]
            const destiantion = document.getElementById("LTC_PK").children[1].children[3].children[0].value
            const amount = Math.round(document.getElementById("LTC_PK").children[1].children[3].children[1].value * 1e8)
            const TX = buildTXPK(LTC, origin, destiantion, amount, UTXO.Legacy, addrIndexl, 44, wif[addrIndexl])
            
            if (confirm("Send TX?")) LTC.submitTX(TX.toHex())
            GetLitecoin(password)

        }

        const sendAlll_btn = document.getElementById("LTC_PK").children[1].children[3].children[3]
        sendAlll_btn.onclick = function() {
            const destiantion = document.getElementById("LTC_PK").children[1].children[3].children[0].value
            const TX = buildTXallPK(LTC, destiantion, UTXO.Legacy, addrIndexl, 44, wif[addrIndexl])

            if (confirm("Send TX?")) LTC.submitTX(TX.toHex())
            GetLitecoin(password)
        }

        const copyo_btn = document.getElementById("LTC_PK").children[2].children[2]
        copyo_btn.onclick = function() {
            navigator.clipboard.writeText(Omni.options[Omni.selectedIndex].text.split(" - ")[1])
        }

        const sendo_btn = document.getElementById("LTC_PK").children[2].children[3].children[2]
        sendo_btn.onclick = function() {
            console.log("send Omni")
            const origin = Omni.options[addrIndexo].text.split(" - ")[1]
            const destiantion = document.getElementById("LTC_PK").children[2].children[3].children[0].value
            const amount = Math.round(document.getElementById("LTC_PK").children[2].children[3].children[1].value * 1e8)
            const TX = buildTXPK(LTC, origin, destiantion, amount, UTXO.Omni[addrIndexo], 49, wif[addrIndexo])
            
            if (confirm("Send TX?")) LTC.submitTX(TX.toHex())
            GetLitecoin(password)

        }

        const sendAllo_btn = document.getElementById("LTC_PK").children[2].children[3].children[3]
        sendAllo_btn.onclick = function() {
            const destiantion = document.getElementById("LTC_PK").children[2].children[3].children[0].value
            const TX = buildTXallPK(LTC, destiantion, UTXO.Omni[addrIndexo], 49, wif[addrIndexo])

            if (confirm("Send TX?")) LTC.submitTX(TX.toHex())
            GetLitecoin(password)
        }

        console.log(await OMNI.getDEX())

        const DEX = await OMNI.getDEX()

        const div = document.getElementById("LTC_DEX")
        div.innerText = ""
        const DEXh = document.createElement("h1")
        DEXh.innerText = "DEX"
        div.appendChild(DEXh)

        for (let a = 0; a < DEX.length; a++) {
            const element = DEX[a]
            
            const entry = document.createElement("p")
            entry.innerText = element.propertyid + " - " + element.amountavailable
            entry.value = element.seller

            const amount = document.createElement("input")
            amount.type = "number"

            const buy_btn = document.createElement("button")
            buy_btn.innerText = "announce buy"
            buy_btn.onclick = async function() {
                const payload = await OMNI.OPbuyDEX(element.propertyid, amount.value)
                console.log(payload)
                const TX = buildDEXbuyTXPK(LTC, Omni.options[addrIndexo].text.split(" - ")[1], element.seller, 5400, payload, UTXO.Omni[addrIndexo], wif[addrIndexo])
                
                if (confirm("Send TX?")) LTC.submitTX(TX.toHex())
                GetLitecoin(password)
            }


            div.appendChild(entry)
            div.appendChild(amount)
            div.appendChild(buy_btn)

            if (element.accepts.length > 0) {
                console.log("Accepts found on - " + element.propertyid)

                for (let b = 0; b < element.accepts.length; b++) {
                    const accept = element.accepts[b]

                    if (accept.buyer == Omni.options[addrIndexo].text.split(" - ")[1]) {
                        console.log("found buy option", accept)
                        console.log(accept.buyer, element.seller, element.propertyid, accept.amounttopay)

                        const pay_btn = document.createElement("button")
                        pay_btn.innerText = "Pay Order"
                        pay_btn.onclick = async function() {
                            const TX = buildDEXpayTXPK(LTC, accept.buyer, element.seller, accept.amounttopay, UTXO.Omni[addrIndexo], wif[addrIndexo])
                            if (confirm("Send TX?")) LTC.submitTX(TX.toHex())
                            GetLitecoin(password)
                        }

                        div.appendChild(pay_btn)
                    }
                    
                }
            }
        }
    }
}

function buildTX(LTC, origin, destiantion, amount, UTXO, addrIndex, addrType) {
    let ustx = LTC.buildTX(origin, destiantion, amount, UTXO[addrIndex], 0)
    console.log(ustx.buildIncomplete().toHex())

    let stx = LTC.signTxV5(ustx.buildIncomplete().toHex(), addrType, addrIndex, UTXO[addrIndex])
    console.log(stx.virtualSize())

    ustx = LTC.buildTX(origin, destiantion, amount, UTXO[addrIndex], stx.virtualSize() +1)
    console.log(ustx.buildIncomplete())

    return LTC.signTxV5(ustx.buildIncomplete().toHex(), addrType, addrIndex, UTXO[addrIndex])
}

function buildTXall(LTC, destiantion, UTXO, addrIndex, addrType) {
    console.log(addrIndex)

    let ustx = LTC.buildTXAll(destiantion, UTXO[addrIndex], 0)
    console.log(ustx.buildIncomplete().toHex())

    let stx = LTC.signTxV5(ustx.buildIncomplete().toHex(), addrType, addrIndex, UTXO[addrIndex])
    console.log(stx.virtualSize())

    ustx = LTC.buildTXAll(destiantion, UTXO[addrIndex], stx.virtualSize() +1)
    console.log(ustx.buildIncomplete().toHex())

    return LTC.signTxV5(ustx.buildIncomplete().toHex(), addrType, addrIndex, UTXO[addrIndex])
}



function buildTXPK(LTC, origin, destiantion, amount, UTXO, addrType, WIF) {
    let ustx = LTC.buildTX(origin, destiantion, amount, UTXO, 0)
    console.log(ustx.buildIncomplete().toHex())

    let stx = LTC.signTxPK(ustx.buildIncomplete().toHex(), addrType, UTXO, WIF)
    console.log(stx.virtualSize())

    ustx = LTC.buildTX(origin, destiantion, amount, UTXO, stx.virtualSize() +1)
    console.log(ustx.buildIncomplete())

    return LTC.signTxPK(ustx.buildIncomplete().toHex(), addrType, UTXO, WIF)
}

function buildTXallPK(LTC, destiantion, UTXO, addrType, WIF) {
    let ustx = LTC.buildTXAll(destiantion, UTXO, 0)
    console.log(ustx.buildIncomplete().toHex())

    let stx = LTC.signTxPK(ustx.buildIncomplete().toHex(), addrType, UTXO, WIF)
    console.log(stx.virtualSize())

    ustx = LTC.buildTXAll(destiantion, UTXO, stx.virtualSize() +1)
    console.log(ustx.buildIncomplete().toHex())

    return LTC.signTxPK(ustx.buildIncomplete().toHex(), addrType, UTXO, WIF)
}

function buildTokenSend(LTC, origin, destiantion, payload, UTXO, WIF) {
    const OParray = payload.match(/.{2}/g).map(b => parseInt(b, 16))
    const OPreturn = bitcoin.script.compile(OParray)

    let ustx = LTC.buildTX(origin, destiantion, 5400, UTXO, 0)
    ustx.addOutput(OPreturn, 0)

    let stx = LTC.signTxPK(ustx.buildIncomplete().toHex(), 49, UTXO, WIF)
    console.log(stx.toHex())

    ustx = LTC.buildTX(origin, destiantion, 5400, UTXO, stx.virtualSize() +1)
    ustx.addOutput(OPreturn, 0)

    return stx = LTC.signTxPK(ustx.buildIncomplete().toHex(), 49, UTXO, WIF)
}

function buildSelfTX(LTC, origin, payload, UTXO, WIF) {
    const OParray = payload.match(/.{2}/g).map(b => parseInt(b, 16))
    const OPreturn = bitcoin.script.compile(OParray)

    let ustx = LTC.buildTXself(origin, UTXO, 0)
    ustx.addOutput(OPreturn, 0)

    let stx = LTC.signTxPK(ustx.buildIncomplete().toHex(), 49, UTXO, WIF)
    console.log(stx.toHex())

    ustx = LTC.buildTXself(origin, UTXO, stx.virtualSize() +1)
    ustx.addOutput(OPreturn, 0)

    return LTC.signTxPK(ustx.buildIncomplete().toHex(), 49, UTXO, WIF)
}

function buildDEXbuyTX(LTC, origin, destiantion, amount, UTXO, addrIndex, payload) {
    console.log(0)
    const OParray = payload.match(/.{2}/g).map(b => parseInt(b, 16))
    const OPreturn = bitcoin.script.compile(OParray)

    console.log(1)
    console.log(origin, destiantion, amount, UTXO[addrIndex], 0)

    let ustx = LTC.buildTX(origin, destiantion, amount, UTXO[addrIndex], 0)
    console.log(2)
    ustx.addOutput(OPreturn, 0)
    console.log(ustx.buildIncomplete().toHex())

    let stx = LTC.signTxV5(ustx.buildIncomplete().toHex(), 49, addrIndex, UTXO[addrIndex])
    console.log(stx.virtualSize())

    ustx = LTC.buildTX(origin, destiantion, amount, UTXO[addrIndex], stx.virtualSize() +1)
    ustx.addOutput(OPreturn, 0)
    console.log(ustx.buildIncomplete())

    return LTC.signTxV5(ustx.buildIncomplete().toHex(), 49, addrIndex, UTXO[addrIndex])
}

function buildDEXbuyTXPK(LTC, origin, destiantion, amount, payload, UTXO, WIF) {
    console.log(0)
    const OParray = payload.match(/.{2}/g).map(b => parseInt(b, 16))
    const OPreturn = bitcoin.script.compile(OParray)

    console.log(1)
    console.log(origin, destiantion, amount, UTXO, 0)

    let ustx = LTC.buildTX(origin, destiantion, amount, UTXO, 0)
    console.log(2)
    ustx.addOutput(OPreturn, 0)
    console.log(ustx.buildIncomplete().toHex())

    let stx = LTC.signTxPK(ustx.buildIncomplete().toHex(), 49, UTXO, WIF)
    console.log(stx.virtualSize())

    ustx = LTC.buildTX(origin, destiantion, amount, UTXO, stx.virtualSize() +1)
    ustx.addOutput(OPreturn, 0)
    console.log(ustx.buildIncomplete())

    return LTC.signTxPK(ustx.buildIncomplete().toHex(), 49, UTXO, WIF)
}

function buildDEXpayTXPK(LTC, origin, destiantion, amount, UTXO, WIF) {
    const exodus = "LTceXoduS2cetpWJSe47M25i5oKjEccN1h"
    amount = amount * 100000000

    let ustx = LTC.buildDEXpayTX(origin, destiantion, amount, UTXO, 0)
    ustx.addOutput(exodus, 5460)

    let stx = LTC.signTxPK(ustx.buildIncomplete().toHex(), 49, UTXO, WIF)

    ustx = LTC.buildDEXpayTX(origin, destiantion, amount, UTXO, stx.virtualSize() +1)
    ustx.addOutput(exodus, 5460)

    return LTC.signTxPK(ustx.buildIncomplete().toHex(), 49, UTXO, WIF)
}