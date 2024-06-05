import {toNano, OpenedContract} from '@ton/core';
import {AssetType, JettonRoot, Pool, PoolType, VaultJetton} from '@dedust/sdk';
import {DeDustFactory} from '../contracts/dedust-factory';
import {HOLE_ADDRESS, tonClientPromise} from '../config';
import {Sender, successTransaction} from "@utils/sender";
import {lastValueFrom} from "rxjs";
import {toast} from "sonner";

export async function depositPool(
  dedustFactory: OpenedContract<DeDustFactory>,
  pool: OpenedContract<Pool>,
  sender: Sender,
  tonAmount: bigint,
  jettonAmount: bigint,
) {
  const tonClient = await tonClientPromise;

  const assets = await pool.getAssets();

  if (assets[0].type !== AssetType.NATIVE && assets[1].type !== AssetType.NATIVE) {
    throw new Error('Only native/jetton assets are supported');
  }
  if (assets[0].type !== AssetType.NATIVE) {
    assets.reverse();
  }
  const assetAmounts: [bigint, bigint] = [tonAmount, jettonAmount];
  const jettonAddress = assets[1].address || HOLE_ADDRESS;
  const nativeVault = tonClient.open(await dedustFactory.getNativeVault());
  const jettonVault = tonClient.open(await dedustFactory.getJettonVault(jettonAddress));

  await nativeVault.sendDepositLiquidity(sender, {
    poolType: PoolType.VOLATILE,
    assets: assets,
    targetBalances: assetAmounts,
    amount: tonAmount,
  });

  const depositLiquidityHash = await lastValueFrom(successTransaction)

  toast.success(`Deposit liquidity transaction hash: ${depositLiquidityHash}`);

  const jettonRoot = tonClient.open(JettonRoot.createFromAddress(jettonAddress));
  const investorJettonWallet = tonClient.open(await jettonRoot.getWallet(sender.address!));

  await investorJettonWallet.sendTransfer(sender, toNano('1.2'), {
    amount: jettonAmount,
    destination: jettonVault.address,
    responseAddress: sender.address!,
    forwardAmount: toNano('1'),
    forwardPayload: VaultJetton.createDepositLiquidityPayload({
      poolType: PoolType.VOLATILE,
      assets: assets,
      targetBalances: assetAmounts,
    }),
  });

  const jettonTransferHash = await lastValueFrom(successTransaction)

  toast.success(`Jetton transfer transaction hash: ${jettonTransferHash}`);
  toast.success(`Pool deposited successfully: ${tonAmount} TON and ${jettonAmount} jUSDT`);
}
