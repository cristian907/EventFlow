import { SystemSettingsType } from '@eventflow/shared';

import { PrismaClient } from '../../generated/prisma/client';

export default class SettingsService {
    constructor(private readonly prisma: PrismaClient) {}

    async getSettings(): Promise<SystemSettingsType> {
        const setting = await this.prisma.systemSetting.findUnique({
            where: { key: 'defaultRateSource' },
        });

        const val = setting?.value as SystemSettingsType['defaultRateSource'] | undefined;
        // Fallback to CUSTOM if not configured
        return {
            defaultRateSource:
                val && ['USD_BCV', 'EUR_BCV', 'USDT_PARALELO', 'CUSTOM', 'NONE'].includes(val)
                    ? val
                    : 'CUSTOM',
        };
    }

    async updateSettings(data: SystemSettingsType): Promise<SystemSettingsType> {
        await this.prisma.systemSetting.upsert({
            where: { key: 'defaultRateSource' },
            update: { value: data.defaultRateSource },
            create: { key: 'defaultRateSource', value: data.defaultRateSource },
        });

        return data;
    }
}
