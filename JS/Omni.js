class Omnilayer {
    constructor() {
        this.URL = "https://liteworlds.quest/?section=ltcomni&method="
    }

    async getProperty(id) {
        const p = await fetch(this.URL + "getproperty&id=" + id)
        const r = await p.json()
        return r
    }

    async getBalanceByAddress(address) {
        const p = await fetch(this.URL + "getbalforadr&adr=" + address)
        const r = await p.json()
        return r
    }

    async getNFTs(address) {
      const p = await fetch(this.URL + "getnfts&adr=" + address)
      return await p.json()
    }

    async getNFTdata(propertyid, token) {
      const p = await fetch(this.URL + "getnftdata&p=" + propertyid + "&t=" + token)
      return await p.json()
    }

    async getDEX(address = "") {
      const p = await fetch(this.URL + "getdex&adr=" + address)
      return await p.json()
    }

    async OPsimpleSend(propertyid, amount) {
      const OP = "6a"
      const length = "14"
      const marker = "6f6d6e69"
      const version = "0000"
      const type = "0000"
      let propertyHex = "00000000"
      let amountHex = "0000000000000000"
      let p, a

      const property = await this.getProperty(propertyid)

      p = this.Number2Hex(propertyid)

      if (property.divisible) a = this.Number2Hex(amount * 100000000)
      else a = this.Number2Hex(amount)

      propertyHex = propertyHex.slice(0, p.length * -1) + p
      amountHex = amountHex.slice(0, a.length * -1) + a

      const payload = OP + length + marker + version + type + propertyHex + amountHex
      return payload
    }

    async OPsetupDEX(propertyid, amount, desire, action) {
      // 0001001400000f6800000000075bb2900000000000bbaee018000000000000000101
      // omni_createpayload_dexsell 3944 "1.2345" "0.123" 24 "0.00000001" 1

      // 0001001400000f6800000000075bb2900000000000bbaee0180000000005f5e10002
      // omni_createpayload_dexsell 3944 "1.2345" "0.123" 24 "1" 2

      // 0001001400000f680000000000000000000000000000000000000000000000000003
      // omni_createpayload_dexsell 3944 "1.2345" "0.123" 24 "1" 3

      /*const OP = "6a"
      const length = "26"
      const marker = "6f6d6e69"
      const version = "0001"
      const type = "0014"
      let propertyHex = "00000f68" // 4 Byte
      let amountforsaleHex = "00000000075bb290" // 8 Byte
      let amountdesiredHex = "0000000000bbaee0" // 8 Byte
      let paymentwindowHex = "18" // 1 Byte
      let minacceptfeeHex = "0000000000000001" // 8 Byte
      let actionHex = "01" // 1 Byte */

      const OP = "6a"
      const length = "26"
      const marker = "6f6d6e69"
      const version = "0001"
      const type = "0014"
      let propertyHex = "00000000"
      let amountforsaleHex = "0000000000000000"
      let amountdesiredHex = "0000000000000000"
      const paymentwindowHex = "18"
      const minacceptfeeHex = "0000000000000001"
      const actionHex = "0" + action
      const p = this.Number2Hex(propertyid)
      let a
      const d = this.Number2Hex(desire * 100000000)
      const property = await this.getProperty(propertyid)

      if (property.divisible) a = this.Number2Hex(amount * 100000000)
      else a = this.Number2Hex(amount)

      console.log(a, a.length)
      console.log(d, d.length)

      console.log(amountforsaleHex, amountforsaleHex.length)

      propertyHex = propertyHex.slice(0, p.length * -1) + p
      amountforsaleHex = amountforsaleHex.slice(0, a.length * -1) + a
      amountdesiredHex = amountdesiredHex.slice(0, d.length * -1) + d

      console.log(amountforsaleHex, amountforsaleHex.length)

      let payload = OP + length + marker + version + type + propertyHex + amountforsaleHex + amountdesiredHex + paymentwindowHex + minacceptfeeHex + actionHex
      if (action == 3) payload = OP + length + marker + version + type + propertyHex + "0000000000000000000000000000000000000000000000000003"
      console.log(payload)

      return payload
    }

    async OPbuyDEX(propertyid, amount) {
      // 0000001600000f6800000000075bcd15

      const OP = "6a"
      const length = "14"
      const marker = "6f6d6e69"
      const version = "0000"
      const type = "0016"
      const p = this.Number2Hex(propertyid)

      let propertyHex = "00000000" // 4 Byte
      let amountHex = "0000000000000000"
      let a

      const property = await this.getProperty(propertyid)

      console.log(property.divisible)

      if (property.divisible) a = this.Number2Hex(amount * 100000000)
      else a = this.Number2Hex(amount)

      console.log(a, amount)

      propertyHex = propertyHex.slice(0, p.length * -1) + p
      amountHex = amountHex.slice(0, a.length * -1) + a

      console.log(amountHex)

      const payload = OP + length + marker + version + type + propertyHex + amountHex
      return payload
    }

    async OPsendNFT(propertyid, token)  {
      // 0000000500000db500000000000000080000000000000008

      const OP = "6a"
      const length = "1c"
      const marker = "6f6d6e69"
      const version = "0000"
      const type = "0005"
      let propertyHex = "00000000"
      let tokenHex = "0000000000000000"

      let p = this.Number2Hex(propertyid)
      let t = this.Number2Hex(token)

      propertyHex = propertyHex.slice(0, p.length * -1) + p
      tokenHex = tokenHex.slice(0, t.length * -1) + t

      return OP + length + marker + version + type + propertyHex + tokenHex + tokenHex
    }

    async OPgrant(propertyid, amount) {
      // 0000003700000eb3000000000000006400

      const OP = "6a"
      const length = "15"
      const marker = "6f6d6e69"
      const version = "0000"
      const type = "0037"
      let propertyHex = "00000000"
      let amountHex = "0000000000000000"
      let close = "00"

      let p = this.Number2Hex(propertyid)
      let a = this.Number2Hex(amount)

      propertyHex = propertyHex.slice(0, p.length * -1) + p
      amountHex = amountHex.slice(0, a.length * -1) + a

      return OP + length + marker + version + type + propertyHex + amountHex + close
    }

    async OPrevoke(propertyid, amount) {
      // 0000003700000eb3000000000000006400

      const OP = "6a"
      const length = "15"
      const marker = "6f6d6e69"
      const version = "0000"
      const type = "0038"
      let propertyHex = "00000000"
      let amountHex = "0000000000000000"
      let close = "00"

      let p = this.Number2Hex(propertyid)
      let a = this.Number2Hex(amount)

      propertyHex = propertyHex.slice(0, p.length * -1) + p
      amountHex = amountHex.slice(0, a.length * -1) + a

      return OP + length + marker + version + type + propertyHex + amountHex + close
    }

    Number2Hex(number) {
      return number.toString(16)
    }
}