# Cong thuc che gia tri nhay cam trong database

Muc tieu: cac con so nhay cam nhu `buy`, `sell`, `expectedSell`, `amount` van duoc luu trong database, nhung khi mo file `shared-database.json` thi khong thay ngay gia tri that.

Luu y quan trong: neu can hien thi lai gia tri tren man hinh thi khong the dung hash mot chieu dung nghia. Hash mot chieu chi kiem tra duoc, khong giai ma duoc. Truong hop nay nen goi la ma hoa/che gia tri co khoa. Cong thuc ben duoi la dang obfuscation co khoa, du de che mat khi nhin file JSON, nhung khong thay the bao mat cap cao neu khoa nam trong frontend.

## Truong can che

Nen ap dung cho cac truong tien:

```txt
unit.buy
unit.sell
unit.expectedSell
affiliateIncome.amount
snapshot.units[].buy
snapshot.units[].sell
snapshot.units[].expectedSell
snapshot.affiliateIncomes[].amount
```

Don vi hien tai trong app la nghin dong, vi vay cong thuc lam viec truc tiep tren so nguyen dang luu.

## Dinh dang luu

Thay vi luu:

```json
{ "buy": 580, "sell": 650 }
```

luu:

```json
{
  "buy": { "__maskedNumber": "v1:..." },
  "sell": { "__maskedNumber": "v1:..." }
}
```

`v1` la phien ban cong thuc. Sau nay doi cong thuc thi tao `v2` de van doc duoc du lieu cu.

## Cong thuc

### 1. Tao khoa so tu passphrase

Dung mot chuoi bi mat, vi du:

```txt
NEXUS_GEAR_DB_SECRET
```

Khong nen luu khoa that vao file database.

Tao seed 32-bit:

```js
function hashKey(secret) {
  let h = 2166136261;
  for (let i = 0; i < secret.length; i += 1) {
    h ^= secret.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}
```

### 2. Tao mask rieng cho tung truong

Dung duong dan cua truong de moi gia tri co mask khac nhau:

```js
function fieldMask(secret, path) {
  let x = hashKey(`${secret}:${path}`);
  x ^= x << 13;
  x ^= x >>> 17;
  x ^= x << 5;
  return (x >>> 0) % 900000 + 100000;
}
```

Vi du `path`:

```txt
units.s001.buy
units.s001.sell
affiliate.aff_123.amount
```

### 3. Ma hoa so

```js
function encodeNumber(value, secret, path) {
  const n = Math.round(Number(value) || 0);
  const mask = fieldMask(secret, path);
  const encoded = (n ^ mask).toString(36);
  return `v1:${encoded}`;
}
```

### 4. Giai ma so

```js
function decodeNumber(masked, secret, path) {
  if (typeof masked !== 'string') return Number(masked) || 0;
  const [version, payload] = masked.split(':');
  if (version !== 'v1') throw new Error(`Unsupported masked number version: ${version}`);
  const mask = fieldMask(secret, path);
  return parseInt(payload, 36) ^ mask;
}
```

## Vi du day du

```js
const secret = 'doi-chuoi-nay-thanh-khoa-rieng';

const rawBuy = 580;
const path = 'units.s001.buy';

const stored = encodeNumber(rawBuy, secret, path);
const restored = decodeNumber(stored, secret, path);

console.log(stored);   // v1:...
console.log(restored); // 580
```

## Cach ap dung vao app

Nen tao mot file code rieng, vi du:

```txt
database-mask.js
```

File do chua cac ham:

```txt
maskDatabaseState(state, secret)
unmaskDatabaseState(state, secret)
encodeNumber(value, secret, path)
decodeNumber(masked, secret, path)
```

Luon giai ma ngay sau khi doc `shared-database.json`, truoc khi dua vao React state.

Luon ma hoa truoc khi ghi lai `shared-database.json`.

## Canh bao bao mat

Neu khoa nam trong code frontend thi nguoi co code van co the giai ma. Cach tot hon la dat khoa o server bang bien moi truong:

```txt
NEXUS_GEAR_DB_SECRET=...
```

Khi do chi server biet khoa, file database nhin truc tiep se khong lo gia tri, con frontend van nhan duoc so da giai ma qua API.

Cong thuc nay phu hop muc tieu "mo file JSON len khong thay ngay gia mua/gia ban". Neu can bao mat manh hon, nen dung AES-GCM cua `crypto` tren server thay vi XOR mask.
