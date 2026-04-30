import { Module, UseGuards } from '@nestjs/common';
import { RouterModule } from '@nestjs/core';
import { AdminSettingsModule } from './settings/admin-settings.module';
import { UserModule } from './user/user.module';
import { TopicModule } from './topic/topic.module';
import { QuestionModule } from './question/question.module';

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
                    },
                    {
                        path: 'topic',
                        module: TopicModule,
                    },
                    {
                        path: 'question',
                        module: QuestionModule,
                    }
                ],
            },

        ]),
        UserModule,
        AdminSettingsModule,
        TopicModule,
        QuestionModule,
    ],
})
export class AdminModule { }
