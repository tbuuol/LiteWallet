class Litecoin {
  constructor() {
    this.network = {
        messagePrefix: '\x19Litecoin Signed Message:\n',
        bip32: { public: 0x01b26ef6, private: 0x01b26792 },
        bech32: 'ltc',
        pubKeyHash: 0x30,
        scriptHash: 0x32,
        wif: 0xb0
    }

    this.BASE58_ALPHABET = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz"
    this.root
  }

  wifToUint8(wif) {
    // Base58 → BigInt
    let num = 0n;
    for (let c of wif) {
      const index = this.BASE58_ALPHABET.indexOf(c);
      if (index < 0) throw new Error("Invalid Base58 char");
      num = num * 58n + BigInt(index);
    }

    // BigInt → Uint8Array (raw bytes)
    let bytes = [];
    while (num > 0n) {
      bytes.push(Number(num & 0xFFn));
      num >>= 8n;
    }
    bytes = bytes.reverse();

    // führende 1er im Base58 = führende 0x00 bytes
    for (let c of wif) {
      if (c === "1") bytes.unshift(0);
      else break;
    }

    return new Uint8Array(bytes);
  }

  uint8ToWIF(bytes) {
    let num = 0n;

    // Uint8 → BigInt
    for (let b of bytes) {
      num = (num << 8n) + BigInt(b);
    }

    // BigInt → Base58
    let s = "";
    while (num > 0n) {
      let r = num % 58n;
      num = num / 58n;
      s = this.BASE58_ALPHABET[Number(r)] + s;
    }

    // führende 0-Bytes wieder in "1" umwandeln
    for (let b of bytes) {
      if (b === 0) s = "1" + s;
      else break;
    }

    return s;
  }

  AddressesFromSeeds(entrophy) {
    const mnemonic = bip39.entropyToMnemonic(entrophy)
    const seed = bip39.mnemonicToSeedSync(mnemonic)
    this.root = bitcoin.bip32.fromSeed(seed, this.network)

    const array = new Array
    array.Legacy = new Array // Legacy
    array.Omni = new Array // Omni
    array.SegWit = new Array // SegWit

    for (let a = 0; a < 20; a++) {
        const childpkh = this.root.derivePath("m/44'/2'/0'/0/" +a)
        const keypairpkh = bitcoin.payments.p2pkh({ 
            pubkey: childpkh.publicKey, 
            network: this.network 
        })

        const childsh = this.root.derivePath("m/49'/2'/0'/0/" +a)
        const keypairsh = bitcoin.payments.p2sh({
            redeem: bitcoin.payments.p2wpkh({ 
            pubkey: childsh.publicKey, 
            network: this.network }), 
            network: this.network
        })

        const childwpkh = this.root.derivePath("m/84'/2'/0'/0/" +a)
        const keypairwpkh = bitcoin.payments.p2wpkh({ 
            pubkey: childwpkh.publicKey, 
            network: this.network 
        })

        array.Legacy.push(keypairpkh.address)
        array.Omni.push(keypairsh.address)
        array.SegWit.push(keypairwpkh.address)
    }

    return array
  }

  AddressesFromWIF(wif) {
    const array = new Array
    array.Legacy = new Array // Legacy
    array.Omni = new Array // Omni
    array.SegWit = new Array // SegWit

    for (let a = 0; a < wif.length; a++) {
      const keypair = bitcoin.ECPair.fromWIF(wif[a], this.network)
    

      const Legacy = bitcoin.payments.p2pkh({ 
        pubkey: keypair.publicKey, 
        network: this.network 
      })

      const Omni = bitcoin.payments.p2sh({
        redeem: bitcoin.payments.p2wpkh({ 
        pubkey: keypair.publicKey, 
        network: this.network }), 
        network: this.network
      })

      const SegWit = bitcoin.payments.p2wpkh({ 
        pubkey: keypair.publicKey, 
        network: this.network 
      })

      array.Legacy.push(Legacy.address)
      array.Omni.push(Omni.address)
      array.SegWit.push(SegWit.address) 
    }

    return array
  }

  async UTXO(addresses) {
    const url = "https://litecoinspace.org/api/address/"
    const urls = new Array

    for (let a = 0; a < addresses.length; a++) {
      urls.push(url + addresses[a] + "/utxo")
    }

    const p = urls.map(u => fetch(u).then(r => r.json()))
    const e = await Promise.all(p)
    return e
  }

  buildTX(origin, destiantion, amount, utxos, fee) {
    const txb = new bitcoin.TransactionBuilder(this.network)

    if (amount < 5400) {
      alert('dust error on sending amount')
      return
    }

    let totalInput = 0
    for (let i = 0; i < utxos.length; i++) {
      const utxo = utxos[i]
      txb.addInput(utxo.txid, utxo.vout)
      totalInput += utxo.value
    }

    if (totalInput < amount + fee) {
      alert('Insufficient funds')
      return
    }

    const change = totalInput - amount - fee;
    if (change < 5400) {
      alert('dust error on change')
      return
    } else {
      txb.addOutput(origin, change)
    }
    txb.addOutput(destiantion, amount)

    return txb
  }

  buildTXAll(destiantion, utxos, fee) {
    const txb = new bitcoin.TransactionBuilder(this.network)

    console.log(utxos)

    let totalInput = 0
    for (let i = 0; i < utxos.length; i++) {
      const utxo = utxos[i]
      txb.addInput(utxo.txid, utxo.vout)
      totalInput += utxo.value
    }

    if (totalInput - fee < 5400) {
      alert('Insufficient funds - dust error')
      return
    }
    txb.addOutput(destiantion, totalInput - fee)

    return txb
  }

  buildDEXpayTX(origin, destiantion, amount, utxos, fee) {
    const txb = new bitcoin.TransactionBuilder(this.network)

    if (amount < 5400) {
      alert('dust error on sending amount')
      return
    }

    let totalInput = 0
    for (let i = 0; i < utxos.length; i++) {
      const utxo = utxos[i]
      txb.addInput(utxo.txid, utxo.vout)
      totalInput += utxo.value
    }

    if (totalInput < amount + fee) {
      alert('Insufficient funds')
      return
    }

    const change = totalInput - amount - fee - 5460
    if (change < 5400) {
      alert('dust error on change')
      return
    } else {
      txb.addOutput(origin, change)
    }
    txb.addOutput(destiantion, amount)

    return txb
  }

  buildTXself(origin, utxos, fee) {
    const txb = new bitcoin.TransactionBuilder(this.network)

    let totalInput = 0
    for (let i = 0; i < utxos.length; i++) {
      const utxo = utxos[i]
      txb.addInput(utxo.txid, utxo.vout)
      totalInput += utxo.value
    }

    const change = totalInput - fee
    if (change < 5400) {
      alert('dust error on change')
      return
    } else {
      txb.addOutput(origin, change)
    }

    return txb    
  }

  signTxV5(unsignedHex, addrType, addrIndex, utxos) {
    const tx = bitcoin.Transaction.fromHex(unsignedHex)
    const txb = bitcoin.TransactionBuilder.fromTransaction(tx, this.network)
    const utxoValuesArray = utxos.map(u => u.value)
    const child = this.root.derivePath("m/"+addrType+"'/2'/0'/0/" +addrIndex)
    let addrData

    if (addrType == 44) {
      addrData = bitcoin.payments.p2pkh({ 
        pubkey: child.publicKey,
        network: this.network
      })

      for (let i = 0; i < tx.ins.length; i++) {
        txb.sign(i, child)
      }
    }

    if (addrType == 49) {
      addrData = bitcoin.payments.p2sh({
        redeem: bitcoin.payments.p2wpkh({
        pubkey: child.publicKey,
        network: this.network }),
        network: this.network
      })

      for (let i = 0; i < tx.ins.length; i++) {
        txb.sign(i, child, addrData.redeem.output, null, utxoValuesArray[i])
      }
    }

    if (addrType == 84) {
      addrData = bitcoin.payments.p2wpkh({ 
        pubkey: child.publicKey,
        network: this.network
      })

      for (let i = 0; i < tx.ins.length; i++) {
        txb.sign(i, child, null, null, utxoValuesArray[i])
      }
    }

    //const keyPair = bitcoin.ECPair.fromPrivateKey(child.privateKey, { network: this.network })
    //console.log(keyPair)

    

    return txb.build()
  }

  signTxPK(unsignedHex, addrType, utxos, wif) {
    const tx = bitcoin.Transaction.fromHex(unsignedHex)
    const txb = bitcoin.TransactionBuilder.fromTransaction(tx, this.network)
    const utxoValuesArray = utxos.map(u => u.value)
    const keyPair = bitcoin.ECPair.fromWIF(wif, this.network)

    //const keyPair = bitcoin.ECPair.fromPrivateKey(wif, { network: this.network })
    console.log(keyPair)

    let addrData

    if (addrType == 44) {
      addrData = bitcoin.payments.p2pkh({ 
        pubkey: keyPair.publicKey,
        network: this.network
      })

      for (let i = 0; i < tx.ins.length; i++) {
        txb.sign(i, keyPair)
      }
    }

    if (addrType == 49) {
      addrData = bitcoin.payments.p2sh({
        redeem: bitcoin.payments.p2wpkh({
        pubkey: keyPair.publicKey,
        network: this.network }),
        network: this.network
      })

      for (let i = 0; i < tx.ins.length; i++) {
        txb.sign(i, keyPair, addrData.redeem.output, null, utxoValuesArray[i])
      }
    }

    return txb.build()
  }

  async submitTX(Hex) {
    const p = await fetch("https://litecoinspace.org/api/tx", {
      method: "POST",
      body: Hex
    })
    const r = await p.text()
    console.log(r.substring(0, 29))
    if (r.substring(0,29) == "sendrawtransaction RPC error:") return false
    
    if (confirm("show TX in Explorer?")) window.open("https://litecoinspace.org/tx/" + r, "_blank", "noopener,noreferrer")

    return r
  }
}