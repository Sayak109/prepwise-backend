import { Module, UseGuards } from '@nestjs/common';
import { RouterModule } from '@nestjs/core';
import { AdminSettingsModule } from './settings/admin-settings.module';
import { UserModule } from './user/user.module';

@Module({
    imports: [
        RouterModule.register([
            {
                path: 'admin',
                children: [
                    {
                        path: 'user',
                        module: UserModule,
                    },
                    {
                        path: 'settings',
                        module: AdminSettingsModule,
                    }
                ],
            },

        ]),
        UserModule,
        AdminSettingsModule,
    ],
})
export class AdminModule { }
