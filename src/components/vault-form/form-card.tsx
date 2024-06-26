import { serverTranslation } from '@i18n';
import { Language } from '@i18n/settings';
import { Card, CardDescription, CardHeader, CardTitle } from '@UI/card';
import { PropsWithChildren } from 'react';
import { Actions } from '@types';

export async function FormCard({
  action,
  lng,
  children,
}: PropsWithChildren<{ lng: Language; action: Actions }>) {
  const { t } = await serverTranslation(lng, 'form');

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t(`${action}_title`)}</CardTitle>
        <CardDescription>{t(`${action}_description`)}</CardDescription>
      </CardHeader>
      {children}
    </Card>
  );
}
