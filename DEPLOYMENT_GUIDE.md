# 🚀 LottoMoji Manual Deployment Guide - Base Sepolia

## ✅ Status Actual
- **LottoMojiRandom**: `0x3E95820Da797FE9fc656B9A10aFc9f9Aaab719c2` ✅ DEPLOYED
- **LottoMojiTickets**: ⏳ PENDING
- **LottoMojiReserves**: ⏳ PENDING  
- **LottoMojiMain**: ⏳ PENDING
- **LottoMojiAutomation**: ⏳ PENDING

## 📋 Información de Deployment

### Network Configuration
- **Network**: Base Sepolia
- **RPC URL**: `https://sepolia.base.org`
- **Chain ID**: `84532`
- **USDC Address**: `0x036CbD53842c5426634e7929541eC2318f3dCF7e`
- **Your Wallet**: `0x...` (tu dirección de wallet)

### Gas Settings Recomendados
- **Gas Limit**: 3,000,000 - 6,000,000 (dependiendo del contrato)
- **Gas Price**: 25 gwei

## 🔄 Orden de Deployment

### 1. LottoMojiTickets ⏳
**Constructor Parameters:**
- `_lotteryContract`: `0x...` (tu wallet address temporalmente, luego será actualizado)

### 2. LottoMojiReserves ⏳
**Constructor Parameters:**
- `_usdcToken`: `0x036CbD53842c5426634e7929541eC2318f3dCF7e`
- `_owner`: `0x...` (tu wallet address)

### 3. LottoMojiMain ⏳
**Constructor Parameters:**
- `_usdcToken`: `0x036CbD53842c5426634e7929541eC2318f3dCF7e`
- `_ticketsContract`: `[LottoMojiTickets address]`
- `_reservesContract`: `[LottoMojiReserves address]`
- `_randomContract`: `0x3E95820Da797FE9fc656B9A10aFc9f9Aaab719c2`

### 4. LottoMojiAutomation ⏳
**Constructor Parameters:**
- `_lotteryContract`: `[LottoMojiMain address]`
- `_reservesContract`: `[LottoMojiReserves address]`
- `_randomContract`: `0x3E95820Da797FE9fc656B9A10aFc9f9Aaab719c2`

## 🛠️ Pasos Post-Deployment

### Configuración de Permisos
1. **LottoMojiReserves.setLotteryContract(`[LottoMojiMain address]`)**
2. **LottoMojiMain.setAutomationContract(`[LottoMojiAutomation address]`)**

### Actualización de LottoMojiRandom
⚠️ **IMPORTANTE**: LottoMojiRandom fue desplegado con tu wallet como lottery contract. Necesitarás:
1. Redesplegar LottoMojiRandom con la dirección correcta de LottoMojiMain, O
2. Implementar una función para actualizar la dirección del lottery contract

## 📁 Archivos a Actualizar

### .env.local
```bash
NEXT_PUBLIC_LOTTERY_ADDRESS=[LottoMojiMain address]
NEXT_PUBLIC_TICKETS_ADDRESS=[LottoMojiTickets address]
NEXT_PUBLIC_RESERVES_ADDRESS=[LottoMojiReserves address]
NEXT_PUBLIC_RANDOM_ADDRESS=0x3E95820Da797FE9fc656B9A10aFc9f9Aaab719c2
NEXT_PUBLIC_AUTOMATION_ADDRESS=[LottoMojiAutomation address]
```

### src/lib/contractAddresses.ts
```typescript
export const CONTRACT_ADDRESSES = {
  LOTTO_MOJI_MAIN: "[LottoMojiMain address]",
  LOTTO_MOJI_TICKETS: "[LottoMojiTickets address]",  
  LOTTO_MOJI_RANDOM: "0x3E95820Da797FE9fc656B9A10aFc9f9Aaab719c2",
  LOTTO_MOJI_RESERVES: "[LottoMojiReserves address]",
  LOTTO_MOJI_AUTOMATION: "[LottoMojiAutomation address]"
} as const;
```

## 🔗 Chainlink VRF Configuration
- **Consumer Contract**: `0x3E95820Da797FE9fc656B9A10aFc9f9Aaab719c2` (LottoMojiRandom)
- **Subscription ID**: `36964112161889945425064710801214207658994639180967117994906698541413525908202`
- **Agregar Consumer**: https://vrf.chain.link/

## 📝 Template de Registro
Copia este template y ve llenando las direcciones conforme despliegues:

```
Deployment Log - Base Sepolia
============================
✅ LottoMojiRandom: 0x3E95820Da797FE9fc656B9A10aFc9f9Aaab719c2
⏳ LottoMojiTickets: 0x________________
⏳ LottoMojiReserves: 0x________________  
⏳ LottoMojiMain: 0x________________
⏳ LottoMojiAutomation: 0x________________

Post-Deployment Checks:
- [ ] LottoMojiReserves.setLotteryContract() called
- [ ] LottoMojiMain.setAutomationContract() called
- [ ] .env.local updated
- [ ] contractAddresses.ts updated
- [ ] Chainlink VRF consumer added
```

## 🚨 Troubleshooting
- Si tienes errores de gas, aumenta el gas limit
- Si tienes errores de "replacement transaction underpriced", espera unos minutos
- Verifica que todos los parámetros del constructor sean correctos
- Asegúrate de estar en Base Sepolia network 